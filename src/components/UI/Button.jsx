import { motion } from 'framer-motion';

export default function Button({ children, onClick, variant = 'primary', className = '', disabled = false, ...props }) {
  const base = 'font-semibold rounded-none hover:rounded-lg transition-all duration-300 cursor-pointer inline-flex items-center justify-center gap-2 uppercase tracking-wider';

  const variants = {
    primary: `bg-[#B93A32] text-white hover:bg-[#d04a40] px-8 py-4 text-lg ${disabled ? 'opacity-50 cursor-not-allowed' : 'glow-accent'}`,
    secondary: `bg-white/10 text-white hover:bg-white/20 border border-white/20 px-6 py-3`,
    ghost: `bg-transparent text-[#B93A32] hover:bg-[#B93A32]/10 px-6 py-3`,
    inactive: `bg-[#7A7A7A]/30 text-[#7A7A7A] px-6 py-3 cursor-not-allowed`,
  };

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={disabled ? undefined : onClick}
      className={`${base} ${variants[variant]} ${className}`}
      style={{ fontFamily: "'Azeret Mono', monospace", ...props.style }}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
