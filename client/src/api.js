import { readComputer } from './computer';
import { translate } from './i18n';

const TOKEN_KEY = 'zamzam.token';

function errorText(data) {
  if (data?.code) {
    const text = translate(`errors.${data.code}`);
    if (text !== `errors.${data.code}`) return text;
  }
  return data?.error || translate('errors.generic');
}

let onUnauthorized = () => {};

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response;
  try {
    response = await fetch(path, { ...options, headers });
  } catch {
    const computer = readComputer() || translate('computer.this');
    throw new Error(translate('errors.offline', { computer }));
  }

  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && !path.startsWith('/api/auth/login')) onUnauthorized();
  if (!response.ok) throw new Error(errorText(data));
  return data;
}
