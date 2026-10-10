import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, History as HistoryIcon, Loader2, ScanLine, Search, SearchX, Trash2, CloudOff } from 'lucide-react';
import PageHeader from '../components/cards/PageHeader';
import EmptyState from '../components/cards/EmptyState';
import ErrorPanel from '../components/cards/ErrorPanel';
import ScanThumb from '../components/cards/ScanThumb';
import StatusBadge from '../components/cards/StatusBadge';
import DemoTag from '../components/cards/DemoTag';
import { useApp } from '../context/AppContext';
import { useScans } from '../hooks/useScans';
import { formatDateTime, formatPercent } from '../utils/format';
import { useT } from '../i18n';
import { API_CONFIG } from '../config';

const STATUS_OPTIONS = [
  ['all', 'All results'],
  ['healthy', 'Healthy'],
  ['disease', 'Possible disease'],
  ['uncertain', 'Uncertain'],
  ['unsupported', 'Unsupported'],
  ['unknown', 'Status not provided'],
];

export default function History() {
  const { removeScan, demoMode, storageWarning } = useApp();
  const { scans, serverState, serverError, reload } = useScans();
  const { t } = useT();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [crop, setCrop] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const crops = useMemo(() => [...new Set(scans.map((s) => s.crop).filter(Boolean))].sort(), [scans]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromT = from ? new Date(`${from}T00:00:00`).getTime() : null;
    const toT = to ? new Date(`${to}T23:59:59`).getTime() : null;
    return scans.filter((s) => {
      if (status !== 'all' && s.status !== status) return false;
      if (crop !== 'all' && s.crop !== crop) return false;
      const time = s.createdAt ? new Date(s.createdAt).getTime() : null;
      if (fromT !== null && (time === null || time < fromT)) return false;
      if (toT !== null && (time === null || time > toT)) return false;
      if (q) {
        const hay = `${s.disease || ''} ${s.crop || ''} ${s.fileName || ''} ${s.status || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [scans, query, status, crop, from, to]);

  const filtersActive = query || status !== 'all' || crop !== 'all' || from || to;
  const clearFilters = () => {
    setQuery('');
    setStatus('all');
    setCrop('all');
    setFrom('');
    setTo('');
  };

  const handleDelete = async (scan) => {
    if (!window.confirm('Delete this scan and its image?')) return;
    try { await removeScan(scan.id, scan.predictionId); await reload(); }
    catch (e) { window.alert(e.message); }
  };

  return (
    <div>
      <PageHeader
        title={t('hist.title')}
        subtitle={t('hist.subtitle')}
        actions={
          <>
            {demoMode && <DemoTag className="self-center" />}
            {!demoMode && <a className="btn-secondary" href={`${API_CONFIG.baseUrl}/api/history/export`}>Export CSV</a>}
            <Link to="/diagnosis" className="btn-primary">
              <ScanLine size={20} aria-hidden="true" /> New Diagnosis
            </Link>
          </>
        }
      />

      {/* Source status banners */}
      {serverState === 'loading' && (
        <p className="mb-4 flex items-center gap-2 text-sm text-ink/65" role="status">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" /> Checking the server for saved scans…
        </p>
      )}
      {serverState === 'unavailable' && (
        <p className="mb-4 flex items-start gap-2 rounded-xl border border-forest/15 bg-mint px-4 py-3 text-sm" role="status">
          <CloudOff size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          Server history is not available yet. Showing scans saved on this device.
        </p>
      )}
      {serverState === 'error' && (
        <div className="mb-4">
          <ErrorPanel error={serverError} title="Could not load server history" onRetry={reload} />
        </div>
      )}
      {storageWarning && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="alert">
          This device is running out of storage, so older scan images may not be kept.
        </p>
      )}

      {/* Filters */}
      <div className="card mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2">
          <label htmlFor="hist-search" className="label">
            Search
          </label>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/45" aria-hidden="true" />
            <input
              id="hist-search"
              type="search"
              className="input pl-10"
              placeholder="Disease, crop or file name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="hist-status" className="label">
            Result
          </label>
          <select id="hist-status" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="hist-from" className="label">
            From date
          </label>
          <input id="hist-from" type="date" className="input" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label htmlFor="hist-to" className="label">
            To date
          </label>
          <input id="hist-to" type="date" className="input" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        </div>
        {crops.length > 0 && (
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="hist-crop" className="label">
              Crop
            </label>
            <select id="hist-crop" className="input" value={crop} onChange={(e) => setCrop(e.target.value)}>
              <option value="all">All crops</option>
              {crops.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
        {filtersActive && (
          <div className="flex items-end">
            <button type="button" className="btn-ghost btn-sm" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* List */}
      {scans.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="No scans yet"
          message="After you analyse a crop photo, the result is kept here so you can look back at it."
          action={
            <Link to="/diagnosis" className="btn-primary">
              <ScanLine size={20} aria-hidden="true" /> Scan Your Crop
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No scans match your filters"
          message="Try a different search or clear the filters."
          action={
            <button type="button" className="btn-secondary" onClick={clearFilters}>
              Clear filters
            </button>
          }
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-ink/65" aria-live="polite">
            Showing {filtered.length} of {scans.length} scans
          </p>
          <ul className="space-y-3">
            {filtered.map((s) => (
              <li key={s.id} className="card flex flex-col gap-4 !p-4 sm:flex-row sm:items-center">
                <ScanThumb src={s.thumbnail} className="h-20 w-20" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-display text-lg font-bold">{s.disease || 'No label returned'}</p>
                    <StatusBadge status={s.status} />
                    {s.isDemo && <DemoTag />}
                  </div>
                  <p className="mt-0.5 text-sm text-ink/65">
                    {formatDateTime(s.createdAt)}
                    {s.crop ? ` · ${s.crop}` : ''}
                    {s.confidence !== null && s.confidence !== undefined ? ` · confidence ${formatPercent(s.confidence)}` : ''}
                    {s.source === 'server' ? ' · from server' : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/results/${s.id}`} className="btn-secondary btn-sm flex-1 sm:flex-none">
                    <Eye size={16} aria-hidden="true" /> View Details
                  </Link>
                  {true && (
                    <button
                      type="button"
                      className="btn-ghost btn-sm text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(s)}
                      aria-label={`Remove scan from ${formatDateTime(s.createdAt)}`}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
