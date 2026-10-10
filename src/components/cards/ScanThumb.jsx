import { Leaf } from 'lucide-react';

/** Thumbnail with graceful fallback when no image was stored. */
export default function ScanThumb({ src, alt = 'Scanned crop', className = 'h-16 w-16' }) {
  if (src) {
    return <img src={src} alt={alt} loading="lazy" className={`${className} shrink-0 rounded-xl border border-forest/10 object-cover`} />;
  }
  return (
    <span
      className={`${className} inline-flex shrink-0 items-center justify-center rounded-xl border border-forest/10 bg-mint text-forest/60`}
      role="img"
      aria-label="No image stored for this scan"
    >
      <Leaf size={22} aria-hidden="true" />
    </span>
  );
}
