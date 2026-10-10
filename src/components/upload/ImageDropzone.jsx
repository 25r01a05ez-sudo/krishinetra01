import { useRef, useState } from 'react';
import { Camera, ImagePlus, RefreshCw, Trash2, UploadCloud } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { UPLOAD_RULES } from '../../config';
import { formatBytes } from '../../utils/image';
import { useT } from '../../i18n';

/**
 * Drag-and-drop / browse / camera image picker with preview.
 * Validation is done by the parent through `onFile` (returns nothing) – this component only picks files.
 */
export default function ImageDropzone({ file, previewUrl, onFile, onRemove, disabled = false, error }) {
  const browseRef = useRef(null);
  const cameraRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const { t } = useT();

  const pick = (list) => {
    if (list && list[0]) onFile(list[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (!disabled) pick(e.dataTransfer.files);
  };

  const accept = UPLOAD_RULES.acceptedTypes.join(',');

  return (
    <div>
      <input
        ref={browseRef}
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose a crop photo from your device"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-label="Take a photo of a crop leaf with your camera"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = '';
        }}
      />

      <AnimatePresence mode="wait">
        {previewUrl ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-hidden rounded-2xl border border-forest/15 bg-white shadow-soft"
          >
            <div className="relative bg-ink/5">
              <img src={previewUrl} alt="Selected crop leaf preview" className="mx-auto max-h-[420px] w-full object-contain" />
            </div>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-semibold">{file?.name}</p>
                <p className="text-sm text-ink/60">{file ? formatBytes(file.size) : ''}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-secondary btn-sm flex-1 sm:flex-none" onClick={() => browseRef.current?.click()} disabled={disabled}>
                  <RefreshCw size={16} aria-hidden="true" /> {t('diag.replace')}
                </button>
                <button type="button" className="btn-ghost btn-sm flex-1 text-red-700 hover:bg-red-50 sm:flex-none" onClick={onRemove} disabled={disabled}>
                  <Trash2 size={16} aria-hidden="true" /> {t('diag.remove')}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="drop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!disabled) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`rounded-3xl border-2 border-dashed p-6 text-center transition sm:p-10 ${
              dragging ? 'scale-[1.01] border-fresh bg-green-50' : 'border-forest/30 bg-mint/70'
            }`}
          >
            <motion.span
              animate={dragging ? { y: -6 } : { y: 0 }}
              className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-forest shadow-soft"
            >
              <UploadCloud size={32} aria-hidden="true" />
            </motion.span>
            <p className="mt-4 font-display text-xl font-bold">{t('diag.drop')}</p>
            <p className="mt-1 text-base text-ink/70">or choose one from your phone or computer</p>

            <div className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
              <button type="button" className="btn-primary flex-1 text-lg" onClick={() => cameraRef.current?.click()} disabled={disabled}>
                <Camera size={22} aria-hidden="true" /> {t('diag.camera')}
              </button>
              <button type="button" className="btn-secondary flex-1 text-lg" onClick={() => browseRef.current?.click()} disabled={disabled}>
                <ImagePlus size={22} aria-hidden="true" /> {t('diag.browse')}
              </button>
            </div>

            <p className="mt-5 text-sm text-ink/60">
              Supported: {UPLOAD_RULES.acceptedLabel} · up to {UPLOAD_RULES.maxSizeMB} MB
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-base font-medium text-red-900">
          {error}
        </p>
      )}
    </div>
  );
}
