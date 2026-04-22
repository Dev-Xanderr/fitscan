import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import LZString from 'lz-string';
import { toBlob } from 'html-to-image';
import useScanStore from '../../context/ScanContext';
import LoadingSpinner from '../UI/LoadingSpinner';
import Button from '../UI/Button';
import { getProductRecommendations } from '../../utils/productRecommendations';
import { GOALS, ROUTES } from '../../utils/constants';
import { SectionLabel, BracketFrame, TopBar, BottomBar, padFrame } from '../UI/Telemetry';
import LeadCapture from '../Privacy/LeadCapture';

// QR v40 at error-correction level L tops out at 2,953 bytes of payload.
// Above that, qrcode.react silently fails to encode, so we swap in a fallback.
const MAX_QR_PAYLOAD = 2953;

/**
 * BoothRoutine — stage 03 of the booth flow.
 *
 *  - Hero strip with numbered profile telemetry (body type, frame, goal, duration)
 *  - 02 / SCHEDULE: numbered day cards, click to open the full workout modal
 *  - 03 / TAKE IT WITH YOU: QR card (booth only — phone viewer hides this)
 *  - 04 / GEAR FOR YOUR BUILD: product recommendations
 *  - Reset is manual — visitor (or staff) taps "START OVER" at the bottom.
 *    No auto-timeout; the QR + routine stay on screen until someone acts.
 *
 * Modal a11y: dialog role + Esc-to-close + focus restoration to the opener.
 */
export default function BoothRoutine({ phoneMode = false }) {
  const navigate = useNavigate();
  // Per-field selectors so unrelated store ticks (scanStatus, salt, etc.)
  // don't re-render the routine page. Matches CameraView's pattern.
  const routine = useScanStore((s) => s.routine);
  const routineLoading = useScanStore((s) => s.routineLoading);
  const routineError = useScanStore((s) => s.routineError);
  const bodyType = useScanStore((s) => s.bodyType);
  const frameSize = useScanStore((s) => s.frameSize);
  const boothGoal = useScanStore((s) => s.boothGoal);
  const leadCaptured = useScanStore((s) => s.leadCaptured);
  const reset = useScanStore((s) => s.reset);

  const [openDayIdx, setOpenDayIdx] = useState(null);

  // QR target URL.
  //
  // The routine generator is DETERMINISTIC — same inputs always produce the
  // same routine. v:2 of the QR payload embeds the actual routine directly so
  // the phone shows exactly what's on screen (no regeneration drift). LZ-string
  // compression keeps it scannable at level L below ~2.9KB.
  const qrUrl = useMemo(() => {
    if (!routine) return '';
    const schedule = routine.weeklySchedule || [];

    const payload = {
      v: 2,
      g: boothGoal,
      bt: bodyType,
      fs: frameSize,
      dur: routine.estimatedSessionDuration || '',
      np: routine.nutritionTips || [],
      d: schedule.map((day) => ({
        n: day.day,
        f: day.focus,
        e: (day.exercises || []).map((ex) => ({
          n: ex.name,
          s: ex.sets || '',
          r: ex.reps || '',
          rs: ex.rest || '',
        })),
      })),
    };

    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
    const publicBase = import.meta.env.VITE_PUBLIC_URL;
    const base = publicBase
      ? publicBase.replace(/\/$/, '')
      : typeof window !== 'undefined'
        ? window.location.origin + (import.meta.env.BASE_URL || '').replace(/\/$/, '')
        : '';
    return `${base}/?r=${compressed}`;
  }, [routine, boothGoal, bodyType, frameSize]);

  const productRecs = useMemo(
    () => getProductRecommendations(bodyType, boothGoal),
    [bodyType, boothGoal]
  );

  // Modal close — stable callback so Esc handler and click handlers share one path.
  const closeDay = useCallback(() => setOpenDayIdx(null), []);

  // Save-as-image wiring (phoneMode only).
  //
  // The visible phone page collapses each day to a 4-exercise preview for
  // scroll-friendliness, so capturing the DOM as-is would produce a teaser,
  // not a useful take-home. Instead we render a dedicated <RoutineExport>
  // template off-screen with *every* exercise expanded (sets · reps · rest
  // per line, plus warm-up and cool-down), capture that, and show the result
  // in a "press and hold to save" modal.
  //
  // We don't use navigator.share() here. In testing it falls back to weak
  // options like "Copy to Clipboard" on several browsers, and "Save to Photos"
  // isn't reliable across iOS/Android/desktop. A visible image the user can
  // long-press (or right-click on desktop) is bulletproof everywhere.
  const captureRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [savedImage, setSavedImage] = useState(null); // { url, filename }

  const closeSavedImage = useCallback(() => {
    setSavedImage((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, []);

  const saveAsImage = useCallback(async () => {
    if (!captureRef.current || capturing) return;
    setCapturing(true);
    try {
      // pixelRatio:2 → retina-sharp PNG. backgroundColor matches bg-bg (#121212)
      // so the capture isn't transparent — the visible page's dusk gradient
      // lives on a -z-10 sibling and isn't part of the captured node.
      const blob = await toBlob(captureRef.current, {
        pixelRatio: 2,
        backgroundColor: '#121212',
        cacheBust: true,
      });
      if (!blob) throw new Error('Capture returned empty');

      const slug = (bodyType || 'routine').toString().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const filename = `squatwolf-routine-${slug}.png`;
      const url = URL.createObjectURL(blob);
      setSavedImage({ url, filename });
    } catch (err) {
      console.error('Could not save routine image:', err);
    } finally {
      setCapturing(false);
    }
  }, [bodyType, capturing]);

  // Revoke any blob URL on unmount so we don't leak memory if the modal
  // is still open when the user navigates away.
  useEffect(() => {
    return () => {
      if (savedImage?.url) URL.revokeObjectURL(savedImage.url);
    };
  }, [savedImage]);

  // Esc-to-close + focus restoration. Capture the activeElement on open so
  // we can return focus to the day card that triggered the modal.
  const openerRef = useRef(null);
  const closeBtnRef = useRef(null);
  useEffect(() => {
    if (openDayIdx === null) {
      if (openerRef.current) {
        openerRef.current.focus();
        openerRef.current = null;
      }
      return;
    }
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      openerRef.current = document.activeElement;
    }
    const onKey = (e) => {
      if (e.key === 'Escape') closeDay();
    };
    window.addEventListener('keydown', onKey);
    closeBtnRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [openDayIdx, closeDay]);

  // ── LOADING STATE ──────────────────────────────────────────────────────────
  if (routineLoading || (!routine && !routineError)) {
    return (
      <div className="min-h-screen w-full bg-bg text-text flex flex-col">
        {!phoneMode && <TopBar stage="ROUTINE" right={<span className="hidden sm:inline">BUILDING</span>} />}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="text-accent font-ui text-[11px] tracking-[0.5em] uppercase mb-6">
              ▸ BUILDING
            </div>
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl text-text leading-[0.85] mb-2">
              YOUR ROUTINE.
            </h1>
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl text-accent leading-[0.85] mb-10">
              ENGINEERED.
            </h1>
            <div className="flex justify-center mb-6">
              <LoadingSpinner size={48} />
            </div>
            <p className="font-body text-text/40 text-xs tracking-[0.3em] uppercase">
              Hold tight — the pack's got you
            </p>
          </div>
        </div>
        {!phoneMode && <BottomBar stage={3} tagline="▸ READ. LOCK. BUILD." />}
      </div>
    );
  }

  // ── ERROR STATE ────────────────────────────────────────────────────────────
  if (routineError) {
    return (
      <div className="min-h-screen w-full bg-bg text-text flex flex-col">
        {!phoneMode && <TopBar stage="ROUTINE" right={<span className="hidden sm:inline text-accent">FAULT</span>} />}
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-md relative border border-text/15 px-10 py-12 bg-text/[0.02]">
            <BracketFrame size="md" color="accent" />
            <div className="text-accent font-ui text-[11px] tracking-[0.5em] uppercase mb-6">
              ▸ SYSTEM FAULT
            </div>
            <h1 className="font-heading text-5xl text-text leading-[0.85] mb-2">
              SOMETHING
            </h1>
            <h1 className="font-heading text-5xl text-accent leading-[0.85] mb-6">
              BROKE.
            </h1>
            <p className="font-body text-text/50 text-sm mb-8">{routineError}</p>
            <Button
              variant="primary"
              onClick={() => {
                reset();
                navigate(ROUTES.LANDING);
              }}
            >
              ▸ START OVER
            </Button>
          </div>
        </div>
        {!phoneMode && <BottomBar stage={3} tagline="▸ READ. LOCK. BUILD." />}
      </div>
    );
  }

  // ── MAIN RESULTS VIEW ──────────────────────────────────────────────────────
  const schedule = routine.weeklySchedule || [];
  const goalLabel = boothGoal === GOALS.LOSE_FAT ? 'GET LEAN' : 'BUILD MUSCLE';
  const openDay = openDayIdx !== null ? schedule[openDayIdx] : null;
  const dialogTitleId = 'day-dialog-title';

  return (
    <div className="min-h-[100dvh] w-full bg-bg text-text relative overflow-hidden flex flex-col">
      {/* Same dusk wash as the other booth screens */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at 70% 30%, rgba(185,58,50,0.16) 0%, rgba(0,0,0,1) 65%)',
        }}
      />
      <div className="absolute left-0 top-0 bottom-0 w-px bg-accent/20 -z-10" aria-hidden="true" />

      {!phoneMode && <TopBar stage="ROUTINE" />}

      <main className={`${phoneMode ? 'px-4 py-8' : 'px-6 sm:px-10 lg:px-14 py-10'} flex-1 max-w-7xl mx-auto w-full`}>
        {/* HERO STRIP */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="text-accent font-ui text-[11px] tracking-[0.4em] uppercase mb-3 flex items-center gap-3">
            <span className="w-8 h-px bg-accent" />
            BUILT FOR {goalLabel}
          </div>
          <h1 className={`${phoneMode ? 'text-5xl' : 'text-6xl sm:text-7xl lg:text-8xl'} font-heading text-text leading-[0.82]`}>
            ROUTINE.
            <br />
            <span className="text-accent">EARNED.</span>
          </h1>

          {/* Profile telemetry — bodytype / frame / duration / days */}
          <dl className={`mt-8 grid ${phoneMode ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'} gap-x-6 gap-y-4 max-w-2xl font-ui text-[11px] uppercase tracking-[0.25em]`}>
            <div>
              <dt className="text-text/30">Body</dt>
              <dd className="text-text mt-1">{bodyType}</dd>
            </div>
            <div>
              <dt className="text-text/30">Frame</dt>
              <dd className="text-text mt-1">{frameSize}</dd>
            </div>
            <div>
              <dt className="text-text/30">Session</dt>
              <dd className="text-text mt-1 tabular-nums">
                {routine.estimatedSessionDuration || '~45 MIN'}
              </dd>
            </div>
            <div>
              <dt className="text-text/30">Days</dt>
              <dd className="text-accent mt-1 tabular-nums">{padFrame(schedule.length, 2)}</dd>
            </div>
          </dl>
        </motion.section>

        {/* MAIN GRID — schedule (left) + QR (right, booth only) */}
        <div className={`grid grid-cols-1 ${!phoneMode ? 'lg:grid-cols-[1.5fr_1fr]' : ''} gap-8 lg:gap-12 items-start`}>
          {/* 02 — SCHEDULE */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-4"
          >
            <SectionLabel n="02" title="SCHEDULE" />
            <div className="space-y-3">
              {schedule.map((day, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  onClick={() => setOpenDayIdx(i)}
                  aria-label={`Open ${day.day} workout — ${day.focus}`}
                  className="group relative w-full grid grid-cols-[48px_1fr_auto] items-center gap-5 border border-text/10 bg-text/[0.02] hover:border-accent hover:bg-accent/[0.06] px-5 py-5 text-left transition-all rounded-none hover:rounded-lg cursor-pointer"
                >
                  <span className="font-heading text-3xl text-text/30 group-hover:text-accent transition-colors tabular-nums">
                    {padFrame(i + 1, 2)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="font-heading text-2xl text-text leading-none">
                        {day.day}
                      </span>
                      <span className="font-ui text-accent text-[10px] tracking-[0.3em] uppercase">
                        {day.focus}
                      </span>
                    </div>
                    <div className="font-body text-text/50 text-sm truncate">
                      {day.exercises
                        .slice(0, 4)
                        .map((e) => e.name)
                        .join(' · ')}
                      {day.exercises.length > 4 ? ` · +${day.exercises.length - 4}` : ''}
                    </div>
                  </div>
                  <span className="font-ui text-text/30 group-hover:text-accent group-hover:translate-x-1 transition-all text-lg">
                    ▶
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* 03 — TAKE IT WITH YOU.
              QR is gated behind lead capture — the routine itself stays
              fully visible in section 02; only the take-home artifact is
              locked. Frames the form as delivery, not marketing, which
              materially out-converts the "parallel path" pattern. */}
          {!phoneMode && (
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="space-y-4 lg:sticky lg:top-6"
            >
              <SectionLabel n="03" title="TAKE IT WITH YOU" />
              <QRCard leadCaptured={leadCaptured} qrUrl={qrUrl} />
            </motion.aside>
          )}
        </div>

        {/* 04 — SAVE TO INBOX (booth only — phone visitors already chose) */}
        {!phoneMode && <LeadCapture />}

        {/* 05 — GEAR */}
        {productRecs.length > 0 && (
          <motion.section
            className="mt-14"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <SectionLabel n={phoneMode ? '04' : '05'} title="GEAR FOR YOUR BUILD" />
            <div className={`mt-5 grid grid-cols-1 sm:grid-cols-2 ${phoneMode ? '' : 'lg:grid-cols-3'} gap-4`}>
              {productRecs.map((rec, i) => (
                <motion.a
                  key={rec.name}
                  href={rec.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.08 }}
                  className="group relative block border border-text/10 bg-text/[0.02] p-5 hover:border-accent hover:bg-accent/[0.05] transition-all rounded-none hover:rounded-lg"
                >
                  <div className="flex items-baseline justify-between mb-2 gap-3">
                    <span className="font-heading text-2xl text-text leading-none">
                      {rec.name}
                    </span>
                    <span className="font-ui text-text/30 text-[10px] uppercase tracking-[0.3em] shrink-0">
                      {rec.category}
                    </span>
                  </div>
                  <div className="font-ui text-accent text-[11px] tracking-[0.2em] uppercase mb-2">
                    {rec.tagline}
                  </div>
                  <p className="font-body text-text/50 text-sm leading-relaxed">
                    {rec.reason}
                  </p>
                  <div className="mt-4 pt-3 border-t border-text/5 flex items-center justify-between font-ui text-[10px] uppercase tracking-[0.3em]">
                    <span className="text-text/30">SQUATWOLF</span>
                    <span className="text-accent group-hover:translate-x-1 transition-transform">
                      SHOP ▶
                    </span>
                  </div>
                </motion.a>
              ))}
            </div>
          </motion.section>
        )}

        {/* Bottom action — booth only */}
        {!phoneMode && (
          <motion.div
            className="mt-12 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              variant="booth"
              onClick={() => {
                reset();
                navigate(ROUTES.LANDING);
              }}
            >
              ▸ START OVER
            </Button>
          </motion.div>
        )}

        {/* Save-as-image — phone only. Opens a modal showing the captured
            PNG with "press and hold" save instructions. The source image is
            RoutineExport rendered off-screen (see below) with every exercise
            expanded, not the collapsed day preview cards visible here. */}
        {phoneMode && (
          <motion.div
            className="mt-10 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
          >
            <Button
              variant="primary"
              onClick={saveAsImage}
              disabled={capturing}
            >
              {capturing ? 'BUILDING…' : '▸ SAVE AS IMAGE'}
            </Button>
            <span className="font-ui text-[10px] tracking-[0.3em] uppercase text-text/30 text-center">
              ▸ FULL ROUTINE · OFFLINE AT THE GYM
            </span>
          </motion.div>
        )}
      </main>

      {!phoneMode && <BottomBar stage={3} tagline="▸ EARNED. NOT GUESSED." />}

      {/* Off-screen export template — only rendered in phoneMode. Positioned
          outside the viewport so it lays out properly (html-to-image needs a
          real bounding box) but never shows to the visitor. This is what we
          actually capture when they hit SAVE AS IMAGE. */}
      {phoneMode && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '-99999px',
            top: 0,
            pointerEvents: 'none',
          }}
        >
          <div ref={captureRef}>
            <RoutineExport
              routine={routine}
              bodyType={bodyType}
              frameSize={frameSize}
              goalLabel={goalLabel}
            />
          </div>
        </div>
      )}

      {/* Saved-image modal — shows the captured PNG with a "press and hold"
          hint so every platform has a clear path to Save. */}
      <AnimatePresence>
        {savedImage && (
          <SavedImageModal
            url={savedImage.url}
            filename={savedImage.filename}
            onClose={closeSavedImage}
          />
        )}
      </AnimatePresence>

      {/* DAY DETAIL MODAL */}
      <AnimatePresence>
        {openDay && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              onClick={closeDay}
              aria-hidden="true"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={dialogTitleId}
              className="relative bg-bg border border-text/15 w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-none"
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 20 }}
            >
              <BracketFrame size="md" color="accent" />

              {/* Modal header */}
              <div className="sticky top-0 bg-bg border-b border-text/10 px-6 py-5 flex items-start justify-between gap-4 z-10">
                <div>
                  <div className="font-ui text-[10px] tracking-[0.4em] uppercase text-accent mb-1">
                    DAY / {padFrame(openDayIdx + 1, 2)} OF {padFrame(schedule.length, 2)}
                  </div>
                  <h2 id={dialogTitleId} className="font-heading text-3xl text-text leading-none">
                    {openDay.day}
                  </h2>
                  <span className="font-ui text-text/50 text-[11px] uppercase tracking-[0.3em] mt-1 inline-block">
                    {openDay.focus}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-ui">
                  <button
                    onClick={() => setOpenDayIdx(Math.max(0, openDayIdx - 1))}
                    disabled={openDayIdx === 0}
                    aria-label="Previous day"
                    className="text-text/40 hover:text-accent disabled:opacity-15 disabled:cursor-not-allowed text-sm border border-text/10 hover:border-accent w-9 h-9 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => setOpenDayIdx(Math.min(schedule.length - 1, openDayIdx + 1))}
                    disabled={openDayIdx === schedule.length - 1}
                    aria-label="Next day"
                    className="text-text/40 hover:text-accent disabled:opacity-15 disabled:cursor-not-allowed text-sm border border-text/10 hover:border-accent w-9 h-9 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    ▶
                  </button>
                  <button
                    ref={closeBtnRef}
                    onClick={closeDay}
                    aria-label="Close workout details"
                    className="ml-1 text-text/50 hover:text-text text-lg border border-text/10 hover:border-accent w-9 h-9 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Warm-up */}
              {openDay.warmup && openDay.warmup.length > 0 && (
                <div className="px-6 pt-6 pb-4 space-y-3">
                  <SectionLabel n="A" title="WARM-UP" />
                  <ul className="font-body text-text/65 text-sm space-y-1.5">
                    {openDay.warmup.map((w, wi) => (
                      <li key={wi} className="flex gap-3">
                        <span className="text-accent/60 font-ui text-[10px] mt-0.5 tabular-nums">
                          {padFrame(wi + 1, 2)}
                        </span>
                        <span>{w.exercise || w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Exercises */}
              <div className="px-6 py-4 space-y-3">
                <SectionLabel n="B" title="EXERCISES" />
                {openDay.exercises.map((ex, ei) => (
                  <div
                    key={ei}
                    className="border border-text/10 bg-text/[0.02] px-4 py-3 grid grid-cols-[36px_1fr] gap-4"
                  >
                    <span className="font-heading text-2xl text-accent/70 leading-none tabular-nums">
                      {padFrame(ei + 1, 2)}
                    </span>
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-body text-text font-medium">{ex.name}</span>
                        {ex.muscleGroup && (
                          <span className="font-ui text-text/30 text-[10px] uppercase tracking-[0.25em] shrink-0">
                            {ex.muscleGroup}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 font-ui text-text/50 text-[11px] uppercase tracking-[0.2em]">
                        {ex.sets && <span><span className="tabular-nums text-text/80">{ex.sets}</span> sets</span>}
                        {ex.reps && <span><span className="tabular-nums text-text/80">{ex.reps}</span> reps</span>}
                        {ex.rest && <span>rest <span className="tabular-nums text-text/80">{ex.rest}</span></span>}
                        {ex.tempo && <span>tempo <span className="tabular-nums text-text/80">{ex.tempo}</span></span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cool-down */}
              {openDay.cooldown && openDay.cooldown.length > 0 && (
                <div className="px-6 pb-6 pt-2 space-y-3">
                  <SectionLabel n="C" title="COOL-DOWN" />
                  <ul className="font-body text-text/65 text-sm space-y-1.5">
                    {openDay.cooldown.map((c, ci) => (
                      <li key={ci} className="flex gap-3">
                        <span className="text-accent/60 font-ui text-[10px] mt-0.5 tabular-nums">
                          {padFrame(ci + 1, 2)}
                        </span>
                        <span>{c.exercise || c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Two states of the take-home card — collected here so the JSX stays a single
// templated render rather than five parallel ternaries on the same boolean.
const QR_CARD_COPY = {
  unlocked: {
    eyebrow: 'SCAN · TAKE HOME',
    headline: 'YOUR PHONE',
    headlineAccent: 'YOUR PLAN.',
    caption:
      'Open your camera, point at the code, and your full routine comes home with you.',
    chip: '▸ READY',
    chipColor: 'text-accent',
  },
  locked: {
    eyebrow: 'LOCKED · UNLOCK BELOW',
    headline: 'LOCK IT',
    headlineAccent: 'TO KEEP IT.',
    caption:
      "Enter your details below to unlock the QR. We'll email a copy too so it follows you home either way.",
    chip: '▸ LOCKED',
    chipColor: 'text-bg/40',
  },
};

function QRCard({ leadCaptured, qrUrl }) {
  const copy = leadCaptured ? QR_CARD_COPY.unlocked : QR_CARD_COPY.locked;
  return (
    <div className="relative bg-text text-bg p-7">
      <BracketFrame size="md" color="accent" />
      <div className="font-ui text-[10px] tracking-[0.4em] uppercase text-bg/60">
        {copy.eyebrow}
      </div>
      <div className="font-heading text-3xl mt-2 mb-5 leading-none">
        {copy.headline}
        <br />
        <span className="text-accent">{copy.headlineAccent}</span>
      </div>

      <AnimatePresence mode="wait">
        {leadCaptured ? (
          <motion.div
            key="qr"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {qrUrl && qrUrl.length <= MAX_QR_PAYLOAD ? (
              <div className="bg-text p-2 inline-block border border-bg/10">
                <QRCodeSVG
                  value={qrUrl}
                  size={228}
                  bgColor="#FAFAFA"
                  fgColor="#121212"
                  level="L"
                />
              </div>
            ) : (
              <div className="bg-bg p-3 w-[228px] h-[228px] flex items-center justify-center text-text/50 text-xs text-center">
                Routine too large for QR
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="locked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <LockedQRPlaceholder />
          </motion.div>
        )}
      </AnimatePresence>

      <p className="font-body text-bg/60 text-xs mt-5 max-w-[228px] leading-relaxed">
        {copy.caption}
      </p>

      <div className="mt-5 pt-4 border-t border-bg/10 flex items-center justify-between font-ui text-[10px] tracking-[0.3em] uppercase">
        <span className="text-bg/50">squatwolf.com</span>
        <span className={copy.chipColor}>{copy.chip}</span>
      </div>
    </div>
  );
}

/**
 * RoutineExport — the take-home image.
 *
 * Renders the full routine (hero stats + every day with all exercises,
 * warm-up, cool-down) in a fixed-width vertical layout optimized for being
 * saved as a phone photo. This is off-screen at all times; only the capture
 * path ever sees it.
 *
 * Styling uses inline styles (not Tailwind classes) because html-to-image
 * captures computed styles reliably, and we want this to render identically
 * whether or not Tailwind's CSS has been applied yet. Inline also sidesteps
 * CSS-variable resolution issues that occasionally break custom-property
 * lookups during serialization.
 */
function RoutineExport({ routine, bodyType, frameSize, goalLabel }) {
  const schedule = routine?.weeklySchedule || [];
  const base = {
    width: '720px',
    background: '#121212',
    color: '#fafafa',
    fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif',
    padding: '40px',
    boxSizing: 'border-box',
  };
  const accent = '#B93A32';
  const dim = 'rgba(250,250,250,0.5)';
  const faint = 'rgba(250,250,250,0.15)';
  const card = 'rgba(250,250,250,0.035)';
  const cardBorder = 'rgba(250,250,250,0.1)';
  return (
    <div style={base}>
      {/* Brand strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '16px',
          borderBottom: `1px solid ${faint}`,
          marginBottom: '28px',
        }}
      >
        <span
          style={{
            fontSize: '14px',
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            fontWeight: 700,
          }}
        >
          SQUATWOLF
        </span>
        <span
          style={{
            fontSize: '11px',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: accent,
          }}
        >
          ROUTINE · EARNED
        </span>
      </div>

      {/* Headline + hero stats */}
      <div
        style={{
          fontSize: '54px',
          fontWeight: 800,
          lineHeight: 0.9,
          letterSpacing: '-0.01em',
          marginBottom: '6px',
        }}
      >
        BUILT FOR <span style={{ color: accent }}>{goalLabel}</span>.
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          marginTop: '24px',
          marginBottom: '32px',
          fontSize: '11px',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
        }}
      >
        <div>
          <div style={{ color: dim, marginBottom: '4px' }}>Body</div>
          <div style={{ fontWeight: 600 }}>{bodyType || '—'}</div>
        </div>
        <div>
          <div style={{ color: dim, marginBottom: '4px' }}>Frame</div>
          <div style={{ fontWeight: 600 }}>{frameSize || '—'}</div>
        </div>
        <div>
          <div style={{ color: dim, marginBottom: '4px' }}>Days</div>
          <div style={{ color: accent, fontWeight: 600 }}>
            {String(schedule.length).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Per-day blocks with every exercise expanded */}
      {schedule.map((day, i) => (
        <div
          key={i}
          style={{
            border: `1px solid ${cardBorder}`,
            background: card,
            padding: '18px 20px',
            marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '12px' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, color: accent }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <span style={{ fontSize: '22px', fontWeight: 700 }}>{day.day}</span>
            <span
              style={{
                fontSize: '10px',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: accent,
              }}
            >
              {day.focus}
            </span>
          </div>

          {/* Warm-up */}
          {day.warmup && day.warmup.length > 0 && (
            <div style={{ marginBottom: '10px' }}>
              <div
                style={{
                  fontSize: '9px',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: dim,
                  marginBottom: '4px',
                }}
              >
                Warm-up
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(250,250,250,0.75)' }}>
                {day.warmup.map((w) => w.exercise || w).join(' · ')}
              </div>
            </div>
          )}

          {/* Exercises — one per row, with sets/reps/rest */}
          <div>
            {day.exercises.map((ex, ei) => (
              <div
                key={ei}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '24px 1fr auto',
                  gap: '12px',
                  padding: '8px 0',
                  borderTop: ei === 0 ? 'none' : `1px solid ${faint}`,
                  alignItems: 'baseline',
                }}
              >
                <span style={{ fontSize: '12px', color: dim, fontWeight: 600 }}>
                  {String(ei + 1).padStart(2, '0')}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{ex.name}</span>
                <span
                  style={{
                    fontSize: '11px',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: 'rgba(250,250,250,0.7)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {[
                    ex.sets && `${ex.sets}×${ex.reps || '—'}`,
                    ex.rest && `rest ${ex.rest}`,
                  ]
                    .filter(Boolean)
                    .join('  ·  ')}
                </span>
              </div>
            ))}
          </div>

          {/* Cool-down */}
          {day.cooldown && day.cooldown.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div
                style={{
                  fontSize: '9px',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: dim,
                  marginBottom: '4px',
                }}
              >
                Cool-down
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(250,250,250,0.75)' }}>
                {day.cooldown.map((c) => c.exercise || c).join(' · ')}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Footer */}
      <div
        style={{
          marginTop: '28px',
          paddingTop: '16px',
          borderTop: `1px solid ${faint}`,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          color: dim,
        }}
      >
        <span>squatwolf.com</span>
        <span style={{ color: accent }}>BORN IN DUBAI</span>
      </div>
    </div>
  );
}

/**
 * SavedImageModal — shows the captured PNG with a "press and hold to save"
 * instruction. Works identically on every platform:
 *   • iOS Safari → long-press image → "Add to Photos"
 *   • Android Chrome → long-press image → "Save image"
 *   • Desktop → right-click, or hit the Download button in the footer
 */
function SavedImageModal({ url, filename, onClose }) {
  // Esc-to-close for desktop keyboard users.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Saved routine image"
        className="relative bg-bg border border-text/15 w-full max-w-md max-h-[92vh] overflow-y-auto rounded-none"
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 20 }}
      >
        <BracketFrame size="md" color="accent" />

        <div className="px-5 py-4 border-b border-text/10 flex items-center justify-between">
          <div>
            <div className="font-ui text-[10px] tracking-[0.4em] uppercase text-accent">
              ▸ READY
            </div>
            <div className="font-heading text-xl text-text leading-none mt-1">
              SAVE TO PHOTOS
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-text/50 hover:text-text text-lg border border-text/10 hover:border-accent w-9 h-9 flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="font-ui text-[10px] tracking-[0.3em] uppercase text-accent text-center mb-3">
            ▸ PRESS AND HOLD THE IMAGE
          </div>
          <p className="font-body text-text/50 text-xs text-center mb-4 leading-relaxed">
            Long-press and tap "Add to Photos" (iOS) or "Save image" (Android).
            Works offline at the gym.
          </p>

          <div className="border border-text/10 bg-text/[0.02] p-2">
            <img
              src={url}
              alt="Your routine"
              className="w-full h-auto block select-auto"
              // Let the native long-press / right-click menu do its thing.
              draggable={false}
            />
          </div>

          {/* Desktop / fallback — explicit download button so users who
              don't know to right-click have a single obvious action. */}
          <a
            href={url}
            download={filename}
            className="mt-4 w-full flex items-center justify-center gap-2 border border-text/15 hover:border-accent hover:bg-accent/[0.06] px-4 py-3 font-ui text-[11px] tracking-[0.3em] uppercase text-text/70 hover:text-text transition-all cursor-pointer"
          >
            ▸ DOWNLOAD
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Same 228px footprint as the real QR so the card doesn't reflow on unlock.
function LockedQRPlaceholder() {
  return (
    <div className="relative w-[228px] h-[228px] bg-bg text-text overflow-hidden flex flex-col items-center justify-center gap-3 border border-bg/10">
      <div
        className="absolute inset-0 diagonal-stripes opacity-30 pointer-events-none"
        aria-hidden="true"
      />
      <div className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2 border-accent pointer-events-none" aria-hidden="true" />
      <div className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2 border-accent pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2 border-accent pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2 border-accent pointer-events-none" aria-hidden="true" />

      {/* Inline SVG to avoid pulling in an icon library for one glyph. */}
      <svg
        viewBox="0 0 24 24"
        className="w-14 h-14 text-accent relative z-10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <rect x="4" y="10.5" width="16" height="10" rx="1" />
        <path d="M8 10.5V7.2a4 4 0 0 1 8 0v3.3" />
        <circle cx="12" cy="15.2" r="1.3" fill="currentColor" />
        <path d="M12 16.4v2.1" />
      </svg>

      <div className="relative z-10 font-ui text-[11px] tracking-[0.45em] uppercase text-text">
        LOCKED
      </div>
      <div className="relative z-10 font-ui text-[9px] tracking-[0.4em] uppercase text-accent attract-pulse">
        UNLOCK BELOW ▾
      </div>
    </div>
  );
}
