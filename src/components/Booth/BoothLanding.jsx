import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useScanStore from '../../context/ScanContext';
import { loadPoseDetector } from '../../services/poseService';
import { GOALS, ROUTES } from '../../utils/constants';
import { SectionLabel, BracketFrame, TopBar, BottomBar } from '../UI/Telemetry';

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
  const { setBoothGoal, setGender, reset } = useScanStore();
  const [gender, setLocalGender] = useState('male');

  useEffect(() => {
    reset();
    // Preload the pose model in the background so the camera opens instantly
    // when the visitor commits to a goal — this is by far the slowest async
    // hop in the kiosk flow (~1-2s on first paint of the WebGL backend).
    loadPoseDetector().catch(() => {});
  }, [reset]);

  const pickGoal = (goal) => {
    setGender(gender);
    setBoothGoal(goal);
    navigate(ROUTES.SCAN);
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
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1.4fr_minmax(380px,1fr)] gap-12 lg:gap-20 items-center px-6 sm:px-10 lg:px-16 py-10 lg:py-12">
        {/* HERO */}
        <motion.div
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
          className="relative bg-bg/60 backdrop-blur-[1px] border border-text/10 p-6 sm:p-8"
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
                index="01"
                label="BUILD MUSCLE"
                sub={gender === 'female' ? 'Glutes · Legs · Tone' : 'Strength · Size · Power'}
                onClick={() => pickGoal(GOALS.BUILD_MUSCLE)}
              />
              <GoalButton
                index="02"
                label="GET LEAN"
                sub={gender === 'female' ? 'Burn · Shape · Define' : 'Burn · Define · Endurance'}
                onClick={() => pickGoal(GOALS.LOSE_FAT)}
              />
            </div>
          </div>

          {/* Mini telemetry footer of the panel */}
          <div className="mt-6 pt-4 border-t border-text/10 flex items-center justify-between font-ui text-[10px] tracking-[0.3em] uppercase text-text/30">
            <span>READY</span>
            <span className="text-accent attract-pulse">▸ TAP TO BEGIN</span>
          </div>
        </motion.div>
      </main>

      <BottomBar stage={1} tagline="▸ READ. LOCK. BUILD." />
    </div>
  );
}

/**
 * Numbered, boxy goal selector. Hover fills the panel in accent and rounds the
 * corners 8px, matching the SQUATWOLF button spec across the rest of the app.
 */
function GoalButton({ index, label, sub, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="group relative w-full grid grid-cols-[40px_1fr_auto] items-center gap-4 px-5 py-5 rounded-none hover:rounded-lg transition-all text-left border-2 border-text/15 bg-text/[0.02] text-text hover:bg-accent hover:border-accent hover:shadow-[0_0_60px_-10px_rgba(185,58,50,0.6)] cursor-pointer"
    >
      <span className="font-ui text-[11px] tracking-[0.3em] text-accent group-hover:text-text/80 tabular-nums">
        {index}
      </span>
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
