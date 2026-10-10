export default function CropSelect({ value, onChange, disabled }) {
  return <div><label htmlFor="crop-hint" className="label">Crop name (optional)</label>
    <input id="crop-hint" className="input" value={value} onChange={e => onChange(e.target.value)} disabled={disabled} maxLength={100} placeholder="For example, tomato or rice" />
    <p className="mt-2 text-sm text-ink/65">Leave blank to let Gemini assess the visible plant. Results are visual estimates and may be uncertain.</p>
  </div>;
}
