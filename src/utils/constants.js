export const ACCENT_COLOR = '#b93a32';
export const ACCENT_RGB = '185, 58, 50';

export const FITNESS_GOALS = [
  { id: 'lose-fat', label: 'Lose Fat', icon: '🔥' },
  { id: 'build-muscle', label: 'Build Muscle', icon: '💪' },
  { id: 'stay-active', label: 'Stay Active', icon: '🏃' },
  { id: 'athletic', label: 'Athletic Performance', icon: '🏆' },
];

export const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Beginner', desc: 'New to training or < 6 months' },
  { id: 'intermediate', label: 'Intermediate', desc: '6 months – 2 years' },
  { id: 'advanced', label: 'Advanced', desc: '2+ years consistent training' },
];

export const EQUIPMENT_OPTIONS = [
  { id: 'bodyweight', label: 'Bodyweight Only' },
  { id: 'dumbbells', label: 'Dumbbells' },
  { id: 'home-gym', label: 'Home Gym' },
  { id: 'full-gym', label: 'Full Gym' },
];

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
