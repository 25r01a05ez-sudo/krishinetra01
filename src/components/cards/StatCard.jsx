import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, hint, tone = 'green', delay = 0 }) {
  const tones = {
    green: 'bg-mint text-forest',
    amber: 'bg-amber-50 text-amber-700',
    gold: 'bg-yellow-50 text-yellow-700',
    slate: 'bg-slate-100 text-slate-700',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="card card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink/65">{label}</p>
          <p className="mt-2 break-words font-display text-3xl font-bold">{value}</p>
          {hint && <p className="mt-1 text-sm text-ink/60">{hint}</p>}
        </div>
        {Icon && (
          <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
            <Icon size={22} aria-hidden="true" />
          </span>
        )}
      </div>
    </motion.div>
  );
}
