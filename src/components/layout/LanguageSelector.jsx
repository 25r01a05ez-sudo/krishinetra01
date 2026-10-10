import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Globe, Search } from 'lucide-react';
import { LANGUAGES, useT } from '../../i18n';

const groups = [
  { key: 'primary', labelKey: 'langSelector.primary' },
  { key: 'additional', labelKey: 'langSelector.additional' },
  { key: 'indigenous', labelKey: 'langSelector.indigenous' },
];

export default function LanguageSelector({ mobile = false }) {
  const { lang, setLang, t } = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const searchRef = useRef(null);

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  // Close on outside click
  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Focus search when opened
  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  // Close on escape
  useEffect(() => {
    const handle = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = LANGUAGES.filter(
    (l) =>
      !q ||
      l.label.toLowerCase().includes(q) ||
      l.nativeLabel.toLowerCase().includes(q) ||
      l.code.includes(q)
  );

  const selectLang = (code) => {
    setLang(code);
    setOpen(false);
    setQuery('');
  };

  if (mobile) {
    return (
      <div className="space-y-2">
        <label htmlFor="mobile-lang-select" className="flex items-center gap-2 text-sm font-semibold text-ink/70">
          <Globe size={16} /> {t('langSelector.label')}
        </label>
        <select
          id="mobile-lang-select"
          className="input"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          aria-label={t('langSelector.label')}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code} disabled={!l.available}>
              {l.nativeLabel} ({l.label}){!l.available ? ` — ${t('langSelector.awaitingReview')}` : ''}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-xl border border-forest/15 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-forest/30 hover:shadow-soft"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('langSelector.label')}
      >
        <Globe size={16} className="text-forest" />
        <span className="hidden sm:inline">{current.nativeLabel}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute end-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-forest/10 bg-white shadow-lift"
            role="listbox"
            aria-label={t('langSelector.label')}
          >
            {/* Search */}
            <div className="border-b border-forest/10 p-2">
              <div className="relative">
                <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink/35" />
                <input
                  ref={searchRef}
                  type="text"
                  className="w-full rounded-lg border border-forest/10 bg-cream py-2 ps-8 pe-3 text-sm placeholder:text-ink/40 focus:border-fresh focus:outline-none focus:ring-1 focus:ring-fresh/40"
                  placeholder={t('langSelector.search')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Language groups */}
            <div className="max-h-80 overflow-y-auto p-1.5">
              {groups.map(({ key, labelKey }) => {
                const items = filtered.filter((l) => l.group === key);
                if (items.length === 0) return null;
                return (
                  <div key={key} className="mb-1">
                    <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ink/40">
                      {t(labelKey)}
                    </p>
                    {items.map((l) => {
                      const isSelected = l.code === lang;
                      return (
                        <button
                          key={l.code}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          disabled={!l.available}
                          onClick={() => l.available && selectLang(l.code)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm transition ${
                            isSelected
                              ? 'bg-mint text-forest font-semibold'
                              : l.available
                                ? 'text-ink hover:bg-mint/70'
                                : 'cursor-not-allowed text-ink/35'
                          }`}
                        >
                          <span className="flex-1">
                            <span className="block font-medium">{l.nativeLabel}</span>
                            <span className="text-xs text-ink/50">{l.label}</span>
                          </span>
                          {isSelected && <Check size={16} className="text-forest" />}
                          {!l.available && (
                            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-ink/50">
                              {t('langSelector.awaitingReview')}
                            </span>
                          )}
                          {l.available && l.completeness < 100 && !isSelected && (
                            <span className="rounded-full bg-fresh/15 px-2 py-0.5 text-[10px] font-bold text-fresh">
                              {l.completeness}%
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="px-3 py-4 text-center text-sm text-ink/50">No languages found</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
