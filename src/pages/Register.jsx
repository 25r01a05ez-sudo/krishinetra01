import { useState } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Leaf, UserPlus, Mail, Lock, User, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TEAM } from '../config';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: 'easeOut' },
});

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8 && p.length <= 128, label: '8–128 characters' },
  { test: (p) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p) => /[0-9]/.test(p), label: 'One number' },
];

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to={'/dashboard'} replace />;

  const passwordStrength = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const passwordValid = passwordStrength === PASSWORD_RULES.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (!passwordValid) {
      setError('Password does not meet the requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 500));

    const result = await register(name, email, password);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-bl from-fresh/20 to-transparent blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-tr from-gold/15 to-transparent blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-64 w-64 rounded-full bg-gradient-to-b from-forest/5 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Header */}
        <motion.div {...fadeUp(0)} className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-forest to-deep shadow-lift">
            <Leaf className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-deep">Create your account</h1>
          <p className="mt-2 text-base text-ink/60">
            Join <span className="font-semibold text-forest">{TEAM.project}</span> and start detecting crop diseases
          </p>
        </motion.div>

        {/* Register Card */}
        <motion.div
          {...fadeUp(0.1)}
          className="rounded-3xl border border-forest/10 bg-white/80 p-6 shadow-lift backdrop-blur-xl sm:p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-500" />
                <p className="text-sm font-medium text-red-700">{error}</p>
              </motion.div>
            )}

            {/* Full Name */}
            <div>
              <label htmlFor="register-name" className="label">
                Full name
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
                <input
                  id="register-name"
                  type="text"
                  autoComplete="name"
                  required
                  placeholder="Ravi Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="register-email" className="label">
                Email address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="farmer@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="register-password" className="label">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-ink/40 transition hover:text-forest"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password strength */}
              {password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 space-y-2"
                >
                  {/* Strength bar */}
                  <div className="flex gap-1.5">
                    {PASSWORD_RULES.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i < passwordStrength
                            ? passwordStrength === PASSWORD_RULES.length
                              ? 'bg-fresh'
                              : passwordStrength >= 2
                                ? 'bg-gold'
                                : 'bg-red-400'
                            : 'bg-forest/10'
                        }`}
                      />
                    ))}
                  </div>
                  {/* Rules checklist */}
                  <ul className="space-y-1">
                    {PASSWORD_RULES.map((rule) => {
                      const passed = rule.test(password);
                      return (
                        <li key={rule.label} className={`flex items-center gap-2 text-xs transition ${passed ? 'text-fresh' : 'text-ink/40'}`}>
                          <Check size={12} className={passed ? 'opacity-100' : 'opacity-0'} />
                          <span className={passed ? 'line-through' : ''}>{rule.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="register-confirm" className="label">
                Confirm password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35" />
                <input
                  id="register-confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`input pl-10 ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400/40'
                      : ''
                  }`}
                />
                {confirmPassword && confirmPassword === password && (
                  <Check size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-fresh" />
                )}
              </div>
              {confirmPassword && confirmPassword !== password && (
                <p className="mt-1 text-xs text-red-500">Passwords don't match</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full text-base"
            >
              {isSubmitting ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating account…
                </>
              ) : (
                <>
                  <UserPlus size={20} /> Create account
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-forest/10" />
            <span className="text-xs font-semibold uppercase tracking-wider text-ink/35">Already have an account?</span>
            <div className="h-px flex-1 bg-forest/10" />
          </div>

          {/* Login link */}
          <Link
            to="/login"
            className="btn-secondary w-full text-base"
          >
            Sign in instead
          </Link>
        </motion.div>

        {/* Footer note */}
        <motion.p {...fadeUp(0.2)} className="mt-6 text-center text-xs text-ink/45">
          By creating an account, you agree to {TEAM.project}'s Terms of Service and Privacy Policy.
        </motion.p>
      </div>
    </div>
  );
}
