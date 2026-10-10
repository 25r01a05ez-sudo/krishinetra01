import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ChevronDown, Filter, Search, ShieldAlert } from 'lucide-react';
import PageHeader from '../components/cards/PageHeader';
import EmptyState from '../components/cards/EmptyState';
import ErrorPanel from '../components/cards/ErrorPanel';
import DemoTag from '../components/cards/DemoTag';
import { useApp } from '../context/AppContext';
import { useScans } from '../hooks/useScans';
import { useGuidance } from '../hooks/useGuidance';
import { useT } from '../i18n';
import { DISEASES, DISEASE_DB_META, getAvailableCrops, diseaseToGuidance } from '../data/diseases';

const DETAIL_SECTIONS = [
  ['symptoms', 'Common visible symptoms'],
  ['preventive', 'General prevention'],
  ['management', 'Reviewed management suggestions'],
  ['immediate', 'Immediate next steps'],
  ['monitoring', 'Monitoring advice'],
  ['expert', 'When to seek expert advice'],
  ['general', 'Other recommendations'],
];

function Placeholder() {
  const { t } = useT();
  return (
    <p className="rounded-xl border border-dashed border-forest/25 bg-mint/60 p-4 text-base text-ink/70">
      {t('guide.notAvailable')}
    </p>
  );
}

function GuidanceCard({ name, defaultOpen = false, isDemo, cropHint }) {
  const [open, setOpen] = useState(defaultOpen);
  const { status, data, error } = useGuidance(name, { enabled: open });
  const panelId = `guide-${name.replace(/\W+/g, '-')}`;

  return (
    <li className="card !p-0 overflow-hidden">
      <button
        type="button"
        className="flex min-h-[64px] w-full items-center justify-between gap-3 p-5 text-start"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-forest">
            <BookOpen size={20} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-lg font-bold">{name}</span>
            {(data?.crop || cropHint) && <span className="text-sm text-ink/60">Crop: {data?.crop || cropHint}</span>}
          </span>
        </span>
        <span className="flex items-center gap-2">
          {isDemo && <DemoTag />}
          <ChevronDown className={`shrink-0 transition ${open ? 'rotate-180' : ''}`} size={22} aria-hidden="true" />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t border-forest/10 p-5">
              {status === 'loading' && <p className="text-base text-ink/65">Loading guidance…</p>}
              {status === 'error' && <ErrorPanel error={error} />}
              {status === 'missing' && <Placeholder />}
              {status === 'ready' && data && (
                <div className="space-y-4">
                  {data.imageUrl && <img src={data.imageUrl} alt={`${name} illustration`} className="max-h-56 rounded-xl object-cover" />}
                  {data.summary && <p className="text-base">{data.summary}</p>}
                  <div className="grid gap-4 md:grid-cols-2">
                    {DETAIL_SECTIONS.filter(([k]) => data[k]?.length).map(([k, label]) => (
                      <section key={k} className="rounded-xl bg-mint/60 p-4">
                        <h4 className="font-display font-bold">{label}</h4>
                        <ul className="mt-2 space-y-1.5">
                          {data[k].map((item, i) => (
                            <li key={i} className="flex gap-2 text-base">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fresh" aria-hidden="true" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </section>
                    ))}
                  </div>
                  {isDemo && <p className="text-sm font-semibold text-yellow-800">Illustrative demo text – not reviewed agricultural advice.</p>}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function Guidance() {
  const { demoMode } = useApp();
  const { scans } = useScans({ fetchServer: false });
  const { t } = useT();
  const [params, setParams] = useSearchParams();
  const initialQ = params.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const [lookup, setLookup] = useState(initialQ);
  const [cropFilter, setCropFilter] = useState('');

  useEffect(() => {
    if (initialQ) setLookup(initialQ);
  }, [initialQ]);

  // Disease names that appeared in user scans
  const seen = useMemo(
    () => [...new Set(scans.filter((s) => s.disease && s.status !== 'healthy' && s.status !== 'unsupported').map((s) => s.disease))],
    [scans],
  );

  const q = query.trim().toLowerCase();
  const visibleSeen = seen.filter((n) => n.toLowerCase().includes(q));
  const lookupName = lookup.trim();

  // All reference diseases filtered by crop and search
  const filteredDiseases = useMemo(() => {
    return DISEASES.filter((d) => {
      if (cropFilter && !d.crop.toLowerCase().includes(cropFilter.toLowerCase())) return false;
      if (q && !d.disease.toLowerCase().includes(q) && !d.crop.toLowerCase().includes(q) && !d.causalAgent.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [q, cropFilter]);

  const crops = useMemo(() => getAvailableCrops(), []);

  const submit = (e) => {
    e.preventDefault();
    const v = query.trim();
    setLookup(v);
    setParams(v ? { q: v } : {});
  };

  return (
    <div>
      <PageHeader title={t('guide.title')} subtitle={t('guide.subtitle')} actions={demoMode ? <DemoTag className="self-center" /> : null} />

      <form onSubmit={submit} className="card mb-6 flex flex-col gap-3 sm:flex-row sm:items-end" role="search">
        <div className="flex-1">
          <label htmlFor="guide-search" className="label">
            {t('guide.searchLabel')}
          </label>
          <div className="relative">
            <Search size={18} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink/45" aria-hidden="true" />
            <input
              id="guide-search"
              className="input ps-10"
              placeholder={t('guide.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <button type="submit" className="btn-primary" disabled={!query.trim()}>
          {t('guide.findBtn')}
        </button>
      </form>

      {/* Disclaimer */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-gold/40 bg-gradient-to-r from-yellow-50 to-white p-4">
        <ShieldAlert size={20} className="mt-0.5 shrink-0 text-yellow-600" />
        <p className="text-sm text-ink/70">{DISEASE_DB_META.disclaimer}</p>
      </div>

      {/* Search result */}
      {lookupName && (
        <section className="mb-8" aria-label={t('guide.searchResult')}>
          <h2 className="mb-3 font-display text-xl font-bold">{t('guide.searchResult')}</h2>
          <ul>
            <GuidanceCard key={lookupName} name={lookupName} defaultOpen isDemo={demoMode} />
          </ul>
        </section>
      )}

      {/* From scans */}
      {seen.length > 0 && (
        <section className="mb-8" aria-label={t('guide.fromScans')}>
          <h2 className="mb-3 font-display text-xl font-bold">{t('guide.fromScans')}</h2>
          <ul className="space-y-3">
            {visibleSeen.map((name) => (
              <GuidanceCard key={name} name={name} isDemo={demoMode} />
            ))}
          </ul>
        </section>
      )}

      {/* Full reference library */}
      <section aria-label="Disease reference library">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-xl font-bold">
            Disease Reference Library
            <span className="ms-2 text-sm font-normal text-ink/50">({filteredDiseases.length} of {DISEASES.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-ink/50" />
            <select
              className="input !min-h-[40px] !w-auto !text-sm"
              value={cropFilter}
              onChange={(e) => setCropFilter(e.target.value)}
              aria-label="Filter by crop"
            >
              <option value="">All crops</option>
              {crops.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredDiseases.length > 0 ? (
          <ul className="space-y-3">
            {filteredDiseases.map((d) => (
              <GuidanceCard key={d.id} name={d.disease} cropHint={d.crop} isDemo={demoMode} />
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={BookOpen}
            title={seen.length ? 'No matches' : t('guide.noDiseasesYet')}
            message="Try a different search term or clear the crop filter."
            action={
              <Link to="/diagnosis" className="btn-secondary">
                {t('guide.scanCrop')}
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}
