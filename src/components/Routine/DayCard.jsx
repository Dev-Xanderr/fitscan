import { motion } from 'framer-motion';
import ExerciseRow from './ExerciseRow';

export default function DayCard({ day }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Day header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-[#b93a32] text-black rounded-xl px-4 py-2">
          <h3 className="text-2xl leading-none">{day.day}</h3>
        </div>
        <div>
          <p className="text-white font-semibold">{day.focus}</p>
        </div>
      </div>

      {/* Warm-up */}
      {day.warmup && day.warmup.length > 0 && (
        <div className="glass rounded-xl p-4">
          <p className="text-[#b93a32]/60 text-xs uppercase tracking-wider mb-3">Warm-up</p>
          <div className="space-y-2">
            {day.warmup.map((w, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-white/70 text-sm">{w.exercise}</span>
                <span className="text-white/30 text-sm">{w.duration}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercises */}
      <div className="space-y-2">
        {day.exercises.map((ex, i) => (
          <ExerciseRow key={i} exercise={ex} index={i} />
        ))}
      </div>

      {/* Cool-down */}
      {day.cooldown && day.cooldown.length > 0 && (
        <div className="glass rounded-xl p-4">
          <p className="text-[#b93a32]/60 text-xs uppercase tracking-wider mb-3">Cool-down</p>
          <div className="space-y-2">
            {day.cooldown.map((c, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-white/70 text-sm">{c.exercise}</span>
                <span className="text-white/30 text-sm">{c.duration}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
