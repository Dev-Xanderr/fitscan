import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import LZString from 'lz-string';
import useScanStore from '../../context/ScanContext';
import LoadingSpinner from '../UI/LoadingSpinner';
import Button from '../UI/Button';
import WolfMark from './WolfMark';
import { getProductRecommendations } from '../../utils/productRecommendations';
import { GOALS, ROUTES } from '../../utils/constants';

const AUTO_RESET_SECONDS = 60;

/**
 * BoothRoutine — the post-scan results screen for the SQUATWOLF booth.
 *
 *  - Compact: bodytype + a 3-day preview at a glance
 *  - QR code: visitor scans to take the full routine to their phone
 *  - Auto-resets after AUTO_RESET_SECONDS so the booth is always ready
 */
export default function BoothRoutine({ phoneMode = false }) {
  const navigate = useNavigate();
  const {
    routine,
    routineLoading,
    routineError,
    bodyType,
    frameSize,
    boothGoal,
    reset,
  } = useScanStore();

  const [secondsLeft, setSecondsLeft] = useState(AUTO_RESET_SECONDS);
  const [openDayIdx, setOpenDayIdx] = useState(null);

  // Auto-reset countdown — booth only (phone viewer has no timer)
  useEffect(() => {
    if (phoneMode) return;
    if (routineLoading || routineError || !routine) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          reset();
          navigate(ROUTES.LANDING);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phoneMode, routine, routineLoading, routineError, reset, navigate]);

  // Build the QR target URL.
  //
  // The routine generator is DETERMINISTIC — same inputs always produce the same
  // routine. So instead of encoding the (huge) routine into the QR, we encode
  // just the small "seed" inputs and let the viewer page regenerate the routine
  // locally. This keeps the QR payload tiny (~150 bytes vs several KB) so it
  // actually fits in a scannable QR code, and the viewer page still works
  // 100% offline.
  const qrUrl = useMemo(() => {
    if (!routine) return '';
    const schedule = routine.weeklySchedule || [];

    // v:2 — embed the actual routine directly so the phone shows exactly what's
    // on screen. No regeneration, no seed drift.
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

  // All hooks must be called before any early returns
  const productRecs = useMemo(
    () => getProductRecommendations(bodyType, boothGoal),
    [bodyType, boothGoal]
  );

  // Modal close — stable callback so Esc handler and click handlers share one path.
  const closeDay = useCallback(() => setOpenDayIdx(null), []);

  // Esc closes modal + focus restoration on close. The opener button is the
  // last activeElement before the modal mounts, so we capture it and restore.
  const openerRef = useRef(null);
  const closeBtnRef = useRef(null);
  useEffect(() => {
    if (openDayIdx === null) {
      // Modal just closed — restore focus to the day card that opened it
      if (openerRef.current) {
        openerRef.current.focus();
        openerRef.current = null;
      }
      return;
    }
    // Capture the trigger element so we can return focus on close
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      openerRef.current = document.activeElement;
    }
    const onKey = (e) => {
      if (e.key === 'Escape') closeDay();
    };
    window.addEventListener('keydown', onKey);
    // Move focus into the dialog so screen readers announce it and Tab stays put
    closeBtnRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [openDayIdx, closeDay]);

  // Loading state — first ~1s after scan
  if (routineLoading || (!routine && !routineError)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <LoadingSpinner size={64} />
          <h1 className="text-4xl mt-8 text-text">
            BUILDING <span className="text-accent">YOUR ROUTINE</span>
          </h1>
          <p className="text-text/40 mt-2 text-sm tracking-wider uppercase">
            Hold tight — the pack's got you
          </p>
        </div>
      </div>
    );
  }

  if (routineError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <div className="text-5xl mb-4">⚠</div>
          <h1 className="text-4xl text-text mb-2">
            SOMETHING BROKE
          </h1>
          <p className="text-text/40 text-sm mb-6">{routineError}</p>
          <Button
            variant="primary"
            onClick={() => {
              reset();
              navigate(ROUTES.LANDING);
            }}
          >
            START OVER
          </Button>
        </div>
      </div>
    );
  }

  const schedule = routine.weeklySchedule || [];
  const goalLabel = boothGoal === GOALS.LOSE_FAT ? 'GET LEAN' : 'BUILD MUSCLE';
  const openDay = openDayIdx !== null ? schedule[openDayIdx] : null;
  const dialogTitleId = 'day-dialog-title';

  return (
    <div className={`min-h-[100dvh] w-full ${phoneMode ? 'px-4 py-8' : 'px-10 sm:px-16 lg:px-20 py-12'} relative overflow-hidden`}>
      {/* Background — same dusk gradient as landing */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at 70% 30%, rgba(185,58,50,0.16) 0%, rgba(0,0,0,1) 65%)',
        }}
      />

      {/* Top bar */}
      <motion.div
        className="flex items-center justify-between mb-8 text-text/70"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <WolfMark size={phoneMode ? 28 : 40} />
          <span className={`${phoneMode ? 'text-base' : 'text-xl'} tracking-[0.35em] font-heading`}>
            SQUATWOLF
          </span>
        </div>
        {!phoneMode && (
          <span className="text-[10px] tracking-[0.3em] uppercase border border-text/20 rounded-none px-4 py-2 font-ui">
            Resets in {secondsLeft}s
          </span>
        )}
      </motion.div>

      {/* Main grid: routine preview (left) + QR (right, booth only) */}
      <div className={`grid grid-cols-1 ${!phoneMode ? 'lg:grid-cols-[1.4fr_1fr]' : ''} gap-10 items-start max-w-6xl mx-auto`}>
        {/* LEFT: routine preview */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-6">
            <span className="text-accent text-xs font-semibold tracking-[0.4em] uppercase">
              Built for {goalLabel}
            </span>
            <h1 className={`${phoneMode ? 'text-5xl' : 'text-6xl sm:text-7xl'} text-text leading-[0.85] mt-3 font-heading`}>
              YOUR ROUTINE.
              <br />
              <span className="text-accent">EARNED.</span>
            </h1>
            <p className="text-text/50 text-sm tracking-wider uppercase mt-3">
              {bodyType} · {frameSize} frame ·{' '}
              {routine.estimatedSessionDuration || '~45 min'} per session
            </p>
          </div>

          {/* All days — clickable cards */}
          <div className="space-y-3">
            {schedule.map((day, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                onClick={() => setOpenDayIdx(i)}
                aria-label={`Open ${day.day} workout — ${day.focus}`}
                className="w-full text-left border border-text/10 bg-text/[0.02] rounded-xl p-4 hover:border-accent/40 hover:bg-accent/[0.06] transition-colors cursor-pointer"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-text text-xl tracking-wide font-heading">
                    {day.day}
                  </span>
                  <span className="text-accent text-xs uppercase tracking-[0.2em]">
                    {day.focus}
                  </span>
                </div>
                <div className="text-text/50 text-sm">
                  {day.exercises
                    .slice(0, 4)
                    .map((e) => e.name)
                    .join(' · ')}
                  {day.exercises.length > 4 ? ` · +${day.exercises.length - 4} more` : ''}
                </div>
                <div className="text-text/30 text-[10px] uppercase tracking-[0.2em] mt-2">
                  Tap to view full workout →
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* RIGHT: QR card — booth only */}
        {!phoneMode && <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center text-center bg-text rounded-2xl p-8"
        >
          <WolfMark variant="black" size={36} className="mb-3 opacity-90" />
          <div className="text-[#000] text-xs tracking-[0.3em] uppercase font-semibold mb-1">
            Take it with you
          </div>
          <div className="text-[#000] text-3xl mb-5 font-heading">
            SCAN THIS
          </div>

          {qrUrl && qrUrl.length <= 2953 ? (
            <div className="bg-white p-3 rounded-lg">
              <QRCodeSVG
                value={qrUrl}
                size={260}
                bgColor="#ffffff"
                fgColor="#000000"
                level="L"
              />
            </div>
          ) : (
            <div className="bg-white p-3 rounded-lg w-[260px] h-[260px] flex items-center justify-center text-black/50 text-xs text-center">
              Routine too large for QR
            </div>
          )}

          <p className="text-[#000]/60 text-xs mt-5 max-w-[220px] leading-relaxed">
            Open your camera, point at the code, and take your full routine home.
          </p>

          <div className="mt-6 w-full pt-5 border-t border-black/10">
            <div className="text-[#000]/60 text-[10px] tracking-[0.25em] uppercase mb-1">
              squatwolf.com
            </div>
          </div>
        </motion.div>}
      </div>

      {/* Product recommendations — based on body type + goal */}
      {productRecs.length > 0 && (
        <motion.div
          className="max-w-6xl mx-auto mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-5">
            <span className="w-8 h-px bg-accent" />
            <span className="text-accent text-[10px] font-semibold tracking-[0.4em] uppercase">
              Gear For Your Build
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {productRecs.map((rec, i) => (
              <motion.a
                key={rec.name}
                href={rec.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="block border border-text/10 bg-text/[0.03] rounded-xl p-5 hover:border-accent/40 hover:bg-accent/[0.06] transition-colors"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-text text-2xl font-heading">
                    {rec.name}
                  </span>
                  <span className="text-text/30 text-[10px] uppercase tracking-wider">
                    {rec.category}
                  </span>
                </div>
                <div className="text-accent text-xs font-semibold tracking-wide mb-2">
                  {rec.tagline}
                </div>
                <p className="text-text/50 text-sm leading-relaxed">
                  {rec.reason}
                </p>
                <div className="text-accent text-[10px] uppercase tracking-[0.2em] mt-3 font-ui">
                  Shop now →
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>
      )}

      {/* Bottom action — booth only */}
      {!phoneMode && (
        <motion.div
          className="mt-8 flex justify-center"
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
            ▸ Start Over
          </Button>
        </motion.div>
      )}

      {/* Day detail modal overlay */}
      <AnimatePresence>
        {openDay && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={closeDay}
              aria-hidden="true"
            />

            {/* Modal content */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={dialogTitleId}
              className="relative bg-[#111] border border-text/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
            >
              {/* Modal header */}
              <div className="sticky top-0 bg-[#111] border-b border-text/10 p-6 flex items-center justify-between z-10">
                <div>
                  <h2 id={dialogTitleId} className="text-3xl text-text font-heading">
                    {openDay.day}
                  </h2>
                  <span className="text-accent text-xs uppercase tracking-[0.2em]">
                    {openDay.focus}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Prev / Next day buttons */}
                  <button
                    onClick={() => setOpenDayIdx(Math.max(0, openDayIdx - 1))}
                    disabled={openDayIdx === 0}
                    aria-label="Previous day"
                    className="text-text/40 hover:text-text disabled:opacity-20 text-lg px-2"
                  >
                    ◀
                  </button>
                  <span className="text-text/30 text-xs" aria-label={`Day ${openDayIdx + 1} of ${schedule.length}`}>
                    {openDayIdx + 1}/{schedule.length}
                  </span>
                  <button
                    onClick={() => setOpenDayIdx(Math.min(schedule.length - 1, openDayIdx + 1))}
                    disabled={openDayIdx === schedule.length - 1}
                    aria-label="Next day"
                    className="text-text/40 hover:text-text disabled:opacity-20 text-lg px-2"
                  >
                    ▶
                  </button>
                  <button
                    ref={closeBtnRef}
                    onClick={closeDay}
                    aria-label="Close workout details"
                    className="ml-2 text-text/50 hover:text-text text-2xl leading-none"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Warm-up */}
              {openDay.warmup && openDay.warmup.length > 0 && (
                <div className="px-6 pt-5 pb-3">
                  <div className="text-accent text-[10px] font-semibold tracking-[0.3em] uppercase mb-2">
                    Warm-Up
                  </div>
                  <ul className="text-text/60 text-sm space-y-1">
                    {openDay.warmup.map((w, wi) => (
                      <li key={wi}>• {w.exercise || w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Exercises */}
              <div className="px-6 py-4 space-y-3">
                <div className="text-accent text-[10px] font-semibold tracking-[0.3em] uppercase mb-1">
                  Exercises
                </div>
                {openDay.exercises.map((ex, ei) => (
                  <div
                    key={ei}
                    className="border border-text/8 rounded-lg p-4 bg-text/[0.02]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-accent/60 text-xs font-mono mr-2">
                          {String(ei + 1).padStart(2, '0')}
                        </span>
                        <span className="text-text font-medium">{ex.name}</span>
                      </div>
                      {ex.muscleGroup && (
                        <span className="text-text/30 text-[10px] uppercase tracking-wider shrink-0">
                          {ex.muscleGroup}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-text/50 text-xs">
                      {ex.sets && <span>{ex.sets} sets</span>}
                      {ex.reps && <span>{ex.reps} reps</span>}
                      {ex.rest && <span>Rest {ex.rest}</span>}
                      {ex.tempo && <span>Tempo {ex.tempo}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Cool-down */}
              {openDay.cooldown && openDay.cooldown.length > 0 && (
                <div className="px-6 pb-6 pt-2">
                  <div className="text-accent text-[10px] font-semibold tracking-[0.3em] uppercase mb-2">
                    Cool-Down
                  </div>
                  <ul className="text-text/60 text-sm space-y-1">
                    {openDay.cooldown.map((c, ci) => (
                      <li key={ci}>• {c.exercise || c}</li>
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
