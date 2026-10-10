import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jsonRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
export default function AccountRecovery({ reset = false }) {
  const { verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const send = async () => {
    setBusy(true); setError('');
    try {
      const result = await jsonRequest('/api/auth/request-otp', 'POST', { email, purpose: reset ? 'reset' : 'login' });
      setSent(true); setMessage(result.message);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const verify = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    try {
      if (reset) {
        const result = await jsonRequest('/api/auth/reset-password', 'POST', { email, code, new_password: password });
        setMessage(result.message); setSent(false); setCode(''); setPassword('');
      } else {
        const result = await verifyOtp(email, code);
        if (!result.success) throw new Error(result.error);
        navigate('/dashboard');
      }
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  return <div className="container-page max-w-lg py-12"><section className="card space-y-5">
    <h1 className="text-2xl font-bold">{reset ? 'Reset your password' : 'Sign in with a code'}</h1>
    <p>Use the email address you registered with.</p>
    <label className="block">Email address<input className="input mt-2" type="email" autoComplete="email" value={email} onChange={e => { setEmail(e.target.value); setSent(false); }} /></label>
    <button className="btn-secondary" onClick={send} disabled={busy || !email}>{sent ? 'Send a new code' : 'Request code'}</button>
    {message && <p role="status" className="rounded-xl bg-mint p-3">{message}</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {sent && <form onSubmit={verify} className="space-y-4">
      <label className="block">Six-digit code<input className="input mt-2" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e => setCode(e.target.value)} /></label>
      {reset && <label className="block">New password<input className="input mt-2" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={e => setPassword(e.target.value)} /><span className="text-sm">8–128 characters, an uppercase letter and a number.</span></label>}
      <button className="btn-primary" disabled={busy}>{busy ? 'Please wait…' : reset ? 'Change password' : 'Verify and sign in'}</button>
    </form>}
    <Link to="/login" className="block font-semibold text-forest">Back to sign in</Link>
  </section></div>;
}
