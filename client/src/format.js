import { calendarParts } from './dates';

export function ymd(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function startOfWeek(now, lang) {
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = cursor.getDay();
  const offset = lang === 'en' ? (day === 0 ? 6 : day - 1) : (day + 1) % 7;
  cursor.setDate(cursor.getDate() - offset);
  return cursor;
}

function startOfCalendarMonth(now, calendar) {
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = calendarParts(cursor, calendar);
  while (true) {
    const prev = new Date(cursor);
    prev.setDate(prev.getDate() - 1);
    const parts = calendarParts(prev, calendar);
    if (parts.year !== target.year || parts.month !== target.month) return cursor;
    cursor.setDate(cursor.getDate() - 1);
  }
}

export function ranges(lang = 'en', calendar = 'meladi') {
  const now = new Date();
  const today = ymd(now);
  const week = startOfWeek(now, calendar === 'meladi' ? 'en' : 'fa');
  const month = calendar === 'shamsi'
    ? startOfCalendarMonth(now, 'persian')
    : calendar === 'hijri'
      ? startOfCalendarMonth(now, 'islamic-umalqura')
      : new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    today: { from: today, to: today },
    week: { from: ymd(week), to: today },
    month: { from: ymd(month), to: today },
    all: { from: '', to: '' },
  };
}

export function nowInputValue() {
  const date = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function money(value, currency = 'Rs') {
  const amount = Number(value || 0);
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
}

export function formatDay(value) {
  if (!value) return '';
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatWhen(value) {
  if (!value) return '';
  const time = value.split('T')[1] || '';
  return `${formatDay(value)} ${time.slice(0, 5)}`.trim();
}

export function rangeLabel(from, to) {
  if (!from && !to) return 'All time';
  if (from && to && from === to) return formatDay(from);
  if (from && to) return `${formatDay(from)} – ${formatDay(to)}`;
  if (from) return `From ${formatDay(from)}`;
  return `Until ${formatDay(to)}`;
}

export function percent(value) {
  const n = Number(value || 0);
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
}
