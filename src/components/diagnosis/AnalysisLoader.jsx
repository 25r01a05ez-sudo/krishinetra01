import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useT } from '../../i18n';

/**
 * Honest loading state: previews the image with a scanning line and an indeterminate bar.
 * It shows elapsed time only – no fake percentage progress.
 */
export default function AnalysisLoader({ previewUrl, onCancel, isDemo }) {
  const [seconds, setSeconds] = useState(0);
  const { t } = useT();

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="overflow-hidden rounded-2xl border border-forest/15 bg-white shadow-soft"
      role="status"
      aria-live="polite"
    >
      <div className="relative bg-ink/5">
        <img src={previewUrl} alt="Crop image being analysed" className="mx-auto max-h-[380px] w-full object-contain opacity-90" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-fresh/10 to-transparent" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 animate-scan" aria-hidden="true">
          <div className="mx-4 h-1 rounded-full bg-fresh shadow-[0_0_18px_4px_rgba(34,197,94,0.7)]" />
        </div>
      </div>
      <div className="p-5">
        <p className="font-display text-xl font-bold">{t('diag.analyzing')}</p>
        <p className="mt-1 text-sm text-ink/65">
          {isDemo ? 'Demo Mode: preparing a sample result (no AI model is used).' : 'Sending your photo to the analysis server and waiting for the result.'}{' '}
          {seconds}s
        </p>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-mint">
          <motion.div
            className="h-full w-1/3 rounded-full bg-gradient-to-r from-fresh to-forest"
            animate={{ x: ['-100%', '300%'] }}
            transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
          />
        </div>
        <button type="button" className="btn-secondary btn-sm mt-4" onClick={onCancel}>
          <X size={16} aria-hidden="true" /> {t('diag.cancel')}
        </button>
      </div>
    </motion.div>
  );
}
