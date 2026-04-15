export function distance(p1, p2) {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

export function midpoint(p1, p2) {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

export function calculateBodyMetrics(keypoints, userHeight) {
  const kp = {};
  keypoints.forEach((k) => {
    kp[k.name] = k;
  });

  const shoulderWidth = distance(kp.left_shoulder, kp.right_shoulder);
  const hipWidth = distance(kp.left_hip, kp.right_hip);
  const shoulderMid = midpoint(kp.left_shoulder, kp.right_shoulder);
  const hipMid = midpoint(kp.left_hip, kp.right_hip);
  const torsoLength = distance(shoulderMid, hipMid);

  const leftLeg = distance(kp.left_hip, kp.left_knee) + distance(kp.left_knee, kp.left_ankle);
  const rightLeg = distance(kp.right_hip, kp.right_knee) + distance(kp.right_knee, kp.right_ankle);
  const avgLegLength = (leftLeg + rightLeg) / 2;

  const leftArm = distance(kp.left_shoulder, kp.left_elbow) + distance(kp.left_elbow, kp.left_wrist);
  const rightArm = distance(kp.right_shoulder, kp.right_elbow) + distance(kp.right_elbow, kp.right_wrist);
  const avgArmLength = (leftArm + rightArm) / 2;

  const shoulderToHipRatio = shoulderWidth / hipWidth;
  const torsoToLegRatio = torsoLength / avgLegLength;
  const totalHeight = torsoLength + avgLegLength;

  const pixelToCm = userHeight ? userHeight / totalHeight : 1;

  return {
    shoulderWidth: shoulderWidth * pixelToCm,
    hipWidth: hipWidth * pixelToCm,
    torsoLength: torsoLength * pixelToCm,
    legLength: avgLegLength * pixelToCm,
    armLength: avgArmLength * pixelToCm,
    shoulderToHipRatio: Math.round(shoulderToHipRatio * 100) / 100,
    torsoToLegRatio: Math.round(torsoToLegRatio * 100) / 100,
    limbToTorsoRatio: Math.round((avgArmLength / torsoLength) * 100) / 100,
  };
}

// Pose-driven body-type classification.
//
// In the booth flow we don't collect real height/weight — everyone would come
// out BMI ≈ 24.5 and the old BMI-first logic collapsed to "mesomorph" for ~90%
// of visitors. This version classifies from the pose ratios themselves:
//
//   - shoulderToHipRatio (shr)  → upper-body dominance / V-taper
//   - torsoToLegRatio   (tlr)   → long vs short torso
//   - limbToTorsoRatio  (ltr)   → leanness / limb length (proxy for frame type)
//
// BMI is kept as a soft tiebreaker only — not a gate.
export function classifyBodyType(metrics, bmi) {
  const { shoulderToHipRatio: shr, torsoToLegRatio: tlr, limbToTorsoRatio: ltr } = metrics;

  // Score each archetype against the observed ratios. Whichever scores highest wins.
  // Scores are additive so multiple signals reinforce each other.
  const scores = {
    ectomorph: 0,
    mesomorph: 0,
    endomorph: 0,
    'ecto-mesomorph': 0,
    'endo-mesomorph': 0,
  };

  // --- Shoulder-to-hip (V-taper) ---
  if (shr >= 1.45) { scores.mesomorph += 2; scores['ecto-mesomorph'] += 1; }
  else if (shr >= 1.30) { scores.mesomorph += 1; scores['ecto-mesomorph'] += 1; }
  else if (shr >= 1.15) { scores['endo-mesomorph'] += 1; scores.ectomorph += 1; }
  else { scores.endomorph += 2; scores['endo-mesomorph'] += 1; }

  // --- Limb length (long limbs → ecto-leaning; short limbs → meso/endo) ---
  if (ltr >= 1.15) { scores.ectomorph += 2; scores['ecto-mesomorph'] += 1; }
  else if (ltr >= 1.00) { scores['ecto-mesomorph'] += 1; scores.mesomorph += 1; }
  else if (ltr >= 0.90) { scores.mesomorph += 1; scores['endo-mesomorph'] += 1; }
  else { scores.endomorph += 2; scores['endo-mesomorph'] += 1; }

  // --- Torso-to-leg (long torso → endo/meso; long legs → ecto) ---
  if (tlr <= 0.60) { scores.ectomorph += 1; scores['ecto-mesomorph'] += 1; }
  else if (tlr >= 0.75) { scores.endomorph += 1; scores['endo-mesomorph'] += 1; }
  else { scores.mesomorph += 1; }

  // --- BMI as soft tiebreaker (only nudges, doesn't gate) ---
  if (Number.isFinite(bmi)) {
    if (bmi < 21) { scores.ectomorph += 1; }
    else if (bmi < 25) { scores.mesomorph += 1; scores['ecto-mesomorph'] += 0.5; }
    else if (bmi < 28) { scores['endo-mesomorph'] += 1; }
    else { scores.endomorph += 1; }
  }

  // Pick the highest-scoring type.
  let winner = 'mesomorph';
  let best = -Infinity;
  for (const [type, score] of Object.entries(scores)) {
    if (score > best) { best = score; winner = type; }
  }
  return winner;
}

export function classifyFrameSize(shoulderWidth, height) {
  // MoveNet places shoulder keypoints at the joint (acromion), which reads
  // ~10% wider than the visible shoulder silhouette. Apply a correction factor.
  const corrected = shoulderWidth * 0.88;
  const ratio = corrected / height;
  if (ratio < 0.215) return 'Small';
  if (ratio < 0.245) return 'Medium';
  return 'Large';
}

export function getProportionalNotes(metrics) {
  const notes = [];
  const { shoulderToHipRatio, limbToTorsoRatio, torsoToLegRatio } = metrics;

  if (limbToTorsoRatio > 1.1) {
    notes.push('Long limbs relative to torso — ideal for deadlifts and pulling movements');
  } else if (limbToTorsoRatio < 0.85) {
    notes.push('Shorter limbs relative to torso — excellent leverage for bench press and squats');
  }

  if (shoulderToHipRatio > 1.35) {
    notes.push('Wide shoulder structure — strong pressing and overhead potential');
  } else if (shoulderToHipRatio < 1.15) {
    notes.push('Balanced frame — focus on shoulder development for a V-taper');
  }

  if (torsoToLegRatio > 0.85) {
    notes.push('Longer torso — great core stability base, suits front squats');
  } else if (torsoToLegRatio < 0.65) {
    notes.push('Longer legs — built for running and explosive movements');
  }

  if (notes.length === 0) {
    notes.push('Well-proportioned build — versatile for all training styles');
  }

  return notes;
}

export function calculateBMI(weightKg, heightCm) {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}
