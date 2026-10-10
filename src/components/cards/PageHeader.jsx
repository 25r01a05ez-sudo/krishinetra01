export default function PageHeader({ eyebrow, title, subtitle, actions, badge }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <span className="eyebrow mb-3">{eyebrow}</span>}
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-base text-ink/75 sm:text-lg">{subtitle}</p>}
        {badge && (
          <span className="mt-3 inline-flex items-center rounded-full border border-gold/60 bg-gold/20 px-3 py-1 text-sm font-semibold text-ink">
            {badge}
          </span>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
