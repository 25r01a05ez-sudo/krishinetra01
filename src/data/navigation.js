import { Home, ScanLine, LayoutDashboard, History, BookOpen, CloudSun, Settings, Info } from 'lucide-react';

/** Top navigation (desktop navbar + mobile menu). */
export const MAIN_NAV = [
  { to: '/', labelKey: 'nav.home', icon: Home, end: true },
  { to: '/diagnosis', labelKey: 'nav.diagnosis', icon: ScanLine },
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/history', labelKey: 'nav.history', icon: History },
  { to: '/guidance', labelKey: 'nav.guidance', icon: BookOpen },
  { to: '/monitoring', labelKey: 'nav.monitoring', icon: CloudSun },
];

/** Dashboard sidebar (desktop) – shown inside the mobile menu on small screens. */
export const SIDEBAR_NAV = [
  { to: '/dashboard', labelKey: 'nav.overview', icon: LayoutDashboard },
  { to: '/diagnosis', labelKey: 'nav.newDiagnosis', icon: ScanLine },
  { to: '/history', labelKey: 'nav.history', icon: History },
  { to: '/monitoring', labelKey: 'nav.cropMonitoring', icon: CloudSun },
  { to: '/guidance', labelKey: 'nav.guidance', icon: BookOpen },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
];

export const EXTRA_NAV = [{ to: '/about', labelKey: 'nav.about', icon: Info }];
