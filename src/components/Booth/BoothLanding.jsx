import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useScanStore from '../../context/ScanContext';
import WolfMark from './WolfMark';
import { loadPoseDetector } from '../../services/poseService';

export default function BoothLanding() {
  const navigate = useNavigate();
  const { setBoothGoal, setGender, reset } = useScanStore();
  const [gender, setLocalGender] = useState('male');

  useEffect(() => {
    reset();
    // Preload the AI model in the background so camera opens instantly
    loadPoseDetector().catch(() => {});
  }, [reset]);

  const pickGoal = (goal) => {
    setGender(gender);
    setBoothGoal(goal);
    navigate('/scan');
  };

  return (
    <div className="min-h-screen w-full flex flex-col px-10 sm:px-16 lg:px-24 py-12 lg:py-14 relative overflow-hidden bg-[#121212] text-[#FAFAFA]">
      {/* Background gradient */}
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
        }}
      />

      {/* Top nav */}
      <motion.div
        className="w-full flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3">
          <WolfMark size={44} />
          <span className="text-xl tracking-[0.35em]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            SQUATWOLF
          </span>
        </div>
        <div
          className="text-[10px] tracking-[0.3em] uppercase text-[#FAFAFA]/50 border border-[#FAFAFA]/20 rounded-none px-4 py-2"
          style={{ fontFamily: "'Azeret Mono', monospace" }}
        >
          Live
        </div>
      </motion.div>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 items-center mt-8">
        {/* LEFT — hero copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.7 }}
            className="mb-6 inline-flex items-center gap-2 text-[#b93a32] text-[10px] font-semibold tracking-[0.4em] uppercase"
          >
            <span className="w-8 h-px bg-[#b93a32]" />
            Born in Dubai, Engineered for Gym
          </motion.div>

          <motion.h1
            className="font-bold leading-[0.82] tracking-tight"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.8 }}
          >
            <span className="block text-7xl sm:text-8xl md:text-[9rem]">STEP IN.</span>
            <span className="block text-7xl sm:text-8xl md:text-[9rem]">GET SCANNED.</span>
            <span className="block text-7xl sm:text-8xl md:text-[9rem] text-[#b93a32]">OWN YOUR WORKOUT.</span>
          </motion.h1>

          <motion.p
            className="text-[#FAFAFA]/60 text-lg max-w-xl mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            One scan reads your build. We hand you a routine engineered for how
            you move. Pick your goal.
          </motion.p>
        </div>

        {/* RIGHT — gender + goal */}
        <motion.div
          className="flex flex-col gap-5 items-stretch"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
        >
          {/* Gender toggle */}
          <div>
            <p
              className="text-[#FAFAFA]/40 text-[10px] tracking-[0.3em] uppercase mb-3"
              style={{ fontFamily: "'Azeret Mono', monospace" }}
            >
              I am
            </p>
            <div className="grid grid-cols-2 gap-3">
              {['male', 'female'].map((g) => (
                <button
                  key={g}
                  onClick={() => setLocalGender(g)}
                  className={`py-3 rounded-none transition-all border text-sm tracking-[0.15em] uppercase ${
                    gender === g
                      ? 'bg-[#B93A32] border-[#B93A32] text-[#FAFAFA]'
                      : 'border-[#FAFAFA]/20 text-[#FAFAFA]/50 hover:border-[#FAFAFA]/40'
                  }`}
                  style={{ fontFamily: "'Azeret Mono', monospace" }}
                >
                  {g === 'male' ? 'Male' : 'Female'}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <span className="flex-1 h-px bg-[#FAFAFA]/10" />
            <span
              className="text-[#FAFAFA]/30 text-[10px] tracking-[0.3em] uppercase"
              style={{ fontFamily: "'Azeret Mono', monospace" }}
            >
              Goal
            </span>
            <span className="flex-1 h-px bg-[#FAFAFA]/10" />
          </div>

          {/* Goal buttons */}
          <GoalButton
            label="BUILD MUSCLE"
            sub={gender === 'female' ? 'Glutes · Legs · Tone' : 'Strength · Size · Power'}
            onClick={() => pickGoal('build-muscle')}
          />
          <GoalButton
            label="GET LEAN"
            sub={gender === 'female' ? 'Burn · Shape · Define' : 'Burn · Define · Endurance'}
            onClick={() => pickGoal('lose-fat')}
          />
        </motion.div>
      </div>

      {/* Bottom bar */}
      <motion.div
        className="w-full flex items-center justify-between text-[#FAFAFA]/40 text-[10px] tracking-[0.3em] uppercase mt-8 pt-6 border-t border-[#FAFAFA]/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <span>squatwolf.com</span>
        <span className="attract-pulse text-[#FAFAFA]/70 text-xs">▸ Tap to begin</span>
        <span>Born in Dubai</span>
      </motion.div>
    </div>
  );
}

function GoalButton({ label, sub, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="group relative px-10 py-7 rounded-none hover:rounded-lg transition-all min-w-[260px] text-left border-2 border-[#FAFAFA]/20 bg-[#FAFAFA]/[0.02] text-[#FAFAFA] hover:bg-[#B93A32] hover:border-[#B93A32] hover:shadow-[0_0_60px_-10px_rgba(185,58,50,0.6)]"
    >
      <div
        className="text-3xl sm:text-4xl mb-1"
        style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.05em' }}
      >
        {label}
      </div>
      <div
        className="text-[#FAFAFA]/50 text-sm tracking-wider uppercase group-hover:text-[#FAFAFA]/80"
        style={{ fontFamily: "'Azeret Mono', monospace" }}
      >
        {sub}
      </div>
      <div className="absolute top-5 right-5 text-xl opacity-70 group-hover:translate-x-1 transition-transform">
        →
      </div>
    </motion.button>
  );
}
