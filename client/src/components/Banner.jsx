export function Banner({ error, message }) {
  if (!error && !message) return null;
  return <div className={error ? 'banner bad' : 'banner good'} role="status">{error || message}</div>;
}
