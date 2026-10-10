import { Outlet } from 'react-router-dom';
import GettingStarted from '../GettingStarted';
import Sidebar from '../navigation/Sidebar';

/** Wraps app pages: sidebar on desktop, full-width content on phones. */
export default function DashboardShell() {
  return (
    <div className="container-page flex gap-8 py-6 sm:py-8">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <GettingStarted />
        <Outlet />
      </div>
    </div>
  );
}
