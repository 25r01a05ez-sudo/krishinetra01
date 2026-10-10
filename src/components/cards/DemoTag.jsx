import { FlaskConical } from 'lucide-react';

export default function DemoTag({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-ink ${className}`}
    >
      <FlaskConical size={12} aria-hidden="true" /> Demo data
    </span>
  );
}
