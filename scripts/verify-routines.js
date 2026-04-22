// ---------------------------------------------------------------------------
// verify-routines.js
// Runs generateLocalRoutine across every (body type × goal × level × gender)
// combination and reports:
//   • exact-name duplicates within a single routine (should be zero)
//   • movement-pattern stacking within a day (should be rare)
//   • overall exercise-pool coverage (how much variety the library is using)
//
// Usage:  node scripts/verify-routines.js
// ---------------------------------------------------------------------------

import { generateLocalRoutine, patternOf } from '../src/services/localRoutineGenerator.js';

const BODY_TYPES = ['ectomorph', 'mesomorph', 'endomorph', 'ecto-mesomorph', 'endo-mesomorph'];
const GOALS = [
  ['lose-fat'],
  ['build-muscle'],
  ['athletic'],
  ['stay-active'],
];
const LEVELS = ['beginner', 'intermediate', 'advanced'];
const GENDERS = ['Male', 'Female'];
const EQUIPMENTS = [['full-gym'], ['home-gym'], ['bodyweight']];

// Representative body metrics per type so the seeded shuffle has something to chew on.
const METRICS_BY_TYPE = {
  ectomorph:         { shoulderToHipRatio: 1.25, torsoToLegRatio: 0.58, limbToTorsoRatio: 1.22 },
  mesomorph:         { shoulderToHipRatio: 1.42, torsoToLegRatio: 0.68, limbToTorsoRatio: 1.02 },
  endomorph:         { shoulderToHipRatio: 1.10, torsoToLegRatio: 0.78, limbToTorsoRatio: 0.88 },
  'ecto-mesomorph':  { shoulderToHipRatio: 1.38, torsoToLegRatio: 0.60, limbToTorsoRatio: 1.15 },
  'endo-mesomorph':  { shoulderToHipRatio: 1.30, torsoToLegRatio: 0.72, limbToTorsoRatio: 0.92 },
};

const results = {
  total: 0,
  duplicates: [],       // { combo, name, count }
  patternStacks: [],    // { combo, day, pattern, count, names }
  allExercisesSeen: new Set(),
  exerciseFrequency: new Map(),
};

function describe(combo) {
  return `${combo.bodyType} / ${combo.goals.join('+')} / ${combo.level} / ${combo.gender} / ${combo.equipment.join('+')}`;
}

async function runOne(combo) {
  const userInfo = {
    name: 'Test',
    age: '28',
    gender: combo.gender,
    height: '175',
    heightUnit: 'cm',
    weight: '75',
    weightUnit: 'kg',
    fitnessGoals: combo.goals,
    experienceLevel: combo.level,
    injuries: '',
    equipment: combo.equipment,
  };
  const analysis = {
    bodyType: combo.bodyType,
    frameSize: 'Medium',
    bodyMetrics: METRICS_BY_TYPE[combo.bodyType],
    proportionalNotes: [],
    salt: 1_700_000_000_000, // fixed salt so runs are reproducible
  };

  const routine = await generateLocalRoutine(userInfo, analysis);

  // 1) Week-wide exact-name dedup check
  const nameCount = new Map();
  for (const day of routine.weeklySchedule) {
    for (const ex of day.exercises) {
      nameCount.set(ex.name, (nameCount.get(ex.name) || 0) + 1);
      results.allExercisesSeen.add(ex.name);
      results.exerciseFrequency.set(
        ex.name,
        (results.exerciseFrequency.get(ex.name) || 0) + 1,
      );
    }
  }
  for (const [name, count] of nameCount) {
    if (count > 1) {
      results.duplicates.push({ combo: describe(combo), name, count });
    }
  }

  // 2) Within-day pattern stacking check
  for (const day of routine.weeklySchedule) {
    const dayPatternGroups = new Map();
    for (const ex of day.exercises) {
      const p = patternOf(ex.name);
      if (!p) continue;
      if (!dayPatternGroups.has(p)) dayPatternGroups.set(p, []);
      dayPatternGroups.get(p).push(ex.name);
    }
    for (const [pattern, names] of dayPatternGroups) {
      if (names.length >= 3) {
        results.patternStacks.push({
          combo: describe(combo),
          day: day.day,
          pattern,
          count: names.length,
          names,
        });
      }
    }
  }

  results.total++;
}

async function patternAudit() {
  // Spot-check that critical exercise names classify to the pattern we expect.
  // Catches regex regressions in patternOf before they reach production.
  const expectations = [
    ['Barbell Bench Press',              'horizontal-press'],
    ['Incline Dumbbell Press',           'horizontal-press'],
    ['Dumbbell Bench Press',             'horizontal-press'],
    ['Spoto Press',                      'horizontal-press'],
    ['Arnold Press',                     'vertical-press'],
    ['Dumbbell Shoulder Press',          'vertical-press'],
    ['Overhead Barbell Press',           'vertical-press'],
    ['Z-Press',                          'vertical-press'],
    ['Pike Push-Ups',                    'vertical-press'],
    ['Push-Ups',                         'push-up'],
    ['Lateral Raises',                   'lateral-raise'],
    ['Cable Lateral Raises',             'lateral-raise'],
    ['Barbell Bent-Over Row',            'horizontal-row'],
    ['Renegade Rows',                    'horizontal-row'],
    ['Inverted Rows',                    'horizontal-row'],
    ['Pull-Ups',                         'vertical-pull-bw'],
    ['Lat Pulldown',                     'vertical-pull-machine'],
    ['Dumbbell Pullover',                'pullover'],
    ['Conventional Deadlift',            'hinge'],
    ['Romanian Deadlift',                'hinge'],
    ['Barbell Back Squat',               'squat'],
    ['Goblet Squat',                     'squat'],
    ['Leg Press',                        'squat'],
    ['Hack Squat',                       'squat'],
    ['Bulgarian Split Squats',           'squat'],
    ['Walking Lunges',                   'lunge'],
    ['Reverse Lunges',                   'lunge'],
    ['Hip Thrusts',                      'hip-thrust'],
    ['Glute Bridge',                     'hip-thrust'],
    ['Barbell Hip Thrust',               'hip-thrust'],
    ['Kas Glute Bridge',                 'hip-thrust'],
    ['Donkey Kicks',                     'glute-iso'],
    ['Fire Hydrants',                    'glute-iso'],
    ['Cable Glute Kickback',             'glute-iso'],
    ['Kickbacks (Cable or Band)',        'glute-iso'],
    ['Tricep Kickbacks',                 'tricep-iso'],
    ['Skull Crushers',                   'tricep-iso'],
    ['Close-Grip Bench Press',           'tricep-iso'],
    ['Cable Tricep Pushdown',            'tricep-iso'],
    ['Barbell Curls',                    'curl'],
    ['Hammer Curls',                     'curl'],
    ['Cable Flyes',                      'fly'],
    ['Dumbbell Flyes',                   'fly'],
    ['Pec Deck Machine',                 'fly'],
    ['Face Pulls',                       'rear-delt'],
    ['Reverse Flyes',                    'rear-delt'],
    ['Standing Calf Raises',             'calf'],
    ['Leg Extensions',                   'leg-extension'],
    ['Leg Curls',                        'leg-curl'],
    ['Kettlebell Swings',                'kb-swing'],
    ['Box Jumps',                        'plyo-jump'],
    ['Burpees',                          'burpee'],
    ['Sled Push',                        'sled'],
    ['Wall Balls',                       'wall-ball'],
    ['Thrusters',                        'olympic'],
    ['Power Clean',                      'olympic'],
    ['Dumbbell Snatch',                  'olympic'],
    ['Farmer Carry',                     'carry'],
    ['Farmer Carry (Heavy)',             'carry'],
    ['SkiErg Intervals',                 'ergo'],
    ['Rowing Machine Intervals',         'ergo'],
    ['Assault Bike Intervals',           'ergo'],
    ['Echo Bike Sprints',                'ergo'],
    ['Shuttle Runs',                     'ergo'],
    ['Plank',                            'core-iso'],
    ['Hanging Leg Raises',               'core-iso'],
    ['Battle Ropes — Alternating Waves', 'slam-rope'],
    ['Med Ball Slams',                   'slam-rope'],
    ['Jump Rope',                        'jump-rope'],
  ];

  const GRN = '\x1b[32m';
  const RED = '\x1b[31m';
  const RST = '\x1b[0m';

  let failed = 0;
  for (const [name, expected] of expectations) {
    const actual = patternOf(name);
    if (actual !== expected) {
      console.log(`${RED}✗${RST}  "${name}"  expected=${expected}  got=${actual}`);
      failed++;
    }
  }
  if (failed === 0) {
    console.log(`${GRN}✓${RST} patternOf audit: all ${expectations.length} classifications correct.`);
  } else {
    console.log(`${RED}✗${RST} patternOf audit: ${failed}/${expectations.length} classifications wrong.`);
  }
  return failed === 0;
}

async function main() {
  // Stage 1: verify the pattern classifier itself
  const patternOk = await patternAudit();
  console.log('');

  // Stage 2: run generator across every combo and check overlap
  for (const bodyType of BODY_TYPES) {
    for (const goals of GOALS) {
      for (const level of LEVELS) {
        for (const gender of GENDERS) {
          for (const equipment of EQUIPMENTS) {
            await runOne({ bodyType, goals, level, gender, equipment });
          }
        }
      }
    }
  }

  const GRN = '\x1b[32m';
  const RED = '\x1b[31m';
  const YEL = '\x1b[33m';
  const DIM = '\x1b[2m';
  const RST = '\x1b[0m';

  console.log(`\nRan ${results.total} routines (${BODY_TYPES.length} × ${GOALS.length} × ${LEVELS.length} × ${GENDERS.length} × ${EQUIPMENTS.length})\n`);

  // Exact-name duplicate report
  if (results.duplicates.length === 0) {
    console.log(`${GRN}✓${RST} No exact-name duplicates in any routine (week-wide dedup working).`);
  } else {
    console.log(`${RED}✗ ${results.duplicates.length} duplicate occurrences found:${RST}`);
    for (const d of results.duplicates.slice(0, 30)) {
      console.log(`    ${d.combo}  →  ${d.name} ×${d.count}`);
    }
    if (results.duplicates.length > 30) console.log(`    … and ${results.duplicates.length - 30} more`);
  }

  // Pattern-stack report (3+ of the same pattern in one day is the concern)
  if (results.patternStacks.length === 0) {
    console.log(`${GRN}✓${RST} No same-pattern stacking within any day (3+ of one pattern).`);
  } else {
    console.log(`\n${YEL}⚠ ${results.patternStacks.length} days with 3+ same-pattern exercises:${RST}`);
    for (const s of results.patternStacks.slice(0, 20)) {
      console.log(`    ${s.combo}  →  ${s.day}  ${s.pattern} ×${s.count}: ${s.names.join(', ')}`);
    }
    if (results.patternStacks.length > 20) console.log(`    … and ${results.patternStacks.length - 20} more`);
  }

  // Coverage report — how much of the library do we actually use?
  const allByFreq = [...results.exerciseFrequency.entries()].sort((a, b) => b[1] - a[1]);
  const top10 = allByFreq.slice(0, 10);
  const bottom10 = allByFreq.slice(-10).reverse();
  console.log(`\n${DIM}Library coverage: ${results.allExercisesSeen.size} distinct exercises appeared across all routines.${RST}`);
  console.log(`${DIM}Most-picked 10:${RST}`);
  for (const [name, count] of top10) console.log(`    ${String(count).padStart(4)}  ${name}`);
  console.log(`${DIM}Least-picked 10 (of those that appeared):${RST}`);
  for (const [name, count] of bottom10) console.log(`    ${String(count).padStart(4)}  ${name}`);

  const failed = results.duplicates.length > 0 || !patternOk;
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error('\x1b[31m✗ verify-routines crashed:\x1b[0m', err);
  process.exit(2);
});
