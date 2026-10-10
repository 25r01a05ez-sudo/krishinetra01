/**
 * DEMO MODE ONLY – illustrative sample data for jury presentations.
 * Nothing here comes from the AI model. Every demo value is flagged `isDemo: true`
 * and the UI labels it clearly. Demo data is never used in live mode.
 */

const wait = (ms, signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(Object.assign(new Error('aborted'), { kind: 'aborted' }));
    });
  });

export const DEMO_GUIDANCE = {
  immediate: [
    'Compare the marked leaf with other leaves on the same plant.',
    'Take another clear, well-lit photo of the affected leaf.',
  ],
  preventive: [
    'Keep hands and tools clean when moving between plants.',
    'Avoid working among wet plants where possible.',
  ],
  monitoring: ['Scan the same plant again after a few days to see whether the symptoms change.'],
  expert: [
    'If symptoms spread quickly, contact your local agriculture officer or Krishi Vigyan Kendra.',
  ],
  symptoms: ['Visible marks or colour changes on leaves (illustrative demo text).'],
  summary: 'Illustrative demo guidance. Real guidance comes from the reviewed backend library.',
};

const SAMPLES = [
  {
    disease: 'Leaf spot (demo sample)',
    confidence: 0.86,
    status: 'disease',
    severity: null,
    crop: null,
    guidance: DEMO_GUIDANCE,
  },
  {
    disease: 'Healthy leaf (demo sample)',
    confidence: 0.93,
    status: 'healthy',
    severity: null,
    crop: null,
    guidance: null,
  },
  {
    disease: null,
    confidence: 0.41,
    status: 'uncertain',
    severity: null,
    crop: null,
    guidance: null,
  },
];

/** Cycles through samples so a presentation shows variety. */
let cursor = 0;
export async function demoPredict(_file, { signal } = {}) {
  await wait(1800, signal);
  const sample = SAMPLES[cursor % SAMPLES.length];
  cursor += 1;
  return {
    predictionId: null,
    statusText: sample.status,
    regions: [],
    overlayUrl: null,
    ...sample,
    isDemo: true,
  };
}

export async function demoGuidance(disease) {
  if (!disease || !/demo sample/i.test(disease) || /healthy/i.test(disease)) return null;
  return { ...DEMO_GUIDANCE, general: [], management: [], name: disease, crop: null, imageUrl: null };
}

/** Pre-seeded illustrative history so the demo dashboard is not empty. */
export function buildDemoHistory() {
  const now = Date.now();
  const day = 86400000;
  const rows = [
    [0.2, 'Leaf spot (demo sample)', 0.86, 'disease'],
    [1.1, 'Healthy leaf (demo sample)', 0.93, 'healthy'],
    [2.3, 'Leaf spot (demo sample)', 0.78, 'disease'],
    [3.4, 'Healthy leaf (demo sample)', 0.9, 'healthy'],
    [5.2, null, 0.41, 'uncertain'],
    [6.5, 'Healthy leaf (demo sample)', 0.95, 'healthy'],
    [8.1, 'Leaf spot (demo sample)', 0.82, 'disease'],
    [10.3, 'Healthy leaf (demo sample)', 0.91, 'healthy'],
  ];
  return rows.map(([ago, disease, confidence, status], i) => ({
    id: `demo-${i}`,
    source: 'local',
    createdAt: new Date(now - ago * day).toISOString(),
    fileName: `demo-sample-${i + 1}.jpg`,
    thumbnail: null,
    crop: null,
    disease,
    confidence,
    status,
    statusText: status,
    severity: null,
    regions: [],
    overlayUrl: null,
    guidance: status === 'disease' ? DEMO_GUIDANCE : null,
    predictionId: null,
    isDemo: true,
  }));
}
