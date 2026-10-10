/**
 * KrishiNetra i18n system.
 * - Supports 4 primary languages: English, Telugu, Hindi, Urdu
 * - Urdu is RTL — document direction is set automatically
 * - Additional/indigenous languages are listed but disabled until verified
 * - Language selection persists via localStorage
 * - Missing keys fall back to English
 * - Parameter interpolation via {param} syntax
 */
import { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import en from './en';
import hi from './hi';
import te from './te';
import ur from './ur';

/* ─── Language registry ──────────────────────────────────────────── */

export const LANGUAGES = [
  // Primary — fully translated & available
  { code: 'en', label: 'English', nativeLabel: 'English', dict: en, available: true, dir: 'ltr', group: 'primary', completeness: 100 },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', dict: te, available: true, dir: 'ltr', group: 'primary', completeness: 95 },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', dict: hi, available: true, dir: 'ltr', group: 'primary', completeness: 95 },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو', dict: ur, available: true, dir: 'rtl', group: 'primary', completeness: 85 },

  // Additional regional — awaiting verified translations
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', dict: {}, available: false, dir: 'ltr', group: 'additional', completeness: 0 },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', dict: {}, available: false, dir: 'ltr', group: 'additional', completeness: 0 },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', dict: {}, available: false, dir: 'ltr', group: 'additional', completeness: 0 },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം', dict: {}, available: false, dir: 'ltr', group: 'additional', completeness: 0 },
  { code: 'or', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ', dict: {}, available: false, dir: 'ltr', group: 'additional', completeness: 0 },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', dict: {}, available: false, dir: 'ltr', group: 'additional', completeness: 0 },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી', dict: {}, available: false, dir: 'ltr', group: 'additional', completeness: 0 },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ', dict: {}, available: false, dir: 'ltr', group: 'additional', completeness: 0 },

  // Indigenous / tribal — awaiting verified translations & script review
  { code: 'lmn', label: 'Lambadi / Banjara', nativeLabel: 'Lambadi / Gor Boli', dict: {}, available: false, dir: 'ltr', group: 'indigenous', completeness: 0 },
  { code: 'gon', label: 'Gondi', nativeLabel: 'Gondi', dict: {}, available: false, dir: 'ltr', group: 'indigenous', completeness: 0 },
  { code: 'kff', label: 'Koya', nativeLabel: 'Koya', dict: {}, available: false, dir: 'ltr', group: 'indigenous', completeness: 0 },
  { code: 'nit', label: 'Kolami', nativeLabel: 'Kolami', dict: {}, available: false, dir: 'ltr', group: 'indigenous', completeness: 0 },
  { code: 'cde', label: 'Chenchu', nativeLabel: 'Chenchu', dict: {}, available: false, dir: 'ltr', group: 'indigenous', completeness: 0 },
  { code: 'yeu', label: 'Yerukala', nativeLabel: 'Yerukala', dict: {}, available: false, dir: 'ltr', group: 'indigenous', completeness: 0 },
];

const LS_KEY = 'krishinetra.lang';

/* ─── Context ────────────────────────────────────────────────────── */

const I18nContext = createContext({
  t: (k) => k,
  lang: 'en',
  dir: 'ltr',
  setLang: () => {},
});

/**
 * Translation function factory.
 * Supports parameter interpolation: t('key', { name: 'Ravi' })
 *   where key value is "Hello {name}" → "Hello Ravi"
 */
function makeT(dict) {
  return (key, params) => {
    let value = dict[key] ?? en[key] ?? key;
    if (params && typeof value === 'string') {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
      });
    }
    return value;
  };
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      return LANGUAGES.find((l) => l.code === saved && l.available) ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const langMeta = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
  const dir = langMeta.dir;

  // Apply RTL/LTR to <html> element
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('dir', dir);
    html.setAttribute('lang', lang);

    // Add/remove Urdu font class for Nastaliq
    if (lang === 'ur') {
      html.classList.add('lang-ur');
    } else {
      html.classList.remove('lang-ur');
    }

    return () => {
      html.removeAttribute('dir');
      html.removeAttribute('lang');
      html.classList.remove('lang-ur');
    };
  }, [lang, dir]);

  const setLang = useCallback((code) => {
    const target = LANGUAGES.find((l) => l.code === code && l.available);
    if (!target) return;
    setLangState(code);
    try {
      localStorage.setItem(LS_KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => {
    const dict = langMeta.dict || en;
    return { lang, dir, setLang, t: makeT(dict) };
  }, [lang, dir, setLang, langMeta]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useT = () => useContext(I18nContext);
