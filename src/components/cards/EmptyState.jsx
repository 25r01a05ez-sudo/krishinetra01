export default function EmptyState({ icon: Icon, title, message, action, compact = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-forest/25 bg-mint/60 text-center ${
        compact ? 'px-4 py-8' : 'px-6 py-14'
      }`}
    >
      {Icon && (
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-forest shadow-soft">
          <Icon size={28} aria-hidden="true" />
        </span>
      )}
      <h3 className="text-lg font-bold">{title}</h3>
      {message && <p className="mt-1.5 max-w-md text-base text-ink/70">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
