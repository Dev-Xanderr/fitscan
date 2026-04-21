import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';

let detector = null;
let warmedUp = false;

export async function loadPoseDetector() {
  if (detector) return detector;

  await tf.setBackend('webgl');
  await tf.ready();

  // Lightning is ~3x faster than Thunder with identical keypoints for booth use.
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    }
  );

  return detector;
}

// Compile WebGL shaders by running one inference on a blank input. Idempotent —
// safe to call on every visitor; only the first call does work. Skipping this
// on subsequent visitors prevents accumulating GPU tensor allocations across
// the kiosk's all-day runtime.
export async function warmUpDetector(d) {
  if (warmedUp || !d) return;
  const blank = document.createElement('canvas');
  blank.width = 192; blank.height = 192;
  try {
    await d.estimatePoses(blank, { maxPoses: 1 });
    warmedUp = true;
  } catch (_) { /* warmup failure is non-fatal */ }
}

export async function detectPose(detector, video) {
  if (!detector || !video || video.readyState < 2) return null;

  const poses = await detector.estimatePoses(video, {
    maxPoses: 1,
    flipHorizontal: false,
  });

  if (poses.length === 0) return null;
  return poses[0];
}

// MoveNet provides 17 keypoints (COCO format)
// We map them to names for our analysis
const MOVENET_KEYPOINT_NAMES = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
  'left_knee', 'right_knee', 'left_ankle', 'right_ankle',
];

export function isFullBodyVisible(keypoints, minConfidence = 0.3) {
  const requiredParts = [
    'left_shoulder', 'right_shoulder',
    'left_hip', 'right_hip',
    'left_knee', 'right_knee',
    'left_ankle', 'right_ankle',
  ];

  return requiredParts.every((name) => {
    const kp = keypoints.find((k) => k.name === name);
    return kp && kp.score >= minConfidence;
  });
}
