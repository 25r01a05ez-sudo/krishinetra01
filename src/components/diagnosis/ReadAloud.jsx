import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Square, Volume2 } from 'lucide-react';
import { useT } from '../../i18n';
import { voiceLabel } from './voiceLabels';

const LOCALES = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN', ur: 'ur-PK' };
const SETTINGS_KEY = 'krishinetra.voiceSettings.v1';
const SPEECH_FIELDS = ['summary', 'symptoms', 'immediate', 'preventive', 'monitoring', 'expert', 'management', 'general'];

const DEFAULT_SETTINGS = { rate: 0.9, pitch: 1, volume: 1, voices: {} };
function loadSettings() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) || '{}');
    const valid = (value, min, max, fallback) => {
      const number = Number(value);
      return value !== undefined && Number.isFinite(number) && number >= min && number <= max ? number : fallback;
    };
    return {
      rate: valid(saved.rate, 0.6, 1.3, 0.9),
      pitch: valid(saved.pitch, 0.7, 1.3, 1),
      volume: valid(saved.volume, 0, 1, 1),
      voices: saved.voices && typeof saved.voices === 'object' && !Array.isArray(saved.voices) ? saved.voices : {},
    };
  } catch { return DEFAULT_SETTINGS; }
}

function splitForSpeech(text) {
  const raw = String(text || '').trim();
  if (!raw) return [];
  // Limit each spoken segment for more reliable browser TTS playback.
  return raw.match(/.{1,170}(?:[.!?।؟,;\s]|$)|.{1,170}/gu)?.map(s => s.trim()).filter(Boolean) || [raw];
}

function buildSpeech(guidance, intro, language) {
  const items = Array.isArray(intro) ? intro.flatMap(splitForSpeech) : [];
  if (!guidance) return items;
  for (const key of SPEECH_FIELDS) {
    const value = guidance[key];
    const paragraphs = typeof value === 'string' ? [value] : Array.isArray(value) ? value : [];
    if (!paragraphs.some(Boolean)) continue;
    if (key !== 'summary') items.push(voiceLabel(language, `voice.section.${key}`));
    paragraphs.forEach(p => items.push(...splitForSpeech(p)));
  }
  return items;
}

/** Reads the displayed analysis with locally available voices. No API key or backend changes. */
export default function ReadAloud({ guidance, intro = [], language, disabled = false }) {
  const { lang } = useT();
  const code = LOCALES[language] ? language : (LOCALES[lang] ? lang : 'en');
  const label = (key) => voiceLabel(lang, key);
  const supported = typeof window !== 'undefined' &&
    'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  const [voices, setVoices] = useState([]);
  const [settings, setSettings] = useState(loadSettings);
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState('');
  const session = useRef(0);
  const introText = Array.isArray(intro) ? intro.filter(Boolean).join('\u2028') : '';
  const chunks = useMemo(() => buildSpeech(guidance, introText ? introText.split('\u2028') : [], code), [guidance, introText, code]);

  useEffect(() => {
    if (!supported) return;
    const refresh = () => setVoices(window.speechSynthesis.getVoices());
    refresh();
    window.speechSynthesis.addEventListener?.('voiceschanged', refresh);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', refresh);
  }, [supported]);

  useEffect(() => {
    try { window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* Optional */ }
  }, [settings]);

  useEffect(() => {
    session.current += 1;
    if (supported) window.speechSynthesis.cancel();
    setState('idle');
    setMessage('');
    return () => {
      session.current += 1;
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported, guidance, introText, code, disabled]);

  const matches = useMemo(() => voices.filter(v =>
    v.lang.toLowerCase().split('-')[0] === code
  ), [voices, code]);
  const savedName = settings.voices[code] || '';
  const selectedVoice = matches.find(v => v.name === savedName) ||
    matches.find(v => v.lang.toLowerCase() === LOCALES[code].toLowerCase()) ||
    matches.find(v => v.default) || matches[0];

  const stop = () => {
    session.current += 1;
    if (supported) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume(); // clear a previous paused state
    }
    setState('idle');
  };

  const play = () => {
    if (!supported || disabled || !chunks.length) return;
    stop();
    setMessage('');
    // Never read Hindi/Telugu/Urdu with an English voice by accident.
    if (!selectedVoice && code !== 'en') {
      setMessage(label('voice.noVoice'));
      return;
    }
    const token = session.current;
    const synth = window.speechSynthesis;
    let index = 0;
    setState('speaking');
    const next = () => {
      if (token !== session.current) return;
      if (index === chunks.length) { setState('idle'); return; }
      const utterance = new SpeechSynthesisUtterance(chunks[index++]);
      utterance.lang = selectedVoice?.lang || LOCALES[code];
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;
      utterance.onend = next;
      utterance.onerror = e => {
        if (token !== session.current || e.error === 'canceled' || e.error === 'interrupted') return;
        setState('idle');
        setMessage(label('voice.playbackError'));
      };
      synth.speak(utterance);
    };
    next();
  };

  const pauseOrResume = () => {
    if (!supported) return;
    if (state === 'speaking') { window.speechSynthesis.pause(); setState('paused'); }
    else if (state === 'paused') { window.speechSynthesis.resume(); setState('speaking'); }
  };

  const update = (key, number) => {
    stop();
    setSettings(s => ({ ...s, [key]: number }));
  };
  if (!chunks.length && !disabled) return null;

  return (
    <section className="mb-4 space-y-3 rounded-xl border border-forest/15 bg-mint p-4" aria-label={label('voice.title')}>
      <div className="flex items-center gap-2 font-semibold text-forest"><Volume2 size={20} /> {label('voice.title')}</div>
      <p className="text-sm text-ink/70">{label('voice.description')}</p>
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-primary btn-sm" type="button" onClick={play} disabled={!supported || disabled || !chunks.length}>
          <Play size={16} aria-hidden="true" /> {label('voice.read')}
        </button>
        <button className="btn-secondary btn-sm" type="button" onClick={pauseOrResume} disabled={state === 'idle'}>
          {state === 'paused' ? <Play size={16} /> : <Pause size={16} />}
          {label(state === 'paused' ? 'voice.resume' : 'voice.pause')}
        </button>
        <button className="btn-secondary btn-sm" type="button" onClick={stop} disabled={state === 'idle'}>
          <Square size={16} aria-hidden="true" /> {label('voice.stop')}
        </button>
        <button className="btn-secondary btn-sm" type="button" onClick={play} disabled={!supported || disabled || !chunks.length}>
          <RotateCcw size={16} aria-hidden="true" /> {label('voice.restart')}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">{label('voice.voice')}
          <select className="input mt-1" value={selectedVoice?.name || ''} disabled={!matches.length}
            onChange={e => {
              stop();
              setSettings(s => ({ ...s, voices: { ...s.voices, [code]: e.target.value } }));
            }}>
            {!matches.length && <option value="">{label('voice.unavailable')}</option>}
            {matches.map((v, i) => <option key={`${v.name}-${i}`} value={v.name}>{v.name} ({v.lang})</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">{label('voice.speed')}: {settings.rate.toFixed(1)}×
          <input className="mt-2 w-full accent-forest" type="range" min="0.6" max="1.3" step="0.1" value={settings.rate}
            onChange={e => update('rate', Number(e.target.value))} />
        </label>
        <label className="text-sm font-medium">{label('voice.pitch')}: {settings.pitch.toFixed(1)}
          <input className="mt-2 w-full accent-forest" type="range" min="0.7" max="1.3" step="0.1" value={settings.pitch}
            onChange={e => update('pitch', Number(e.target.value))} />
        </label>
        <label className="text-sm font-medium">{label('voice.volume')}: {Math.round(settings.volume * 100)}%
          <input className="mt-2 w-full accent-forest" type="range" min="0" max="1" step="0.05" value={settings.volume}
            onChange={e => update('volume', Number(e.target.value))} />
        </label>
      </div>
      {!supported && <p className="text-sm" role="status">{label('voice.unsupported')}</p>}
      {disabled && <p className="text-sm" role="status">{label('voice.waitTranslation')}</p>}
      {!!message && <p className="text-sm" role="alert">{message}</p>}
    </section>
  );
}
