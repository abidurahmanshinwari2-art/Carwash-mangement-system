import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from './api';
import { rememberComputer } from './computer';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [businessName, setBusinessName] = useState('ZAMZAM Carwash');
  const [currency, setCurrency] = useState('Rs');
  const [calendar, setCalendar] = useState('meladi');
  const [computerName, setComputerName] = useState('');
  const [ready, setReady] = useState(false);

  function applySettings(settings) {
    setBusinessName(settings.businessName || 'ZAMZAM Carwash');
    setCurrency(settings.currency || 'Rs');
    setCalendar(settings.calendar || 'meladi');
  }

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
    });
  }, []);

  useEffect(() => {
    let ignore = false;
    async function boot() {
      try {
        const health = await api('/api/health');
        if (!ignore && health.computerName) {
          setComputerName(health.computerName);
          rememberComputer(health.computerName);
        }
      } catch {
        /* the desk name appears after the server answers */
      }
      if (!getToken()) {
        if (!ignore) setReady(true);
        return;
      }
      try {
        const me = await api('/api/auth/me');
        const settings = await api('/api/settings');
        if (ignore) return;
        setUser(me.user);
        applySettings(settings);
      } catch {
        if (!ignore) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!ignore) setReady(true);
      }
    }
    boot();
    return () => {
      ignore = true;
    };
  }, []);

  const value = useMemo(() => ({
    user,
    ready,
    businessName,
    currency,
    calendar,
    computerName,
    async login(username, password) {
      const result = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setToken(result.token);
      setUser(result.user);
      const settings = await api('/api/settings');
      applySettings(settings);
    },
    logout() {
      setToken(null);
      setUser(null);
    },
    async refreshSettings() {
      applySettings(await api('/api/settings'));
    },
  }), [user, ready, businessName, currency, calendar, computerName]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
