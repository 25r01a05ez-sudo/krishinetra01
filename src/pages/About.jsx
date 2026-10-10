import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, Cpu, Rocket, Sprout, Target, Users, Workflow } from 'lucide-react';
import PageHeader from '../components/cards/PageHeader';
import { LogoMark } from '../components/layout/Logo';
import { ABOUT } from '../data/content';
import { TEAM } from '../config';

function Block({ icon: Icon, title, children }) {
  return (
    <section className="card">
      <h2 className="flex items-center gap-2.5 font-display text-xl font-bold">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-forest">
          <Icon size={20} aria-hidden="true" />
        </span>
        {title}
      </h2>
      <div className="mt-3 text-base text-ink/80">{children}</div>
    </section>
  );
}

const Bullets = ({ items }) => (
  <ul className="space-y-2">
    {items.map((i) => (
      <li key={i} className="flex gap-2.5">
        <CheckCircle2 size={18} className="mt-1 shrink-0 text-fresh" aria-hidden="true" />
        <span>{i}</span>
      </li>
    ))}
  </ul>
);

export default function About() {
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mb-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <LogoMark className="h-20 w-20" />
        <PageHeader eyebrow="About the project" title={TEAM.project} subtitle={TEAM.tagline} />
      </div>

      <dl className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Project', TEAM.project],
          ['Team', TEAM.name],
          ['Competition', TEAM.competition],
          ['Problem Statement', TEAM.problemStatementId],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-forest/10 bg-white p-4 shadow-soft">
            <dt className="text-xs font-bold uppercase tracking-wider text-forest/70">{k}</dt>
            <dd className="mt-1 font-display text-lg font-bold">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-5 lg:grid-cols-2">
        <Block icon={Target} title="The agricultural problem">
          <p>{ABOUT.problem}</p>
          <p className="mt-2 text-sm text-ink/60">Problem statement SIH26131: Early detection and management of crop disease and infestation.</p>
        </Block>
        <Block icon={Sprout} title="Our proposed AI-assisted solution">
          <p>{ABOUT.solution}</p>
        </Block>
        <Block icon={Workflow} title="How the application works">
          <ol className="list-decimal space-y-2 pl-5">
            {ABOUT.how.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ol>
        </Block>
        <Block icon={Cpu} title="Technologies involved">
          <ul className="flex flex-wrap gap-2">
            {ABOUT.tech.map((t) => (
              <li key={t} className="rounded-full border border-forest/15 bg-mint px-3 py-1 text-sm font-medium">
                {t}
              </li>
            ))}
          </ul>
        </Block>
        <Block icon={CheckCircle2} title="Expected benefits for farmers">
          <Bullets items={ABOUT.benefits} />
        </Block>
        <Block icon={Rocket} title="Future improvements">
          <Bullets items={ABOUT.future} />
        </Block>
      </div>

      <div className="mt-6 flex gap-3 rounded-2xl border border-gold/60 bg-yellow-50 p-5">
        <AlertTriangle className="mt-0.5 shrink-0 text-yellow-700" size={22} aria-hidden="true" />
        <p className="text-base">
          <strong>Validation notice:</strong> KrishiNetra is a prototype. Its predictions and its field performance still need to be
          validated with agricultural experts before real-world reliance.
        </p>
      </div>

      <section className="mt-10" aria-labelledby="team-heading">
        <h2 id="team-heading" className="mb-4 flex items-center gap-2 font-display text-2xl font-bold">
          <Users size={24} className="text-forest" aria-hidden="true" /> Team {TEAM.name}
        </h2>
        <p className="mb-5 text-sm text-ink/60">
          Placeholders – edit the <code>TEAM.members</code> list in <code>src/config.js</code> with real names and roles.
        </p>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.members.map((m, i) => (
            <li key={i} className="card flex items-center gap-4 !p-4">
              <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fresh to-forest font-display text-xl font-bold text-white" aria-hidden="true">
                {i + 1}
              </span>
              <div>
                <p className="font-bold">{m.name}</p>
                <p className="text-sm text-ink/60">{m.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 text-center">
        <Link to="/diagnosis" className="btn-primary text-lg">
          Try the diagnosis <ArrowRight size={20} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
