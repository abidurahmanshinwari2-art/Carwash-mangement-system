export function Logo({ light = false }) {
  return (
    <div className={light ? 'logo light' : 'logo'}>
      <span className="logo-mark" aria-hidden="true">Z</span>
      <span>
        <strong>ZAMZAM</strong>
        <small>Carwash</small>
      </span>
    </div>
  );
}

export function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
    </svg>
  );
}

export function IconDrop() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 2s6.2 7.1 6.2 11.2a6.2 6.2 0 1 1-12.4 0C5.8 9.1 12 2 12 2z" />
    </svg>
  );
}

export function IconReceipt() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M6 2h12a1 1 0 0 1 1 1v19l-2.5-1.5L14 22l-2.5-1.5L9 22l-2.5-1.5L4 22V3a1 1 0 0 1 1-1zm2 5v2h8V7H8zm0 4v2h8v-2H8zm0 4v2h5v-2H8z" />
    </svg>
  );
}

export function IconSplit() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 3a9 9 0 1 0 .001 18.001A9 9 0 0 0 12 3zm0 2v6.1l5.2 3.1-1 1.7L11 12.5V5h1z" />
    </svg>
  );
}

export function IconChart() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M4 19h16v2H2V3h2v16zm4-2H6V9h2v8zm5 0h-2V5h2v12zm5 0h-2v-6h2v6z" />
    </svg>
  );
}

export function IconGear() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M19.1 12.5c.1-.3.1-.7 0-1l2-1.6-2-3.4-2.4 1a7.7 7.7 0 0 0-1.7-1L14.6 4h-4.2l-.4 2.5c-.6.2-1.2.6-1.7 1l-2.4-1-2 3.4 2 1.6a6 6 0 0 0 0 1l-2 1.6 2 3.4 2.4-1c.5.4 1.1.8 1.7 1l.4 2.5h4.2l.4-2.5c.6-.2 1.2-.6 1.7-1l2.4 1 2-3.4-2-1.6zM12.5 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z" />
    </svg>
  );
}
