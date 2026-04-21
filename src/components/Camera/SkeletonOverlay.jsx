import { memo } from 'react';
import { POSE_CONNECTIONS } from '../../utils/constants';

// Static SVG filter — extracted so React doesn't re-create the same defs tree
// on every detection frame.
const GlowDefs = (
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
);

function SkeletonOverlay({ keypoints, width, height, videoWidth, videoHeight }) {
  if (!keypoints || keypoints.length === 0) return null;

  const scaleX = width / videoWidth;
  const scaleY = height / videoHeight;

  const scale = (kp) => ({
    x: kp.x * scaleX,
    y: kp.y * scaleY,
    score: kp.score,
  });

  const scaledKps = keypoints.map(scale);

  return (
    <svg
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none"
    >
      {GlowDefs}

      <g filter="url(#glow)">
        {/* Connections */}
        {POSE_CONNECTIONS.map(([i, j], idx) => {
          const a = scaledKps[i];
          const b = scaledKps[j];
          if (!a || !b || a.score < 0.3 || b.score < 0.3) return null;
          return (
            <line
              key={idx}
              x1={a.x} y1={a.y}
              x2={b.x} y2={b.y}
              stroke="var(--color-accent)"
              strokeWidth={3}
              strokeLinecap="round"
              opacity={Math.min(a.score, b.score)}
            />
          );
        })}

        {/* Keypoints */}
        {scaledKps.map((kp, i) => {
          if (kp.score < 0.3) return null;
          const isMain = i >= 5 && i <= 16;
          return (
            <circle
              key={i}
              cx={kp.x}
              cy={kp.y}
              r={isMain ? 6 : 4}
              fill="var(--color-accent)"
              opacity={kp.score}
              stroke="rgba(0,0,0,0.5)"
              strokeWidth={1}
            />
          );
        })}
      </g>
    </svg>
  );
}

export default memo(SkeletonOverlay);
