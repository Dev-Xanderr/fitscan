// ---------------------------------------------------------------------------
// productRecommendations.js
// Maps body type + goal → SQUATWOLF collection recommendations.
// Uses only the 5 priority collections from the ecom team.
// ---------------------------------------------------------------------------

const BASE = 'https://squatwolf.com/en-ae/collections';

const COLLECTIONS = [
  {
    id: 'actdry',
    name: 'ACTDRY',
    tagline: 'Stay dry. Train harder.',
    url: `${BASE}/actdry`,
    category: 'Training',
    // Best for intense sweaters, heavy sessions, bigger builds — great for all goals
    bodyTypes: ['endomorph', 'endo-mesomorph', 'mesomorph'],
    goals: ['build-muscle', 'lose-fat', 'athletic'],
    why: {
      endomorph: 'Advanced moisture-wicking keeps you dry through high-rep, short-rest training.',
      'endo-mesomorph': 'Built for powerful builds that generate serious heat in the gym.',
      mesomorph: 'Sweat management tech that keeps up with your intense sessions.',
      default: 'Moisture-wicking technology for high-intensity training.',
    },
  },
  {
    id: 'ultralight',
    name: 'Ultralight Performance',
    tagline: 'Zero weight. Full range.',
    url: `${BASE}/ultralight-performance`,
    category: 'Performance',
    // Best for lean frames, conditioning, athletic work — works for all goals
    bodyTypes: ['ectomorph', 'ecto-mesomorph', 'mesomorph'],
    goals: ['lose-fat', 'athletic', 'build-muscle'],
    // already includes all goals
    why: {
      ectomorph: 'Featherlight fabric complements your lean frame — moves like a second skin.',
      'ecto-mesomorph': 'Engineered for explosive movement without restriction.',
      mesomorph: 'Barely-there weight lets your physique do the talking.',
      default: 'Ultra-lightweight performance wear for unrestricted training.',
    },
  },
  {
    id: 'seamless',
    name: 'Seamless',
    tagline: 'Built to your shape.',
    url: `${BASE}/seamless`,
    category: 'Fitted',
    // Best for showing off physique, muscle goals — also great for lean transformations
    bodyTypes: ['mesomorph', 'ecto-mesomorph', 'ectomorph'],
    goals: ['build-muscle', 'athletic', 'lose-fat'],
    why: {
      mesomorph: 'Contoured fit designed to showcase your balanced, athletic build.',
      'ecto-mesomorph': 'Seamless construction highlights your V-taper and shoulder width.',
      ectomorph: 'Form-fitting design adds visual structure to a lean frame.',
      default: 'Seamless construction for a clean, sculpted silhouette.',
    },
  },
  {
    id: 'run',
    name: 'Run',
    tagline: 'Pace yourself. Or don\'t.',
    url: `${BASE}/run`,
    category: 'Cardio',
    // Best for lean/conditioning goals
    bodyTypes: ['endomorph', 'endo-mesomorph', 'ectomorph', 'mesomorph', 'ecto-mesomorph'],
    goals: ['lose-fat'],
    why: {
      endomorph: 'Purpose-built for your conditioning days — breathable, light, unrestricted.',
      'endo-mesomorph': 'Cardio-ready gear for the metabolic work in your programme.',
      ectomorph: 'Light enough for long conditioning sessions without overheating.',
      mesomorph: 'Designed for the HIIT and cardio blocks in your lean programme.',
      default: 'Engineered for running and cardio-focused training.',
    },
  },
  {
    id: 'reset',
    name: 'Reset',
    tagline: 'Recovery is part of the plan.',
    url: `${BASE}/reset`,
    category: 'Recovery',
    // Universal — everyone needs rest days
    bodyTypes: ['ectomorph', 'mesomorph', 'endomorph', 'ecto-mesomorph', 'endo-mesomorph'],
    goals: ['build-muscle', 'lose-fat', 'athletic'],
    why: {
      ectomorph: 'Recovery is where you grow — soft fabrics for the days between heavy lifts.',
      mesomorph: 'Your muscles respond fast, but only if you recover. Gear up for rest days.',
      endomorph: 'Active recovery keeps the engine running — comfortable gear for off days.',
      'ecto-mesomorph': 'Growth happens during recovery. Dress the part on your rest days.',
      'endo-mesomorph': 'Rest days fuel your next PR. Premium comfort for when you\'re not lifting.',
      default: 'Premium comfort for rest days and active recovery.',
    },
  },
];

/**
 * Returns 3 product recommendations: 2 training picks + Reset for recovery.
 *
 * @param {string} bodyType - e.g. 'mesomorph', 'Ecto-Mesomorph'
 * @param {string} goal - e.g. 'build-muscle', 'lose-fat'
 * @returns {Array<{name, tagline, url, category, reason}>}
 */
export function getProductRecommendations(bodyType, goal) {
  const bt = (bodyType || 'mesomorph').toLowerCase().replace(/\s+/g, '-');
  const g = goal || 'build-muscle';

  // Score training collections (exclude Reset — it's always the 3rd pick)
  const training = COLLECTIONS.filter((c) => c.id !== 'reset');
  const scored = training.map((c) => {
    let score = 0;
    if (c.bodyTypes.includes(bt)) score += 3;
    if (c.goals.includes(g)) score += 3;
    if (c.why[bt]) score += 1; // bonus for personalized copy
    return { c, score };
  });
  scored.sort((a, b) => b.score - a.score);

  // Top 2 training picks
  const picks = scored.slice(0, 2).map(({ c }) => ({
    name: c.name,
    tagline: c.tagline,
    url: c.url,
    category: c.category,
    reason: c.why[bt] || c.why.default,
  }));

  // Always add Reset as the 3rd
  const reset = COLLECTIONS.find((c) => c.id === 'reset');
  picks.push({
    name: reset.name,
    tagline: reset.tagline,
    url: reset.url,
    category: reset.category,
    reason: reset.why[bt] || reset.why.default,
  });

  return picks;
}

export default getProductRecommendations;
