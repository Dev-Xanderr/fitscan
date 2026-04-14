import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useScanStore from '../../context/ScanContext';
import { loadPoseDetector, detectPose, isFullBodyVisible } from '../../services/poseService';
import { calculateBodyMetrics, classifyBodyType, classifyFrameSize, getProportionalNotes, calculateBMI } from '../../utils/bodyMetrics';
import { STABILITY_THRESHOLD, STABILITY_FRAMES, STABILITY_DURATION, DETECTION_TIMEOUT, BODY_TYPES } from '../../utils/constants';
import { generateLocalRoutine } from '../../services/localRoutineGenerator';
import SkeletonOverlay from './SkeletonOverlay';
import SilhouetteGuide from './SilhouetteGuide';
import LoadingSpinner from '../UI/LoadingSpinner';
import Button from '../UI/Button';
import PageTransition from '../UI/PageTransition';

const STATUS_LABELS = {
  idle: 'Warming up',
  camera: 'Camera live',
  loading: 'Loading AI',
  searching: 'Step into frame',
  detected: 'Locked in',
  holding: 'Hold still',
  complete: 'Scan complete',
};

export default function CameraView() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const animFrameRef = useRef(null);
  const stableStartRef = useRef(null);
  const prevKpsRef = useRef([]);
  const detectorRef = useRef(null);
  const timeoutRef = useRef(null);
  const completedRef = useRef(false);
  const streamRef = useRef(null);
  const mountedRef = useRef(true);

  const { userInfo, setScanData, setScanStatus, scanStatus, setAnalysis, setRoutine, setRoutineLoading, setRoutineError } = useScanStore();
  const [currentKeypoints, setCurrentKeypoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('Starting camera...');
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 });
  const [videoDims, setVideoDims] = useState({ width: 640, height: 480 });
  const [holdProgress, setHoldProgress] = useState(0);
  const [showFallback, setShowFallback] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  // Cleanup helper
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

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

    let heightCm = parseFloat(userInfo.height) || 170;
    if (userInfo.heightUnit === 'in') heightCm = heightCm * 2.54;

    let weightKg = parseFloat(userInfo.weight) || 70;
    if (userInfo.weightUnit === 'lbs') weightKg = weightKg * 0.453592;

    const metrics = calculateBodyMetrics(keypoints, heightCm);
    const bmi = calculateBMI(weightKg, heightCm);
    const bodyType = classifyBodyType(metrics, bmi);
    const frameSize = classifyFrameSize(metrics.shoulderWidth, heightCm);
    const notes = getProportionalNotes(metrics);

    setScanData(keypoints, snapshot);
    setAnalysis(metrics, bodyType, frameSize, notes);
    setScanStatus('complete');
    stopStream();

    // Booth flow: skip /results and go straight to /routine.
    // Generate the routine offline (no API) while the success animation plays.
    setRoutineLoading(true);
    (async () => {
      try {
        const typeInfo = BODY_TYPES[bodyType] || BODY_TYPES.mesomorph;
        const currentSalt = useScanStore.getState().routineSalt;
        const analysisData = {
          bodyType: typeInfo.name,
          frameSize,
          bodyMetrics: metrics,
          proportionalNotes: notes,
          salt: currentSalt,
        };
        const result = await generateLocalRoutine(userInfo, analysisData);
        setRoutine(result);
      } catch (err) {
        console.error('Local routine generation failed:', err);
        setRoutineError(err.message || 'Routine generation failed');
      }
    })();

    setTimeout(() => navigate('/routine'), 1200);
  }, [userInfo, setScanData, setAnalysis, setScanStatus, navigate, stopStream, setRoutine, setRoutineLoading, setRoutineError]);

  // Detection loop
  const runDetection = useCallback(async () => {
    if (completedRef.current || !mountedRef.current) return;

    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(runDetection);
      return;
    }

    try {
      const pose = await detectPose(detector, video);

      if (pose && pose.keypoints) {
        const kps = pose.keypoints;
        setCurrentKeypoints(kps);

        if (isFullBodyVisible(kps)) {
          const currentStatus = useScanStore.getState().scanStatus;
          if (currentStatus !== 'detected' && currentStatus !== 'holding' && currentStatus !== 'complete') {
            setScanStatus('detected');
          }

          const prevList = prevKpsRef.current;
          if (prevList.length >= STABILITY_FRAMES) {
            const avgDelta = prevList.reduce((sum, prev) => {
              const d = kps.reduce((s, kp, i) => {
                const p = prev[i];
                if (!p) return s;
                return s + Math.abs(kp.x - p.x) + Math.abs(kp.y - p.y);
              }, 0) / kps.length;
              return sum + d;
            }, 0) / prevList.length;

            if (avgDelta < STABILITY_THRESHOLD) {
              if (!stableStartRef.current) {
                stableStartRef.current = Date.now();
                setScanStatus('holding');
              }
              const elapsed = Date.now() - stableStartRef.current;
              setHoldProgress(Math.min(elapsed / STABILITY_DURATION, 1));

              if (elapsed >= STABILITY_DURATION) {
                captureAndAnalyze(kps);
                return;
              }
            } else {
              stableStartRef.current = null;
              setHoldProgress(0);
              const cs = useScanStore.getState().scanStatus;
              if (cs === 'holding') setScanStatus('detected');
            }
          }

          prevKpsRef.current = [...prevList.slice(-(STABILITY_FRAMES - 1)), kps];
        } else {
          stableStartRef.current = null;
          setHoldProgress(0);
          prevKpsRef.current = [];
          const cs = useScanStore.getState().scanStatus;
          if (cs !== 'searching' && cs !== 'idle' && cs !== 'loading' && cs !== 'camera') {
            setScanStatus('searching');
          }
        }
      } else {
        setCurrentKeypoints(null);
        stableStartRef.current = null;
        setHoldProgress(0);
        prevKpsRef.current = [];
      }
    } catch (err) {
      console.warn('Detection frame error:', err);
    }

    if (!completedRef.current && mountedRef.current) {
      animFrameRef.current = requestAnimationFrame(runDetection);
    }
  }, [captureAndAnalyze, setScanStatus]);

  // Initialize camera and model
  useEffect(() => {
    mountedRef.current = true;
    completedRef.current = false;

    async function init() {
      setScanStatus('camera');
      setStatusMsg('Starting camera...');

      // Step 1: Get camera — retry up to 3 times
      let stream = null;
      let cameraError = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          // Try different constraints on each attempt
          const constraints = attempt === 0
            ? { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } }
            : attempt === 1
            ? { video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } } }
            : { video: true };

          stream = await navigator.mediaDevices.getUserMedia(constraints);
          cameraError = null;
          break;
        } catch (err) {
          cameraError = err;
          console.warn(`Camera attempt ${attempt + 1} failed:`, err.name, err.message);
          // Small delay before retry
          if (attempt < 2) await new Promise((r) => setTimeout(r, 500));
        }
      }

      if (!mountedRef.current) {
        if (stream) stream.getTracks().forEach((t) => t.stop());
        return;
      }

      if (!stream) {
        console.error('All camera attempts failed:', cameraError);
        setError(cameraError?.message || 'Camera access denied');
        setLoading(false);
        setShowFallback(true);
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to actually be ready
        await new Promise((resolve) => {
          const video = videoRef.current;
          if (!video) { resolve(); return; }

          if (video.readyState >= 2) {
            resolve();
          } else {
            const onReady = () => {
              video.removeEventListener('loadeddata', onReady);
              resolve();
            };
            video.addEventListener('loadeddata', onReady);
            video.play().catch(() => {});
          }

          // Safety timeout
          setTimeout(resolve, 5000);
        });

        if (!mountedRef.current) { stopStream(); return; }

        const vw = videoRef.current?.videoWidth || 640;
        const vh = videoRef.current?.videoHeight || 480;
        setVideoDims({ width: vw, height: vh });

        const containerWidth = Math.min(window.innerWidth - 32, 640);
        const containerHeight = (vh / vw) * containerWidth;
        setDimensions({ width: containerWidth, height: containerHeight });
        setCameraReady(true);
        setStatusMsg('Camera ready! Loading AI model...');
      }

      // Step 2: Load AI model
      try {
        setScanStatus('loading');
        setStatusMsg('Loading AI pose detection model...');

        const detector = await loadPoseDetector();

        if (!mountedRef.current) return;

        detectorRef.current = detector;
        setLoading(false);
        setScanStatus('searching');
        setStatusMsg('Stand in frame — full body visible');

        // Timeout fallback
        timeoutRef.current = setTimeout(() => {
          const status = useScanStore.getState().scanStatus;
          if (status === 'searching' || status === 'loading') {
            setShowFallback(true);
          }
        }, DETECTION_TIMEOUT);
      } catch (err) {
        console.error('Model load error:', err);
        if (!mountedRef.current) return;
        setError(`AI model failed to load: ${err.message}`);
        setLoading(false);
        setShowFallback(true);
      }
    }

    init();

    return () => {
      mountedRef.current = false;
      stopStream();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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
    setScanStatus('complete');

    // Generate routine offline, then go to /routine (booth flow — no /results page)
    setRoutineLoading(true);
    (async () => {
      try {
        const typeInfo = BODY_TYPES[type] || BODY_TYPES.mesomorph;
        const mockSalt = useScanStore.getState().routineSalt;
        const analysisData = {
          bodyType: typeInfo.name,
          frameSize,
          bodyMetrics: mockMetrics,
          proportionalNotes: notes,
          salt: mockSalt,
        };
        const result = await generateLocalRoutine(userInfo, analysisData);
        setRoutine(result);
      } catch (err) {
        console.error('Local routine generation failed:', err);
        setRoutineError(err.message || 'Routine generation failed');
      }
    })();

    navigate('/routine');
  };

  if (showFallback) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
          <h1 className="text-5xl mb-2">Manual <span className="text-[#b93a32]">Selection</span></h1>
          <p className="text-white/40 mb-10 text-center max-w-md">
            {error || 'Detection timed out.'} Select your body type manually.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl w-full">
            {[
              { type: 'ectomorph', label: 'Ectomorph', desc: 'Lean, narrow frame, fast metabolism', icon: '🏃' },
              { type: 'mesomorph', label: 'Mesomorph', desc: 'Athletic, muscular, medium frame', icon: '💪' },
              { type: 'endomorph', label: 'Endomorph', desc: 'Broader, solid frame, strong base', icon: '🏋️' },
            ].map((bt) => (
              <motion.button
                key={bt.type}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleManualSelect(bt.type)}
                className="glass rounded-2xl p-8 text-center cursor-pointer hover:border-[#b93a32]/30 transition-colors"
              >
                <span className="text-5xl block mb-4">{bt.icon}</span>
                <h3 className="text-2xl mb-1">{bt.label}</h3>
                <p className="text-white/40 text-sm">{bt.desc}</p>
              </motion.button>
            ))}
          </div>
          <Button variant="ghost" onClick={() => window.location.reload()} className="mt-8">
            Try Camera Again
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Status */}
        <motion.div className="mb-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-4xl sm:text-5xl mb-2">THE <span className="text-[#b93a32]">SCAN</span></h1>
          <div className="flex items-center justify-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              scanStatus === 'complete' ? 'bg-green-400' :
              scanStatus === 'holding' ? 'bg-[#b93a32] pulse-glow' :
              scanStatus === 'detected' ? 'bg-[#b93a32]' :
              'bg-white/30 pulse-glow'
            }`} />
            <span className="text-white/60">{STATUS_LABELS[scanStatus] || statusMsg}</span>
          </div>
        </motion.div>

        {/* Camera container */}
        <div
          className="relative rounded-3xl overflow-hidden bg-black/50 border border-white/10"
          style={{ width: dimensions.width, height: dimensions.height }}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/80">
              <LoadingSpinner text={statusMsg} />
            </div>
          )}

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
            {(scanStatus === 'searching' || scanStatus === 'idle' || scanStatus === 'loading' || scanStatus === 'camera') && !loading && (
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

          {/* Hold progress ring */}
          {scanStatus === 'holding' && (
            <div className="absolute top-4 right-4 z-10">
              <svg width="60" height="60" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                <circle
                  cx="30" cy="30" r="26" fill="none" stroke="#b93a32" strokeWidth="4"
                  strokeDasharray={2 * Math.PI * 26}
                  strokeDashoffset={2 * Math.PI * 26 * (1 - holdProgress)}
                  strokeLinecap="round"
                  transform="rotate(-90 30 30)"
                />
                <text x="30" y="34" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                  {Math.round(holdProgress * 3)}s
                </text>
              </svg>
            </div>
          )}

          {/* Scan complete overlay */}
          <AnimatePresence>
            {scanStatus === 'complete' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/60 flex items-center justify-center z-10"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="bg-[#b93a32] rounded-full p-6"
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tips */}
        <motion.div
          className="mt-6 text-center max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-white/30 text-sm">
            Stand about 6ft from the camera. Full body should be visible. Stay still for 3 seconds.
          </p>
          <Button variant="ghost" onClick={() => setShowFallback(true)} className="mt-4 text-sm">
            Can't use camera? Select manually
          </Button>
        </motion.div>
      </div>
    </PageTransition>
  );
}
