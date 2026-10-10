import { Link } from 'react-router-dom';

/** Original KrishiNetra mark: a leaf whose veins end in subtle circuit nodes. */
export function LogoMark({ className = 'h-10 w-10' }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="KrishiNetra logo">
      <defs>
        <linearGradient id="kn-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#22C55E" />
          <stop offset="1" stopColor="#166534" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#064E3B" />
      <path d="M32 11c-11.5 6.2-16.8 15.6-14.6 26 1.2 6 6.6 11.4 14.6 15.4 8-4 13.4-9.4 14.6-15.4C48.8 26.6 43.5 17.2 32 11z" fill="url(#kn-leaf)" />
      <path d="M32 17v33" stroke="#F0FDF4" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M32 29l-8.5-6.5M32 37.5l9.5-7.5M32 45l-6-4.5" stroke="#F0FDF4" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.9" />
      <circle cx="23" cy="22.5" r="2.6" fill="#FACC15" />
      <circle cx="42" cy="30" r="2.6" fill="#FACC15" />
      <circle cx="25.5" cy="40.5" r="2.2" fill="#FACC15" />
    </svg>
  );
}

export default function Logo({ to = '/', light = false }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label="KrishiNetra home">
      <LogoMark />
      <span className="leading-tight">
        <span className={`block font-display text-xl font-bold ${light ? 'text-white' : 'text-deep'}`}>KrishiNetra</span>
        <span className={`hidden text-[11px] font-medium uppercase tracking-wider sm:block ${light ? 'text-green-200' : 'text-forest/70'}`}>
          AI Crop Health
        </span>
      </span>
    </Link>
  );
}
