import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ label, value, unit = '', delay = 0, max = 100 }) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = parseFloat(value) || 0;

  useEffect(() => {
    const timeout = setTimeout(() => {
      const duration = 1200;
      const start = Date.now();
      const animate = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(numericValue * eased);
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timeout);
  }, [numericValue, delay]);

  const percentage = Math.min((numericValue / max) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay / 1000, duration: 0.5 }}
      className="glass rounded-2xl p-5"
    >
      <p className="text-white/40 text-xs uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end gap-1 mb-3">
        <span className="text-3xl font-bold text-white" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          {typeof value === 'string' && isNaN(value) ? value : displayValue.toFixed(value % 1 !== 0 ? 2 : 0)}
        </span>
        {unit && <span className="text-white/40 text-sm mb-1">{unit}</span>}
      </div>
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#b93a32] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: delay / 1000, duration: 1, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}
