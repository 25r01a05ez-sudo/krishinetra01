import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import App from './App';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { I18nProvider } from './i18n';
import './index.css';

function AccountApp() { const { user } = useAuth(); return <AppProvider key={user?.id || 'guest'}><App /></AppProvider>; }

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* reducedMotion="user" makes animations respect the OS "reduce motion" setting */}
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <I18nProvider>
          <AuthProvider>
            <AccountApp />
          </AuthProvider>
        </I18nProvider>
      </BrowserRouter>
    </MotionConfig>
  </React.StrictMode>,
);

