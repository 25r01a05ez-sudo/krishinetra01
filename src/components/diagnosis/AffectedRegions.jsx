import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Renders backend-supplied affected-region boxes and/or an overlay image on top of the photo.
 * Renders nothing when the backend provided neither – we never invent highlighted regions.
 * Boxes are treated as normalised (0-1) when every value <= 1, otherwise as pixel coordinates.
 */
export default function AffectedRegions({ imageUrl, regions = [], overlayUrl }) {
  const [size, setSize] = useState(null);
  const [show, setShow] = useState(true);
  const hasViz = (regions && regions.length > 0) || overlayUrl;
  if (!hasViz || !imageUrl) return null;

  const normalised = regions.every((r) => r.x <= 1 && r.y <= 1 && r.width <= 1 && r.height <= 1);
  const vbW = normalised ? 1 : size?.w || 1;
  const vbH = normalised ? 1 : size?.h || 1;
  const stroke = normalised ? 0.006 : Math.max(2, (size?.w || 600) * 0.005);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-ink/60">Affected regions (from the model)</h3>
        <button type="button" className="btn-ghost btn-sm" onClick={() => setShow((v) => !v)} aria-pressed={show}>
          {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />} {show ? 'Hide' : 'Show'}
        </button>
      </div>
      <div className="relative mt-2 overflow-hidden rounded-xl border border-forest/15 bg-ink/5">
        <img
          src={imageUrl}
          alt="Crop image with model-highlighted regions"
          className="mx-auto block max-h-[420px] w-full object-contain"
          onLoad={(e) => setSize({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
        />
        {show && overlayUrl && (
          <img src={overlayUrl} alt="" aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-60" />
        )}
        {show && regions.length > 0 && (normalised || size) && (
          <svg
            viewBox={`0 0 ${vbW} ${vbH}`}
            preserveAspectRatio="xMidYMid meet"
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            {regions.map((r, i) => (
              <rect
                key={i}
                x={r.x}
                y={r.y}
                width={r.width}
                height={r.height}
                fill="rgba(250,204,21,0.18)"
                stroke="#FACC15"
                strokeWidth={stroke}
                rx={normalised ? 0.004 : 4}
              />
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}
