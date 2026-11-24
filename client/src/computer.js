const KEY = 'zamzam.computer';

export function rememberComputer(name) {
  const text = String(name || '').trim();
  if (!text) return;
  try {
    sessionStorage.setItem(KEY, text);
  } catch {
    /* the name is still kept in React state */
  }
}

export function readComputer() {
  try {
    return sessionStorage.getItem(KEY) || '';
  } catch {
    return '';
  }
}
