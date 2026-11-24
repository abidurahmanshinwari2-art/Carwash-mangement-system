import { useAuth } from '../auth';
import { formatShown } from '../dates';
import { useI18n } from '../i18n';

export default function TripleDate({ value, withTime = true }) {
  const { calendar } = useAuth();
  const { lang } = useI18n();
  const text = formatShown(value, calendar, lang, withTime);
  if (!text) return null;
  return <span className="shown-date">{text}</span>;
}

export function DateRange({ from, to }) {
  const { t } = useI18n();
  if (!from && !to) return <strong className="range-all">{t('period.all')}</strong>;
  if (from && from === to) return <TripleDate value={from} withTime={false} />;
  return (
    <div className="date-range">
      {from ? (
        <div>
          <em>{t('period.from')}</em>
          <TripleDate value={from} withTime={false} />
        </div>
      ) : null}
      {to ? (
        <div>
          <em>{t('period.to')}</em>
          <TripleDate value={to} withTime={false} />
        </div>
      ) : null}
    </div>
  );
}
