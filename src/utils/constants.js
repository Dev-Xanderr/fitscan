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

// Per-keypoint pixel-delta (current frame vs previous frame) below which
// we count a frame as "still". Frame-to-frame metric, NOT averaged across
// a long buffer.
//
// Generous bumps after each round of live tracing — kiosk visitors aren't
// going to stand statue-still, and MoveNet keypoints jitter even on
// motionless input. 20px per-keypoint per-frame is well below the per-
// frame deltas of any deliberate movement (>40px/frame) but tolerant of
// breathing, micro-sway, and detector noise.
export const STABILITY_THRESHOLD = 20;
// 2-second hold (was 3s). Visitors are willing to stand still, but every
// extra second of "don't move" is one more chance for the detector to
// hiccup and bounce them out. 2s is plenty for MoveNet to lock pose.
export const STABILITY_DURATION = 2000;
// Number of prior frames we need before the stability check fires.
export const STABILITY_FRAMES = 3;
// How many consecutive "bad" frames we tolerate before breaking a HOLD.
// Counts BOTH above-threshold avgDelta frames AND brief isFullBodyVisible
// failures (transient confidence dips on a single keypoint). At ~30fps
// this is ~500ms of noise tolerance — long enough to absorb sustained
// MoveNet confidence flickers, short enough that an actual "user stepped
// out" still resets the hold within half a second.
export const STABILITY_BAD_FRAME_TOLERANCE = 15;
// Confidence threshold for counting a keypoint as "visible" in
// isFullBodyVisible. Lower = more forgiving. MoveNet routinely returns
// 0.2-0.3 on partially occluded ankles/knees, especially under booth
// downlight; bumping the floor down to 0.2 stops those from failing the
// full-body check.
export const FULL_BODY_KEYPOINT_CONF = 0.2;
// Allow up to N of the 8 required body keypoints to fall below the
// confidence floor before we declare the body "not fully visible".
// Tolerates a single occluded knee/ankle without breaking the lock.
export const FULL_BODY_MISSING_TOLERANCE = 1;
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
  TERMS: '/terms',
});

/**
 * localStorage keys. The booth has no backend by default — captured leads
 * accumulate here and the operator can drain them via DevTools at end of day,
 * or set VITE_LEAD_ENDPOINT to POST them somewhere instead.
 */
export const STORAGE_KEYS = Object.freeze({
  LEADS: 'fitscan-leads',
});

/**
 * Brand contact details exposed in the privacy policy. Real deployments
 * should override these via env (VITE_PRIVACY_EMAIL etc.) once routed.
 */
export const BRAND_CONTACT = Object.freeze({
  email: import.meta.env.VITE_PRIVACY_EMAIL || 'privacy@squatwolf.com',
  jurisdiction: 'Dubai, United Arab Emirates',
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
