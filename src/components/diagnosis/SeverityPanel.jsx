import { SEVERITY_META } from '../../utils/status';
import { useT } from '../../i18n';

/** Shows severity ONLY when the backend supplied a validated value. */
export default function SeverityPanel({ severity }) {
  const { t } = useT();
  const meta = severity ? SEVERITY_META[severity] : null;
  return (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wide text-ink/60">Severity</h3>
      {meta ? (
        <>
          <p className="mt-2 font-display text-2xl font-bold">{meta.label}</p>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-mint" aria-hidden="true">
            <div className={`h-full rounded-full ${meta.bar}`} style={{ width: meta.width }} />
          </div>
        </>
      ) : (
        <p className="mt-2 text-base text-ink/75">{t('res.severityNA')}</p>
      )}
    </div>
  );
}
