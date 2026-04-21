import { useEffect, useRef, useState, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useScanStore from '../../context/ScanContext';
import { loadPoseDetector, detectPose, isFullBodyVisible, warmUpDetector } from '../../services/poseService';
import { calculateBodyMetrics, classifyBodyType, classifyFrameSize, getProportionalNotes, calculateBMI, normalizeUserMeasurements } from '../../utils/bodyMetrics';
import { STABILITY_THRESHOLD, STABILITY_FRAMES, STABILITY_DURATION, STABILITY_BAD_FRAME_TOLERANCE, DETECTION_TIMEOUT, BODY_TYPES, SCAN_STATUS, ROUTES } from '../../utils/constants';
import { generateLocalRoutine } from '../../services/localRoutineGenerator';
import SkeletonOverlay from './SkeletonOverlay';
import SilhouetteGuide from './SilhouetteGuide';
import LoadingSpinner from '../UI/LoadingSpinner';
import Button from '../UI/Button';
import PageTransition from '../UI/PageTransition';
import { SectionLabel, BracketFrame, padFrame, TopBar, BottomBar } from '../UI/Telemetry';

// Editorial / racing-telemetry-styled status copy. Short, punchy uppercase
// fits the Barlow Condensed display font better than the previous sentences.
const STATUS_LABELS = {
  [SCAN_STATUS.IDLE]: 'STANDBY',
  [SCAN_STATUS.CAMERA]: 'FEED LIVE',
  [SCAN_STATUS.LOADING]: 'WARMING UP',
  [SCAN_STATUS.SEARCHING]: 'STEP IN',
  [SCAN_STATUS.DETECTED]: 'LOCKED ON',
  [SCAN_STATUS.HOLDING]: 'HOLD',
  [SCAN_STATUS.COMPLETE]: 'COMPLETE',
};

const STATUS_HINTS = {
  [SCAN_STATUS.IDLE]: 'Booting up the rig.',
  [SCAN_STATUS.CAMERA]: 'Feed connected. Stand by.',
  [SCAN_STATUS.LOADING]: 'Loading the model.',
  [SCAN_STATUS.SEARCHING]: 'Move into the silhouette.',
  [SCAN_STATUS.DETECTED]: 'Body detected — hold steady.',
  [SCAN_STATUS.HOLDING]: 'Don’t move. Three seconds.',
  [SCAN_STATUS.COMPLETE]: 'Reading your build…',
};

export default function CameraView() {
  const navigate = useNavigate();
  // Belt-and-braces consent guard: the booth's URL bar is locked, but if
  // anyone deep-links straight to /scan we send them back to landing rather
  // than silently starting a biometric capture.
  const consentAccepted = useScanStore((s) => s.consentAccepted);
  const videoRef = useRef(null);
  const animFrameRef = useRef(null);
  const stableStartRef = useRef(null);
  const prevKpsRef = useRef([]);
  // Counter of consecutive frames where avgDelta exceeded STABILITY_THRESHOLD.
  // We tolerate up to STABILITY_BAD_FRAME_TOLERANCE before breaking a HOLD,
  // which absorbs single-frame detector jitter without letting real motion
  // sneak through.
  const badFrameCountRef = useRef(0);
  const detectorRef = useRef(null);
  const timeoutRef = useRef(null);
  const completedRef = useRef(false);
  const streamRef = useRef(null);
  const mountedRef = useRef(true);
  // Frame counter is mutated per-detection-frame; we publish to React state on
  // a 250ms tick so the telemetry display updates without re-rendering the
  // whole tree at 30fps.
  const frameCountRef = useRef(0);

  // Per-field selectors so per-frame setState calls don't fan out re-renders to
  // every consumer of the store.
  const userInfo = useScanStore((s) => s.userInfo);
  const setScanData = useScanStore((s) => s.setScanData);
  const setScanStatus = useScanStore((s) => s.setScanStatus);
  const scanStatus = useScanStore((s) => s.scanStatus);
  const setAnalysis = useScanStore((s) => s.setAnalysis);
  const setRoutine = useScanStore((s) => s.setRoutine);
  const setRoutineLoading = useScanStore((s) => s.setRoutineLoading);
  const setRoutineError = useScanStore((s) => s.setRoutineError);
  const [currentKeypoints, setCurrentKeypoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('Starting camera…');
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 });
  const [videoDims, setVideoDims] = useState({ width: 640, height: 480 });
  const [holdProgress, setHoldProgress] = useState(0);
  const [showFallback, setShowFallback] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [frameDisplay, setFrameDisplay] = useState(0);

  // Frame counter ticker — publishes the per-frame ref to React state at 4Hz so
  // telemetry consumers update without forcing the tree to re-render at 30fps.
  // The wall-clock readout lives inside <TopBar />.
  useEffect(() => {
    const frameId = setInterval(() => setFrameDisplay(frameCountRef.current), 250);
    return () => clearInterval(frameId);
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Booth flow: skip /results and go straight to /routine. Generate the routine
  // offline (no API) while the success animation plays. Shared by the camera
  // capture path and the manual fallback so they can't drift.
  const kickOffRoutine = useCallback((bodyType, frameSize, metrics, notes) => {
    setRoutineLoading(true);
    (async () => {
      try {
        const typeInfo = BODY_TYPES[bodyType] || BODY_TYPES.mesomorph;
        const analysisData = {
          bodyType: typeInfo.name,
          frameSize,
          bodyMetrics: metrics,
          proportionalNotes: notes,
          salt: useScanStore.getState().routineSalt,
        };
        const result = await generateLocalRoutine(userInfo, analysisData);
        setRoutine(result);
      } catch (err) {
        console.error('Local routine generation failed:', err);
        setRoutineError(err.message || 'Routine generation failed');
      }
    })();
  }, [userInfo, setRoutine, setRoutineLoading, setRoutineError]);

  const captureAndAnalyze = useCallback((keypoints) => {
    if (completedRef.current) return;
    completedRef.current = true;

    const video = videoRef.current;
    if (!video) return;

    const offscreen = document.createElement('canvas');
    offscreen.width = video.videoWidth;
    offscreen.height = video.videoHeight;
    const ctx = offscreen.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const snapshot = offscreen.toDataURL('image/jpeg', 0.9);

    const { heightCm, weightKg } = normalizeUserMeasurements(userInfo);
    const metrics = calculateBodyMetrics(keypoints, heightCm);
    const bmi = calculateBMI(weightKg, heightCm);
    const bodyType = classifyBodyType(metrics, bmi);
    const frameSize = classifyFrameSize(metrics.shoulderWidth, heightCm);
    const notes = getProportionalNotes(metrics);

    setScanData(keypoints, snapshot);
    setAnalysis(metrics, bodyType, frameSize, notes);
    setScanStatus(SCAN_STATUS.COMPLETE);
    stopStream();

    kickOffRoutine(bodyType, frameSize, metrics, notes);

    setTimeout(() => navigate(ROUTES.ROUTINE), 1200);
  }, [userInfo, setScanData, setAnalysis, setScanStatus, navigate, stopStream, kickOffRoutine]);

  // Detection loop
  const runDetection = useCallback(async () => {
    if (completedRef.current || !mountedRef.current) return;

    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(runDetection);
      return;
    }

    // Local change-detection helpers — avoid setting state every frame so
    // skeleton/progress consumers don't re-render at ~30fps for no reason.
    const setHoldProgressIfChanged = (next) => {
      setHoldProgress((prev) => (prev === next ? prev : next));
    };

    try {
      const pose = await detectPose(detector, video);

      if (pose && pose.keypoints) {
        // Bump the per-frame telemetry counter (read by the 250ms ticker).
        frameCountRef.current += 1;
        const kps = pose.keypoints;
        setCurrentKeypoints(kps);

        if (isFullBodyVisible(kps)) {
          const currentStatus = useScanStore.getState().scanStatus;
          if (
            currentStatus !== SCAN_STATUS.DETECTED &&
            currentStatus !== SCAN_STATUS.HOLDING &&
            currentStatus !== SCAN_STATUS.COMPLETE
          ) {
            setScanStatus(SCAN_STATUS.DETECTED);
          }

          const prevList = prevKpsRef.current;
          if (prevList.length >= STABILITY_FRAMES) {
            // Frame-to-frame delta: compare against the IMMEDIATE previous
            // frame only. The earlier implementation averaged deltas against
            // every frame in the buffer, which inflated avgDelta with
            // accumulated detector noise over the window — so even when a
            // visitor stood still, avgDelta consistently exceeded the
            // threshold and stableStartRef was reset every frame, freezing
            // holdProgress at ~0 forever.
            const prev = prevList[prevList.length - 1];
            const avgDelta = kps.reduce((s, kp, i) => {
              const p = prev[i];
              if (!p) return s;
              return s + Math.abs(kp.x - p.x) + Math.abs(kp.y - p.y);
            }, 0) / kps.length;

            if (avgDelta < STABILITY_THRESHOLD) {
              // Good frame — reset jitter tolerance counter and accumulate hold.
              badFrameCountRef.current = 0;
              if (!stableStartRef.current) {
                stableStartRef.current = Date.now();
                setScanStatus(SCAN_STATUS.HOLDING);
              }
              const elapsed = Date.now() - stableStartRef.current;
              setHoldProgressIfChanged(Math.min(elapsed / STABILITY_DURATION, 1));

              if (elapsed >= STABILITY_DURATION) {
                captureAndAnalyze(kps);
                return;
              }
            } else {
              // Above-threshold frame. Don't immediately drop the hold —
              // a single noisy frame from the detector shouldn't undo
              // 2.5s of patient standing-still.
              badFrameCountRef.current += 1;
              if (badFrameCountRef.current >= STABILITY_BAD_FRAME_TOLERANCE) {
                stableStartRef.current = null;
                setHoldProgressIfChanged(0);
                const cs = useScanStore.getState().scanStatus;
                if (cs === SCAN_STATUS.HOLDING) setScanStatus(SCAN_STATUS.DETECTED);
              }
            }
          }

          // Ring buffer in place — avoids allocating two arrays per frame.
          if (prevList.length >= STABILITY_FRAMES) prevList.shift();
          prevList.push(kps);
        } else {
          stableStartRef.current = null;
          badFrameCountRef.current = 0;
          setHoldProgressIfChanged(0);
          if (prevKpsRef.current.length) prevKpsRef.current.length = 0;
          const cs = useScanStore.getState().scanStatus;
          if (
            cs !== SCAN_STATUS.SEARCHING &&
            cs !== SCAN_STATUS.IDLE &&
            cs !== SCAN_STATUS.LOADING &&
            cs !== SCAN_STATUS.CAMERA
          ) {
            setScanStatus(SCAN_STATUS.SEARCHING);
          }
        }
      } else {
        setCurrentKeypoints((prev) => (prev === null ? prev : null));
        stableStartRef.current = null;
        badFrameCountRef.current = 0;
        setHoldProgressIfChanged(0);
        if (prevKpsRef.current.length) prevKpsRef.current.length = 0;
      }
    } catch (err) {
      console.warn('Detection frame error:', err);
    }

    if (!completedRef.current && mountedRef.current) {
      animFrameRef.current = requestAnimationFrame(runDetection);
    }
  }, [captureAndAnalyze, setScanStatus]);

  // Initialize camera and model.
  //
  // Gated on consentAccepted — without this gate, even a brief render of
  // CameraView (e.g. before the route guard's <Navigate> takes effect) would
  // pop the camera-permission prompt. Don't start any AV pipeline until the
  // visitor has explicitly opted in via ConsentGate.
  useEffect(() => {
    if (!consentAccepted) return;
    mountedRef.current = true;
    completedRef.current = false;

    async function init() {
      setScanStatus(SCAN_STATUS.CAMERA);
      setStatusMsg('Starting camera…');

      // Run camera + model loading IN PARALLEL — whichever takes longer is the bottleneck,
      // not the sum of both. If the model was preloaded on the landing page it resolves instantly.
      const cameraPromise = (async () => {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const constraints = attempt === 0
              ? { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } }
              : attempt === 1
              ? { video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } }
              : { video: true };
            return await navigator.mediaDevices.getUserMedia(constraints);
          } catch (err) {
            console.warn(`Camera attempt ${attempt + 1} failed:`, err.name);
            if (attempt < 2) await new Promise((r) => setTimeout(r, 400));
            if (attempt === 2) throw err;
          }
        }
      })();

      const modelPromise = loadPoseDetector();

      let stream, detector;
      try {
        [stream, detector] = await Promise.all([cameraPromise, modelPromise]);
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err.message || 'Camera or model failed to load');
        setLoading(false);
        setShowFallback(true);
        return;
      }

      if (!mountedRef.current) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      // Attach stream to video element
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          const video = videoRef.current;
          if (!video) { resolve(); return; }
          if (video.readyState >= 2) { resolve(); return; }
          let fallback;
          const finish = () => {
            video.removeEventListener('loadeddata', onReady);
            if (fallback) clearTimeout(fallback);
            resolve();
          };
          const onReady = () => finish();
          video.addEventListener('loadeddata', onReady);
          video.play().catch(() => {});
          fallback = setTimeout(finish, 4000);
        });

        if (!mountedRef.current) { stopStream(); return; }

        const vw = videoRef.current?.videoWidth || 640;
        const vh = videoRef.current?.videoHeight || 480;
        setVideoDims({ width: vw, height: vh });
        // Generous cap for the kiosk display; on smaller screens fall back to
        // the previous tighter bound. Layout has a ~340px chrome budget on lg+.
        const isLg = window.innerWidth >= 1024;
        const availWidth = isLg ? window.innerWidth - 360 : window.innerWidth - 32;
        const containerWidth = Math.min(availWidth, 880);
        setDimensions({ width: containerWidth, height: (vh / vw) * containerWidth });
        setCameraReady(true);
      }

      // Idempotent — only the first visitor pays the WebGL shader cost.
      await warmUpDetector(detector);

      if (!mountedRef.current) return;

      detectorRef.current = detector;
      setLoading(false);
      setScanStatus(SCAN_STATUS.SEARCHING);
      setStatusMsg('Stand in frame — full body visible');

      timeoutRef.current = setTimeout(() => {
        const status = useScanStore.getState().scanStatus;
        if (status === SCAN_STATUS.SEARCHING || status === SCAN_STATUS.LOADING) setShowFallback(true);
      }, DETECTION_TIMEOUT);
    }

    init();

    return () => {
      mountedRef.current = false;
      stopStream();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [consentAccepted]);

  // Start detection loop when model is ready
  useEffect(() => {
    if (!loading && detectorRef.current && !completedRef.current && cameraReady) {
      animFrameRef.current = requestAnimationFrame(runDetection);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [loading, runDetection, cameraReady]);

  const handleManualSelect = (type) => {
    const mockMetrics = {
      shoulderWidth: type === 'ectomorph' ? 38 : type === 'mesomorph' ? 44 : 42,
      hipWidth: type === 'ectomorph' ? 30 : type === 'mesomorph' ? 33 : 38,
      torsoLength: type === 'ectomorph' ? 52 : type === 'mesomorph' ? 50 : 48,
      legLength: type === 'ectomorph' ? 84 : type === 'mesomorph' ? 80 : 76,
      armLength: type === 'ectomorph' ? 64 : type === 'mesomorph' ? 60 : 56,
      shoulderToHipRatio: type === 'ectomorph' ? 1.27 : type === 'mesomorph' ? 1.33 : 1.11,
      torsoToLegRatio: type === 'ectomorph' ? 0.62 : type === 'mesomorph' ? 0.63 : 0.63,
      limbToTorsoRatio: type === 'ectomorph' ? 1.23 : type === 'mesomorph' ? 1.2 : 1.17,
    };
    const notes = getProportionalNotes(mockMetrics);
    const frameSize = type === 'ectomorph' ? 'Small' : type === 'mesomorph' ? 'Medium' : 'Large';

    stopStream();
    setScanData(null, null);
    setAnalysis(mockMetrics, type, frameSize, notes);
    setScanStatus(SCAN_STATUS.COMPLETE);

    kickOffRoutine(type, frameSize, mockMetrics, notes);

    navigate(ROUTES.ROUTINE);
  };

  // Derived telemetry values (cheap; recompute per render is fine).
  const trackedCount = currentKeypoints
    ? currentKeypoints.filter((kp) => kp.score >= 0.3).length
    : 0;
  const holdSeconds = (holdProgress * (STABILITY_DURATION / 1000)).toFixed(1);
  const holdPct = Math.round(holdProgress * 100);
  // Whole-second countdown (3 → 2 → 1) for the tachometer-style HUD readout.
  // Clamp to a min of 1 so we never flash a "0" before the COMPLETE overlay
  // takes the screen.
  const holdCountdown = Math.max(1, Math.ceil(3 - holdProgress * 3));
  const isShowingGuide =
    scanStatus === SCAN_STATUS.SEARCHING ||
    scanStatus === SCAN_STATUS.IDLE ||
    scanStatus === SCAN_STATUS.LOADING ||
    scanStatus === SCAN_STATUS.CAMERA;

  // Pseudo-telemetry vector readout — pulled off the nose keypoint (idx 0)
  // and normalised to the video frame so the numbers read as 0.000-1.000
  // coordinates rather than raw pixels. Falls back to "—" before lock-on.
  const noseKp = currentKeypoints?.[0];
  const vectorX = noseKp ? (noseKp.x / videoDims.width).toFixed(3) : '—.———';
  const vectorY = noseKp ? (noseKp.y / videoDims.height).toFixed(3) : '—.———';
  const avgConf = currentKeypoints && currentKeypoints.length
    ? (
        currentKeypoints.reduce((s, kp) => s + (kp.score || 0), 0) /
        currentKeypoints.length
      ).toFixed(3)
    : '—.———';

  // ── CONSENT GUARD ──────────────────────────────────────────────────────────
  // If the visitor lands on /scan without a granted consent flag, send them
  // back to landing where the ConsentGate fires before navigation. This early
  // return is intentionally below all hooks so we don't violate Rules of Hooks
  // — the camera-init useEffect will not run because it's wrapped in a guard
  // already (mountedRef check), but we still want to short-circuit the JSX.
  if (!consentAccepted) {
    return <Navigate to={ROUTES.LANDING} replace />;
  }

  // ── MANUAL FALLBACK ────────────────────────────────────────────────────────
  if (showFallback) {
    const options = [
      { type: 'ectomorph', label: 'ECTOMORPH', desc: 'Lean, narrow frame, fast metabolism' },
      { type: 'mesomorph', label: 'MESOMORPH', desc: 'Athletic, muscular, medium frame' },
      { type: 'endomorph', label: 'ENDOMORPH', desc: 'Broader, solid frame, strong base' },
    ];
    return (
      <PageTransition>
        <div className="min-h-screen w-full bg-bg text-text relative">
          {/* Top telemetry bar */}
          <header className="border-b border-text/10 px-6 sm:px-10 py-4 flex items-center justify-between font-ui text-[11px] tracking-[0.3em] uppercase">
            <div className="flex items-center gap-4">
              <span className="text-text/60">SQUATWOLF</span>
              <span className="text-text/20">/</span>
              <span className="text-accent">MANUAL</span>
            </div>
            <span className="text-text/40">FALLBACK MODE</span>
          </header>

          <main className="px-6 sm:px-12 py-12 max-w-5xl mx-auto">
            <div className="mb-12 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-8 items-end">
              <div>
                <div className="flex items-center gap-3 text-accent font-ui text-[11px] tracking-[0.4em] uppercase mb-4">
                  <span className="w-8 h-px bg-accent" />
                  CAMERA UNAVAILABLE
                </div>
                <h1 className="font-heading text-6xl sm:text-7xl lg:text-8xl leading-[0.85]">
                  PICK YOUR
                  <br />
                  <span className="text-accent">BUILD</span>.
                </h1>
                <p className="font-body text-text/50 text-sm mt-5 max-w-md">
                  {error || 'Detection timed out.'} Pick the body type that matches and we'll still build a routine that fits.
                </p>
              </div>
              <div className="hidden sm:block font-ui text-[11px] tracking-[0.3em] uppercase text-text/30 text-right">
                <div>OPTIONS / 03</div>
                <div className="mt-1">SELECT ONE</div>
              </div>
            </div>

            <div className="space-y-3">
              {options.map((bt, i) => (
                <button
                  key={bt.type}
                  onClick={() => handleManualSelect(bt.type)}
                  className="group w-full grid grid-cols-[64px_1fr_auto] items-center gap-6 border border-text/10 bg-text/[0.02] hover:border-accent hover:bg-accent/[0.06] px-6 py-6 text-left transition-all rounded-none hover:rounded-lg cursor-pointer"
                >
                  <span className="font-heading text-4xl text-text/30 group-hover:text-accent transition-colors tabular-nums">
                    0{i + 1}
                  </span>
                  <div>
                    <div className="font-heading text-3xl sm:text-4xl text-text leading-none">
                      {bt.label}
                    </div>
                    <div className="font-body text-text/50 text-sm mt-2">{bt.desc}</div>
                  </div>
                  <span className="font-ui text-text/40 group-hover:text-accent group-hover:translate-x-1 transition-all text-lg">
                    ▶
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Button variant="booth" onClick={() => window.location.reload()}>
                ▸ RETRY CAMERA
              </Button>
            </div>
          </main>
        </div>
      </PageTransition>
    );
  }

  // ── MAIN SCAN VIEW ─────────────────────────────────────────────────────────
  return (
    <PageTransition>
      <div className="min-h-screen w-full bg-bg text-text relative overflow-hidden flex flex-col">
        {/* Decorative left edge accent */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-accent/20 -z-10" aria-hidden="true" />

        {/* TOP TELEMETRY BAR — common chrome + scan-specific frame counter */}
        <TopBar
          stage="SCAN"
          right={
            <span className="hidden sm:inline">
              FRAME / <span className="text-text tabular-nums">{padFrame(frameDisplay)}</span>
            </span>
          }
        />

        {/* MAIN GRID */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr]">
          {/* LEFT TELEMETRY RAIL */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:flex flex-col gap-10 border-r border-text/10 px-6 py-10"
          >
            {/* 01 — STATUS */}
            <div className="space-y-4">
              <SectionLabel n="01" title="STATUS" />
              <div className="font-heading text-4xl leading-none text-text">
                {STATUS_LABELS[scanStatus] || 'STANDBY'}
              </div>
              <div className="font-body text-sm text-text/50">
                {STATUS_HINTS[scanStatus] || statusMsg}
              </div>
            </div>

            {/* 02 — TELEMETRY */}
            <div className="space-y-4">
              <SectionLabel n="02" title="TELEMETRY" />
              <dl className="grid grid-cols-[1fr_auto] gap-y-2 gap-x-6 font-ui text-[11px]">
                <dt className="text-text/40 uppercase tracking-[0.2em]">Tracked</dt>
                <dd className="tabular-nums text-text text-right">{trackedCount} / 17</dd>
                <dt className="text-text/40 uppercase tracking-[0.2em]">Hold</dt>
                <dd className="tabular-nums text-text text-right">{holdSeconds}s</dd>
                <dt className="text-text/40 uppercase tracking-[0.2em]">Stability</dt>
                <dd className="tabular-nums text-text text-right">{holdPct}%</dd>
                <dt className="text-text/40 uppercase tracking-[0.2em]">Frames</dt>
                <dd className="tabular-nums text-text text-right">{padFrame(frameDisplay)}</dd>
              </dl>
            </div>

            {/* 03 — VECTOR (pose-derived live coords; reads as racing position data) */}
            <div className="space-y-4">
              <SectionLabel n="03" title="VECTOR" />
              <dl className="grid grid-cols-[1fr_auto] gap-y-2 gap-x-6 font-ui text-[11px]">
                <dt className="text-text/40 uppercase tracking-[0.2em]">Pos·X</dt>
                <dd className="tabular-nums text-text text-right">{vectorX}</dd>
                <dt className="text-text/40 uppercase tracking-[0.2em]">Pos·Y</dt>
                <dd className="tabular-nums text-text text-right">{vectorY}</dd>
                <dt className="text-text/40 uppercase tracking-[0.2em]">Conf</dt>
                <dd className="tabular-nums text-text text-right">{avgConf}</dd>
              </dl>
            </div>

            {/* 04 — GUIDANCE */}
            <div className="space-y-4">
              <SectionLabel n="04" title="GUIDANCE" />
              <ol className="space-y-2 font-body text-sm text-text/60">
                <li className="flex gap-3">
                  <span className="text-accent font-ui text-[11px] mt-0.5">01</span>
                  Stand 6ft from camera
                </li>
                <li className="flex gap-3">
                  <span className="text-accent font-ui text-[11px] mt-0.5">02</span>
                  Full body in frame
                </li>
                <li className="flex gap-3">
                  <span className="text-accent font-ui text-[11px] mt-0.5">03</span>
                  Hold still 3 seconds
                </li>
              </ol>
            </div>

            {/* Tertiary fallback action */}
            <div className="mt-auto pt-6 border-t border-text/10">
              <button
                onClick={() => setShowFallback(true)}
                className="font-ui text-[10px] tracking-[0.4em] uppercase text-text/40 hover:text-accent transition-colors"
              >
                ▸ Skip / Manual select
              </button>
            </div>
          </motion.aside>

          {/* CENTER VIEWPORT */}
          <section className="px-4 sm:px-10 py-8 lg:py-10 flex flex-col">
            {/* Page title row — visible on all sizes */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-6 flex items-end justify-between gap-6"
            >
              <div>
                <div className="text-accent font-ui text-[11px] tracking-[0.4em] uppercase mb-2">
                  ▸ INITIATE
                </div>
                <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl leading-[0.85]">
                  READ MY <span className="text-accent">BUILD</span>.
                </h1>
              </div>
              {/* Mobile-only mini status (telemetry rail is desktop-only) */}
              <div className="lg:hidden text-right font-ui text-[10px] tracking-[0.3em] uppercase text-text/50">
                <div className="text-accent text-base font-heading tracking-normal">
                  {STATUS_LABELS[scanStatus] || 'STANDBY'}
                </div>
                <div className="mt-1 tabular-nums">{padFrame(frameDisplay)}</div>
              </div>
            </motion.div>

            {/* Camera viewport */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative bg-black border border-text/20 self-center"
              style={{ width: dimensions.width, height: dimensions.height }}
            >
              {/* Outer corner brackets — chunkier "lg" size for the racing frame look */}
              <BracketFrame size="lg" />

              {/* Top strip — feed metadata */}
              <div className="absolute top-0 left-0 right-0 z-20 px-3 py-2 flex items-center justify-between font-ui text-[9px] uppercase tracking-[0.4em] text-text/60 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
                <span>FEED · {videoDims.width}×{videoDims.height}</span>
                <span className="flex items-center gap-4">
                  <span className="text-text/50 hidden sm:inline">CH·01</span>
                  <span className="flex items-center gap-2 text-accent">
                    <span className="w-1.5 h-1.5 bg-accent inline-block pulse-glow" />
                    LIVE
                  </span>
                </span>
              </div>

              {/* Pseudo-telemetry data ticker — sits just below the FEED strip,
                  scrolls right→left to give the viewport an "instrument
                  cluster always-on" feel. Frame counter feeds the live values. */}
              <div className="absolute top-7 left-0 right-0 z-[15] h-5 bg-black/55 border-y border-text/10 overflow-hidden pointer-events-none">
                <div className="data-feed flex w-max whitespace-nowrap font-ui text-[9px] tracking-[0.3em] uppercase text-text/55 leading-5 will-change-transform">
                  <DataFeedRow frame={frameDisplay} tracked={trackedCount} stab={holdPct} conf={avgConf} />
                  <DataFeedRow frame={frameDisplay} tracked={trackedCount} stab={holdPct} conf={avgConf} />
                </div>
              </div>

              {/* Rangefinder hash-mark rulers — racing measurement-tape feel
                  along the left + right edges of the viewport. */}
              <div className="absolute top-8 bottom-0 left-0 w-2 hash-marks-y pointer-events-none z-10" aria-hidden="true" />
              <div className="absolute top-8 bottom-0 right-0 w-2 hash-marks-y pointer-events-none z-10" aria-hidden="true" />
              <div className="absolute top-8 bottom-0 left-0 w-2 hash-marks-y-major pointer-events-none z-10 mix-blend-screen" aria-hidden="true" />
              <div className="absolute top-8 bottom-0 right-0 w-2 hash-marks-y-major pointer-events-none z-10 mix-blend-screen" aria-hidden="true" />

              {/* Diagonal racing-stripe markers — top-right + bottom-left,
                  pit-lane chevron motif that subtly animates. */}
              <div className="absolute top-12 right-0 w-24 h-1.5 diagonal-stripes opacity-70 z-20 pointer-events-none" aria-hidden="true" />
              <div className="absolute bottom-0 left-0 w-24 h-1.5 diagonal-stripes opacity-70 z-20 pointer-events-none" aria-hidden="true" />

              {/* Vertical scanline sweep — only while actively searching/locking.
                  Hidden during HOLDING so it doesn't compete with the tachometer. */}
              {!loading &&
                scanStatus !== SCAN_STATUS.HOLDING &&
                scanStatus !== SCAN_STATUS.COMPLETE && (
                  <div className="absolute inset-0 z-[15] overflow-hidden pointer-events-none">
                    <div className="absolute inset-x-0 h-px bg-accent shadow-[0_0_24px_rgba(185,58,50,0.85)] scan-sweep-v" />
                  </div>
                )}

              {/* Center crosshair / target reticle — pops the moment a body is
                  detected; persists through HOLD as a "lock acquired" marker. */}
              <AnimatePresence>
                {(scanStatus === SCAN_STATUS.DETECTED ||
                  scanStatus === SCAN_STATUS.HOLDING) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 1.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center"
                  >
                    <div className="relative w-28 h-28 radar-pulse">
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-accent/70" />
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-accent/70" />
                      <div className="absolute top-0 left-0 w-3.5 h-3.5 border-l-2 border-t-2 border-accent" />
                      <div className="absolute top-0 right-0 w-3.5 h-3.5 border-r-2 border-t-2 border-accent" />
                      <div className="absolute bottom-0 left-0 w-3.5 h-3.5 border-l-2 border-b-2 border-accent" />
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 border-r-2 border-b-2 border-accent" />
                      {/* Tiny coord chip top-right of the reticle */}
                      <span className="absolute -top-5 right-0 font-ui text-[9px] tracking-[0.3em] uppercase text-accent tabular-nums">
                        {vectorX} · {vectorY}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Giant tachometer-style HOLD countdown.
                  Sits behind the bottom HOLD strip and is the focal element of
                  the screen during the 3-second lock-in. */}
              <AnimatePresence>
                {scanStatus === SCAN_STATUS.HOLDING && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 z-[25] pointer-events-none flex flex-col items-center justify-center"
                  >
                    <div className="font-ui text-[10px] tracking-[0.5em] uppercase text-accent mb-2">
                      ▸ HOLD
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={holdCountdown}
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="font-heading font-bold text-[10rem] sm:text-[12rem] leading-none tabular-nums text-text tachometer-glow"
                      >
                        {holdCountdown}
                      </motion.div>
                    </AnimatePresence>
                    <div className="font-ui text-[10px] tracking-[0.4em] uppercase text-text/60 mt-2">
                      DON'T MOVE
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading scrim */}
              {loading && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85">
                  <LoadingSpinner size={48} />
                  <div className="mt-6 font-ui text-[11px] tracking-[0.4em] uppercase text-text/60">
                    {statusMsg}
                  </div>
                </div>
              )}

              {/* Live video */}
              <video
                ref={videoRef}
                className="absolute top-0 left-0 w-full h-full object-cover"
                playsInline
                muted
                autoPlay
                style={{ transform: 'scaleX(-1)' }}
              />

              {/* Silhouette guide */}
              <AnimatePresence>
                {isShowingGuide && !loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0"
                    style={{ transform: 'scaleX(-1)' }}
                  >
                    <SilhouetteGuide width={dimensions.width} height={dimensions.height} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Skeleton overlay */}
              {currentKeypoints && (
                <div style={{ transform: 'scaleX(-1)' }} className="absolute inset-0">
                  <SkeletonOverlay
                    keypoints={currentKeypoints}
                    width={dimensions.width}
                    height={dimensions.height}
                    videoWidth={videoDims.width}
                    videoHeight={videoDims.height}
                  />
                </div>
              )}

              {/* Hold progress — bottom telemetry strip */}
              <AnimatePresence>
                {scanStatus === SCAN_STATUS.HOLDING && (
                  <motion.div
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 16, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-x-0 bottom-0 z-30 px-4 py-3 bg-black/85 border-t border-accent/40 font-ui text-[10px] uppercase tracking-[0.4em] flex items-center gap-4"
                  >
                    <span className="text-accent">HOLD</span>
                    <div className="flex-1 h-[3px] bg-text/15 overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${holdPct}%`, transition: 'width 100ms linear' }}
                      />
                    </div>
                    <span className="tabular-nums text-text/80">
                      {holdSeconds}S / 3.0S
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scan complete overlay */}
              <AnimatePresence>
                {scanStatus === SCAN_STATUS.COMPLETE && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-bg/90 backdrop-blur-[2px]"
                  >
                    <div className="font-ui text-accent text-[11px] tracking-[0.5em] uppercase mb-4">
                      ▸ COMPLETE
                    </div>
                    <motion.div
                      initial={{ scale: 0.92, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                      className="font-heading text-6xl sm:text-7xl text-text leading-none mb-3"
                    >
                      LOCKED.
                    </motion.div>
                    <div className="font-body text-text/60 text-sm">
                      Building your routine…
                    </div>
                    {/* Decorative bracket frame */}
                    <div className="absolute inset-6 border border-accent/30 pointer-events-none" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Below viewport — small caption + readout */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 self-center w-full flex items-end justify-between gap-6 max-w-[880px]"
              style={{ width: dimensions.width || undefined }}
            >
              <p className="font-body text-text/40 text-sm max-w-md">
                Stand about 6ft from the camera. Full body visible. Hold still for 3 seconds and we'll lock in your build.
              </p>
              {/* Mobile-only fallback (desktop has it in the rail) */}
              <button
                onClick={() => setShowFallback(true)}
                className="lg:hidden shrink-0 font-ui text-[10px] tracking-[0.4em] uppercase text-text/50 hover:text-text border border-text/20 hover:border-accent rounded-none hover:rounded-lg px-4 py-2.5 transition-all"
              >
                ▸ MANUAL
              </button>
            </motion.div>
          </section>
        </main>

        {/* BOTTOM TELEMETRY BAR */}
        <BottomBar stage={2} tagline="▸ READ. LOCK. BUILD." />
      </div>
    </PageTransition>
  );
}

/**
 * Pseudo-telemetry strip rendered inside the data-feed ticker.
 *
 * The actual scroll is a CSS animation on the parent (`.data-feed`); this
 * component just emits the string content. Two copies of the row are placed
 * side-by-side so the parent can translateX(-50%) for a seamless loop.
 *
 * Values are a mix of real signal (frame counter, tracked-keypoint count,
 * stability %, average confidence) and decorative deterministic noise that
 * varies with the frame counter — enough to read as "live" without burning
 * cycles on RNG every render.
 */
function DataFeedRow({ frame, tracked, stab, conf }) {
  const f = frame || 0;
  const drift = ((f % 40) / 1000).toFixed(3);
  const vec = (0.12 + (f % 50) / 500).toFixed(3);
  const lat = (8 + (f % 4)).toString().padStart(2, '0');
  return (
    <span className="px-6 inline-flex items-center gap-6">
      <span>POSE.CONF <span className="text-text tabular-nums">{conf}</span></span>
      <span className="text-accent">·</span>
      <span>VEC.MAG <span className="text-text tabular-nums">{vec}</span></span>
      <span className="text-accent">·</span>
      <span>DRIFT <span className="text-text tabular-nums">{drift}</span></span>
      <span className="text-accent">·</span>
      <span>KP <span className="text-text tabular-nums">{String(tracked).padStart(2, '0')}/17</span></span>
      <span className="text-accent">·</span>
      <span>STAB <span className="text-text tabular-nums">{String(stab).padStart(3, '0')}%</span></span>
      <span className="text-accent">·</span>
      <span>FRAME <span className="text-text tabular-nums">{String(f).padStart(5, '0')}</span></span>
      <span className="text-accent">·</span>
      <span>LAT <span className="text-text tabular-nums">{lat}MS</span></span>
      <span className="text-accent">·</span>
      <span>RIG.01</span>
      <span className="text-accent">·</span>
      <span>ENGINE.MOVENET</span>
      <span className="text-accent">·</span>
      <span>MODE.CAPTURE</span>
      <span className="text-accent">·</span>
      <span>BORN.IN.DUBAI</span>
      <span className="text-accent">·</span>
    </span>
  );
}
