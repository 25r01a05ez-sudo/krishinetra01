import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { formatPercent } from '../../utils/format';
import { LOW_CONFIDENCE_THRESHOLD } from '../../config';
import { useT } from '../../i18n';

export default function ConfidenceMeter({ confidence }) {
  const { t } = useT();
  if (confidence === null || confidence === undefined) {
    return (
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-ink/60">Model confidence</h3>
        <p className="mt-2 text-base text-ink/75">The server did not return a confidence value.</p>
      </div>
    );
  }
  const pct = Math.round(confidence * 100);
  const low = confidence < LOW_CONFIDENCE_THRESHOLD;
  return (
    <div>
      <div className="flex items-end justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-ink/60">Model confidence</h3>
        <span className="font-display text-3xl font-bold">{formatPercent(confidence)}</span>
      </div>
      <div
        className="mt-2 h-3 overflow-hidden rounded-full bg-mint"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Model confidence"
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${low ? 'bg-gold' : 'bg-fresh'}`}
        />
      </div>
      {low && <p className="mt-2 text-sm font-semibold text-yellow-800">Confidence is low – treat this result with extra caution.</p>}
      <p className="mt-2 flex items-start gap-1.5 text-sm text-ink/65">
        <Info size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> {t('res.confidenceNote')}
      </p>
    </div>
  );
}
