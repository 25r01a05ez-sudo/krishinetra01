import { AlertOctagon, CalendarCheck, Footprints, ShieldPlus, Stethoscope, Eye } from 'lucide-react';

const SECTIONS = [
  { key: 'immediate', title: 'Immediate next steps', icon: Footprints },
  { key: 'preventive', title: 'Preventive measures', icon: ShieldPlus },
  { key: 'monitoring', title: 'Crop monitoring suggestions', icon: CalendarCheck },
  { key: 'expert', title: 'When to seek agricultural expert advice', icon: Stethoscope },
];

function List({ items }) {
  return (
    <ul className="mt-2 space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 text-base">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fresh" aria-hidden="true" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Shows reviewed guidance supplied by the backend (or clearly-labelled demo guidance).
 * Never generates its own treatment advice.
 */
export default function GuidancePanel({ guidance, status, loading, isDemo }) {
  if (loading) {
    return <p className="text-base text-ink/65">Looking for guidance…</p>;
  }

  const uncertainNote =
    status === 'uncertain' || status === 'unknown' ? (
      <div className="mb-4 flex gap-3 rounded-xl border border-yellow-300 bg-yellow-50 p-4 text-yellow-950" role="note">
        <AlertOctagon className="mt-0.5 shrink-0" size={20} aria-hidden="true" />
        <p className="text-base font-medium">
          The AI cannot confidently identify the issue. Please ask a local agriculture officer or expert to examine the plant.
        </p>
      </div>
    ) : null;

  if (!guidance) {
    return (
      <div>
        {uncertainNote}
        <div className="rounded-xl border border-dashed border-forest/25 bg-mint/60 p-5">
          <p className="font-semibold">Management guidance is not available for this result yet.</p>
          <p className="mt-1 text-base text-ink/70">
            Reviewed guidance appears here when the backend provides it. In the meantime, consider asking your local
            agriculture officer or Krishi Vigyan Kendra about what you see on the plant.
          </p>
        </div>
      </div>
    );
  }

  const groups = SECTIONS.filter((s) => guidance[s.key]?.length);
  const extras = [
    { title: 'Management suggestions', items: guidance.management, icon: Eye },
    { title: 'Recommended actions', items: guidance.general, icon: Footprints },
  ].filter((e) => e.items?.length);

  return (
    <div>
      {uncertainNote}
      {isDemo && <p className="mb-3 text-sm font-semibold text-yellow-800">Illustrative demo guidance – not reviewed agricultural advice.</p>}
      {guidance.summary && <p className="mb-4 text-base">{guidance.summary}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {[...groups, ...extras.map((e) => ({ ...e, key: e.title }))].map((g) => {
          const Icon = g.icon;
          const items = g.items || guidance[g.key];
          return (
            <section key={g.title} className="rounded-xl border border-forest/10 bg-mint/50 p-4">
              <h4 className="flex items-center gap-2 font-display text-base font-bold">
                <Icon size={18} className="text-forest" aria-hidden="true" /> {g.title}
              </h4>
              <List items={items} />
            </section>
          );
        })}
      </div>
      {!groups.length && !extras.length && !guidance.summary && (
        <p className="text-base text-ink/70">The server returned guidance without any readable steps.</p>
      )}
    </div>
  );
}
