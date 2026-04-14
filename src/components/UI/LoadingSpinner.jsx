import { motion } from 'framer-motion';

export default function LoadingSpinner({ size = 48, text = '' }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="border-2 border-white/10 border-t-[#b93a32] rounded-full"
        style={{ width: size, height: size }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      {text && <p className="text-white/60 text-sm">{text}</p>}
    </div>
  );
}
