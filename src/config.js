/**
 * Central application configuration.
 * Change backend route names / field names HERE – nothing else needs editing.
 */

const env = import.meta.env;

export const API_CONFIG = {
  baseUrl: (env.VITE_API_BASE_URL || '').replace(/\/+$/, ''),
  timeoutMs: Number(env.VITE_API_TIMEOUT_MS) || 110000,

  // Multipart field name used for the uploaded image (change if backend differs)
  uploadFieldName: 'file',
  // Optional crop hint field sent alongside the image when a crop is selected
  cropFieldName: 'crop',

  routes: {
    predict: '/api/predict', // POST (required)
    history: '/api/history', // GET  (to be confirmed with backend team)
    guidance: (disease) => `/api/guidance/${encodeURIComponent(disease)}`, // GET (to be confirmed)
    monitoring: '/api/monitoring', // GET  (to be confirmed)
  },
};

export const UPLOAD_RULES = {
  maxSizeMB: Number(env.VITE_MAX_UPLOAD_MB) || 10,
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  acceptedLabel: 'JPG, PNG or WebP',
};

/**
 * Crops actually supported by the model / backend.
 * Leave EMPTY until the backend team confirms the list, e.g.
 *   [{ value: 'tomato', label: 'Tomato' }]
 * The crop dropdown only offers what is configured here.
 */
export const SUPPORTED_CROPS = [];

/** Charts only appear when at least this many real scans exist. */
export const MIN_CHART_POINTS = 3;

/** Max scans kept in on-device history (localStorage). */
export const HISTORY_LIMIT = 60;

/** Below this model confidence the UI shows an extra caution note (display hint only). */
export const LOW_CONFIDENCE_THRESHOLD = 0.5;

export const HERO_IMAGE_URL = env.VITE_HERO_IMAGE_URL || '';

export const TEAM = {
  project: 'KrishiNetra',
  name: 'Proxy Pirates',
  competition: 'Smart India Hackathon 2026',
  problemStatementId: 'SIH26131',
  tagline: 'Smart Farming Starts with Early Detection.',
  // Edit these placeholders with real team details.
  members: [
    { name: 'Team Member 1', role: 'Role / Responsibility' },
    { name: 'Team Member 2', role: 'Role / Responsibility' },
    { name: 'Team Member 3', role: 'Role / Responsibility' },
    { name: 'Team Member 4', role: 'Role / Responsibility' },
    { name: 'Team Member 5', role: 'Role / Responsibility' },
    { name: 'Team Member 6', role: 'Role / Responsibility' },
  ],
};
