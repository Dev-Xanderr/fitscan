/**
 * SilhouetteGuide — the big, obvious "stand here" overlay drawn on top of the
 * camera feed. Designed to be impossible to miss at the booth:
 *   - Aurora-red corner brackets framing the target zone
 *   - A thick wolf-red body outline with a soft glow
 *   - Pulsing "STAND IN FRAME" label at the bottom
 */
export default function SilhouetteGuide({ width, height }) {
  const cx = width / 2;
  const scale = Math.min(width, height) / 500;

  // Corner bracket geometry — sits 6% in from each edge
  const pad = Math.min(width, height) * 0.06;
  const bracketLen = Math.min(width, height) * 0.12;
  const bracketW = 6; // thickness

  const Bracket = ({ x, y, dx, dy }) => (
    <>
      <line
        x1={x} y1={y} x2={x + dx * bracketLen} y2={y}
        stroke="var(--color-accent)" strokeWidth={bracketW} strokeLinecap="round"
      />
      <line
        x1={x} y1={y} x2={x} y2={y + dy * bracketLen}
        stroke="var(--color-accent)" strokeWidth={bracketW} strokeLinecap="round"
      />
    </>
  );

  return (
    <svg
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none"
    >
      <defs>
        <filter id="sg-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Dim the outside area so the target zone pops */}
      <mask id="sg-mask">
        <rect width={width} height={height} fill="white" />
        <rect
          x={pad} y={pad}
          width={width - pad * 2} height={height - pad * 2}
          rx={24} ry={24}
          fill="black"
        />
      </mask>
      <rect width={width} height={height} fill="rgba(0,0,0,0.35)" mask="url(#sg-mask)" />

      {/* Corner brackets — pulsing */}
      <g style={{ animation: 'sgPulse 1.6s ease-in-out infinite' }}>
        <Bracket x={pad} y={pad} dx={1} dy={1} />
        <Bracket x={width - pad} y={pad} dx={-1} dy={1} />
        <Bracket x={pad} y={height - pad} dx={1} dy={-1} />
        <Bracket x={width - pad} y={height - pad} dx={-1} dy={-1} />
      </g>

      {/* Body silhouette — thick and glowing, centered */}
      <g
        transform={`translate(${cx}, ${height * 0.12})`}
        stroke="var(--color-accent)"
        strokeWidth={5 * scale}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={0.55}
        filter="url(#sg-glow)"
      >
        {/* Head */}
        <ellipse cx={0} cy={28 * scale} rx={22 * scale} ry={28 * scale} />
        {/* Neck */}
        <line x1={0} y1={56 * scale} x2={0} y2={72 * scale} />
        {/* Shoulder bar */}
        <line x1={-68 * scale} y1={82 * scale} x2={68 * scale} y2={82 * scale} />
        {/* Torso sides */}
        <line x1={-68 * scale} y1={82 * scale} x2={-50 * scale} y2={210 * scale} />
        <line x1={68 * scale} y1={82 * scale} x2={50 * scale} y2={210 * scale} />
        {/* Hip bar */}
        <line x1={-50 * scale} y1={210 * scale} x2={50 * scale} y2={210 * scale} />
        {/* Arms (slightly away from body) */}
        <line x1={-68 * scale} y1={82 * scale} x2={-88 * scale} y2={180 * scale} />
        <line x1={68 * scale} y1={82 * scale} x2={88 * scale} y2={180 * scale} />
        {/* Legs */}
        <line x1={-50 * scale} y1={210 * scale} x2={-55 * scale} y2={360 * scale} />
        <line x1={50 * scale} y1={210 * scale} x2={55 * scale} y2={360 * scale} />
      </g>

      {/* Label — counter-flip so text reads correctly (parent is scaleX(-1)) */}
      <g style={{ animation: 'sgPulse 1.6s ease-in-out infinite' }} transform={`translate(${width}, 0) scale(-1, 1)`}>
        <rect
          x={cx - 120} y={height - pad - 46}
          width={240} height={34} rx={17}
          fill="rgba(0,0,0,0.75)"
          stroke="var(--color-accent)" strokeWidth={1.5}
        />
        <text
          x={cx} y={height - pad - 24}
          textAnchor="middle"
          fill="var(--color-text)"
          fontSize={13}
          fontWeight={700}
          letterSpacing={3}
          className="font-heading"
        >
          STAND IN FRAME
        </text>
      </g>

      <style>{`
        @keyframes sgPulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.55; }
        }
      `}</style>
    </svg>
  );
}
