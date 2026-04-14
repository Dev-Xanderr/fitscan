/**
 * WolfMark — renders the official SQUATWOLF icon from /public/brand.
 *
 * Variants:
 *   - "white" (default) for dark backgrounds
 *   - "black" for light surfaces (e.g. the QR card)
 */
export default function WolfMark({ size = 48, variant = 'white', className = '', style }) {
  const src = variant === 'black' ? '/brand/icon-black.png' : '/brand/icon-white.png';
  return (
    <img
      src={src}
      alt="SQUATWOLF"
      width={size}
      height={(size * 480) / 732}
      className={className}
      style={{ objectFit: 'contain', ...style }}
      draggable={false}
    />
  );
}
