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
// Aggressively forgiving — kiosk visitors fidget, shift weight, breathe,
// and MoveNet itself jitters even on motionless input. 35px per-keypoint
// per-frame still rules out any deliberate movement (an arm raise is
// >80px/frame at this video resolution) but happily ignores micro-sway,
// shoulder breathing, and detector noise spikes.
export const STABILITY_THRESHOLD = 35;
// 1.5-second hold. Cut from 2s after another round of "still bouncing"
// traces — every extra half-second is one more chance for the detector
// to hiccup. 1.5s is the floor we can run while still feeling like a
// deliberate "lock-on" rather than a snapshot.
export const STABILITY_DURATION = 1500;
// Number of prior frames we need before the stability check fires.
// Dropped to 2 so the very first viable frame-to-frame comparison
// counts toward the hold instead of being thrown away as warm-up.
export const STABILITY_FRAMES = 2;
// How many consecutive "bad" frames we tolerate before breaking a HOLD.
// Counts BOTH above-threshold avgDelta frames AND brief isFullBodyVisible
// failures (transient confidence dips on a single keypoint). At ~30fps
// this is ~1s of noise tolerance — long enough to absorb sustained
// MoveNet confidence dropouts when a visitor partially turns or a limb
// dips into shadow, short enough that an actual "user stepped out" still
// resets within a second.
export const STABILITY_BAD_FRAME_TOLERANCE = 30;
// Confidence threshold for counting a keypoint as "visible" in
// isFullBodyVisible. Lower = more forgiving. MoveNet routinely returns
// 0.15-0.25 on partially occluded ankles/knees under booth downlight;
// the floor of 0.15 keeps those frames in the "good" bucket.
export const FULL_BODY_KEYPOINT_CONF = 0.15;
// Allow up to N of the 8 required body keypoints to fall below the
// confidence floor before we declare the body "not fully visible".
// 3 of 8 means a visitor whose two ankles AND one knee are clipped or
// shadowed STILL passes the visibility check — the four shoulder/hip
// anchors plus one knee are enough to call the pose locked.
export const FULL_BODY_MISSING_TOLERANCE = 3;
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
