import { motion } from 'framer-motion';

/**
 * Button — shared button component.
 *
 * Variants:
 *   primary    — solid accent CTA (landing/scan main actions)
 *   secondary  — translucent on dark surfaces
 *   ghost      — text-only accent link
 *   inactive   — disabled-looking placeholder
 *   booth      — small hollow pill used as a tertiary action on booth screens
 *                (border that fills on hover, wide letter-spacing, smaller text)
 *
 * Font weight + tracking live on each variant rather than `base` so the
 * `booth` variant doesn't have to fight base utilities with !important.
 */
export default function Button({ children, onClick, variant = 'primary', className = '', disabled = false, ...props }) {
  const base = 'rounded-none hover:rounded-lg transition-all duration-300 cursor-pointer inline-flex items-center justify-center gap-2 uppercase';

  const variants = {
    primary: `font-semibold tracking-wider bg-accent text-white hover:bg-accent-light px-8 py-4 text-lg ${disabled ? 'opacity-50 cursor-not-allowed' : 'glow-accent'}`,
    secondary: `font-semibold tracking-wider bg-white/10 text-white hover:bg-white/20 border border-white/20 px-6 py-3`,
    ghost: `font-semibold tracking-wider bg-transparent text-accent hover:bg-accent/10 px-6 py-3`,
    inactive: `font-semibold tracking-wider bg-text-muted/30 text-text-muted px-6 py-3 cursor-not-allowed`,
    booth: `font-normal tracking-[0.3em] text-[11px] bg-transparent text-text/50 hover:text-text border border-text/20 hover:border-accent px-6 py-3`,
  };

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={disabled ? undefined : onClick}
      className={`${base} ${variants[variant]} ${className} font-ui`}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
