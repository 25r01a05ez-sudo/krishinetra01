import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle2, Clock, ScanLine, BarChart3, PieChart as PieIcon, LineChart as LineIcon } from 'lucide-react';
import PageHeader from '../components/cards/PageHeader';
import StatCard from '../components/cards/StatCard';
import EmptyState from '../components/cards/EmptyState';
import ScanThumb from '../components/cards/ScanThumb';
import StatusBadge from '../components/cards/StatusBadge';
import DemoTag from '../components/cards/DemoTag';
import ScanActivityChart from '../components/charts/ScanActivityChart';
import DiseaseBreakdownChart from '../components/charts/DiseaseBreakdownChart';
import HealthTimeline from '../components/charts/HealthTimeline';
import { useApp } from '../context/AppContext';
import { useScans } from '../hooks/useScans';
import { MIN_CHART_POINTS } from '../config';
import { formatDateTime, formatPercent } from '../utils/format';
import { useT } from '../i18n';

function ChartCard({ icon: Icon, title, enough, children, minimum = MIN_CHART_POINTS }) {
  return (
    <section className="card">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
        <Icon size={20} className="text-forest" aria-hidden="true" /> {title}
      </h2>
      {enough ? (
        children
      ) : (
        <EmptyState compact icon={Icon} title="Not enough scans yet" message={`This chart appears after at least ${minimum} real scans.`} />
      )}
    </section>
  );
}

export default function Dashboard() {
  const { demoMode } = useApp();
  const { scans, serverState } = useScans();
  const { t } = useT();

  const total = scans.length;
  const healthy = scans.filter((s) => s.status === 'healthy').length;
  const disease = scans.filter((s) => s.status === 'disease').length;
  const latest = scans[0];
  const hasData = total > 0;
  const enough = total >= MIN_CHART_POINTS;

  return (
    <div>
      <PageHeader
        title={t('dash.title')}
        subtitle={t('dash.subtitle')}
        actions={
          <>
            {demoMode && <DemoTag className="self-center" />}
            <Link to="/diagnosis" className="btn-primary">
              <ScanLine size={20} aria-hidden="true" /> New Diagnosis
            </Link>
          </>
        }
      />

      {serverState === 'error' && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="status">
          Server history could not be loaded, so only scans saved on this device are counted.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Activity} label="Total Crop Scans" value={total} hint={hasData ? 'Across all saved scans' : 'No scans yet'} />
        <StatCard
          icon={CheckCircle2}
          label="Supported Healthy Results"
          value={hasData ? healthy : '—'}
          hint={hasData ? 'Model found no supported disease' : 'Appears after your first scan'}
          delay={0.05}
        />
        <StatCard
          icon={AlertTriangle}
          label="Potential Disease Detections"
          value={hasData ? disease : '—'}
          hint={hasData ? 'Possible disease or pest' : 'Appears after your first scan'}
          tone="amber"
          delay={0.1}
        />
        <StatCard
          icon={Clock}
          label="Latest Scan"
          value={latest?.createdAt ? new Date(latest.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : '—'}
          hint={latest ? formatDateTime(latest.createdAt) : 'No scans yet'}
          tone="gold"
          delay={0.15}
        />
      </div>

      {!hasData ? (
        <div className="mt-6">
          <EmptyState
            icon={ScanLine}
            title="Welcome! Let's scan your first crop"
            message="Your results, charts and crop health timeline will appear here after you analyse a leaf photo."
            action={
              <Link to="/diagnosis" className="btn-primary text-lg">
                <ScanLine size={22} aria-hidden="true" /> Scan Your Crop
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {/* Latest scan */}
          <section className="card mt-6">
            <h2 className="mb-4 font-display text-lg font-bold">Latest scan</h2>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <ScanThumb src={latest.thumbnail} className="h-28 w-28" />
              <dl className="grid flex-1 gap-x-6 gap-y-2 text-base sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-ink/60">AI prediction</dt>
                  <dd className="font-semibold">{latest.disease || 'No label returned'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-ink/60">Crop</dt>
                  <dd className="font-semibold">{latest.crop || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-ink/60">Date and time</dt>
                  <dd className="font-semibold">{formatDateTime(latest.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-ink/60">Status</dt>
                  <dd className="mt-0.5">
                    <StatusBadge status={latest.status} />
                    {latest.confidence !== null && latest.confidence !== undefined && (
                      <span className="ml-2 text-sm text-ink/60">confidence {formatPercent(latest.confidence)}</span>
                    )}
                  </dd>
                </div>
              </dl>
              <Link to={`/results/${latest.id}`} className="btn-secondary self-start sm:self-center">
                View Details
              </Link>
            </div>
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <ChartCard icon={BarChart3} title="Crop scan activity (last 14 days)" enough={enough}>
              <ScanActivityChart scans={scans} />
            </ChartCard>
            <ChartCard icon={PieIcon} title="Disease detection breakdown" enough={enough}>
              <DiseaseBreakdownChart scans={scans} />
            </ChartCard>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <section className="card">
              <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
                <LineIcon size={20} className="text-forest" aria-hidden="true" /> Crop health timeline
              </h2>
              <HealthTimeline scans={scans} />
            </section>
            <section className="card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Recent scan history</h2>
                <Link to="/history" className="text-sm font-semibold text-forest hover:underline">
                  View all
                </Link>
              </div>
              <ul className="divide-y divide-forest/10">
                {scans.slice(0, 5).map((s) => (
                  <li key={s.id} className="flex items-center gap-3 py-3">
                    <ScanThumb src={s.thumbnail} className="h-12 w-12" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{s.disease || 'No label returned'}</p>
                      <p className="text-sm text-ink/60">{formatDateTime(s.createdAt)}</p>
                    </div>
                    <StatusBadge status={s.status} />
                    <Link to={`/results/${s.id}`} className="text-sm font-semibold text-forest hover:underline">
                      Open
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
