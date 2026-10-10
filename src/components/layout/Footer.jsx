import { Link } from 'react-router-dom';
import Logo from './Logo';
import { TEAM } from '../../config';

export default function Footer() {
  return (
    <footer className="mt-16 bg-deep text-green-50">
      <div className="container-page grid gap-10 py-12 md:grid-cols-3">
        <div>
          <Logo light />
          <p className="mt-4 max-w-sm text-sm text-green-100/90">{TEAM.tagline}</p>
          <p className="mt-3 text-sm text-green-100/70">
            An AI-assisted prototype. Results are indicative and must be validated by agriculture experts.
          </p>
        </div>
        <div>
          <h2 className="font-display text-base font-semibold text-white">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              ['/diagnosis', 'Crop Diagnosis'],
              ['/dashboard', 'Dashboard'],
              ['/history', 'Scan History'],
              ['/guidance', 'Guidance'],
              ['/monitoring', 'Monitoring'],
              ['/about', 'About the Project'],
            ].map(([to, label]) => (
              <li key={to}>
                <Link className="text-green-100/90 hover:text-gold" to={to}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-display text-base font-semibold text-white">Project</h2>
          <dl className="mt-3 space-y-2 text-sm text-green-100/90">
            <div>
              <dt className="inline text-green-100/60">Team: </dt>
              <dd className="inline">{TEAM.name}</dd>
            </div>
            <div>
              <dt className="inline text-green-100/60">Event: </dt>
              <dd className="inline">{TEAM.competition}</dd>
            </div>
            <div>
              <dt className="inline text-green-100/60">Problem Statement: </dt>
              <dd className="inline">{TEAM.problemStatementId}</dd>
            </div>
            <div>
              <dt className="inline text-green-100/60">Theme: </dt>
              <dd className="inline">Smart Agriculture</dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-green-100/70">
        © {new Date().getFullYear()} Team {TEAM.name} · {TEAM.competition} · {TEAM.problemStatementId}
      </div>
    </footer>
  );
}
