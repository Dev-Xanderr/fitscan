import { motion } from 'framer-motion';

export default function ProportionChart({ metrics }) {
  const bars = [
    { label: 'Shoulder Width', value: metrics.shoulderWidth, max: 55, unit: 'cm' },
    { label: 'Hip Width', value: metrics.hipWidth, max: 45, unit: 'cm' },
    { label: 'Torso Length', value: metrics.torsoLength, max: 70, unit: 'cm' },
    { label: 'Leg Length', value: metrics.legLength, max: 100, unit: 'cm' },
    { label: 'Arm Length', value: metrics.armLength, max: 80, unit: 'cm' },
  ];

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-2xl mb-4">Body <span className="text-[#b93a32]">Proportions</span></h3>
      <div className="space-y-4">
        {bars.map((bar, i) => {
          const pct = Math.min((bar.value / bar.max) * 100, 100);
          return (
            <div key={bar.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white/60">{bar.label}</span>
                <span className="text-white font-medium">{Math.round(bar.value)} {bar.unit}</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, #b93a32, #d04a40)` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
