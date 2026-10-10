import { getStatusMeta } from '../../utils/status';

export default function StatusBadge({ status, large = false }) {
  const meta = getStatusMeta(status);
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${meta.badge} ${
        large ? 'px-4 py-1.5 text-base' : 'px-2.5 py-0.5 text-xs'
      }`}
    >
      <Icon size={large ? 18 : 14} aria-hidden="true" />
      {large ? meta.label : meta.short}
    </span>
  );
}
