import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, ScanSearch, Sun, Focus, Leaf } from 'lucide-react';
import PageHeader from '../components/cards/PageHeader';
import ImageDropzone from '../components/upload/ImageDropzone';
import CropSelect from '../components/upload/CropSelect';
import AnalysisLoader from '../components/diagnosis/AnalysisLoader';
import ErrorPanel from '../components/cards/ErrorPanel';
import DemoTag from '../components/cards/DemoTag';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n';
import { predictCrop } from '../services/api';
import { demoPredict } from '../services/demo';
import { createThumbnail, makeId, validateImage } from '../utils/image';

export default function Diagnosis() {
  const navigate = useNavigate();
  const { demoMode, autoSave, addScan, setCurrentScan } = useApp();
  const { t, lang } = useT();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [crop, setCrop] = useState('');
  const [fileError, setFileError] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | analyzing | error
  const [apiError, setApiError] = useState(null);
  const abortRef = useRef(null);

  // Revoke object URLs we create
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );
  // Cancel any in-flight request when leaving the page
  useEffect(() => () => abortRef.current?.abort(), []);

  const handleFile = (f) => {
    const check = validateImage(f);
    if (!check.ok) {
      setFileError(check.error);
      return;
    }
    setFileError(null);
    setApiError(null);
    setPhase('idle');
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleRemove = () => {
    setFile(null);
    setPreviewUrl(null);
    setFileError(null);
    setApiError(null);
    setPhase('idle');
  };

  const analyze = async () => {
    const check = validateImage(file);
    if (!check.ok) {
      setFileError(check.error);
      return;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setApiError(null);
    setPhase('analyzing');
    try {
      // Live mode: result MUST come from the Flask backend. Errors never fall back to demo data.
      const prediction = demoMode
        ? await demoPredict(file, { signal: ctrl.signal })
        : await predictCrop(file, { crop: crop || undefined, language: lang, signal: ctrl.signal });

      const thumbnail = await createThumbnail(file);
      const scan = {
        id: prediction.predictionId ? `srv-${prediction.predictionId}` : makeId(),
        source: demoMode ? 'local' : 'server',
        fileName: file.name,
        thumbnail,
        ...prediction,
        createdAt: prediction.createdAt || new Date().toISOString(),
        crop: prediction.crop || crop || null,
      };
      if (autoSave || !demoMode) addScan(scan);
      setCurrentScan({ ...scan, previewUrl: prediction.imageUrl || thumbnail });
      navigate(`/results/${scan.id}`);
    } catch (err) {
      if (err?.kind === 'aborted') {
        setPhase('idle');
        return;
      }
      setApiError(err);
      setPhase('error');
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    setPhase('idle');
  };

  const analyzing = phase === 'analyzing';

  const TIPS = [
    { icon: Sun, text: t('diag.tip.light') },
    { icon: Focus, text: t('diag.tip.focus') },
    { icon: Leaf, text: t('diag.tip.leaf') },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={t('diag.eyebrow')}
        title={t('diag.title')}
        subtitle={t('diag.subtitle')}
        actions={demoMode ? <DemoTag /> : null}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          {analyzing ? (
            <AnalysisLoader previewUrl={previewUrl} onCancel={cancel} isDemo={demoMode} />
          ) : (
            <ImageDropzone file={file} previewUrl={previewUrl} onFile={handleFile} onRemove={handleRemove} error={fileError} />
          )}

          {phase === 'error' && apiError && <ErrorPanel error={apiError} onRetry={analyze} />}

          {!analyzing && (
            <div className="card space-y-4">
              <CropSelect value={crop} onChange={setCrop} disabled={demoMode} />
              <button type="button" className="btn-primary w-full text-lg" onClick={analyze} disabled={!file}>
                <ScanSearch size={22} aria-hidden="true" /> {t('diag.analyze')}
              </button>
              {!file && <p className="text-center text-sm text-ink/60">{t('diag.chooseFirst', { action: t('diag.analyze') })}</p>}
              {demoMode && (
                <p className="text-center text-sm font-medium text-yellow-800">
                  {t('diag.demoNote')}
                </p>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-4" aria-label={t('diag.tipsTitle')}>
          <div className="card">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <Lightbulb size={20} className="text-gold" aria-hidden="true" /> {t('diag.tipsTitle')}
            </h2>
            <ul className="mt-3 space-y-3">
              {TIPS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-3 text-base">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mint text-forest">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-forest/10 bg-mint/70 p-5 text-sm text-ink/75">
            {t('diag.disclaimer')}
          </div>
        </aside>
      </div>
    </div>
  );
}
