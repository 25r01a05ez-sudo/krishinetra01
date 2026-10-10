import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, ChevronRight, Leaf, ScanLine, ShieldAlert, Sprout, Telescope,
  Microscope, Bug, Activity, BookOpenCheck, Camera, Cpu, ClipboardCheck,
  Smartphone, History, CloudSun, LineChart, Languages,
} from 'lucide-react';
import HeroVisual from '../components/cards/HeroVisual';
import FeatureCard from '../components/cards/FeatureCard';
import { TEAM } from '../config';
import { useT } from '../i18n';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: 'easeOut' },
});

function Section({ id, eyebrow, title, subtitle, children, tinted = false }) {
  return (
    <section id={id} className={`py-16 sm:py-20 ${tinted ? 'bg-mint/70' : ''}`}>
      <div className="container-page">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          {eyebrow && <span className="eyebrow mb-3">{eyebrow}</span>}
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="mt-3 text-lg text-ink/70">{subtitle}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

function HowItWorks() {
  const { t } = useT();
  const [active, setActive] = useState(0);

  const STEPS = [
    { icon: Camera, titleKey: 'step.capture.title', textKey: 'step.capture.text', detailKey: 'step.capture.detail' },
    { icon: Cpu, titleKey: 'step.analyze.title', textKey: 'step.analyze.text', detailKey: 'step.analyze.detail' },
    { icon: ClipboardCheck, titleKey: 'step.act.title', textKey: 'step.act.text', detailKey: 'step.act.detail' },
  ];

  const step = STEPS[active];
  return (
    <div>
      <ol className="mx-auto flex max-w-4xl flex-col items-stretch gap-3 md:flex-row md:items-center">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === active;
          return (
            <li key={s.titleKey} className="flex flex-1 items-center gap-3">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={isActive}
                className={`flex min-h-[96px] w-full flex-1 items-center gap-4 rounded-2xl border p-4 text-start transition ${
                  isActive ? 'border-forest bg-forest text-white shadow-lift' : 'border-forest/15 bg-white hover:border-forest/40 hover:shadow-soft'
                }`}
              >
                <span
                  className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${
                    isActive ? 'bg-white/15 text-gold' : 'bg-mint text-forest'
                  }`}
                >
                  <Icon size={28} aria-hidden="true" />
                </span>
                <span>
                  <span className={`block text-xs font-bold uppercase tracking-wider ${isActive ? 'text-green-200' : 'text-forest/70'}`}>
                    {t('home.howItWorks.step')} {i + 1}
                  </span>
                  <span className="block font-display text-xl font-bold">{t(s.titleKey)}</span>
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className="hidden shrink-0 text-forest/40 md:block rtl:rotate-180" size={28} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
      <div className="mx-auto mt-6 max-w-4xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.titleKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="card"
            aria-live="polite"
          >
            <p className="font-display text-xl font-bold">
              {t('home.howItWorks.step')} {active + 1} — {t(step.titleKey)}
            </p>
            <p className="mt-1 text-lg font-medium text-forest">{t(step.textKey)}</p>
            <p className="mt-2 text-base text-ink/75">{t(step.detailKey)}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useT();

  const FEATURES = [
    { icon: Microscope, title: t('feature.aiDetection.title'), text: t('feature.aiDetection.text') },
    { icon: Bug, title: t('feature.pestId.title'), text: t('feature.pestId.text') },
    { icon: Activity, title: t('feature.healthMon.title'), text: t('feature.healthMon.text') },
    { icon: BookOpenCheck, title: t('feature.guidance.title'), text: t('feature.guidance.text') },
  ];

  const WHY_EARLY = [
    { title: t('whyEarly.1.title'), text: t('whyEarly.1.text') },
    { title: t('whyEarly.2.title'), text: t('whyEarly.2.text') },
    { title: t('whyEarly.3.title'), text: t('whyEarly.3.text') },
  ];

  const HELPS = [
    { icon: Smartphone, title: t('helps.phone.title'), text: t('helps.phone.text') },
    { icon: Languages, title: t('helps.language.title'), text: t('helps.language.text') },
    { icon: History, title: t('helps.history.title'), text: t('helps.history.text') },
  ];

  const CAPABILITIES = [
    { icon: Microscope, title: t('cap.imageAnalysis.title'), text: t('cap.imageAnalysis.text') },
    { icon: LineChart, title: t('cap.scanAnalytics.title'), text: t('cap.scanAnalytics.text') },
    { icon: History, title: t('cap.scanHistory.title'), text: t('cap.scanHistory.text') },
    { icon: BookOpenCheck, title: t('cap.guidanceLib.title'), text: t('cap.guidanceLib.text') },
    { icon: CloudSun, title: t('cap.envMonitoring.title'), text: t('cap.envMonitoring.text') },
    { icon: Languages, title: t('cap.multilingual.title'), text: t('cap.multilingual.text') },
  ];

  const LIMITATIONS = [
    t('limit.1'), t('limit.2'), t('limit.3'),
    t('limit.4'), t('limit.5'), t('limit.6'),
  ];

  return (
    <>
      {/* Hero */}
      <section className="leaf-pattern relative overflow-hidden">
        <div className="container-page grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <motion.span {...fadeUp(0)} className="eyebrow mb-5">
              <Sprout size={14} aria-hidden="true" /> {TEAM.competition} · {TEAM.problemStatementId}
            </motion.span>
            <motion.h1 {...fadeUp(0.08)} className="text-4xl font-extrabold leading-[1.1] text-deep sm:text-5xl lg:text-6xl">
              {t('hero.title')}
            </motion.h1>
            <motion.p {...fadeUp(0.16)} className="mt-5 max-w-xl text-lg text-ink/75 sm:text-xl">
              {t('hero.subtitle')}
            </motion.p>
            <motion.div {...fadeUp(0.24)} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/diagnosis" className="btn-primary text-lg">
                <ScanLine size={22} aria-hidden="true" /> {t('hero.primary')}
              </Link>
              <Link to="/dashboard" className="btn-secondary text-lg">
                {t('hero.secondary')} <ArrowRight size={20} aria-hidden="true" />
              </Link>
            </motion.div>
            <motion.p {...fadeUp(0.32)} className="mt-6 text-sm font-medium text-ink/60">
              {TEAM.tagline}
            </motion.p>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }}>
            <HeroVisual />
          </motion.div>
        </div>
      </section>

      {/* Key features */}
      <Section eyebrow={t('home.features.eyebrow')} title={t('home.features.title')} subtitle={t('home.features.subtitle')}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} {...f} index={i} />
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section id="how-it-works" tinted eyebrow={t('home.howItWorks.eyebrow')} title={t('home.howItWorks.title')} subtitle={t('home.howItWorks.subtitle')}>
        <HowItWorks />
      </Section>

      {/* Why early detection */}
      <Section eyebrow={t('home.whyEarly.eyebrow')} title={t('home.whyEarly.title')}>
        <div className="grid gap-5 md:grid-cols-3">
          {WHY_EARLY.map((w, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card"
            >
              <span className="font-display text-4xl font-extrabold text-fresh">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 text-xl font-bold">{w.title}</h3>
              <p className="mt-1.5 text-base text-ink/75">{w.text}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* How helps farmers */}
      <Section tinted eyebrow={t('home.helpsFarmers.eyebrow')} title={t('home.helpsFarmers.title')}>
        <div className="grid gap-5 md:grid-cols-3">
          {HELPS.map((h, i) => (
            <FeatureCard key={i} {...h} index={i} />
          ))}
        </div>
      </Section>

      {/* Capabilities */}
      <Section eyebrow={t('home.capabilities.eyebrow')} title={t('home.capabilities.title')} subtitle={t('home.capabilities.subtitle')}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="flex gap-4 rounded-2xl border border-forest/10 bg-white p-5 shadow-soft">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mint text-forest">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-bold">{c.title}</h3>
                  <p className="text-base text-ink/70">{c.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Responsible AI */}
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <div className="mx-auto max-w-4xl rounded-3xl border border-gold/50 bg-gradient-to-br from-yellow-50 to-white p-6 shadow-soft sm:p-10">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold text-ink">
                <ShieldAlert size={26} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-2xl font-bold sm:text-3xl">{t('home.responsibleAI.title')}</h2>
                <p className="mt-2 text-base text-ink/75">{t('home.responsibleAI.subtitle')}</p>
              </div>
            </div>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {LIMITATIONS.map((l, i) => (
                <li key={i} className="flex gap-2.5 text-base">
                  <Leaf size={18} className="mt-1 shrink-0 text-forest" aria-hidden="true" />
                  <span>{l}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="bg-gradient-to-br from-deep via-forest to-deep py-16 text-white sm:py-20">
        <div className="container-page mx-auto max-w-3xl text-center">
          <Telescope className="mx-auto text-gold" size={36} aria-hidden="true" />
          <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">{t('home.vision.title')}</h2>
          <p className="mt-4 text-lg text-green-100">{t('home.vision.text')}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/diagnosis" className="btn-gold text-lg">
              <ScanLine size={22} aria-hidden="true" /> {t('hero.primary')}
            </Link>
            <Link to="/about" className="btn border border-white/40 text-lg text-white hover:bg-white/10">
              {t('home.vision.aboutLink')}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
