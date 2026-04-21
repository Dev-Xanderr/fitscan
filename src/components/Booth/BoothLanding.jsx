import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useScanStore from '../../context/ScanContext';
import { loadPoseDetector } from '../../services/poseService';
import { GOALS, ROUTES } from '../../utils/constants';
import { SectionLabel, BracketFrame, TopBar, BottomBar } from '../UI/Telemetry';
import ConsentGate from '../Privacy/ConsentGate';

// Hero emblem — public/ asset served at the Vite base path. We recolor the
// white PNG into accent red via CSS mask + background-color so we don't need
// a separate red-tinted export (and don't have to hand-tune a hue-rotate).
const EMBLEM_URL = `${import.meta.env.BASE_URL}brand/icon-white.png`;

/**
 * Stage 01 — landing screen.
 *
 * Visual language is shared with the scanner and routine pages:
 *   • TopBar/BottomBar telemetry chrome
 *   • Numbered section rails (01 / I AM, 02 / GOAL)
 *   • Boxy panels with corner brackets and a hover-to-rounded transition
 *   • Editorial Barlow Condensed display headline with a single accent word
 */
export default function BoothLanding() {
  const navigate = useNavigate();
  const { setBoothGoal, setGender, setConsentAccepted, reset } = useScanStore();
  const [gender, setLocalGender] = useState('male');
  // Pending goal — set when the visitor taps a goal, cleared once they
  // either accept consent (and we navigate) or decline (and we drop it).
  const [pendingGoal, setPendingGoal] = useState(null);
  // Goal-button hover state lifts the emblem opacity, scale & glow so the
  // brand stamp visibly reacts when the visitor engages with the panel.
  const [goalHover, setGoalHover] = useState(false);

  // Mouse parallax — emblem drifts toward the cursor with spring inertia.
  // We use React state instead of useMotionValue/useSpring because the
  // motion-value→style.x route silently failed to propagate on the deployed
  // build (animate prop works fine, style.x with motion values doesn't).
  // State updates per mousemove are cheap on a single-page kiosk and trigger
  // framer-motion's spring transition cleanly.
  const mainRef = useRef(null);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!mainRef.current) return;
    const rect = mainRef.current.getBoundingClientRect();
    // Normalize to -0.5..0.5 around the centre, scale to a generous px
    // range so the drift is actually noticeable.
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setParallax({ x: px * 110, y: py * 110 });
  };

  useEffect(() => {
    reset();
    // Preload the pose model in the background so the camera opens instantly
    // when the visitor commits to a goal — this is by far the slowest async
    // hop in the kiosk flow (~1-2s on first paint of the WebGL backend).
    loadPoseDetector().catch(() => {});
  }, [reset]);

  // Goal pick: stash the goal, open consent. We don't navigate until consent
  // is granted — biometric processing should never start before opt-in.
  const pickGoal = (goal) => {
    setGender(gender);
    setBoothGoal(goal);
    setPendingGoal(goal);
  };

  const handleConsentAccept = () => {
    setConsentAccepted(true);
    setPendingGoal(null);
    navigate(ROUTES.SCAN);
  };

  const handleConsentDecline = () => {
    // Visitor backed out — drop the pending goal but leave gender + boothGoal
    // alone (they may want to try again with a different goal).
    setPendingGoal(null);
  };

  return (
    <div className="min-h-screen w-full bg-bg text-text relative overflow-hidden flex flex-col">
      {/* Atmospheric backdrop — dark dusk wash + faint engineering grid */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse at 75% 20%, rgba(185,58,50,0.28) 0%, rgba(0,0,0,1) 55%), radial-gradient(ellipse at 10% 90%, rgba(185,58,50,0.12) 0%, rgba(0,0,0,0) 50%)',
        }}
      />
      <div
        className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      <div className="absolute left-0 top-0 bottom-0 w-px bg-accent/20 -z-10" aria-hidden="true" />

      <TopBar
        stage="LANDING"
        right={<span className="hidden sm:inline">RIG · 01</span>}
      />

      {/* Main grid: hero (left) + selector rail (right) */}
      <main
        ref={mainRef}
        onMouseMove={handleMouseMove}
        className="relative flex-1 grid grid-cols-1 lg:grid-cols-[1.4fr_minmax(380px,1fr)] gap-12 lg:gap-20 items-center px-6 sm:px-10 lg:px-16 py-10 lg:py-12"
      >
        {/* BRAND EMBLEM — three-layer stack:
              1) outer wrapper: positioning anchor, bleeds off the bottom-right
                 so it reads as a watermark/backdrop instead of a foreground icon
              2) middle motion layer: entrance fade + cursor parallax + opacity
                 reacting to goal-button hover (visitor engagement → brand pulse)
              3) inner motion layer: rotate-in + continuous breath cycle + the
                 actual recoloured CSS mask
            All hidden under lg so the phone/tablet layout keeps breathing room. */}
        <div
          aria-hidden="true"
          className="hidden lg:block absolute pointer-events-none z-0"
          style={{
            bottom: '-15%',
            right: '-10%',
            width: 'min(720px, 56vw)',
            aspectRatio: '1 / 1',
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{
              opacity: goalHover ? 0.85 : 0.5,
              x: parallax.x,
              y: parallax.y,
              scale: goalHover ? 1.06 : 1,
            }}
            transition={{
              opacity: { duration: 0.45, ease: 'easeOut' },
              scale: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
              // Spring drift on parallax — soft, lazy follow.
              x: { type: 'spring', stiffness: 60, damping: 18, mass: 0.7 },
              y: { type: 'spring', stiffness: 60, damping: 18, mass: 0.7 },
            }}
            className="w-full h-full"
          >
            <motion.div
              initial={{ rotate: -14 }}
              animate={{ rotate: -8, scale: [1, 1.06, 1] }}
              transition={{
                rotate: { duration: 1.4, ease: [0.16, 1, 0.3, 1] },
                // Slow breath cycle — starts after the entrance settles so the
                // two animations don't fight for the same frame budget.
                scale: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1.6 },
              }}
              className="w-full h-full"
              style={{
                maskImage: `url(${EMBLEM_URL})`,
                WebkitMaskImage: `url(${EMBLEM_URL})`,
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
                backgroundColor: '#B93A32',
                filter: goalHover
                  ? 'drop-shadow(0 0 180px rgba(185,58,50,0.85))'
                  : 'drop-shadow(0 0 100px rgba(185,58,50,0.55))',
                // CSS-side transition for the filter swap so it eases in/out
                // instead of snapping when goalHover flips.
                transition: 'filter 0.5s ease-out',
              }}
            />
          </motion.div>
        </div>

        {/* HERO */}
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="flex items-center gap-3 text-accent font-ui text-[11px] tracking-[0.4em] uppercase mb-6">
            <span className="w-8 h-px bg-accent" />
            BORN IN DUBAI · ENGINEERED FOR GYM
          </div>

          <h1 className="font-heading font-bold leading-[0.82] tracking-tight">
            <motion.span
              className="block text-7xl sm:text-8xl md:text-[8.5rem] lg:text-[9rem]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.7 }}
            >
              STEP IN.
            </motion.span>
            <motion.span
              className="block text-7xl sm:text-8xl md:text-[8.5rem] lg:text-[9rem]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              GET SCANNED.
            </motion.span>
            <motion.span
              className="block text-7xl sm:text-8xl md:text-[8.5rem] lg:text-[9rem] text-accent"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.7 }}
            >
              OWN YOUR BUILD.
            </motion.span>
          </h1>

          <motion.p
            className="font-body text-text/60 text-base lg:text-lg max-w-xl mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            One scan reads your build. We hand you a routine engineered for how you move.
            Pick your goal — the rig does the rest.
          </motion.p>

          {/* Spec strip — telemetry-style read-out so the hero side has its own
              quiet supporting detail without competing with the headline. */}
          <motion.dl
            className="mt-10 grid grid-cols-3 max-w-md font-ui text-[11px] uppercase tracking-[0.3em]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
          >
            <div>
              <dt className="text-text/30">Scan</dt>
              <dd className="text-text mt-1 tabular-nums">3 SEC</dd>
            </div>
            <div>
              <dt className="text-text/30">Routine</dt>
              <dd className="text-text mt-1 tabular-nums">7 DAYS</dd>
            </div>
            <div>
              <dt className="text-text/30">Forms</dt>
              <dd className="text-accent mt-1">ZERO</dd>
            </div>
          </motion.dl>
        </motion.div>

        {/* SELECTOR RAIL */}
        <motion.div
          className="relative z-10 bg-bg/60 backdrop-blur-[1px] border border-text/10 p-6 sm:p-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
        >
          <BracketFrame size="md" color="muted" />

          {/* 01 — GENDER */}
          <div className="space-y-4 mb-8">
            <SectionLabel n="01" title="I AM" />
            <div className="grid grid-cols-2 gap-3">
              {['male', 'female'].map((g) => {
                const selected = gender === g;
                return (
                  <button
                    key={g}
                    onClick={() => setLocalGender(g)}
                    aria-pressed={selected}
                    className={`relative py-4 rounded-none transition-all border font-ui text-xs tracking-[0.3em] uppercase cursor-pointer ${
                      selected
                        ? 'bg-accent border-accent text-text'
                        : 'border-text/15 text-text/50 hover:border-text/40 hover:text-text/80'
                    }`}
                  >
                    {selected && (
                      <span className="absolute top-1.5 left-2 text-[9px] tabular-nums opacity-70">
                        ▸
                      </span>
                    )}
                    {g === 'male' ? 'Male' : 'Female'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 02 — GOAL */}
          <div className="space-y-4">
            <SectionLabel n="02" title="GOAL" />
            <div className="space-y-3">
              <GoalButton
                label="BUILD MUSCLE"
                sub={gender === 'female' ? 'Glutes · Legs · Tone' : 'Strength · Size · Power'}
                onClick={() => pickGoal(GOALS.BUILD_MUSCLE)}
                onHoverStart={() => setGoalHover(true)}
                onHoverEnd={() => setGoalHover(false)}
              />
              <GoalButton
                label="GET LEAN"
                sub={gender === 'female' ? 'Burn · Shape · Define' : 'Burn · Define · Endurance'}
                onClick={() => pickGoal(GOALS.LOSE_FAT)}
                onHoverStart={() => setGoalHover(true)}
                onHoverEnd={() => setGoalHover(false)}
              />
            </div>
          </div>

          {/* Mini telemetry footer of the panel */}
          <div className="mt-6 pt-4 border-t border-text/10 flex items-center justify-between font-ui text-[10px] tracking-[0.3em] uppercase text-text/30">
            <Link
              to={ROUTES.TERMS}
              className="hover:text-accent transition-colors"
            >
              ▸ TERMS
            </Link>
            <span className="text-accent attract-pulse">▸ TAP TO BEGIN</span>
          </div>
        </motion.div>
      </main>

      <BottomBar stage={1} tagline="▸ READ. LOCK. BUILD." />

      <ConsentGate
        open={pendingGoal !== null}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />
    </div>
  );
}

/**
 * Boxy goal selector. Hover fills the panel in accent and rounds the corners
 * 8px, matching the SQUATWOLF button spec across the rest of the app. The
 * leading numeric index was dropped — the two-option list reads cleaner without
 * "01 / 02" pretending it's a longer enumerated set.
 */
function GoalButton({ label, sub, onClick, onHoverStart, onHoverEnd }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      className="group relative w-full grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-5 rounded-none hover:rounded-lg transition-all text-left border-2 border-text/15 bg-text/[0.02] text-text hover:bg-accent hover:border-accent hover:shadow-[0_0_60px_-10px_rgba(185,58,50,0.6)] cursor-pointer"
    >
      <div>
        <div
          className="font-heading text-2xl sm:text-3xl leading-none"
          style={{ letterSpacing: '0.04em' }}
        >
          {label}
        </div>
        <div className="font-ui text-[11px] tracking-[0.25em] uppercase text-text/40 group-hover:text-text/80 mt-2">
          {sub}
        </div>
      </div>
      <span className="font-ui text-text/40 group-hover:text-text group-hover:translate-x-1 transition-all text-lg">
        ▶
      </span>
    </motion.button>
  );
}
