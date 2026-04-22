import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useScanStore from '../../context/ScanContext';
import { loadPoseDetector } from '../../services/poseService';
import { GOALS, ROUTES } from '../../utils/constants';
import { SectionLabel, BracketFrame, TopBar, BottomBar } from '../UI/Telemetry';
import ConsentGate from '../Privacy/ConsentGate';

/**
 * Optional demographic chips. Each row maps a human-readable bucket label
 * to the midpoint value we feed into bodyMetrics + the routine generator.
 *
 *   • `value` — numeric midpoint (years / cm / kg) so frame-size and BMI
 *     calculations have something realistic to work with. Falls back to the
 *     DEFAULT_USER_INFO seed when the visitor skips.
 *   • `label` — string we persist on the lead row (e.g. "25-34") so
 *     marketing can segment by bucket without re-binning numeric values.
 *
 * Buckets are deliberately wide — booths are anonymous, visitors won't
 * tap through 10 options, and tighter buckets give us false precision.
 */
const AGE_RANGES = [
  { label: '18-24', value: '21' },
  { label: '25-34', value: '30' },
  { label: '35-44', value: '40' },
  { label: '45-54', value: '50' },
  { label: '55+',   value: '60' },
];

const HEIGHT_RANGES = [
  { label: '<165',    value: '160' },
  { label: '165-175', value: '170' },
  { label: '175-185', value: '180' },
  { label: '185+',    value: '190' },
];

const WEIGHT_RANGES = [
  { label: '<60',     value: '55' },
  { label: '60-75',   value: '68' },
  { label: '75-90',   value: '83' },
  { label: '90-105',  value: '98' },
  { label: '105+',    value: '110' },
];

/**
 * Stage 01 — landing screen.
 *
 * Visual language is shared with the scanner and routine pages:
 *   • TopBar/BottomBar telemetry chrome
 *   • Numbered section rails (01 / I AM, 02 / TUNE IT, 03 / GOAL)
 *   • Boxy panels with corner brackets and a hover-to-rounded transition
 *   • Editorial Barlow Condensed display headline with a single accent word
 *
 * TUNE IT is collapsed by default — visitors who tap straight through to a
 * goal don't see it; curious ones can expand to share age/height/weight
 * buckets that feed the routine generator and ship to Supabase as marketing
 * segmentation data.
 */
export default function BoothLanding() {
  const navigate = useNavigate();
  const { setBoothGoal, setGender, setConsentAccepted, setUserInfo, reset } = useScanStore();
  const ageRange = useScanStore((s) => s.userInfo?.ageRange);
  const heightRange = useScanStore((s) => s.userInfo?.heightRange);
  const weightRange = useScanStore((s) => s.userInfo?.weightRange);

  const [gender, setLocalGender] = useState('male');
  // TUNE IT panel is collapsed by default — keeps the booth flow tight for
  // the 95% who tap straight through to a goal. Curious visitors can open it.
  const [tuneOpen, setTuneOpen] = useState(false);
  // Pending goal — set when the visitor taps a goal, cleared once they
  // either accept consent (and we navigate) or decline (and we drop it).
  const [pendingGoal, setPendingGoal] = useState(null);

  // Chip taps write *both* the numeric field (so bodyMetrics + the routine
  // generator have a realistic value to work with) and the human range label
  // (so LeadCapture ships it to Supabase for segmentation). Tapping the same
  // chip again clears the selection — null falls back to DEFAULT_USER_INFO.
  const pickRange = (key, range) => (option) => {
    const isSame = range === option.label;
    if (key === 'age') {
      setUserInfo({ age: isSame ? '28' : option.value, ageRange: isSame ? null : option.label });
    } else if (key === 'height') {
      setUserInfo({ height: isSame ? '175' : option.value, heightUnit: 'cm', heightRange: isSame ? null : option.label });
    } else if (key === 'weight') {
      setUserInfo({ weight: isSame ? '75' : option.value, weightUnit: 'kg', weightRange: isSame ? null : option.label });
    }
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
              <dt className="text-text/30">Privacy</dt>
              <dd className="text-accent mt-1">OPT-IN</dd>
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

          {/* 02 — TUNE IT (optional). Standard SectionLabel + single tight pill
              button so the rail reads consistently with 01 and 03 and the
              collapsed state isn't trying to be a header AND a button. */}
          <div className="space-y-4 mb-8">
            <SectionLabel n="02" title="TUNE IT" />

            <button
              type="button"
              onClick={() => setTuneOpen((v) => !v)}
              aria-expanded={tuneOpen}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 border border-text/15 hover:border-text/40 hover:bg-text/[0.03] transition-all cursor-pointer group rounded-none"
            >
              <span className="flex items-center gap-2 font-ui text-[11px] tracking-[0.25em] uppercase text-text/55 group-hover:text-text">
                <span className="text-accent text-sm leading-none w-3 inline-block text-center">
                  {tuneOpen ? '−' : '+'}
                </span>
                {tuneOpen ? 'HIDE' : 'AGE · HEIGHT · WEIGHT'}
              </span>
              <span className="font-ui text-[9px] tracking-[0.3em] uppercase text-text/30 group-hover:text-accent">
                OPTIONAL
              </span>
            </button>

            <AnimatePresence initial={false}>
              {tuneOpen && (
                <motion.div
                  key="tune-content"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 pt-2">
                    <ChipRow
                      label="AGE"
                      unit="YRS"
                      options={AGE_RANGES}
                      selected={ageRange}
                      onPick={pickRange('age', ageRange)}
                    />
                    <ChipRow
                      label="HEIGHT"
                      unit="CM"
                      options={HEIGHT_RANGES}
                      selected={heightRange}
                      onPick={pickRange('height', heightRange)}
                    />
                    <ChipRow
                      label="WEIGHT"
                      unit="KG"
                      options={WEIGHT_RANGES}
                      selected={weightRange}
                      onPick={pickRange('weight', weightRange)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 03 — GOAL */}
          <div className="space-y-4">
            <SectionLabel n="03" title="GOAL" />
            <div className="space-y-3">
              <GoalButton
                label="BUILD MUSCLE"
                sub={gender === 'female' ? 'Glutes · Legs · Tone' : 'Strength · Size · Power'}
                onClick={() => pickGoal(GOALS.BUILD_MUSCLE)}
              />
              <GoalButton
                label="GET LEAN"
                sub={gender === 'female' ? 'Burn · Shape · Define' : 'Burn · Define · Endurance'}
                onClick={() => pickGoal(GOALS.LOSE_FAT)}
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
 * Optional demographic chip row — label on the left, tappable buckets on the
 * right. Tapping a selected chip clears the selection (toggles back to the
 * default seed). Matches the gender selector aesthetic so the booth visual
 * language stays consistent.
 */
function ChipRow({ label, unit, options, selected, onPick }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="font-ui text-[10px] tracking-[0.3em] uppercase text-text/40">
          {label}
        </span>
        <span className="font-ui text-[9px] tracking-[0.3em] uppercase text-text/20">
          {unit}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isSelected = selected === opt.label;
          return (
            <button
              key={opt.label}
              type="button"
              onClick={() => onPick(opt)}
              aria-pressed={isSelected}
              className={`px-3 py-2 rounded-none border font-ui text-[11px] tracking-[0.2em] uppercase transition-all cursor-pointer tabular-nums ${
                isSelected
                  ? 'bg-accent border-accent text-text'
                  : 'border-text/15 text-text/50 hover:border-text/40 hover:text-text/80'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Boxy goal selector. Hover fills the panel in accent and rounds the corners
 * 8px, matching the SQUATWOLF button spec across the rest of the app. The
 * leading numeric index was dropped — the two-option list reads cleaner without
 * "01 / 02" pretending it's a longer enumerated set.
 */
function GoalButton({ label, sub, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
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
