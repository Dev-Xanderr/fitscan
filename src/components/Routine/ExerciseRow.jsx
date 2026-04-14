import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExerciseRow({ exercise, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-4 text-left cursor-pointer hover:bg-white/5 transition-colors"
      >
        <span className="text-[#b93a32] font-bold text-lg w-8 text-center shrink-0" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm">{exercise.name}</h4>
          <p className="text-white/40 text-xs mt-0.5">
            {exercise.sets} sets × {exercise.reps} · {exercise.rest} rest
          </p>
        </div>
        <div className="text-white/20 shrink-0 transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 space-y-3 border-t border-white/5">
              <div className="grid grid-cols-3 gap-3 pt-3">
                <div className="text-center">
                  <p className="text-white/30 text-xs uppercase">Tempo</p>
                  <p className="text-white text-sm font-medium">{exercise.tempo}</p>
                </div>
                <div className="text-center">
                  <p className="text-white/30 text-xs uppercase">Sets</p>
                  <p className="text-white text-sm font-medium">{exercise.sets}</p>
                </div>
                <div className="text-center">
                  <p className="text-white/30 text-xs uppercase">Reps</p>
                  <p className="text-white text-sm font-medium">{exercise.reps}</p>
                </div>
              </div>

              {exercise.notes && (
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/30 text-xs uppercase mb-1">Notes</p>
                  <p className="text-white/70 text-sm">{exercise.notes}</p>
                </div>
              )}

              <div className="bg-[#b93a32]/5 border border-[#b93a32]/10 rounded-lg p-3">
                <p className="text-[#b93a32]/60 text-xs uppercase mb-1">Why This Exercise?</p>
                <p className="text-white/70 text-sm">{exercise.whyThisExercise}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
