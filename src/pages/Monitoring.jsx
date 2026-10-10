import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BellRing, CloudSun, Droplets, Loader2, Plug, Sprout, Thermometer, WifiOff } from 'lucide-react';
import PageHeader from '../components/cards/PageHeader';
import ErrorPanel from '../components/cards/ErrorPanel';
import { getMonitoring, describeApiError } from '../services/api';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';

function Widget({ icon: Icon, title, metric, unitFallback, note, children }) {
  const live = metric && typeof metric.value === 'number';
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="card relative"
      aria-label={title}
    >
      <div className="flex items-start justify-between">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-mint text-forest">
          <Icon size={22} aria-hidden="true" />
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
            live ? 'bg-green-100 text-green-900' : 'bg-gold/30 text-ink'
          }`}
        >
          {live ? 'From server' : 'No data'}
        </span>
      </div>
      <h2 className="mt-4 font-display text-lg font-bold">{title}</h2>
      {live ? (
        <p className="mt-2 font-display text-4xl font-bold">
          {metric.value}
          <span className="ml-1 text-xl font-semibold text-ink/60">{metric.unit || unitFallback}</span>
        </p>
      ) : (
        <>
          <p className="mt-2 font-display text-4xl font-bold text-ink/25" aria-hidden="true">
            — —
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink/65">
            <WifiOff size={15} aria-hidden="true" /> No live data available
          </p>
        </>
      )}
      {metric?.updatedAt && <p className="mt-2 text-xs">Updated: {new Date(metric.updatedAt).toLocaleString()}</p>}
      {note && <p className="mt-3 text-sm text-ink/60">{note}</p>}
      {children}
    </motion.section>
  );
}

export default function Monitoring() {
  const { demoMode } = useApp();
  const { t } = useT();
  const [state, setState] = useState({ status: 'idle', data: null, error: null });

  const check = async () => {
    setState({ status: 'loading', data: null, error: null });
    try {
      const data = await getMonitoring();
      setState(data ? { status: 'ready', data, error: null } : { status: 'empty', data: null, error: null });
    } catch (error) {
      setState({ status: error.kind === 'not_available' ? 'unavailable' : 'error', data: null, error });
    }
  };

  useEffect(() => { if (!demoMode) check(); else setState({ status: 'idle', data: null, error: null }); }, [demoMode]);

  const d = state.data;

  return (
    <div>
      <PageHeader eyebrow="Farm conditions" title={t('mon.title')} subtitle="Weather estimates and measurements you submit." />

      <div className="mb-6 rounded-2xl border border-gold/50 bg-yellow-50 p-5">
        <p className="font-semibold">Know where your readings come from.</p>
        <p className="mt-1 text-base text-ink/75">
          Set your farm location in Settings for Open-Meteo weather estimates. Soil moisture stays empty until you submit a measurement. Weather estimates are not field sensor readings.
        </p>
        {demoMode && <p className="mt-2 text-sm font-semibold text-yellow-900">Demo Mode does not create sensor or weather data.</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <Widget icon={Thermometer} title="Temperature" metric={d?.temperature} unitFallback="°C" note="Air temperature near your crop." />
        <Widget icon={Droplets} title="Humidity" metric={d?.humidity} unitFallback="%" note="Moist air can influence some crop problems." />
        <Widget icon={Sprout} title="Soil moisture" metric={d?.soilMoisture} unitFallback="%" note="Needs a field sensor to be connected." />

        <section className="card sm:col-span-2" aria-label="Weather overview">
          <div className="flex items-start justify-between">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-mint text-forest">
              <CloudSun size={22} aria-hidden="true" />
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${d?.weather ? 'bg-green-100 text-green-900' : 'bg-gold/30 text-ink'}`}>
              {d?.weather ? 'From server' : 'No data'}
            </span>
          </div>
          <h2 className="mt-4 font-display text-lg font-bold">Weather overview</h2>
          {d?.weather ? (
            <p className="mt-2 text-lg">{d.weather}</p>
          ) : (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-ink/65">
              <WifiOff size={15} aria-hidden="true" /> No live data available
            </p>
          )}
        </section>

        <section className="card" aria-label="Environmental risk notifications">
          <div className="flex items-start justify-between">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-mint text-forest">
              <BellRing size={22} aria-hidden="true" />
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${d?.alerts?.length ? 'bg-green-100 text-green-900' : 'bg-gold/30 text-ink'}`}>
              {d?.alerts?.length ? 'From server' : 'No data'}
            </span>
          </div>
          <h2 className="mt-4 font-display text-lg font-bold">Environmental risk notifications</h2>
          {d?.alerts?.length ? (
            <ul className="mt-2 space-y-1.5">
              {d.alerts.map((a, i) => (
                <li key={i} className="text-base">
                  • {a}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-ink/65">
              <WifiOff size={15} aria-hidden="true" /> No notifications available
            </p>
          )}
        </section>
      </div>

      <p className="mt-5 text-sm"><a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="underline">Weather data: Open-Meteo</a> · CC BY 4.0</p>

      {/* Connection check */}
      <div className="card mt-8">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
          <Plug size={20} className="text-forest" aria-hidden="true" /> Refresh farm conditions
        </h2>
        <p className="mt-1 text-base text-ink/70">
          Refresh to load the latest available weather estimates and submitted measurements.
        </p>
        <button type="button" className="btn-secondary btn-sm mt-4" onClick={check} disabled={state.status === 'loading' || demoMode}>
          {state.status === 'loading' ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Plug size={16} aria-hidden="true" />}
          Refresh readings
        </button>
        {demoMode && <p className="mt-2 text-sm text-ink/60">Turn off Demo Mode to contact the backend.</p>}
        <div className="mt-4" aria-live="polite">
          {state.status === 'unavailable' && <p className="text-base text-ink/75">The backend does not offer monitoring data yet ({describeApiError(state.error).message}).</p>}
          {state.status === 'empty' && <p className="text-base text-ink/75">The backend replied, but it contained no readings.</p>}
          {state.status === 'ready' && <p className="text-base font-semibold text-green-800">Available data loaded from the server.</p>}
          {state.status === 'error' && <ErrorPanel error={state.error} onRetry={check} />}
        </div>
      </div>
    </div>
  );
}
