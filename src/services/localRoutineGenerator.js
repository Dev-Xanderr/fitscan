// ---------------------------------------------------------------------------
// localRoutineGenerator.js
// Generates a fully personalized workout routine without any API calls.
// ---------------------------------------------------------------------------

// ============================= EXERCISE DATABASE ============================

const EXERCISES = {
  // ---- CHEST ----
  chest: [
    { name: 'Barbell Bench Press', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'chest', secondary: ['triceps', 'shoulders'], compound: true },
    { name: 'Dumbbell Bench Press', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'chest', secondary: ['triceps', 'shoulders'], compound: true },
    { name: 'Incline Dumbbell Press', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'chest', secondary: ['shoulders', 'triceps'], compound: true },
    { name: 'Incline Barbell Press', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'chest', secondary: ['shoulders', 'triceps'], compound: true },
    { name: 'Decline Dumbbell Press', equipment: ['home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'chest', secondary: ['triceps'], compound: true },
    { name: 'Cable Flyes', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'chest', secondary: [], compound: false },
    { name: 'Dumbbell Flyes', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'chest', secondary: [], compound: false },
    { name: 'Push-Ups', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'chest', secondary: ['triceps', 'shoulders'], compound: true },
    { name: 'Diamond Push-Ups', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'chest', secondary: ['triceps'], compound: true },
    { name: 'Chest Dips', equipment: ['home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'chest', secondary: ['triceps', 'shoulders'], compound: true },
    { name: 'Pec Deck Machine', equipment: ['full-gym'], level: ['beginner', 'intermediate'], primary: 'chest', secondary: [], compound: false },
    { name: 'Landmine Press', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'chest', secondary: ['shoulders'], compound: true },
    { name: 'Svend Press', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate'], primary: 'chest', secondary: [], compound: false },
    { name: 'Floor Press', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'chest', secondary: ['triceps'], compound: true },
    { name: 'Machine Chest Press', equipment: ['full-gym'], level: ['beginner', 'intermediate'], primary: 'chest', secondary: ['triceps'], compound: true },
    { name: 'Cable Crossovers', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'chest', secondary: [], compound: false },
    { name: 'Incline Push-Ups', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate'], primary: 'chest', secondary: ['shoulders'], compound: true },
    { name: 'Archer Push-Ups', equipment: ['bodyweight', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'chest', secondary: ['triceps'], compound: true },
  ],

  // ---- BACK ----
  back: [
    { name: 'Barbell Bent-Over Row', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'back', secondary: ['biceps'], compound: true },
    { name: 'Dumbbell Single-Arm Row', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'back', secondary: ['biceps'], compound: true },
    { name: 'Pull-Ups', equipment: ['home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'back', secondary: ['biceps'], compound: true },
    { name: 'Chin-Ups', equipment: ['home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'back', secondary: ['biceps'], compound: true },
    { name: 'Lat Pulldown', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'back', secondary: ['biceps'], compound: true },
    { name: 'Seated Cable Row', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'back', secondary: ['biceps'], compound: true },
    { name: 'T-Bar Row', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'back', secondary: ['biceps'], compound: true },
    { name: 'Face Pulls', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'back', secondary: ['shoulders'], compound: false },
    { name: 'Dumbbell Pullover', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'back', secondary: ['chest'], compound: true },
    { name: 'Inverted Rows', equipment: ['bodyweight', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate'], primary: 'back', secondary: ['biceps'], compound: true },
    { name: 'Superman Hold', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate'], primary: 'back', secondary: [], compound: false },
    { name: 'Renegade Rows', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'back', secondary: ['core'], compound: true },
    { name: 'Meadows Row', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'back', secondary: ['biceps'], compound: true },
    { name: 'Chest-Supported Row', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'back', secondary: ['biceps'], compound: true },
    { name: 'Straight-Arm Pulldown', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'back', secondary: [], compound: false },
    { name: 'Wide-Grip Lat Pulldown', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'back', secondary: ['biceps'], compound: true },
    { name: 'Neutral-Grip Pull-Ups', equipment: ['home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'back', secondary: ['biceps'], compound: true },
    { name: 'Rack Pulls', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'back', secondary: ['glutes'], compound: true },
    { name: 'Kroc Rows', equipment: ['dumbbells', 'full-gym'], level: ['advanced'], primary: 'back', secondary: ['biceps'], compound: true },
  ],

  // ---- SHOULDERS ----
  shoulders: [
    { name: 'Overhead Barbell Press', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'shoulders', secondary: ['triceps'], compound: true },
    { name: 'Dumbbell Shoulder Press', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'shoulders', secondary: ['triceps'], compound: true },
    { name: 'Arnold Press', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'shoulders', secondary: ['triceps'], compound: true },
    { name: 'Lateral Raises', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'shoulders', secondary: [], compound: false },
    { name: 'Front Raises', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'shoulders', secondary: [], compound: false },
    { name: 'Reverse Flyes', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'shoulders', secondary: ['back'], compound: false },
    { name: 'Pike Push-Ups', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'shoulders', secondary: ['triceps'], compound: true },
    { name: 'Handstand Push-Ups (Wall)', equipment: ['bodyweight', 'home-gym', 'full-gym'], level: ['advanced'], primary: 'shoulders', secondary: ['triceps'], compound: true },
    { name: 'Cable Lateral Raises', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'shoulders', secondary: [], compound: false },
    { name: 'Upright Rows', equipment: ['dumbbells', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'shoulders', secondary: ['traps'], compound: true },
    { name: 'Machine Shoulder Press', equipment: ['full-gym'], level: ['beginner', 'intermediate'], primary: 'shoulders', secondary: ['triceps'], compound: true },
    { name: 'Cable Rear Delt Flyes', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'shoulders', secondary: ['back'], compound: false },
    { name: 'Landmine Shoulder Press', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'shoulders', secondary: ['triceps'], compound: true },
    { name: 'Plate Front Raises', equipment: ['full-gym'], level: ['beginner', 'intermediate'], primary: 'shoulders', secondary: [], compound: false },
    { name: 'Seated Dumbbell Press', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'shoulders', secondary: ['triceps'], compound: true },
  ],

  // ---- BICEPS ----
  biceps: [
    { name: 'Barbell Curls', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'biceps', secondary: [], compound: false },
    { name: 'Dumbbell Curls', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'biceps', secondary: [], compound: false },
    { name: 'Hammer Curls', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'biceps', secondary: ['forearms'], compound: false },
    { name: 'Concentration Curls', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'biceps', secondary: [], compound: false },
    { name: 'Incline Dumbbell Curls', equipment: ['home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'biceps', secondary: [], compound: false },
    { name: 'Cable Curls', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'biceps', secondary: [], compound: false },
    { name: 'Preacher Curls', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'biceps', secondary: [], compound: false },
    { name: 'Spider Curls', equipment: ['dumbbells', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'biceps', secondary: [], compound: false },
    { name: 'EZ Bar Curls', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'biceps', secondary: [], compound: false },
    { name: 'Zottman Curls', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'biceps', secondary: ['forearms'], compound: false },
  ],

  // ---- TRICEPS ----
  triceps: [
    { name: 'Tricep Dips', equipment: ['bodyweight', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'triceps', secondary: ['chest'], compound: true },
    { name: 'Overhead Tricep Extension', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'triceps', secondary: [], compound: false },
    { name: 'Tricep Kickbacks', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate'], primary: 'triceps', secondary: [], compound: false },
    { name: 'Skull Crushers', equipment: ['full-gym', 'home-gym'], level: ['intermediate', 'advanced'], primary: 'triceps', secondary: [], compound: false },
    { name: 'Cable Tricep Pushdown', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'triceps', secondary: [], compound: false },
    { name: 'Close-Grip Bench Press', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'triceps', secondary: ['chest'], compound: true },
    { name: 'Bench Dips', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate'], primary: 'triceps', secondary: [], compound: false },
    { name: 'Rope Tricep Pushdown', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'triceps', secondary: [], compound: false },
    { name: 'Single-Arm Cable Pushdown', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'triceps', secondary: [], compound: false },
    { name: 'JM Press', equipment: ['full-gym'], level: ['advanced'], primary: 'triceps', secondary: ['chest'], compound: true },
    { name: 'Tate Press', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'triceps', secondary: [], compound: false },
  ],

  // ---- QUADS ----
  quads: [
    { name: 'Barbell Back Squat', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'quads', secondary: ['glutes', 'hamstrings'], compound: true },
    { name: 'Goblet Squat', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate'], primary: 'quads', secondary: ['glutes'], compound: true },
    { name: 'Front Squat', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'quads', secondary: ['core', 'glutes'], compound: true },
    { name: 'Leg Press', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'quads', secondary: ['glutes'], compound: true },
    { name: 'Leg Extensions', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'quads', secondary: [], compound: false },
    { name: 'Bulgarian Split Squats', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'quads', secondary: ['glutes'], compound: true },
    { name: 'Walking Lunges', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'quads', secondary: ['glutes'], compound: true },
    { name: 'Bodyweight Squats', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate'], primary: 'quads', secondary: ['glutes'], compound: true },
    { name: 'Step-Ups', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'quads', secondary: ['glutes'], compound: true },
    { name: 'Hack Squat', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'quads', secondary: ['glutes'], compound: true },
    { name: 'Sissy Squats', equipment: ['bodyweight', 'home-gym', 'full-gym'], level: ['advanced'], primary: 'quads', secondary: [], compound: false },
    { name: 'Reverse Lunges', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'quads', secondary: ['glutes'], compound: true },
    { name: 'Dumbbell Lunges', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'quads', secondary: ['glutes'], compound: true },
    { name: 'Pistol Squats', equipment: ['bodyweight', 'home-gym', 'full-gym'], level: ['advanced'], primary: 'quads', secondary: ['glutes'], compound: true },
    { name: 'Box Squats', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'quads', secondary: ['glutes'], compound: true },
    { name: 'Belt Squats', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'quads', secondary: ['glutes'], compound: true },
    { name: 'Jump Squats', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'quads', secondary: ['glutes'], compound: true },
  ],

  // ---- HAMSTRINGS ----
  hamstrings: [
    { name: 'Romanian Deadlift', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'hamstrings', secondary: ['glutes', 'back'], compound: true },
    { name: 'Conventional Deadlift', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'hamstrings', secondary: ['back', 'glutes'], compound: true },
    { name: 'Leg Curls', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'hamstrings', secondary: [], compound: false },
    { name: 'Glute-Ham Raise', equipment: ['full-gym'], level: ['advanced'], primary: 'hamstrings', secondary: ['glutes'], compound: true },
    { name: 'Single-Leg Romanian Deadlift', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'hamstrings', secondary: ['glutes', 'core'], compound: true },
    { name: 'Good Mornings', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'hamstrings', secondary: ['back'], compound: true },
    { name: 'Nordic Hamstring Curl', equipment: ['bodyweight', 'home-gym', 'full-gym'], level: ['advanced'], primary: 'hamstrings', secondary: [], compound: false },
    { name: 'Stability Ball Hamstring Curl', equipment: ['home-gym', 'full-gym'], level: ['beginner', 'intermediate'], primary: 'hamstrings', secondary: ['glutes'], compound: false },
    { name: 'Seated Leg Curl', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'hamstrings', secondary: [], compound: false },
    { name: 'Deficit Deadlift', equipment: ['full-gym'], level: ['advanced'], primary: 'hamstrings', secondary: ['back', 'glutes'], compound: true },
    { name: 'Kettlebell Swings', equipment: ['home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'hamstrings', secondary: ['glutes'], compound: true },
  ],

  // ---- GLUTES ----
  glutes: [
    { name: 'Hip Thrusts', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'glutes', secondary: ['hamstrings'], compound: true },
    { name: 'Glute Bridge', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate'], primary: 'glutes', secondary: ['hamstrings'], compound: true },
    { name: 'Cable Pull-Through', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'glutes', secondary: ['hamstrings'], compound: true },
    { name: 'Sumo Deadlift', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'glutes', secondary: ['quads', 'hamstrings'], compound: true },
    { name: 'Kickbacks (Cable or Band)', equipment: ['home-gym', 'full-gym'], level: ['beginner', 'intermediate'], primary: 'glutes', secondary: [], compound: false },
    { name: 'Lateral Band Walks', equipment: ['home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'glutes', secondary: [], compound: false },
    { name: 'Single-Leg Glute Bridge', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate'], primary: 'glutes', secondary: ['hamstrings'], compound: true },
    { name: 'B-Stance Hip Thrust', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'glutes', secondary: ['hamstrings'], compound: true },
    { name: 'Curtsy Lunges', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate'], primary: 'glutes', secondary: ['quads'], compound: true },
    { name: 'Frog Pumps', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate'], primary: 'glutes', secondary: [], compound: false },
    { name: 'Step-Through Lunges', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'glutes', secondary: ['quads'], compound: true },
  ],

  // ---- CALVES ----
  calves: [
    { name: 'Standing Calf Raises', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'calves', secondary: [], compound: false },
    { name: 'Seated Calf Raises', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'calves', secondary: [], compound: false },
    { name: 'Single-Leg Calf Raise', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'calves', secondary: [], compound: false },
    { name: 'Donkey Calf Raises', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'calves', secondary: [], compound: false },
    { name: 'Leg Press Calf Raises', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'calves', secondary: [], compound: false },
    { name: 'Jump Rope', equipment: ['bodyweight', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'calves', secondary: [], compound: false },
  ],

  // ---- CORE ----
  core: [
    { name: 'Plank', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'core', secondary: [], compound: false },
    { name: 'Dead Bug', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate'], primary: 'core', secondary: [], compound: false },
    { name: 'Hanging Leg Raises', equipment: ['home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'core', secondary: [], compound: false },
    { name: 'Cable Woodchops', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'core', secondary: ['shoulders'], compound: false },
    { name: 'Ab Wheel Rollout', equipment: ['home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'core', secondary: [], compound: false },
    { name: 'Bicycle Crunches', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'core', secondary: [], compound: false },
    { name: 'Mountain Climbers', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'core', secondary: [], compound: false },
    { name: 'Russian Twists', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'core', secondary: [], compound: false },
    { name: 'Pallof Press', equipment: ['full-gym', 'home-gym'], level: ['intermediate', 'advanced'], primary: 'core', secondary: [], compound: false },
    { name: 'V-Ups', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'core', secondary: [], compound: false },
    { name: 'Side Plank', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'core', secondary: [], compound: false },
    { name: 'Hollow Body Hold', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'core', secondary: [], compound: false },
    { name: 'Toes-to-Bar', equipment: ['home-gym', 'full-gym'], level: ['advanced'], primary: 'core', secondary: [], compound: false },
    { name: 'Cable Crunches', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'core', secondary: [], compound: false },
    { name: 'Farmer Carry', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'core', secondary: ['traps'], compound: true },
    { name: 'Dragon Flag', equipment: ['home-gym', 'full-gym'], level: ['advanced'], primary: 'core', secondary: [], compound: false },
    { name: 'Bird Dog', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate'], primary: 'core', secondary: ['glutes'], compound: false },
    { name: 'Turkish Get-Up', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'core', secondary: ['shoulders', 'glutes'], compound: true },
    { name: 'Suitcase Carry', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'core', secondary: ['traps'], compound: true },
    { name: 'Overhead Carry', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'core', secondary: ['shoulders'], compound: true },
  ],

  // ---- CONDITIONING (cardio / metabolic / Hyrox / CrossFit) ----
  conditioning: [
    // Hyrox-style
    { name: 'Wall Balls', equipment: ['full-gym', 'home-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'conditioning', secondary: ['quads', 'shoulders'], compound: true, modality: 'metabolic' },
    { name: 'Sled Push', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'conditioning', secondary: ['quads', 'glutes'], compound: true, modality: 'metabolic' },
    { name: 'Sled Pull', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'conditioning', secondary: ['back', 'biceps'], compound: true, modality: 'metabolic' },
    { name: 'Sandbag Lunges', equipment: ['full-gym', 'home-gym'], level: ['intermediate', 'advanced'], primary: 'conditioning', secondary: ['quads', 'glutes'], compound: true, modality: 'metabolic' },
    { name: 'Farmer Carry (Heavy)', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'conditioning', secondary: ['core', 'traps'], compound: true, modality: 'metabolic' },
    { name: 'SkiErg Intervals', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'conditioning', secondary: ['back', 'shoulders'], compound: true, modality: 'cardio' },
    { name: 'Rowing Machine Intervals', equipment: ['full-gym', 'home-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'conditioning', secondary: ['back', 'quads'], compound: true, modality: 'cardio' },
    // CrossFit / functional
    { name: 'Thrusters', equipment: ['dumbbells', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'conditioning', secondary: ['quads', 'shoulders'], compound: true, modality: 'metabolic' },
    { name: 'Devil Press', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'conditioning', secondary: ['chest', 'shoulders', 'quads'], compound: true, modality: 'metabolic' },
    { name: 'Man-Makers', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['advanced'], primary: 'conditioning', secondary: ['chest', 'back', 'shoulders'], compound: true, modality: 'metabolic' },
    { name: 'Dumbbell Snatch', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'conditioning', secondary: ['shoulders', 'quads'], compound: true, modality: 'power' },
    { name: 'Kettlebell Clean & Press', equipment: ['home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'conditioning', secondary: ['shoulders', 'core'], compound: true, modality: 'power' },
    { name: 'Power Clean', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'conditioning', secondary: ['quads', 'back', 'shoulders'], compound: true, modality: 'power' },
    { name: 'Push Press', equipment: ['full-gym', 'dumbbells'], level: ['intermediate', 'advanced'], primary: 'conditioning', secondary: ['shoulders', 'quads'], compound: true, modality: 'power' },
    { name: 'Sumo Deadlift High Pull', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'conditioning', secondary: ['back', 'shoulders', 'quads'], compound: true, modality: 'power' },
    // Plyometric / explosive
    { name: 'Box Jumps', equipment: ['full-gym', 'home-gym'], level: ['intermediate', 'advanced'], primary: 'conditioning', secondary: ['quads', 'glutes'], compound: true, modality: 'plyometric' },
    { name: 'Burpee Box Jump-Overs', equipment: ['full-gym', 'home-gym'], level: ['advanced'], primary: 'conditioning', secondary: ['quads', 'chest'], compound: true, modality: 'plyometric' },
    { name: 'Broad Jumps', equipment: ['bodyweight', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'conditioning', secondary: ['quads', 'glutes'], compound: true, modality: 'plyometric' },
    { name: 'Split Squat Jumps', equipment: ['bodyweight', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'conditioning', secondary: ['quads', 'glutes'], compound: true, modality: 'plyometric' },
    { name: 'Med Ball Slams', equipment: ['full-gym', 'home-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'conditioning', secondary: ['core', 'shoulders'], compound: true, modality: 'metabolic' },
    { name: 'Med Ball Wall Throws', equipment: ['full-gym', 'home-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'conditioning', secondary: ['chest', 'core'], compound: true, modality: 'plyometric' },
    // Bodyweight cardio
    { name: 'Burpees', equipment: ['bodyweight', 'dumbbells', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'conditioning', secondary: ['chest', 'quads'], compound: true, modality: 'metabolic' },
    { name: 'Bear Crawls', equipment: ['bodyweight', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'conditioning', secondary: ['core', 'shoulders'], compound: true, modality: 'metabolic' },
    { name: 'Battle Ropes — Alternating Waves', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'conditioning', secondary: ['shoulders', 'core'], compound: true, modality: 'cardio' },
    { name: 'Battle Ropes — Double Slams', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'conditioning', secondary: ['shoulders', 'core'], compound: true, modality: 'cardio' },
    { name: 'Assault Bike Intervals', equipment: ['full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'conditioning', secondary: ['quads'], compound: true, modality: 'cardio' },
    // Kettlebell conditioning
    { name: 'Kettlebell Snatch', equipment: ['home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'conditioning', secondary: ['shoulders', 'hamstrings'], compound: true, modality: 'power' },
    { name: 'Kettlebell Goblet Squat to Press', equipment: ['home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'conditioning', secondary: ['quads', 'shoulders'], compound: true, modality: 'metabolic' },
    { name: 'Kettlebell Swings (American)', equipment: ['home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'conditioning', secondary: ['hamstrings', 'shoulders'], compound: true, modality: 'metabolic' },
    // Loaded carries
    { name: 'Sandbag Carry', equipment: ['full-gym', 'home-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'conditioning', secondary: ['core', 'quads'], compound: true, modality: 'metabolic' },
    { name: 'Front Rack Carry', equipment: ['dumbbells', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'conditioning', secondary: ['core', 'shoulders'], compound: true, modality: 'metabolic' },
    { name: 'Tire Flips', equipment: ['full-gym'], level: ['intermediate', 'advanced'], primary: 'conditioning', secondary: ['back', 'quads', 'glutes'], compound: true, modality: 'power' },
    // Jump rope variations
    { name: 'Jump Rope — Double Unders', equipment: ['bodyweight', 'home-gym', 'full-gym'], level: ['intermediate', 'advanced'], primary: 'conditioning', secondary: ['calves'], compound: true, modality: 'cardio' },
    { name: 'Jump Rope — High Knees', equipment: ['bodyweight', 'home-gym', 'full-gym'], level: ['beginner', 'intermediate', 'advanced'], primary: 'conditioning', secondary: ['calves', 'core'], compound: true, modality: 'cardio' },
  ],
};

// ============================= WARMUP / COOLDOWN TEMPLATES =================

const WARMUPS = {
  upper: [
    { exercise: 'Arm Circles (forward & backward)', duration: '30 seconds each direction' },
    { exercise: 'Band Pull-Aparts or Arm Swings', duration: '30 seconds' },
    { exercise: 'Cat-Cow Stretch', duration: '1 minute' },
    { exercise: 'Shoulder Pass-Throughs (band or towel)', duration: '30 seconds' },
    { exercise: 'Light Push-Ups', duration: '10 reps' },
  ],
  lower: [
    { exercise: 'Leg Swings (front-to-back)', duration: '30 seconds each leg' },
    { exercise: 'Leg Swings (side-to-side)', duration: '30 seconds each leg' },
    { exercise: 'Bodyweight Squats', duration: '10 reps' },
    { exercise: 'Hip Circles', duration: '30 seconds each direction' },
    { exercise: 'Walking Knee Hugs', duration: '1 minute' },
  ],
  full: [
    { exercise: 'Jumping Jacks or Light Jog in Place', duration: '2 minutes' },
    { exercise: 'Arm Circles', duration: '30 seconds' },
    { exercise: 'Leg Swings', duration: '30 seconds each leg' },
    { exercise: 'Bodyweight Squats', duration: '10 reps' },
    { exercise: 'Cat-Cow Stretch', duration: '1 minute' },
  ],
  cardio: [
    { exercise: 'Light Walk or Jog', duration: '3 minutes' },
    { exercise: 'Dynamic Leg Stretches', duration: '1 minute' },
    { exercise: 'Arm Swings', duration: '30 seconds' },
    { exercise: 'High Knees (gentle)', duration: '30 seconds' },
  ],
};

const COOLDOWNS = {
  upper: [
    { exercise: 'Chest Doorway Stretch', duration: '30 seconds each side' },
    { exercise: 'Cross-Body Shoulder Stretch', duration: '30 seconds each side' },
    { exercise: 'Tricep Stretch', duration: '30 seconds each arm' },
    { exercise: 'Child\'s Pose', duration: '1 minute' },
  ],
  lower: [
    { exercise: 'Standing Quad Stretch', duration: '30 seconds each leg' },
    { exercise: 'Hamstring Stretch (seated or standing)', duration: '30 seconds each leg' },
    { exercise: 'Pigeon Pose', duration: '45 seconds each side' },
    { exercise: 'Calf Stretch', duration: '30 seconds each side' },
  ],
  full: [
    { exercise: 'Full-Body Stretch Sequence', duration: '2 minutes' },
    { exercise: 'Hamstring Stretch', duration: '30 seconds each leg' },
    { exercise: 'Chest Stretch', duration: '30 seconds' },
    { exercise: 'Child\'s Pose', duration: '1 minute' },
    { exercise: 'Deep Breathing', duration: '1 minute' },
  ],
  cardio: [
    { exercise: 'Slow Walk Cool-Down', duration: '3 minutes' },
    { exercise: 'Standing Quad Stretch', duration: '30 seconds each leg' },
    { exercise: 'Standing Hamstring Stretch', duration: '30 seconds each leg' },
    { exercise: 'Deep Breathing', duration: '1 minute' },
  ],
};

// ============================= SPLIT PATTERNS ==============================

function getSplitPattern(experienceLevel, goals, daysAvailable, bodyType, gender) {
  const wantsFatLoss = goals.includes('lose-fat');
  const wantsAthleticism = goals.includes('athletic') || goals.includes('stay-active');
  const isFemale = (gender || '').toLowerCase() === 'female';

  // ---------- FEMALE SPLITS — glute/leg focus, upper body toning ----------
  if (isFemale) {
    if (wantsFatLoss) {
      return {
        days: [
          { day: 'Monday', focus: 'Glutes & Lower Burn', muscleGroups: ['glutes', 'hamstrings', 'quads', 'conditioning'], warmupType: 'lower', cooldownType: 'lower' },
          { day: 'Tuesday', focus: 'Upper Tone & Core', muscleGroups: ['shoulders', 'back', 'core', 'conditioning'], warmupType: 'upper', cooldownType: 'upper' },
          { day: 'Thursday', focus: 'Quad & Glute Circuit', muscleGroups: ['quads', 'glutes', 'conditioning', 'core'], warmupType: 'lower', cooldownType: 'cardio' },
          { day: 'Friday', focus: 'Full-Body Burn', muscleGroups: ['conditioning', 'glutes', 'shoulders', 'core'], warmupType: 'cardio', cooldownType: 'full' },
        ],
      };
    }
    // Female build/tone
    return {
      days: [
        { day: 'Monday', focus: 'Glutes & Hamstrings', muscleGroups: ['glutes', 'hamstrings', 'core', 'calves'], warmupType: 'lower', cooldownType: 'lower' },
        { day: 'Tuesday', focus: 'Upper Body Tone', muscleGroups: ['shoulders', 'back', 'triceps', 'biceps'], warmupType: 'upper', cooldownType: 'upper' },
        { day: 'Thursday', focus: 'Quads & Glutes', muscleGroups: ['quads', 'glutes', 'hamstrings', 'core'], warmupType: 'lower', cooldownType: 'lower' },
        { day: 'Friday', focus: 'Shoulders & Core', muscleGroups: ['shoulders', 'core', 'glutes', 'back'], warmupType: 'upper', cooldownType: 'full' },
      ],
    };
  }

  // ---------- LOSE-FAT track (metabolic, full-body, conditioning) ----------
  if (wantsFatLoss) {
    if (experienceLevel === 'beginner') {
      return {
        days: [
          { day: 'Monday', focus: 'Full-Body Burn', muscleGroups: ['quads', 'back', 'chest', 'conditioning'], warmupType: 'full', cooldownType: 'full' },
          { day: 'Wednesday', focus: 'Conditioning & Core', muscleGroups: ['conditioning', 'core', 'shoulders', 'glutes'], warmupType: 'cardio', cooldownType: 'cardio' },
          { day: 'Friday', focus: 'Total-Body Finisher', muscleGroups: ['back', 'quads', 'conditioning', 'core'], warmupType: 'full', cooldownType: 'full' },
        ],
      };
    }
    // Body-type-specific lean splits
    if (bodyType === 'ectomorph' || bodyType === 'ecto-mesomorph') {
      // Leaner builds: more strength-preserving, less pure cardio
      return {
        days: [
          { day: 'Monday', focus: 'Strength & Burn — Upper', muscleGroups: ['chest', 'back', 'shoulders', 'conditioning'], warmupType: 'upper', cooldownType: 'upper' },
          { day: 'Tuesday', focus: 'Strength & Burn — Lower', muscleGroups: ['quads', 'glutes', 'hamstrings', 'conditioning'], warmupType: 'lower', cooldownType: 'lower' },
          { day: 'Thursday', focus: 'Power Conditioning', muscleGroups: ['conditioning', 'back', 'quads', 'core'], warmupType: 'cardio', cooldownType: 'full' },
          { day: 'Friday', focus: 'Metabolic Finisher', muscleGroups: ['conditioning', 'shoulders', 'glutes', 'core'], warmupType: 'cardio', cooldownType: 'cardio' },
        ],
      };
    }
    if (bodyType === 'endomorph' || bodyType === 'endo-mesomorph') {
      // Broader builds: more conditioning volume, circuit-style
      return {
        days: [
          { day: 'Monday', focus: 'Upper Metabolic Circuit', muscleGroups: ['chest', 'back', 'conditioning', 'core'], warmupType: 'upper', cooldownType: 'upper' },
          { day: 'Tuesday', focus: 'Lower Metabolic Circuit', muscleGroups: ['quads', 'glutes', 'conditioning', 'hamstrings'], warmupType: 'lower', cooldownType: 'lower' },
          { day: 'Thursday', focus: 'Hyrox-Style Conditioning', muscleGroups: ['conditioning', 'conditioning', 'core', 'back'], warmupType: 'cardio', cooldownType: 'cardio' },
          { day: 'Friday', focus: 'Total-Body Burn', muscleGroups: ['conditioning', 'quads', 'shoulders', 'core'], warmupType: 'cardio', cooldownType: 'full' },
        ],
      };
    }
    // Default mesomorph lean
    return {
      days: [
        { day: 'Monday', focus: 'Upper Burn — Metabolic', muscleGroups: ['chest', 'back', 'shoulders', 'conditioning'], warmupType: 'upper', cooldownType: 'upper' },
        { day: 'Tuesday', focus: 'Lower Burn — Metabolic', muscleGroups: ['quads', 'glutes', 'hamstrings', 'conditioning'], warmupType: 'lower', cooldownType: 'lower' },
        { day: 'Thursday', focus: 'Full-Body HIIT Strength', muscleGroups: ['conditioning', 'back', 'quads', 'core'], warmupType: 'cardio', cooldownType: 'full' },
        { day: 'Friday', focus: 'Conditioning & Core', muscleGroups: ['conditioning', 'glutes', 'shoulders', 'core'], warmupType: 'cardio', cooldownType: 'cardio' },
      ],
    };
  }

  // ---------- ATHLETIC track ----------
  if (wantsAthleticism && experienceLevel !== 'beginner') {
    return {
      days: [
        { day: 'Monday', focus: 'Upper Body Power', muscleGroups: ['chest', 'back', 'shoulders', 'triceps', 'biceps'], warmupType: 'upper', cooldownType: 'upper' },
        { day: 'Tuesday', focus: 'Lower Body Power', muscleGroups: ['quads', 'hamstrings', 'glutes', 'calves', 'core'], warmupType: 'lower', cooldownType: 'lower' },
        { day: 'Thursday', focus: 'Upper Endurance', muscleGroups: ['chest', 'back', 'shoulders', 'biceps', 'core'], warmupType: 'upper', cooldownType: 'upper' },
        { day: 'Friday', focus: 'Lower Conditioning', muscleGroups: ['quads', 'hamstrings', 'glutes', 'calves', 'core'], warmupType: 'lower', cooldownType: 'lower' },
      ],
    };
  }

  // ---------- BUILD-MUSCLE track (hypertrophy split) ----------
  if (experienceLevel === 'beginner') {
    return {
      days: [
        { day: 'Monday', focus: 'Full Body — Push Emphasis', muscleGroups: ['chest', 'shoulders', 'triceps', 'quads', 'core'], warmupType: 'full', cooldownType: 'full' },
        { day: 'Wednesday', focus: 'Full Body — Pull Emphasis', muscleGroups: ['back', 'biceps', 'hamstrings', 'glutes', 'core'], warmupType: 'full', cooldownType: 'full' },
        { day: 'Friday', focus: 'Full Body — Leg Emphasis', muscleGroups: ['quads', 'glutes', 'back', 'shoulders', 'core'], warmupType: 'full', cooldownType: 'full' },
      ],
    };
  }

  // Body-type-specific muscle splits for intermediate+
  if (bodyType === 'ectomorph') {
    // Ectomorphs: Upper/Lower for higher frequency per muscle, heavy compounds
    if (experienceLevel === 'intermediate') {
      return {
        days: [
          { day: 'Monday', focus: 'Upper Body — Strength', muscleGroups: ['chest', 'back', 'shoulders', 'triceps'], warmupType: 'upper', cooldownType: 'upper' },
          { day: 'Tuesday', focus: 'Lower Body — Strength', muscleGroups: ['quads', 'hamstrings', 'glutes', 'calves'], warmupType: 'lower', cooldownType: 'lower' },
          { day: 'Thursday', focus: 'Upper Body — Volume', muscleGroups: ['back', 'chest', 'biceps', 'shoulders'], warmupType: 'upper', cooldownType: 'upper' },
          { day: 'Friday', focus: 'Lower Body — Volume', muscleGroups: ['glutes', 'quads', 'hamstrings', 'core'], warmupType: 'lower', cooldownType: 'lower' },
        ],
      };
    }
    return {
      days: [
        { day: 'Monday', focus: 'Upper Power', muscleGroups: ['chest', 'back', 'shoulders', 'triceps'], warmupType: 'upper', cooldownType: 'upper' },
        { day: 'Tuesday', focus: 'Lower Power', muscleGroups: ['quads', 'hamstrings', 'glutes', 'calves'], warmupType: 'lower', cooldownType: 'lower' },
        { day: 'Thursday', focus: 'Upper Hypertrophy', muscleGroups: ['back', 'chest', 'biceps', 'shoulders'], warmupType: 'upper', cooldownType: 'upper' },
        { day: 'Friday', focus: 'Lower Hypertrophy', muscleGroups: ['glutes', 'quads', 'hamstrings', 'core'], warmupType: 'lower', cooldownType: 'lower' },
      ],
    };
  }

  if (bodyType === 'endomorph') {
    // Endomorphs: higher volume split with metabolic component
    if (experienceLevel === 'intermediate') {
      return {
        days: [
          { day: 'Monday', focus: 'Push — Chest & Shoulders', muscleGroups: ['chest', 'shoulders', 'triceps', 'core'], warmupType: 'upper', cooldownType: 'upper' },
          { day: 'Tuesday', focus: 'Pull — Back & Arms', muscleGroups: ['back', 'biceps', 'core'], warmupType: 'upper', cooldownType: 'upper' },
          { day: 'Thursday', focus: 'Legs — Compound Focus', muscleGroups: ['quads', 'glutes', 'hamstrings', 'calves'], warmupType: 'lower', cooldownType: 'lower' },
          { day: 'Friday', focus: 'Full Body — Pump & Burn', muscleGroups: ['shoulders', 'back', 'quads', 'core'], warmupType: 'full', cooldownType: 'full' },
        ],
      };
    }
    return {
      days: [
        { day: 'Monday', focus: 'Chest & Triceps — Volume', muscleGroups: ['chest', 'triceps', 'core'], warmupType: 'upper', cooldownType: 'upper' },
        { day: 'Tuesday', focus: 'Back & Biceps — Volume', muscleGroups: ['back', 'biceps'], warmupType: 'upper', cooldownType: 'upper' },
        { day: 'Wednesday', focus: 'Legs — Quad & Glute', muscleGroups: ['quads', 'glutes', 'calves', 'core'], warmupType: 'lower', cooldownType: 'lower' },
        { day: 'Thursday', focus: 'Shoulders & Arms Pump', muscleGroups: ['shoulders', 'biceps', 'triceps'], warmupType: 'upper', cooldownType: 'upper' },
        { day: 'Friday', focus: 'Posterior Chain & Core', muscleGroups: ['hamstrings', 'glutes', 'back', 'core'], warmupType: 'lower', cooldownType: 'lower' },
      ],
    };
  }

  if (bodyType === 'ecto-mesomorph') {
    // Lean-athletic: V-taper emphasis
    return {
      days: [
        { day: 'Monday', focus: 'Chest & Back — Supersets', muscleGroups: ['chest', 'back', 'core'], warmupType: 'upper', cooldownType: 'upper' },
        { day: 'Tuesday', focus: 'Legs — Power & Size', muscleGroups: ['quads', 'hamstrings', 'glutes', 'calves'], warmupType: 'lower', cooldownType: 'lower' },
        { day: 'Thursday', focus: 'Shoulders & Arms — V-Taper', muscleGroups: ['shoulders', 'biceps', 'triceps', 'core'], warmupType: 'upper', cooldownType: 'upper' },
        { day: 'Friday', focus: 'Back & Posterior Chain', muscleGroups: ['back', 'hamstrings', 'glutes', 'core'], warmupType: 'full', cooldownType: 'full' },
      ],
    };
  }

  if (bodyType === 'endo-mesomorph') {
    // Powerful build: strength-focused with high volume
    return {
      days: [
        { day: 'Monday', focus: 'Push — Heavy', muscleGroups: ['chest', 'shoulders', 'triceps'], warmupType: 'upper', cooldownType: 'upper' },
        { day: 'Tuesday', focus: 'Pull — Heavy', muscleGroups: ['back', 'biceps', 'core'], warmupType: 'upper', cooldownType: 'upper' },
        { day: 'Thursday', focus: 'Legs — Strength', muscleGroups: ['quads', 'glutes', 'hamstrings', 'calves'], warmupType: 'lower', cooldownType: 'lower' },
        { day: 'Friday', focus: 'Upper Body Hypertrophy', muscleGroups: ['shoulders', 'chest', 'back', 'core'], warmupType: 'upper', cooldownType: 'upper' },
      ],
    };
  }

  // Default mesomorph muscle
  if (experienceLevel === 'intermediate') {
    return {
      days: [
        { day: 'Monday', focus: 'Push — Chest, Shoulders, Triceps', muscleGroups: ['chest', 'shoulders', 'triceps'], warmupType: 'upper', cooldownType: 'upper' },
        { day: 'Tuesday', focus: 'Pull — Back, Biceps', muscleGroups: ['back', 'biceps', 'core'], warmupType: 'upper', cooldownType: 'upper' },
        { day: 'Thursday', focus: 'Legs — Quad & Glute Focus', muscleGroups: ['quads', 'glutes', 'hamstrings', 'calves'], warmupType: 'lower', cooldownType: 'lower' },
        { day: 'Friday', focus: 'Arms & Shoulders Hypertrophy', muscleGroups: ['shoulders', 'biceps', 'triceps', 'core'], warmupType: 'upper', cooldownType: 'upper' },
      ],
    };
  }

  // advanced mesomorph
  return {
    days: [
      { day: 'Monday', focus: 'Chest & Triceps', muscleGroups: ['chest', 'triceps', 'core'], warmupType: 'upper', cooldownType: 'upper' },
      { day: 'Tuesday', focus: 'Back & Biceps', muscleGroups: ['back', 'biceps'], warmupType: 'upper', cooldownType: 'upper' },
      { day: 'Wednesday', focus: 'Legs (Quad Focus)', muscleGroups: ['quads', 'glutes', 'calves', 'core'], warmupType: 'lower', cooldownType: 'lower' },
      { day: 'Thursday', focus: 'Shoulders & Arms', muscleGroups: ['shoulders', 'biceps', 'triceps'], warmupType: 'upper', cooldownType: 'upper' },
      { day: 'Friday', focus: 'Legs — Posterior Chain', muscleGroups: ['hamstrings', 'glutes', 'calves', 'core'], warmupType: 'lower', cooldownType: 'lower' },
    ],
  };
}

// Returns a per-muscle "track" to shift exercise selection by goal, giving the
// two goals visibly different exercise picks on top of the different splits.
function getGoalExerciseBias(goals) {
  if (goals.includes('lose-fat')) {
    return {
      preferCompound: true,      // compounds burn more calories
      preferBodyweight: true,    // keeps tempo up, minimal setup
      avoid: ['Pec Deck Machine', 'Leg Extensions', 'Concentration Curls', 'Cable Curls'],
    };
  }
  if (goals.includes('build-muscle')) {
    return {
      preferIsolation: true,     // squeeze and pump work for hypertrophy
      preferHeavy: true,
      avoid: ['Mountain Climbers', 'Bicycle Crunches', 'Jumping Jacks'],
    };
  }
  return { avoid: [] };
}

// Signature exercises per body type — these get a big boost in the sort so
// the routines actually feel distinct across the five somatotypes. The idea
// is that each archetype has a "hero lift" mix that matches its leverages.
const BODY_TYPE_SIGNATURES = {
  ectomorph: {
    // Long-limbed lean build: heavy compound pulls and presses for mass.
    priorityMuscles: ['back', 'quads', 'chest'],
    signatureLifts: [
      'Conventional Deadlift', 'Barbell Bench Press', 'Barbell Back Squat',
      'Pull-Ups', 'Overhead Barbell Press', 'Romanian Deadlift',
      // Conditioning: power-oriented
      'Power Clean', 'Dumbbell Snatch', 'Kettlebell Clean & Press',
    ],
    conditioningPrefer: ['power', 'plyometric'],
    avoid: ['Cable Flyes', 'Pec Deck Machine', 'Leg Extensions', 'Tricep Kickbacks'],
  },
  mesomorph: {
    // Athletic responder: blend of power + hypertrophy with dumbbell work.
    priorityMuscles: ['chest', 'shoulders', 'back'],
    signatureLifts: [
      'Incline Dumbbell Press', 'Dumbbell Single-Arm Row', 'Dumbbell Shoulder Press',
      'Bulgarian Split Squats', 'Chin-Ups', 'Arnold Press',
      // Conditioning: balanced mix
      'Thrusters', 'Box Jumps', 'Devil Press',
    ],
    conditioningPrefer: ['metabolic', 'plyometric'],
    avoid: [],
  },
  endomorph: {
    // Broader build: metabolic, circuit-friendly movements and posterior chain.
    priorityMuscles: ['back', 'glutes', 'hamstrings'],
    signatureLifts: [
      'Goblet Squat', 'Hip Thrusts', 'Romanian Deadlift', 'Lat Pulldown',
      'Walking Lunges', 'Cable Pull-Through', 'Seated Cable Row',
      // Conditioning: high-calorie burn, Hyrox-style
      'Wall Balls', 'Sled Push', 'Battle Ropes — Alternating Waves',
      'Rowing Machine Intervals', 'Assault Bike Intervals', 'Burpees',
    ],
    conditioningPrefer: ['metabolic', 'cardio'],
    avoid: ['Conventional Deadlift', 'Barbell Back Squat'],
  },
  'ecto-mesomorph': {
    // Lean-athletic: V-taper work + compound-dominant strength.
    priorityMuscles: ['shoulders', 'back', 'chest'],
    signatureLifts: [
      'Pull-Ups', 'Incline Barbell Press', 'Lateral Raises', 'Barbell Bent-Over Row',
      'Dumbbell Shoulder Press', 'Front Squat',
      // Conditioning: explosive, athletic
      'Kettlebell Snatch', 'Box Jumps', 'Med Ball Slams', 'Push Press',
    ],
    conditioningPrefer: ['power', 'plyometric'],
    avoid: ['Bench Dips', 'Upright Rows'],
  },
  'endo-mesomorph': {
    // Powerful + dense: moderate-rep compounds with metabolic finishers.
    priorityMuscles: ['back', 'quads', 'glutes'],
    signatureLifts: [
      'Sumo Deadlift', 'T-Bar Row', 'Hack Squat', 'Cable Pull-Through',
      'Hip Thrusts', 'Landmine Press', 'Seated Cable Row',
      // Conditioning: Hyrox / loaded carries
      'Sled Push', 'Sled Pull', 'Farmer Carry (Heavy)', 'Sandbag Carry',
      'Tire Flips', 'Battle Ropes — Double Slams',
    ],
    conditioningPrefer: ['metabolic', 'power'],
    avoid: ['Conventional Deadlift'],
  },
};

function getBodyTypeBias(bodyType) {
  return BODY_TYPE_SIGNATURES[bodyType] || BODY_TYPE_SIGNATURES.mesomorph;
}

// ============================= BODY-TYPE STRATEGY ==========================

/**
 * Returns training strategy adjustments based on somatotype.
 */
function getBodyTypeStrategy(bodyType, goals) {
  const strategies = {
    ectomorph: {
      repRange: { min: 6, max: 10 },
      setsPerExercise: { min: 3, max: 4 },
      restSeconds: { min: 90, max: 150 },
      tempo: '3-1-2-0',
      priorityMuscles: ['back', 'quads', 'glutes', 'chest'],
      avoidExcess: ['core'],
      notes: 'Focus on progressive overload with heavier loads and longer rest to maximise muscle-building stimulus.',
      nutritionBias: 'caloric-surplus',
    },
    mesomorph: {
      repRange: { min: 8, max: 12 },
      setsPerExercise: { min: 3, max: 4 },
      restSeconds: { min: 60, max: 90 },
      tempo: '2-1-2-0',
      priorityMuscles: ['chest', 'back', 'shoulders', 'quads'],
      avoidExcess: [],
      notes: 'Your body responds well to moderate volume; vary rep ranges across the week for balanced development.',
      nutritionBias: 'balanced',
    },
    endomorph: {
      repRange: { min: 10, max: 15 },
      setsPerExercise: { min: 3, max: 4 },
      restSeconds: { min: 45, max: 75 },
      tempo: '2-0-2-0',
      priorityMuscles: ['back', 'quads', 'glutes', 'hamstrings'],
      avoidExcess: [],
      notes: 'Shorter rest periods and higher reps to keep heart rate elevated. Supersets recommended where possible.',
      nutritionBias: 'caloric-deficit',
    },
    'ecto-mesomorph': {
      repRange: { min: 8, max: 12 },
      setsPerExercise: { min: 3, max: 4 },
      restSeconds: { min: 75, max: 120 },
      tempo: '3-1-2-0',
      priorityMuscles: ['chest', 'back', 'shoulders', 'quads'],
      avoidExcess: [],
      notes: 'Blend of hypertrophy and strength work; compound lifts are your best friend for filling out your frame.',
      nutritionBias: 'slight-surplus',
    },
    'endo-mesomorph': {
      repRange: { min: 10, max: 14 },
      setsPerExercise: { min: 3, max: 4 },
      restSeconds: { min: 60, max: 90 },
      tempo: '2-0-2-0',
      priorityMuscles: ['back', 'quads', 'glutes', 'shoulders'],
      avoidExcess: [],
      notes: 'Moderate-to-high reps with controlled rest. Include metabolic finishers on leg days.',
      nutritionBias: 'slight-deficit',
    },
  };

  const strategy = strategies[bodyType] || strategies.mesomorph;

  // Adjust for goals
  if (goals.includes('lose-fat')) {
    strategy.repRange.min = Math.max(strategy.repRange.min, 10);
    strategy.repRange.max = Math.max(strategy.repRange.max, 15);
    strategy.restSeconds.min = Math.max(30, strategy.restSeconds.min - 15);
    strategy.restSeconds.max = Math.max(45, strategy.restSeconds.max - 15);
    strategy.nutritionBias = 'caloric-deficit';
  }
  if (goals.includes('build-muscle')) {
    strategy.repRange.min = Math.min(strategy.repRange.min, 8);
    strategy.repRange.max = Math.min(strategy.repRange.max, 12);
    strategy.setsPerExercise.max = 4;
  }
  if (goals.includes('athletic')) {
    strategy.tempo = '2-0-X-0'; // explosive concentric
    strategy.restSeconds.min = Math.max(60, strategy.restSeconds.min);
  }

  return strategy;
}

// ============================= PROPORTION ANALYSIS =========================

/**
 * Analyses body metrics and returns exercise selection biases plus
 * justification strings for the whyThisExercise field.
 */
function analyseProportions(metrics, frameSize, gender) {
  const insights = [];
  const biases = { prioritise: [], avoid: [], notes: [] };

  if (!metrics) return { insights, biases };

  // Shoulder-to-hip ratio
  const shr = metrics.shoulderToHipRatio;
  if (shr !== undefined) {
    if (shr < 1.3) {
      insights.push('narrower shoulder-to-hip ratio');
      biases.prioritise.push('shoulders');
      biases.notes.push('shoulder-width exercises to broaden your frame');
    } else if (shr > 1.55) {
      insights.push('wide shoulders relative to hips');
      biases.prioritise.push('glutes', 'quads');
      biases.notes.push('lower-body emphasis to balance your wide upper body');
    }
  }

  // Torso-to-leg ratio
  const tlr = metrics.torsoToLegRatio;
  if (tlr !== undefined) {
    if (tlr > 1.05) {
      insights.push('longer torso relative to legs');
      biases.prioritise.push('quads', 'hamstrings', 'calves');
      biases.notes.push('leg development to balance a longer torso');
    } else if (tlr < 0.85) {
      insights.push('longer legs relative to torso');
      biases.prioritise.push('chest', 'back', 'shoulders');
      biases.notes.push('upper-body work to complement your longer legs');
    }
  }

  // Limb-to-torso ratio
  const ltr = metrics.limbToTorsoRatio;
  if (ltr !== undefined) {
    if (ltr > 1.1) {
      insights.push('longer limbs');
      biases.notes.push('longer range of motion suits DB/cable work over barbell for comfort');
    } else if (ltr < 0.85) {
      insights.push('shorter limbs relative to torso');
      biases.notes.push('mechanical advantage on pressing movements -- push those heavy compounds');
    }
  }

  // Frame size
  if (frameSize === 'Small') {
    biases.notes.push('smaller frame benefits from width-building exercises (lateral raises, wide-grip rows)');
    biases.prioritise.push('shoulders');
  } else if (frameSize === 'Large') {
    biases.notes.push('larger frame supports heavier compound lifts -- use that base to your advantage');
  }

  // Gender-aware glute/posterior priority
  if ((gender || '').toLowerCase() === 'female') {
    biases.prioritise.push('glutes', 'hamstrings');
  }

  return { insights, biases };
}

// ============================= SEEDED SHUFFLE ==============================

/**
 * Simple deterministic hash from body metrics — produces a float in [0, 1).
 * Two people with even slightly different proportions get a different seed,
 * but the same person always gets the same seed (so QR regeneration works).
 */
function metricsSeed(metrics, salt = 0) {
  const shr = metrics?.shoulderToHipRatio || 1.3;
  const ltr = metrics?.limbToTorsoRatio || 0.95;
  const tlr = metrics?.torsoToLegRatio || 0.9;
  // Multiply by primes + mix in salt so two scans of the same person differ.
  // Salt is a timestamp (e.g. 1718123456789). We reduce it to a small float
  // via golden ratio fractional hash, then add it in.
  const saltFloat = salt ? ((salt * 0.6180339887) % 1) : 0;
  const raw = (shr * 7919 + ltr * 6271 + tlr * 5381 + saltFloat * 9973);
  return raw - Math.floor(raw); // 0..1
}

/**
 * Deterministic Fisher-Yates shuffle using a simple linear-congruential PRNG
 * seeded from body metrics. This ensures two people with the same body type
 * but different proportions get a visibly different exercise order.
 */
function seededShuffle(arr, seed) {
  const a = arr.slice(); // don't mutate original
  let s = Math.floor(seed * 2147483647) || 1;
  const next = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================= EXERCISE SELECTION ==========================

/**
 * Filter exercises from the DB that are compatible with the user's equipment
 * and experience level.
 */
function getAvailableExercises(muscleGroup, equipment, level) {
  const pool = EXERCISES[muscleGroup] || [];
  return pool.filter((ex) => {
    const equipOk = ex.equipment.some((e) => equipment.includes(e));
    const levelOk = ex.level.includes(level);
    return equipOk && levelOk;
  });
}

/**
 * Deterministically pick exercises for a muscle group, respecting priority
 * bias and avoiding duplicates within a workout day.
 */
function selectExercises(muscleGroup, count, equipment, level, usedNames, priorityBias, goalBias = {}, bodyBias = {}, seed = 0.5) {
  let pool = getAvailableExercises(muscleGroup, equipment, level);

  // Remove already-used exercises + anything the goal or body type avoids
  const avoidSet = new Set([...(goalBias.avoid || []), ...(bodyBias.avoid || [])]);
  pool = pool.filter((e) => !usedNames.has(e.name) && !avoidSet.has(e.name));

  // Shuffle the pool using the person's unique metric seed — two people with
  // the same body type but different proportions get a different base order.
  pool = seededShuffle(pool, seed);

  const signatures = new Set(bodyBias.signatureLifts || []);
  const bodyPriority = bodyBias.priorityMuscles || [];
  const conditioningPrefer = new Set(bodyBias.conditioningPrefer || []);

  // Score each exercise with a small seed-derived offset (0–3 points).
  // Signature lifts (+12) still dominate, but exercises within a similar
  // tier (±3 points) will swap positions per person → visible variety.
  let prng = Math.floor(seed * 2147483647) || 1;
  const nextFloat = () => { prng = (prng * 16807) % 2147483647; return (prng - 1) / 2147483646; };

  const scored = pool.map((ex) => {
    let s = 0;
    if (signatures.has(ex.name)) s += 12;
    if (bodyPriority.includes(ex.primary)) s += 4;
    if (priorityBias.includes(ex.primary)) s += 6;
    if (ex.modality && conditioningPrefer.has(ex.modality)) s += 6;
    if (goalBias.preferCompound && ex.compound) s += 5;
    if (goalBias.preferIsolation && !ex.compound) s += 3;
    if (goalBias.preferHeavy && ex.compound) s += 3;
    if (goalBias.preferBodyweight && ex.equipment.includes('bodyweight')) s += 2;
    if (ex.compound) s += 1;
    // Per-person jitter: up to 3 points of noise so same-tier exercises shuffle
    s += nextFloat() * 3;
    return { ex, s };
  });
  scored.sort((a, b) => b.s - a.s);

  const selected = scored.slice(0, count).map((item) => item.ex);
  selected.forEach((e) => usedNames.add(e.name));
  return selected;
}

// ============================= WHY-THIS-EXERCISE GENERATOR ================

function buildWhyExercise(exercise, proportionInsights, biasNotes, bodyType, goals) {
  const parts = [];

  // Proportion-based reasoning
  if (biasNotes.length > 0) {
    const relevant = biasNotes.find((n) =>
      n.toLowerCase().includes(exercise.primary) ||
      (exercise.secondary && exercise.secondary.some((s) => n.toLowerCase().includes(s)))
    );
    if (relevant) {
      parts.push(`Selected because your proportions suggest ${relevant}.`);
    }
  }

  if (proportionInsights.length > 0 && parts.length === 0) {
    parts.push(`With your ${proportionInsights.join(' and ')}, this exercise helps create balanced development.`);
  }

  // Compound / isolation reasoning
  if (exercise.compound) {
    parts.push('Compound movement that recruits multiple muscle groups for efficient stimulus.');
  } else {
    parts.push('Isolation movement to target and refine this specific area.');
  }

  // Body-type reasoning
  const typeDescriptions = {
    ectomorph: 'As an ectomorph, heavier compound lifts with controlled tempo maximize your growth potential.',
    mesomorph: 'Your mesomorph build responds well to moderate volume; this hits the sweet spot.',
    endomorph: 'Higher rep work with shorter rest keeps metabolic demand elevated for your body type.',
    'ecto-mesomorph': 'Your lean-athletic build benefits from a blend of strength and hypertrophy.',
    'endo-mesomorph': 'Moderate-to-high volume with controlled rest leverages your natural strength while managing body composition.',
  };
  if (typeDescriptions[bodyType] && parts.length < 2) {
    parts.push(typeDescriptions[bodyType]);
  }

  // Goal-specific
  if (goals.includes('lose-fat') && exercise.compound) {
    parts.push('Compound lifts burn more calories, supporting your fat-loss goal.');
  }
  if (goals.includes('build-muscle') && !exercise.compound) {
    parts.push('Isolation work ensures the target muscle gets full stimulation for growth.');
  }

  return parts.join(' ') || 'A well-rounded exercise choice for your profile.';
}

// ============================= EXERCISE COUNT PER GROUP ====================

// Target per-day exercise counts — tuned to land in 6-9 total exercises/day.
// Formula: (focus groups × focusCount) + (accessory groups × accessoryCount).
// Most splits have 3-5 muscle groups, so:
//   beginner     → 2 focus + 1 accessory × N ≈ 6 exercises
//   intermediate → 3 focus + 1 accessory × N ≈ 7-8 exercises
//   advanced     → 3 focus + 2 accessory × N ≈ 8-9 exercises
function exercisesPerGroup(muscleGroup, isFocusGroup, level) {
  if (isFocusGroup) {
    if (level === 'beginner') return 2;
    if (level === 'intermediate') return 3;
    return 3;
  }
  if (level === 'beginner') return 1;
  if (level === 'intermediate') return 1;
  return 2;
}

// ============================= NUTRITION TIPS ==============================

function buildNutritionTips(bodyType, goals, gender) {
  const tips = [];

  const biasMap = {
    'caloric-surplus': [
      'Aim for a caloric surplus of 300-500 kcal above maintenance to support muscle growth.',
      'Prioritise protein intake: target 1.6-2.2 g per kg of bodyweight daily.',
      'Eat a protein-rich meal within 2 hours post-workout for optimal recovery.',
      'Include calorie-dense whole foods: nuts, avocados, olive oil, and whole grains.',
    ],
    'slight-surplus': [
      'Eat at a modest surplus of 200-300 kcal above maintenance.',
      'Prioritise protein intake: 1.6-2.0 g per kg of bodyweight daily.',
      'Focus on nutrient-dense foods rather than empty calories.',
    ],
    'balanced': [
      'Eat at maintenance or a slight surplus depending on the training phase.',
      'Protein target: 1.6-2.0 g per kg of bodyweight daily.',
      'Balance macros roughly 30% protein, 40% carbs, 30% fats as a starting point.',
    ],
    'slight-deficit': [
      'Eat at a modest deficit of 200-300 kcal below maintenance.',
      'Keep protein high (2.0-2.4 g per kg) to preserve muscle in a deficit.',
      'Prioritise fibrous vegetables and lean proteins to stay satiated.',
    ],
    'caloric-deficit': [
      'Aim for a moderate caloric deficit of 400-600 kcal below maintenance.',
      'Keep protein high (2.0-2.4 g per kg) to preserve muscle mass while losing fat.',
      'Prioritise whole foods, vegetables, and lean proteins for satiety.',
      'Consider time-restricted eating (e.g. 16:8) if it suits your lifestyle.',
    ],
  };

  const strategy = getBodyTypeStrategy(bodyType, goals);
  const bias = strategy.nutritionBias;
  tips.push(...(biasMap[bias] || biasMap.balanced));

  // Universal tips
  tips.push('Stay hydrated: aim for at least 2-3 litres of water daily, more on training days.');
  tips.push('Prioritise sleep (7-9 hours) -- it is the most underrated recovery tool.');

  if (goals.includes('athletic')) {
    tips.push('Include complex carbs (oats, rice, sweet potatoes) 1-2 hours before training for sustained energy.');
  }

  return tips;
}

// ============================= WEEKLY PROGRESSION ==========================

function buildProgressionPlan(level, bodyType, goals) {
  if (level === 'beginner') {
    return 'Week-over-week, aim to add 1-2 reps per set or increase weight by the smallest increment available once you hit the top of the rep range on all sets. Track your weights in a notebook or app. Beginners often see rapid strength gains -- trust the process and prioritise form over load.';
  }
  if (level === 'intermediate') {
    return 'Follow a double-progression model: work within the prescribed rep range and once you can complete all sets at the top of the range with good form, increase the weight by 2-5% next session. Deload every 4-6 weeks by reducing volume or intensity by 40% for one week.';
  }
  return 'Use a periodised approach: alternate between accumulation weeks (higher reps, moderate load) and intensification weeks (lower reps, heavier load) in 3-week blocks. Incorporate RPE-based autoregulation -- aim for RPE 7-8 on working sets and RPE 9-10 only on peak sets. Deload every 4th week.';
}

// ============================= SESSION DURATION ============================

function estimateSessionDuration(exerciseCount, strategy, level) {
  const avgSets = (strategy.setsPerExercise.min + strategy.setsPerExercise.max) / 2;
  const avgRest = (strategy.restSeconds.min + strategy.restSeconds.max) / 2;
  const timePerSet = 40; // seconds for actual lifting
  const warmupMinutes = 5;
  const cooldownMinutes = 5;
  const exerciseTransition = 60; // seconds between exercises

  const workingMinutes =
    (exerciseCount * avgSets * (timePerSet + avgRest) + exerciseCount * exerciseTransition) / 60;
  const total = Math.round(warmupMinutes + workingMinutes + cooldownMinutes);
  return `${total}-${total + 10} minutes`;
}

// ============================= INJURY FILTER ===============================

const INJURY_KEYWORD_MAP = {
  shoulder: ['Overhead Barbell Press', 'Upright Rows', 'Behind-the-Neck Press', 'Handstand Push-Ups (Wall)'],
  knee: ['Barbell Back Squat', 'Leg Extensions', 'Sissy Squats', 'Hack Squat', 'Walking Lunges'],
  back: ['Conventional Deadlift', 'Good Mornings', 'Barbell Bent-Over Row', 'T-Bar Row'],
  wrist: ['Barbell Bench Press', 'Barbell Curls', 'Overhead Barbell Press', 'Front Squat'],
  hip: ['Sumo Deadlift', 'Bulgarian Split Squats', 'Conventional Deadlift'],
  elbow: ['Skull Crushers', 'Close-Grip Bench Press', 'Barbell Curls'],
  neck: ['Overhead Barbell Press', 'Upright Rows'],
  ankle: ['Barbell Back Squat', 'Walking Lunges', 'Sissy Squats'],
};

function getInjuryExclusions(injuryString) {
  if (!injuryString || injuryString.trim() === '') return new Set();
  const lower = injuryString.toLowerCase();
  const excluded = new Set();
  for (const [keyword, exercises] of Object.entries(INJURY_KEYWORD_MAP)) {
    if (lower.includes(keyword)) {
      exercises.forEach((e) => excluded.add(e));
    }
  }
  return excluded;
}

// ============================= MAIN GENERATOR ==============================

/**
 * Generates a fully personalised workout routine locally.
 *
 * @param {object} userInfo
 * @param {object} analysisData
 * @returns {Promise<object>} The routine in the standard JSON shape.
 */
export async function generateLocalRoutine(userInfo, analysisData) {
  // ---- Unpack inputs with safe defaults ----
  const bodyType = analysisData?.bodyType || 'mesomorph';
  const frameSize = analysisData?.frameSize || 'Medium';
  const metrics = analysisData?.bodyMetrics || analysisData?.metrics || {};
  const proportionalNotes = analysisData?.proportionalNotes || [];
  const goals = userInfo?.fitnessGoals?.length ? userInfo.fitnessGoals : ['stay-active'];
  const level = userInfo?.experienceLevel || 'beginner';
  const equipment = userInfo?.equipment?.length ? userInfo.equipment : ['bodyweight'];
  const injuries = userInfo?.injuries || '';
  const gender = userInfo?.gender || 'Other';

  // Normalize body type — booth passes display name ("Ecto-Mesomorph"),
  // our lookup tables use lowercased hyphenated keys ("ecto-mesomorph").
  const btKey = (bodyType || '').toLowerCase().replace(/\s+/g, '-');

  // ---- Derive strategies ----
  const strategy = getBodyTypeStrategy(btKey, goals);
  const { insights, biases } = analyseProportions(metrics, frameSize, gender);
  const split = getSplitPattern(level, goals, 4, btKey, gender);
  const goalBias = getGoalExerciseBias(goals);
  const bodyBias = getBodyTypeBias(btKey);
  const injuryExclusions = getInjuryExclusions(injuries);
  const salt = analysisData?.salt || analysisData?.routineSalt || 0;
  const seed = metricsSeed(metrics, salt);

  // Merge proportional notes into insights for richer whyThisExercise text
  const allInsights = [...insights, ...proportionalNotes.map((n) => n.toLowerCase())];

  // ---- Build each day ----
  const weeklySchedule = split.days.map((dayPlan) => {
    const usedNames = new Set(injuryExclusions); // pre-seed exclusions
    const dayExercises = [];

    dayPlan.muscleGroups.forEach((mg, idx) => {
      const isFocus = idx < 2; // first two groups are the focus
      const count = exercisesPerGroup(mg, isFocus, level);
      const selected = selectExercises(mg, count, equipment, level, usedNames, biases.prioritise, goalBias, bodyBias, seed);

      selected.forEach((ex) => {
        // Conditioning exercises get interval/time-based formatting
        if (mg === 'conditioning' || ex.primary === 'conditioning') {
          const isCardio = ex.modality === 'cardio';
          const isPlyometric = ex.modality === 'plyometric';
          dayExercises.push({
            name: ex.name,
            sets: isCardio ? 3 : isPlyometric ? 4 : 3,
            reps: isCardio ? '40 sec work' : isPlyometric ? '8-10' : '12-15',
            rest: isCardio ? '20 sec' : isPlyometric ? '45 seconds' : '30 seconds',
            tempo: isCardio ? 'Max effort' : isPlyometric ? 'Explosive' : 'Controlled',
            muscleGroup: 'conditioning',
            notes: isCardio
              ? 'All-out effort each interval. Scale intensity to maintain form.'
              : isPlyometric
                ? 'Focus on explosive power and safe landings.'
                : 'Keep moving — minimal rest between reps.',
            whyThisExercise: buildWhyExercise(ex, allInsights, biases.notes, bodyType, goals),
          });
          return;
        }

        const repsMin = strategy.repRange.min;
        const repsMax = strategy.repRange.max;
        const sets =
          ex.compound
            ? strategy.setsPerExercise.max
            : strategy.setsPerExercise.min;
        const rest = ex.compound
          ? `${strategy.restSeconds.max} seconds`
          : `${strategy.restSeconds.min} seconds`;

        dayExercises.push({
          name: ex.name,
          sets,
          reps: `${repsMin}-${repsMax}`,
          rest,
          tempo: strategy.tempo,
          muscleGroup: mg,
          notes: ex.compound
            ? 'Focus on full range of motion and controlled eccentric.'
            : 'Squeeze at peak contraction; control the negative.',
          whyThisExercise: buildWhyExercise(ex, allInsights, biases.notes, bodyType, goals),
        });
      });
    });

    return {
      day: dayPlan.day,
      focus: dayPlan.focus,
      warmup: WARMUPS[dayPlan.warmupType] || WARMUPS.full,
      exercises: dayExercises,
      cooldown: COOLDOWNS[dayPlan.cooldownType] || COOLDOWNS.full,
    };
  });

  // ---- Aggregate metadata ----
  const avgExercises =
    weeklySchedule.reduce((sum, d) => sum + d.exercises.length, 0) / weeklySchedule.length;

  return {
    weeklySchedule,
    nutritionTips: buildNutritionTips(bodyType, goals, gender),
    weeklyProgressionPlan: buildProgressionPlan(level, bodyType, goals),
    estimatedSessionDuration: estimateSessionDuration(Math.round(avgExercises), strategy, level),
  };
}

export default generateLocalRoutine;
