import { Link, useLocation } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { useT } from '../../i18n';

/** Floating primary action on phones – scanning is the main task. */
export default function MobileScanBar() {
  const { pathname } = useLocation();
  const { t } = useT();
  if (pathname.startsWith('/diagnosis')) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 p-4 sm:hidden">
      <Link to="/diagnosis" className="btn-primary pointer-events-auto w-full text-lg shadow-lift">
        <Camera size={22} aria-hidden="true" /> {t('nav.scan')}
      </Link>
    </div>
  );
}
