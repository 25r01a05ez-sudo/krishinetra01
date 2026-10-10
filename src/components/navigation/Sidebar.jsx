import { NavLink } from 'react-router-dom';
import { SIDEBAR_NAV } from '../../data/navigation';
import { useT } from '../../i18n';

export default function Sidebar() {
  const { t } = useT();
  return (
    <aside className="hidden w-60 shrink-0 lg:block" aria-label="Dashboard sidebar">
      <nav className="sticky top-24 rounded-2xl border border-forest/10 bg-white p-3 shadow-soft">
        <ul className="space-y-1">
          {SIDEBAR_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex min-h-[46px] items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
                      isActive ? 'bg-forest text-white shadow-soft' : 'text-ink/80 hover:bg-mint hover:text-forest'
                    }`
                  }
                >
                  <Icon size={18} aria-hidden="true" /> {t(item.labelKey)}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
