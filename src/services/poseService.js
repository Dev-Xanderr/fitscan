import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';

let detector = null;

export async function loadPoseDetector() {
  if (detector) return detector;

  await tf.setBackend('webgl');
  await tf.ready();

  // Use MoveNet (SinglePose.Thunder for better accuracy)
  // MoveNet uses pure tfjs runtime — no @mediapipe dependency
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,
    }
  );

  return detector;
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
