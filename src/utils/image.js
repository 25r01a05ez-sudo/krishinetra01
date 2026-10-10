import { UPLOAD_RULES } from '../config';

/** Validates a File chosen by the farmer. Returns { ok, error? }. */
export function validateImage(file) {
  if (!file) return { ok: false, error: 'Please choose a photo of a crop leaf.' };
  if (!UPLOAD_RULES.acceptedTypes.includes(file.type)) {
    return {
      ok: false,
      error: `This file type is not supported. Please use a ${UPLOAD_RULES.acceptedLabel} photo.`,
    };
  }
  if (file.size === 0) return { ok: false, error: 'This file is empty. Please choose another photo.' };
  const maxBytes = UPLOAD_RULES.maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `This photo is too large (${formatBytes(file.size)}). The maximum size is ${UPLOAD_RULES.maxSizeMB} MB.`,
    };
  }
  return { ok: true };
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Small JPEG data-URL used for on-device history. Resolves null on failure. */
export function createThumbnail(file, maxSize = 420, quality = 0.72) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve(null);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
