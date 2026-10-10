import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ArrowRight, LogIn, LogOut, ChevronDown, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Logo from './Logo';
import LanguageSelector from './LanguageSelector';
import { MAIN_NAV, SIDEBAR_NAV, EXTRA_NAV } from '../../data/navigation';
import { useT } from '../../i18n';
import { useAuth } from '../../context/AuthContext';

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-mint text-forest' : 'text-ink/75 hover:bg-mint hover:text-forest'
  }`;

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const { t } = useT();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  useEffect(() => { setOpen(false); setUserMenuOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    if (!await logout()) return;
    setUserMenuOpen(false);
    navigate('/');
  };

  const mobileLinks = [
    ...MAIN_NAV,
    ...SIDEBAR_NAV.filter((s) => s.to === '/settings'),
    ...EXTRA_NAV,
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-forest/10 bg-cream/85 backdrop-blur-lg">
      <nav className="container-page flex h-16 items-center justify-between gap-4" aria-label="Main navigation">
        <Logo />

        <ul className="hidden items-center gap-1 lg:flex">
          {MAIN_NAV.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} className={linkClass}>
                {t(item.labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <Link to="/diagnosis" className="btn-primary btn-sm hidden sm:inline-flex">
            {t('nav.getStarted')} <ArrowRight size={16} aria-hidden="true" />
          </Link>

          {/* Auth buttons — desktop */}
          {isAuthenticated ? (
            <div className="relative hidden lg:block" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-forest/15 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-forest/30 hover:shadow-soft"
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-forest to-deep text-xs font-bold text-white">
                  {user?.avatar || 'U'}
                </span>
                <span className="max-w-[100px] truncate">{user?.name?.split(' ')[0]}</span>
                <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute end-0 mt-2 w-64 overflow-hidden rounded-2xl border border-forest/10 bg-white shadow-lift"
                  >
                    {/* User info */}
                    <div className="border-b border-forest/10 px-4 py-3">
                      <p className="text-sm font-bold text-ink">{user?.name}</p>
                      <p className="text-xs text-ink/50">{user?.email}</p>
                    </div>
                    {/* Menu items */}
                    <div className="p-1.5">
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink/75 transition hover:bg-mint hover:text-forest"
                      >
                        <User size={16} /> {t('nav.myProfile')}
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut size={16} /> {t('nav.logout')}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden items-center gap-2 rounded-xl border border-forest/15 bg-white px-4 py-2 text-sm font-semibold text-forest transition hover:border-forest/30 hover:bg-mint lg:inline-flex"
            >
              <LogIn size={16} /> {t('nav.login')}
            </Link>
          )}

          <button
            type="button"
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-forest/15 bg-white text-forest lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-x-0 top-16 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-forest/10 bg-cream px-4 pb-6 pt-3 shadow-lift lg:hidden"
          >
            {/* Mobile user info */}
            {isAuthenticated && user && (
              <div className="mb-3 flex items-center gap-3 rounded-xl bg-mint/70 px-4 py-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-forest to-deep text-sm font-bold text-white">
                  {user.avatar}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{user.name}</p>
                  <p className="truncate text-xs text-ink/50">{user.email}</p>
                </div>
              </div>
            )}

            <ul className="space-y-1">
              {mobileLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex min-h-[52px] items-center gap-3 rounded-xl px-4 text-base font-semibold ${
                          isActive ? 'bg-mint text-forest' : 'text-ink hover:bg-mint'
                        }`
                      }
                    >
                      <Icon size={20} aria-hidden="true" /> {t(item.labelKey)}
                    </NavLink>
                  </li>
                );
              })}
            </ul>

            <Link to="/diagnosis" className="btn-primary mt-4 w-full text-lg">
              {t('hero.primary')}
            </Link>

            {/* Mobile language selector */}
            <div className="mt-4 border-t border-forest/10 pt-4">
              <LanguageSelector mobile />
            </div>

            {/* Mobile auth button */}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="btn mt-2 w-full border border-red-200 text-base text-red-600 hover:bg-red-50"
              >
                <LogOut size={18} /> {t('nav.logout')}
              </button>
            ) : (
              <Link to="/login" className="btn-secondary mt-2 w-full text-base">
                <LogIn size={18} /> {t('nav.login')}
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
