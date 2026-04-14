import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useScanStore from '../../context/ScanContext';
import DayCard from './DayCard';
import Button from '../UI/Button';
import LoadingSpinner from '../UI/LoadingSpinner';
import PageTransition from '../UI/PageTransition';

export default function RoutineView() {
  const navigate = useNavigate();
  const { routine, routineLoading, routineError, setRoutineLoading, setRoutine, setRoutineError, userInfo, bodyType, bodyMetrics, frameSize, proportionalNotes } = useScanStore();
  const [activeDay, setActiveDay] = useState(0);

  const handleCopy = async () => {
    if (!routine) return;
    const text = routine.weeklySchedule
      .map((day) => {
        let s = `${day.day} — ${day.focus}\n`;
        s += day.warmup?.map((w) => `  Warm-up: ${w.exercise} (${w.duration})`).join('\n') + '\n';
        s += day.exercises.map((e, i) => `  ${i + 1}. ${e.name} — ${e.sets}×${e.reps}, rest ${e.rest}, tempo ${e.tempo}`).join('\n') + '\n';
        s += day.cooldown?.map((c) => `  Cool-down: ${c.exercise} (${c.duration})`).join('\n');
        return s;
      })
      .join('\n\n');
    await navigator.clipboard.writeText(text);
  };

  const handleRetry = async () => {
    setRoutineLoading(true);
    setRoutineError(null);
    try {
      const { BODY_TYPES } = await import('../../utils/constants');
      const typeInfo = BODY_TYPES[bodyType] || BODY_TYPES.mesomorph;
      const analysisData = { bodyType: typeInfo.name, frameSize, metrics: bodyMetrics, proportionalNotes };

      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      const hasApiKey = apiKey && apiKey !== 'your-api-key-here' && apiKey.startsWith('sk-');

      let result;
      if (hasApiKey) {
        try {
          const { generateRoutine } = await import('../../services/claudeApi');
          result = await generateRoutine(userInfo, analysisData);
        } catch {
          const { generateLocalRoutine } = await import('../../services/localRoutineGenerator');
          result = await generateLocalRoutine(userInfo, analysisData);
        }
      } else {
        const { generateLocalRoutine } = await import('../../services/localRoutineGenerator');
        result = await generateLocalRoutine(userInfo, analysisData);
      }
      setRoutine(result);
    } catch (err) {
      setRoutineError(err.message);
    }
  };

  // Loading state
  if (routineLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <LoadingSpinner size={64} />
            <h1 className="text-4xl mt-8 mb-2">Building Your <span className="text-[#b93a32]">Routine</span></h1>
            <p className="text-white/40">Our AI is designing a program for your unique body...</p>
            <motion.div
              className="mt-6 flex gap-2 justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              {['Analyzing proportions', 'Selecting exercises', 'Optimizing volume', 'Finalizing plan'].map((step, i) => (
                <motion.span
                  key={step}
                  className="text-xs text-white/20 px-3 py-1 rounded-full bg-white/5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 + i * 1.5 }}
                >
                  {step}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </PageTransition>
    );
  }

  // Error state
  if (routineError) {
    return (
      <PageTransition>
        <div className="min-h-screen flex flex-col items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-4xl mb-2">Generation <span className="text-red-400">Failed</span></h1>
            <p className="text-white/40 mb-2">{routineError}</p>
            <p className="text-white/20 text-sm mb-8">Make sure your API key is set in the .env file</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={handleRetry}>Try Again</Button>
              <Button variant="secondary" onClick={() => navigate('/results')}>Back to Results</Button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!routine) {
    navigate('/');
    return null;
  }

  const schedule = routine.weeklySchedule;

  return (
    <PageTransition>
      <div className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div className="text-center mb-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-5xl sm:text-6xl mb-2">
            Your <span className="text-[#b93a32]">Routine</span>
          </h1>
          <p className="text-white/40">
            {routine.estimatedSessionDuration && `~${routine.estimatedSessionDuration} per session`}
          </p>
        </motion.div>

        {/* Day tabs */}
        <motion.div
          className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {schedule.map((day, i) => (
            <button
              key={i}
              onClick={() => setActiveDay(i)}
              className={`shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
                activeDay === i
                  ? 'bg-[#b93a32] text-black'
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {day.day}
            </button>
          ))}
        </motion.div>

        {/* Active day */}
        <AnimatePresence mode="wait">
          <DayCard key={activeDay} day={schedule[activeDay]} />
        </AnimatePresence>

        {/* Progression Plan */}
        {routine.weeklyProgressionPlan && (
          <motion.div
            className="glass rounded-2xl p-6 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-2xl mb-2">Weekly <span className="text-[#b93a32]">Progression</span></h3>
            <p className="text-white/60 text-sm">{routine.weeklyProgressionPlan}</p>
          </motion.div>
        )}

        {/* Nutrition Tips */}
        {routine.nutritionTips && routine.nutritionTips.length > 0 && (
          <motion.div
            className="glass rounded-2xl p-6 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-2xl mb-3">Nutrition <span className="text-[#b93a32]">Tips</span></h3>
            <div className="space-y-2">
              {routine.nutritionTips.map((tip, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-[#b93a32] mt-0.5">▸</span>
                  <p className="text-white/60 text-sm">{tip}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          className="flex flex-wrap gap-4 justify-center mt-10 pb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Button onClick={handleCopy} variant="secondary">
            Copy to Clipboard
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              useScanStore.getState().reset();
              navigate('/');
            }}
          >
            Re-scan
          </Button>
        </motion.div>
      </div>
    </PageTransition>
  );
}
