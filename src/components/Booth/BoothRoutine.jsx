import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import LZString from 'lz-string';
import useScanStore from '../../context/ScanContext';
import LoadingSpinner from '../UI/LoadingSpinner';
import Button from '../UI/Button';
import { getProductRecommendations } from '../../utils/productRecommendations';
import { GOALS, ROUTES } from '../../utils/constants';
import { SectionLabel, BracketFrame, TopBar, BottomBar, padFrame } from '../UI/Telemetry';
import LeadCapture from '../Privacy/LeadCapture';

const AUTO_RESET_SECONDS = 60;

/**
 * BoothRoutine — stage 03 of the booth flow.
 *
 *  - Hero strip with numbered profile telemetry (body type, frame, goal, duration)
 *  - 02 / SCHEDULE: numbered day cards, click to open the full workout modal
 *  - 03 / TAKE IT WITH YOU: QR card (booth only — phone viewer hides this)
 *  - 04 / GEAR FOR YOUR BUILD: product recommendations
 *  - Auto-resets after AUTO_RESET_SECONDS so the booth is always ready for
 *    the next visitor; phone viewer has no timer.
 *
 * Modal a11y: dialog role + Esc-to-close + focus restoration to the opener.
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

      {!phoneMode && (
        <TopBar
          stage="ROUTINE"
          right={
            <span className="hidden sm:inline">
              RESET / <span className="text-accent tabular-nums">{padFrame(secondsLeft, 2)}S</span>
            </span>
          }
        />
      )}

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

          {/* 03 — TAKE IT WITH YOU (QR card, booth only) */}
          {!phoneMode && (
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="space-y-4 lg:sticky lg:top-6"
            >
              <SectionLabel n="03" title="TAKE IT WITH YOU" />
              <div className="relative bg-text text-bg p-7">
                <BracketFrame size="md" color="accent" />
                <div className="font-ui text-[10px] tracking-[0.4em] uppercase text-bg/60">
                  SCAN · TAKE HOME
                </div>
                <div className="font-heading text-3xl mt-2 mb-5 leading-none">
                  YOUR PHONE
                  <br />
                  <span className="text-accent">YOUR PLAN.</span>
                </div>

                {qrUrl && qrUrl.length <= 2953 ? (
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

                <p className="font-body text-bg/60 text-xs mt-5 max-w-[228px] leading-relaxed">
                  Open your camera, point at the code, and your full routine
                  comes home with you.
                </p>

                <div className="mt-5 pt-4 border-t border-bg/10 flex items-center justify-between font-ui text-[10px] tracking-[0.3em] uppercase">
                  <span className="text-bg/50">squatwolf.com</span>
                  <span className="text-accent">▸ READY</span>
                </div>
              </div>
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
      </main>

      {!phoneMode && <BottomBar stage={3} tagline="▸ EARNED. NOT GUESSED." />}

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
