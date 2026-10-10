import { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../services/api';
export default function FarmSettings() {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { getSettings().then(({settings}) => { setLatitude(settings.latitude ?? ''); setLongitude(settings.longitude ?? ''); }).catch(e => setMessage(e.message)); }, []);
  const save = async e => {
    e.preventDefault(); setBusy(true);
    try {
      await saveSettings({latitude: latitude === '' ? null : Number(latitude), longitude: longitude === '' ? null : Number(longitude)});
      setMessage('Farm location saved. Open Monitoring to load weather estimates.');
    } catch (e) { setMessage(e.message); } finally { setBusy(false); }
  };
  return <section className="card space-y-4"><h2 className="text-lg font-bold">Farm location</h2>
    <p>Enter your farm coordinates to see local weather estimates. Soil moisture requires an actual measurement.</p>
    <form onSubmit={save} className="space-y-3">
      <label className="block">Latitude<input type="number" step="any" min="-90" max="90" className="input" value={latitude} onChange={e => setLatitude(e.target.value)} /></label>
      <label className="block">Longitude<input type="number" step="any" min="-180" max="180" className="input" value={longitude} onChange={e => setLongitude(e.target.value)} /></label>
      <button className="btn-secondary" disabled={busy}>Save farm location</button>
    </form>
    {message && <p role="status">{message}</p>}
    <a className="text-forest underline" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Weather data by Open-Meteo</a>
  </section>;
}
