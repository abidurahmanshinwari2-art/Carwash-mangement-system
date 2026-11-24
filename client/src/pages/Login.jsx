import { useState } from 'react';
import { useAuth } from '../auth';
import LanguageSwitch from '../components/LanguageSwitch';
import { useI18n } from '../i18n';

export default function Login() {
  const { login, computerName } = useAuth();
  const { t } = useI18n();
  const computer = computerName || t('computer.this');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <section className="login-photo">
        <img src="/zamzam-carwash.png" alt={t('brand.full')} />
      </section>
      <section className="login-panel">
        <form className="card login-card" onSubmit={onSubmit}>
          <LanguageSwitch />
          <label>
            {t('login.username')}
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
          </label>
          <label>
            {t('login.password')}
            <span className="password-row">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button type="button" className="btn ghost tiny" onClick={() => setShow((value) => !value)}>
                {show ? t('login.hide') : t('login.show')}
              </button>
            </span>
          </label>
          {error ? <div className="banner bad">{error}</div> : null}
          <button className="btn primary" type="submit" disabled={busy}>{busy ? t('login.busy') : t('login.submit')}</button>
          <p className="hint">{computer}</p>
        </form>
      </section>
    </div>
  );
}
