import { FlaskConical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useT } from '../../i18n';

export default function DemoBanner() {
  const { demoMode } = useApp();
  const { t } = useT();
  if (!demoMode) return null;
  return (
    <div role="status" className="bg-gold text-ink">
      <div className="container-page flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center text-sm font-semibold">
        <FlaskConical size={16} aria-hidden="true" />
        <span>{t('common.demoBanner')}</span>
        <Link to="/settings" className="underline underline-offset-2">
          Turn off
        </Link>
      </div>
    </div>
  );
}
