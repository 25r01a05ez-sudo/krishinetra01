import { FlaskConical, Globe, Server, Trash2 } from 'lucide-react';
import FarmSettings from '../components/FarmSettings';
import PageHeader from '../components/cards/PageHeader';
import { useScans } from '../hooks/useScans';
import { useApp } from '../context/AppContext';
import { API_CONFIG } from '../config';
import { LANGUAGES, useT } from '../i18n';

function Toggle({ id, checked, onChange, label, description }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        <p className="text-sm text-ink/65">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${checked ? 'bg-forest' : 'bg-ink/25'}`}
      >
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? 'left-7' : 'left-1'}`} />
        <span className="sr-only">{checked ? 'On' : 'Off'}</span>
      </button>
    </div>
  );
}

export default function Settings() {
  const { demoMode, setDemoMode, autoSave, setAutoSave, history, clearHistory } = useApp();
  const { lang, setLang, t } = useT();
  const { scans, reload } = useScans();

  const handleClear = async () => {
    if (window.confirm(`Delete all ${demoMode ? 'demo' : 'account'} scans and images?`)) {
      try { await clearHistory(); await reload(); window.alert('History cleared.'); } catch (e) { window.alert(e.message); }
    }
  };

  return (
    <div>
      <PageHeader title={t('nav.settings')} subtitle="Control how KrishiNetra works on this device." />

      <div className="space-y-5">
        <FarmSettings />
        <section className="card space-y-5">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <FlaskConical size={20} className="text-forest" aria-hidden="true" /> Demo Mode (for presentations)
          </h2>
          <Toggle
            id="demo-toggle"
            checked={demoMode}
            onChange={setDemoMode}
            label="Demo Mode"
            description="Shows clearly labelled illustrative samples without contacting the backend. These are NOT real AI predictions. When off, every result comes from the Flask server."
          />
        </section>

        <section className="card space-y-5">
          <h2 className="font-display text-lg font-bold">Scan history</h2>
          {demoMode && <Toggle
            id="autosave-toggle"
            checked={autoSave}
            onChange={setAutoSave}
            label="Save results on this device"
            description="Keeps a small copy of each result and photo thumbnail in this browser so you can review it later."
          />}
          {!demoMode && <p>Live results and images are saved privately to your account after analysis.</p>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-forest/10 pt-4">
            <p className="text-base">
              {scans.length} scan{scans.length === 1 ? '' : 's'} stored{demoMode ? ' (demo)' : ''}.
            </p>
            <button type="button" className="btn-secondary btn-sm text-red-700" onClick={handleClear} disabled={demoMode && !history.length}>
              <Trash2 size={16} aria-hidden="true" /> Clear history
            </button>
          </div>
        </section>

        <section className="card">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Globe size={20} className="text-forest" aria-hidden="true" /> Language
          </h2>
          <label htmlFor="lang" className="label">
            Interface language
          </label>
          <select id="lang" className="input max-w-xs" value={lang} onChange={(e) => setLang(e.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} disabled={!l.available}>
                {l.label}
                {l.available ? '' : ' – not available yet'}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-ink/60">English, Telugu, Hindi and Urdu are available. AI result text follows your selected language.</p>
        </section>

        <section className="card">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
            <Server size={20} className="text-forest" aria-hidden="true" /> Backend connection
          </h2>
          <dl className="grid gap-2 text-base sm:grid-cols-[180px_1fr]">
            <dt className="font-semibold">API base URL</dt>
            <dd className="break-all font-mono text-sm">{API_CONFIG.baseUrl || 'Same origin (/api)'}</dd>
            <dt className="font-semibold">Predict endpoint</dt>
            <dd className="font-mono text-sm">POST {API_CONFIG.routes.predict}</dd>
            <dt className="font-semibold">Upload field name</dt>
            <dd className="font-mono text-sm">{API_CONFIG.uploadFieldName}</dd>
            <dt className="font-semibold">Timeout</dt>
            <dd>{Math.round(API_CONFIG.timeoutMs / 1000)} seconds</dd>
          </dl>
          <p className="mt-3 text-sm text-ink/60">
            Change these in <code>.env</code> (<code>VITE_API_BASE_URL</code>) or <code>src/config.js</code>.
          </p>
        </section>
      </div>
    </div>
  );
}
