/**
 * API service layer – ALL backend communication and response normalisation lives here.
 * The final Flask contract may change; every normaliser is defensive.
 */
import { API_CONFIG } from '../config';

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

export class ApiError extends Error {
  /**
   * kind: 'network' | 'timeout' | 'http' | 'not_available' | 'invalid' | 'empty' | 'aborted'
   */
  constructor(kind, message, { status, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.details = details;
  }
}

/** Turns any thrown error into friendly, farmer-readable text. */
export function describeApiError(err) {
  const kind = err instanceof ApiError ? err.kind : 'unknown';
  switch (kind) {
    case 'network':
      return {
        title: 'Cannot reach the analysis server',
        message:
          'The KrishiNetra backend did not respond. Check your internet connection and make sure the server is running.',
        hint: `Server address: ${API_CONFIG.baseUrl}`,
      };
    case 'timeout':
      return {
        title: 'The analysis is taking too long',
        message: 'The server did not answer in time. Please try again, or use a smaller photo.',
        hint: `Timeout: ${Math.round(API_CONFIG.timeoutMs / 1000)} seconds`,
      };
    case 'not_available':
      return {
        title: 'Not available yet',
        message: 'The server does not offer this feature yet.',
        hint: err.status ? `Server replied with status ${err.status}.` : undefined,
      };
    case 'http':
      return {
        title: 'The server reported a problem',
        message: err.message || 'Something went wrong while analysing the image.',
        hint: err.status ? `Status code ${err.status}` : undefined,
      };
    case 'empty':
      return {
        title: 'Empty response',
        message: 'The server replied without any result. Please try again.',
      };
    case 'invalid':
      return {
        title: 'Unexpected response',
        message: 'The server replied in a format this app does not understand.',
        hint: err.message,
      };
    default:
      return {
        title: 'Something went wrong',
        message: (err && err.message) || 'An unknown error occurred. Please try again.',
      };
  }
}

/* ------------------------------------------------------------------ */
/* Low-level request                                                   */
/* ------------------------------------------------------------------ */

const buildUrl = (path) => `${API_CONFIG.baseUrl}${path}`;

export async function request(path, { method = 'GET', body, headers, timeoutMs = API_CONFIG.timeoutMs, signal } = {}) {
  const controller = new AbortController();
  let timedOut = false;
  let userAborted = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => {
    userAborted = true;
    controller.abort();
  };
  if (signal) {
    if (signal.aborted) onExternalAbort();
    else signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    let res;
    let text;
    try {
      res = await fetch(buildUrl(path), { method, body, headers: { 'X-KrishiNetra': '1', ...headers }, credentials: 'include', signal: controller.signal });
      text = await res.text();
    } catch (err) {
      if (userAborted) throw new ApiError('aborted', 'Request cancelled.');
      if (timedOut) throw new ApiError('timeout', 'Request timed out.');
      throw new ApiError('network', 'Network request failed.', { details: String(err) });
    }

    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = undefined; // non-JSON body
      }
    }

    if (!res.ok) {
      const msg =
        (data && typeof data === 'object' && (data.error || data.message || data.detail)) ||
        `Server responded with status ${res.status}.`;
      const kind = [404, 405, 501].includes(res.status) ? 'not_available' : 'http';
      throw new ApiError(kind, typeof msg === 'string' ? msg : JSON.stringify(msg), { status: res.status });
    }

    if (data === undefined) {
      throw new ApiError('invalid', 'Response was not valid JSON.', { status: res.status });
    }
    return data; // may be null for an empty body
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onExternalAbort);
  }
}

/* ------------------------------------------------------------------ */
/* Normalisation helpers                                               */
/* ------------------------------------------------------------------ */

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function pick(obj, keys) {
  if (!isObj(obj)) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return undefined;
}

/** Returns a 0..1 number or null. Accepts 0-1, 0-100 or "93%". */
export function toConfidence(v) {
  if (v === undefined || v === null || v === '') return null;
  let n = typeof v === 'string' ? parseFloat(v.replace('%', '')) : Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  if (typeof v === 'string' && v.includes('%')) n /= 100;
  else if (n > 1) n /= 100;
  return Math.min(n, 1);
}

/** healthy | disease | uncertain | unsupported | unknown */
export function normalizeStatus(v) {
  if (typeof v !== 'string') return 'unknown';
  const s = v.toLowerCase().replace(/[\s-]+/g, '_');
  if (s.includes('unsupported') || s.includes('not_supported') || s.includes('out_of_scope')) return 'unsupported';
  if (s.includes('uncertain') || s.includes('unsure') || s.includes('low_confidence') || s.includes('inconclusive'))
    return 'uncertain';
  if (s.includes('health') && !s.includes('unhealth')) return 'healthy';
  if (
    ['disease', 'infect', 'infest', 'pest', 'possible', 'detected', 'unhealth', 'blight', 'spot', 'rust', 'mold', 'mould', 'virus', 'diseased'].some(
      (w) => s.includes(w),
    )
  )
    return 'disease';
  return 'unknown';
}

/** low | moderate | high | null – only when the backend really sends one */
export function normalizeSeverity(v) {
  const raw = isObj(v) ? pick(v, ['level', 'label', 'value', 'severity']) : v;
  if (typeof raw !== 'string') return null;
  const s = raw.toLowerCase();
  if (s.startsWith('low') || s === 'mild') return 'low';
  if (s.startsWith('mod') || s.startsWith('med')) return 'moderate';
  if (s.startsWith('high') || s === 'severe') return 'high';
  return null;
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Returns [{x,y,width,height}] (units untouched – UI decides whether normalised or pixel) */
function normalizeRegions(v) {
  if (!Array.isArray(v)) return [];
  return v
    .map((r) => {
      if (Array.isArray(r) && r.length >= 4) {
        const [x, y, width, height] = r.map(toNum);
        return { x, y, width, height };
      }
      if (isObj(r)) {
        const box = pick(r, ['bbox', 'box']);
        if (Array.isArray(box) && box.length >= 4) {
          const [x, y, width, height] = box.map(toNum);
          return { x, y, width, height };
        }
        return {
          x: toNum(pick(r, ['x', 'left'])),
          y: toNum(pick(r, ['y', 'top'])),
          width: toNum(pick(r, ['width', 'w'])),
          height: toNum(pick(r, ['height', 'h'])),
        };
      }
      return null;
    })
    .filter((r) => r && [r.x, r.y, r.width, r.height].every((n) => n !== null && n >= 0) && r.width > 0 && r.height > 0);
}

function resolveImageUrl(v) {
  if (typeof v !== 'string' || !v) return null;
  if (/^(https?:|data:|blob:)/i.test(v)) return v;
  if (v.startsWith('/')) return `${API_CONFIG.baseUrl}${v}`;
  if (v.length > 200 && /^[A-Za-z0-9+/=\s]+$/.test(v)) return `data:image/png;base64,${v.replace(/\s/g, '')}`;
  return `${API_CONFIG.baseUrl}/${v}`;
}

function toList(v) {
  if (v === undefined || v === null) return [];
  if (Array.isArray(v)) {
    return v
      .map((i) => (typeof i === 'string' ? i : isObj(i) ? pick(i, ['text', 'description', 'title', 'step']) : String(i)))
      .filter((i) => typeof i === 'string' && i.trim())
      .map((i) => i.trim());
  }
  if (typeof v === 'string') {
    return v
      .split(/\n+/)
      .map((s) => s.replace(/^[-*•\d.)\s]+/, '').trim())
      .filter(Boolean);
  }
  return [];
}

/** Normalised guidance object or null when nothing usable is present. */
export function normalizeGuidance(raw) {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === 'string') return raw.trim() ? { summary: raw.trim(), general: [] } : null;
  if (Array.isArray(raw)) {
    const general = toList(raw);
    return general.length ? { general } : null;
  }
  if (!isObj(raw)) return null;
  const src = isObj(raw.guidance) ? raw.guidance : raw;
  const g = {
    name: pick(src, ['disease', 'name', 'title']) || null,
    crop: pick(src, ['crop', 'supported_crop']) || null,
    summary: pick(src, ['summary', 'description', 'overview']) || null,
    symptoms: toList(pick(src, ['symptoms', 'common_symptoms', 'visible_symptoms'])),
    immediate: toList(pick(src, ['immediate', 'immediate_steps', 'immediate_actions', 'next_steps'])),
    preventive: toList(pick(src, ['preventive', 'prevention', 'preventive_measures', 'prevention_tips'])),
    monitoring: toList(pick(src, ['monitoring', 'monitoring_suggestions', 'monitoring_advice'])),
    expert: toList(pick(src, ['expert', 'expert_advice', 'seek_expert', 'when_to_seek_expert_advice', 'when_to_seek_help'])),
    management: toList(pick(src, ['management', 'management_suggestions', 'treatment', 'recommendations'])),
    general: toList(pick(src, ['general', 'actions', 'steps'])),
    imageUrl: resolveImageUrl(pick(src, ['image_url', 'image', 'illustration'])),
  };
  const hasContent =
    g.summary ||
    ['symptoms', 'immediate', 'preventive', 'monitoring', 'expert', 'management', 'general'].some((k) => g[k].length);
  return hasContent ? g : null;
}

/* ------------------------------------------------------------------ */
/* Prediction                                                          */
/* ------------------------------------------------------------------ */

export function normalizePrediction(raw) {
  if (!isObj(raw)) throw new ApiError('invalid', 'Prediction response was not an object.');
  // Allow {prediction:{...}} / {result:{...}} / {data:{...}} wrappers
  const src = ['prediction', 'result', 'data'].reduce((acc, k) => (isObj(acc[k]) ? acc[k] : acc), raw);

  const diseaseRaw = pick(src, ['disease', 'label', 'class', 'class_name', 'prediction', 'name']);
  const disease = typeof diseaseRaw === 'string' ? diseaseRaw : isObj(diseaseRaw) ? pick(diseaseRaw, ['name', 'label']) || null : null;
  const confidence = toConfidence(pick(src, ['confidence', 'probability', 'score']));
  const statusRaw = pick(src, ['status', 'health_status', 'state']);
  const status = normalizeStatus(statusRaw);

  if (!disease && confidence === null && statusRaw === undefined) {
    throw new ApiError('invalid', 'None of disease, confidence or status were present in the response.');
  }

  return {
    language: src.language || 'en',
    imageUrl: resolveImageUrl(src.image_url),
    createdAt: src.created_at || null,
    predictionId: pick(src, ['prediction_id', 'id']) ?? null,
    disease: disease || null,
    confidence,
    status,
    statusText: typeof statusRaw === 'string' ? statusRaw : null,
    severity: normalizeSeverity(pick(src, ['severity', 'severity_level'])),
    crop: (typeof pick(src, ['crop', 'crop_name']) === 'string' && pick(src, ['crop', 'crop_name'])) || null,
    regions: normalizeRegions(pick(src, ['affected_regions', 'regions', 'bounding_boxes'])),
    overlayUrl: resolveImageUrl(pick(src, ['overlay_url', 'overlay', 'mask_url', 'mask', 'heatmap_url'])),
    guidance: normalizeGuidance(pick(src, ['guidance', 'recommendations'])),
    isDemo: false,
  };
}

/**
 * POST /api/predict – multipart/form-data.
 * @param {File} file
 * @param {{crop?: string, signal?: AbortSignal}} [opts]
 */
export async function predictCrop(file, { crop, language = 'en', signal } = {}) {
  if (!(file instanceof Blob)) throw new ApiError('invalid', 'No image file provided.');
  const form = new FormData();
  form.append(API_CONFIG.uploadFieldName, file, file.name || 'crop.jpg');
  if (crop) form.append(API_CONFIG.cropFieldName, crop);
  form.append('language', language);

  // Do NOT set Content-Type: the browser adds the multipart boundary.
  const raw = await request(API_CONFIG.routes.predict, { method: 'POST', body: form, signal });
  if (raw === null) throw new ApiError('empty', 'Empty response from server.');
  return normalizePrediction(raw);
}

/* ------------------------------------------------------------------ */
/* History (optional route – confirm with backend)                      */
/* ------------------------------------------------------------------ */

function normalizeHistoryItem(item, index) {
  if (!isObj(item)) return null;
  const p = (() => {
    try {
      return normalizePrediction(item);
    } catch {
      return null;
    }
  })();
  if (!p) return null;
  const createdAt = pick(item, ['created_at', 'createdAt', 'timestamp', 'date', 'time']);
  const date = createdAt ? new Date(createdAt) : null;
  const id = String(pick(item, ['id', 'prediction_id', 'scan_id']) ?? `server-${index}`);
  return {
    ...p,
    id: `srv-${id}`,
    source: 'server',
    createdAt: date && !Number.isNaN(date.getTime()) ? date.toISOString() : null,
    thumbnail: resolveImageUrl(pick(item, ['image_url', 'thumbnail', 'image', 'thumbnail_url'])),
  };
}

export async function getHistory({ signal } = {}) {
  const items = [];
  for (let page = 1; ; page++) {
    const raw = await request(`${API_CONFIG.routes.history}?page=${page}&limit=100`, { signal });
    items.push(...(raw.history || []));
    if (!raw.has_more) break;
  }
  return items.map(normalizeHistoryItem).filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* Guidance (optional route – confirm with backend)                    */
/* ------------------------------------------------------------------ */

/** Returns normalised guidance, or null if the backend has none / route missing. */
export async function getGuidance(disease, { signal } = {}) {
  if (!disease) return null;
  try {
    const raw = await request(API_CONFIG.routes.guidance(disease), { signal });
    return normalizeGuidance(raw);
  } catch (err) {
    if (err instanceof ApiError && err.kind === 'not_available') return null;
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/* Monitoring (optional route – confirm with backend)                  */
/* ------------------------------------------------------------------ */

function normalizeMetric(v) {
  if (v === undefined || v === null) return null;
  if (isObj(v)) {
    const value = toNum(pick(v, ['value', 'current', 'reading']));
    if (value === null) return null;
    return { value, unit: pick(v, ['unit']) || null, updatedAt: pick(v, ['updated_at', 'timestamp']) || null };
  }
  const value = toNum(v);
  return value === null ? null : { value, unit: null, updatedAt: null };
}

export async function getMonitoring({ signal } = {}) {
  const raw = await request(API_CONFIG.routes.monitoring, { signal });
  if (!isObj(raw)) return null;
  const src = isObj(raw.data) ? raw.data : raw;
  const result = {
    temperature: normalizeMetric(pick(src, ['temperature', 'temp'])),
    humidity: normalizeMetric(pick(src, ['humidity'])),
    soilMoisture: normalizeMetric(pick(src, ['soil_moisture', 'soilMoisture', 'moisture'])),
    weather: typeof pick(src, ['weather', 'weather_summary']) === 'string' ? pick(src, ['weather', 'weather_summary']) : null,
    alerts: toList(pick(src, ['alerts', 'risks', 'notifications'])),
  };
  const any = result.temperature || result.humidity || result.soilMoisture || result.weather || result.alerts.length;
  return any ? result : null;
}

export const jsonRequest = (path, method, data) => request(path, {
  method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
});
export const deleteScan = (id) => request(`/api/scans/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const deleteHistory = () => request('/api/history', { method: 'DELETE' });
export const getSettings = () => request('/api/settings');
export const saveSettings = (settings) => jsonRequest('/api/settings', 'PATCH', settings);
export async function translateAssessment(scan, language, { signal } = {}) {
  const raw = await request('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    signal, body: JSON.stringify({ scan_id: scan.predictionId, language }) });
  return normalizePrediction(raw);
}
