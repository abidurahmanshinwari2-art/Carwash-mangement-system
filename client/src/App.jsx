import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { useI18n } from './i18n';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WashNow from './pages/WashNow';
import Expenses from './pages/Expenses';
import Distribution from './pages/Distribution';
import Reports from './pages/Reports';
import Rent from './pages/Rent';
import Settings from './pages/Settings';

function Splash() {
  const { t } = useI18n();
  return (
    <div className="splash">
      <div className="logo-mark">Z</div>
      <p>{t('splash')}</p>
    </div>
  );
}

function RequireAuth() {
  const { user, ready } = useAuth();
  if (!ready) return <Splash />;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout />;
}

function GuestOnly() {
  const { user, ready } = useAuth();
  if (!ready) return <Splash />;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<GuestOnly />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/wash" element={<WashNow />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/distribution" element={<Distribution />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/rent" element={<Rent />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
