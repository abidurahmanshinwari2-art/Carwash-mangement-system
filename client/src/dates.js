const SHAMSI = {
  en: ['Hamal', 'Sawr', 'Jawza', 'Saratan', 'Asad', 'Sonbola', 'Mizan', 'Aqrab', 'Qaws', 'Jadi', 'Dalw', 'Hoot'],
  fa: ['حمل', 'ثور', 'جوزا', 'سرطان', 'اسد', 'سنبله', 'میزان', 'عقرب', 'قوس', 'جدی', 'دلو', 'حوت'],
  ps: ['وری', 'غویی', 'غبرګولی', 'چنګاښ', 'زمری', 'وږی', 'تله', 'لړم', 'لیندۍ', 'مرغومی', 'سلواغه', 'کب'],
};

const HIJRI = {
  en: ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhu al-Qadah', 'Dhu al-Hijjah'],
  fa: ['محرم', 'صفر', 'ربیع‌الاول', 'ربیع‌الثانی', 'جمادی‌الاول', 'جمادی‌الثانی', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذیقعده', 'ذیحجه'],
  ps: ['محرم', 'صفر', 'ربیع الاول', 'ربیع الثاني', 'جمادي الاول', 'جمادي الثاني', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذوالقعده', 'ذوالحجه'],
};

const MELADI = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  fa: ['جنوری', 'فبروری', 'مارچ', 'اپریل', 'می', 'جون', 'جولای', 'اگست', 'سپتمبر', 'اکتوبر', 'نوامبر', 'دسمبر'],
  ps: ['جنوري', 'فبروري', 'مارچ', 'اپریل', 'مۍ', 'جون', 'جولای', 'اګست', 'سپتمبر', 'اکتوبر', 'نومبر', 'ډسمبر'],
};

export function calendarParts(date, calendar) {
  const fmt = new Intl.DateTimeFormat('en-US-u-nu-latn', {
    calendar,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
  const bag = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type === 'day' || part.type === 'month' || part.type === 'year') bag[part.type] = Number(part.value);
  }
  return bag;
}

export function parseStamp(value) {
  if (!value) return null;
  const [datePart, timePart] = String(value).split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return null;
  let hours = 0;
  let minutes = 0;
  if (timePart) {
    const bits = timePart.split(':').map(Number);
    hours = bits[0] || 0;
    minutes = bits[1] || 0;
  }
  return {
    date: new Date(year, month - 1, day, hours, minutes, 0),
    hasTime: Boolean(timePart),
  };
}

const DAY_HALF = {
  en: ['AM', 'PM'],
  fa: ['ق.ظ', 'ب.ظ'],
  ps: ['غ.م', 'غ.و'],
};

export function formatClock(date, lang) {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const half = hours >= 12 ? 1 : 0;
  const hour12 = hours % 12 || 12;
  const mark = (DAY_HALF[lang] || DAY_HALF.en)[half];
  return `${hour12}:${minutes} ${mark}`;
}

function monthName(kind, lang, month) {
  const pack = kind === 'shamsi' ? SHAMSI : kind === 'hijri' ? HIJRI : MELADI;
  return pack[lang]?.[month - 1] || pack.en[month - 1];
}

export function formatCalendar(date, kind, lang) {
  if (kind === 'meladi') {
    return `${date.getDate()} ${monthName('meladi', lang, date.getMonth() + 1)} ${date.getFullYear()}`;
  }
  const parts = calendarParts(date, kind === 'shamsi' ? 'persian' : 'islamic-umalqura');
  return `${parts.day} ${monthName(kind, lang, parts.month)} ${parts.year}`;
}

export function clockParts(value) {
  const parsed = parseStamp(value);
  const date = parsed?.date || new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const hours = date.getHours();
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    hour: String(hours % 12 || 12),
    minute: pad(date.getMinutes()),
    period: hours >= 12 ? 'PM' : 'AM',
  };
}

export function stampFromClock({ date, hour, minute, period }) {
  let hours = Number(hour) % 12;
  if (period === 'PM') hours += 12;
  const pad = (n) => String(Number(n)).padStart(2, '0');
  return `${date}T${pad(hours)}:${pad(minute)}`;
}

export function formatShown(value, kind, lang, withTime = true) {
  const parsed = parseStamp(value);
  if (!parsed) return '';
  const calendar = kind === 'shamsi' || kind === 'hijri' ? kind : 'meladi';
  const dateText = formatCalendar(parsed.date, calendar, lang);
  if (!withTime || !parsed.hasTime) return dateText;
  return `${dateText}, ${formatClock(parsed.date, lang)}`;
}
