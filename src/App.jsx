import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardShell from './components/layout/DashboardShell';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import AccountRecovery from './pages/AccountRecovery';
import Register from './pages/Register';
import Diagnosis from './pages/Diagnosis';
import Results from './pages/Results';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Guidance from './pages/Guidance';
import Monitoring from './pages/Monitoring';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="login" element={<Login />} />
        <Route path="otp-login" element={<AccountRecovery key="otp" />} />
        <Route path="forgot-password" element={<AccountRecovery key="reset" reset />} />
        <Route path="register" element={<Register />} />
        <Route element={<ProtectedRoute><DashboardShell /></ProtectedRoute>}>
          <Route path="diagnosis" element={<Diagnosis />} />
          <Route path="results/:id" element={<Results />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="history" element={<History />} />
          <Route path="guidance" element={<Guidance />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

