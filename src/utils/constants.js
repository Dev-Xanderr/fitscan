export const BODY_TYPES = {
  ectomorph: {
    name: 'Ectomorph',
    description: 'Naturally lean and long. Fast metabolism, narrower frame. Excels at endurance activities.',
    traits: ['Lean build', 'Fast metabolism', 'Narrow shoulders', 'Long limbs'],
  },
  mesomorph: {
    name: 'Mesomorph',
    description: 'Naturally muscular and athletic. Gains muscle easily, medium frame. Built for power.',
    traits: ['Athletic build', 'Broad shoulders', 'Responsive muscles', 'Medium frame'],
  },
  endomorph: {
    name: 'Endomorph',
    description: 'Naturally broader and solid. Stores energy efficiently, wider frame. Strong foundation for strength.',
    traits: ['Solid build', 'Wider hips', 'Strong base', 'Larger frame'],
  },
  'ecto-mesomorph': {
    name: 'Ecto-Mesomorph',
    description: 'Lean with good muscle-building potential. Athletic frame with longer limbs.',
    traits: ['Lean & athletic', 'Good V-taper', 'Long muscle bellies', 'Versatile build'],
  },
  'endo-mesomorph': {
    name: 'Endo-Mesomorph',
    description: 'Powerful and naturally strong. Wide frame with significant muscle potential.',
    traits: ['Powerful build', 'Wide frame', 'Strong naturally', 'Dense muscles'],
  },
};

// MoveNet COCO 17-keypoint connections
export const POSE_CONNECTIONS = [
  [5, 6],   // shoulders
  [5, 7],   [7, 9],   // left arm
  [6, 8],   [8, 10],  // right arm
  [5, 11],  [6, 12],  // torso sides
  [11, 12], // hips
  [11, 13], [13, 15], // left leg
  [12, 14], [14, 16], // right leg
];

export const STABILITY_THRESHOLD = 5;
export const STABILITY_DURATION = 3000;
export const STABILITY_FRAMES = 10;
export const DETECTION_TIMEOUT = 60000;

// ── Stringly-typed enum centralization ───────────────────────────────────────
// These were originally raw string literals scattered across components.
// Centralizing them here means a typo at a call site is a runtime
// `undefined` rather than a silently-broken state machine.

/** Scan flow state machine values used by ScanContext.scanStatus. */
export const SCAN_STATUS = Object.freeze({
  IDLE: 'idle',
  CAMERA: 'camera',
  LOADING: 'loading',
  SEARCHING: 'searching',
  DETECTED: 'detected',
  HOLDING: 'holding',
  COMPLETE: 'complete',
});

/** React Router paths. Keep in sync with <Route> declarations in App.jsx. */
export const ROUTES = Object.freeze({
  LANDING: '/',
  SCAN: '/scan',
  ROUTINE: '/routine',
});

/**
 * Booth goal options. The string values are baked into the QR payload (seed.g)
 * and into productRecommendations / localRoutineGenerator goal lookups, so
 * changing the values is a breaking change for old QR codes.
 */
export const GOALS = Object.freeze({
  BUILD_MUSCLE: 'build-muscle',
  LOSE_FAT: 'lose-fat',
});
