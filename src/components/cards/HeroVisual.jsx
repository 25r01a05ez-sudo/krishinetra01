import { motion } from 'framer-motion';
import { Camera, ScanLine, ShieldCheck } from 'lucide-react';
import { HERO_IMAGE_URL } from '../../config';

/** Illustrated field + leaf scene. Set VITE_HERO_IMAGE_URL to use a real photograph instead. */
function FieldScene() {
  return (
    <svg viewBox="0 0 600 560" className="h-full w-full" role="img" aria-label="Illustration of a green crop field with a leaf being scanned">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F0FDF4" />
          <stop offset="1" stopColor="#DCFCE7" />
        </linearGradient>
        <linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4ADE80" />
          <stop offset="1" stopColor="#16A34A" />
        </linearGradient>
        <linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#22C55E" />
          <stop offset="1" stopColor="#166534" />
        </linearGradient>
        <linearGradient id="leafG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#86EFAC" />
          <stop offset="1" stopColor="#15803D" />
        </linearGradient>
      </defs>
      <rect width="600" height="560" fill="url(#sky)" />
      <circle cx="470" cy="110" r="46" fill="#FACC15" opacity="0.9" />
      <circle cx="470" cy="110" r="68" fill="#FACC15" opacity="0.18" />
      <path d="M0 330c90-50 160-40 250-10s170 20 350-30v270H0z" fill="url(#hill1)" />
      <path d="M0 400c110-40 200-30 300 0s200 20 300-20v180H0z" fill="url(#hill2)" />
      {/* crop rows */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path
          key={i}
          d={`M${-40 + i * 120} 560 L${230 + i * 28} 420`}
          stroke="#DCFCE7"
          strokeOpacity="0.35"
          strokeWidth="3"
          strokeDasharray="2 10"
          strokeLinecap="round"
        />
      ))}
      {/* sprouts */}
      {[
        [90, 470],
        [180, 500],
        [300, 480],
        [410, 505],
        [520, 470],
        [140, 440],
        [470, 430],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path d="M0 0c-6-12-18-14-24-10 4 10 14 14 24 10z" fill="#BBF7D0" />
          <path d="M0 0c6-14 18-16 24-12-4 12-14 16-24 12z" fill="#86EFAC" />
          <path d="M0 0v16" stroke="#DCFCE7" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
      {/* big leaf */}
      <g transform="translate(300 250) rotate(-12)">
        <path d="M0-150C-90-100-135-30-118 50-108 100-60 140 0 170 60 140 108 100 118 50 135-30 90-100 0-150z" fill="url(#leafG)" stroke="#064E3B" strokeOpacity="0.25" strokeWidth="3" />
        <path d="M0-140V160" stroke="#F0FDF4" strokeOpacity="0.8" strokeWidth="5" strokeLinecap="round" />
        <path d="M0-60l-60-40M0-10l-72-44M0 50l-62-34M0-70l56-38M0-20l68-44M0 40l58-30" stroke="#F0FDF4" strokeOpacity="0.55" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        {/* scan frame */}
        <g stroke="#FACC15" strokeWidth="5" fill="none" strokeLinecap="round">
          <path d="M-95-70v-34h34M95-70v-34h-34M-95 80v34h34M95 80v34h-34" />
        </g>
      </g>
    </svg>
  );
}

export default function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-fresh/25 via-mint to-gold/25 blur-2xl" aria-hidden="true" />
      <div className="relative aspect-[6/5.6] overflow-hidden rounded-[2rem] border border-white bg-mint shadow-lift">
        {HERO_IMAGE_URL ? (
          <img src={HERO_IMAGE_URL} alt="Green crop field" className="h-full w-full object-cover" />
        ) : (
          <FieldScene />
        )}
      </div>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
        className="glass absolute -left-2 top-8 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lift sm:-left-8"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-forest text-white">
          <Camera size={20} aria-hidden="true" />
        </span>
        <span className="text-sm leading-tight">
          <span className="block font-bold">1. Capture</span>
          <span className="text-ink/65">Photo of a leaf</span>
        </span>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut', delay: 0.6 }}
        className="glass absolute -right-2 top-1/2 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lift sm:-right-8"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gold text-ink">
          <ScanLine size={20} aria-hidden="true" />
        </span>
        <span className="text-sm leading-tight">
          <span className="block font-bold">2. Analyze</span>
          <span className="text-ink/65">AI model checks it</span>
        </span>
      </motion.div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 5.5, ease: 'easeInOut', delay: 1.2 }}
        className="glass absolute -bottom-4 left-6 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lift"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-fresh text-white">
          <ShieldCheck size={20} aria-hidden="true" />
        </span>
        <span className="text-sm leading-tight">
          <span className="block font-bold">3. Act</span>
          <span className="text-ink/65">Review guidance</span>
        </span>
      </motion.div>
    </div>
  );
}
