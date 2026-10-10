import { Link } from 'react-router-dom';
import { getStatusMeta } from '../../utils/status';
import { formatDateTime, formatPercent } from '../../utils/format';

/** Chronological list of real scan outcomes (no invented values). */
export default function HealthTimeline({ scans, limit = 6 }) {
  const items = scans.filter((s) => s.createdAt).slice(0, limit);
  return (
    <ol className="relative space-y-5 border-l-2 border-forest/15 pl-6">
      {items.map((s) => {
        const meta = getStatusMeta(s.status);
        return (
          <li key={s.id} className="relative">
            <span className={`absolute -left-[33px] top-1.5 h-4 w-4 rounded-full border-2 border-white ${meta.dot}`} aria-hidden="true" />
            <p className="text-xs font-semibold text-ink/60">{formatDateTime(s.createdAt)}</p>
            <p className="font-semibold">
              <Link to={`/results/${s.id}`} className="hover:text-forest hover:underline">
                {s.disease || meta.label}
              </Link>
            </p>
            <p className={`text-sm ${meta.text}`}>
              {meta.short}
              {s.confidence !== null && s.confidence !== undefined ? ` · model confidence ${formatPercent(s.confidence)}` : ''}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
