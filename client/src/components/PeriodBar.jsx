import { useAuth } from '../auth';
import { ranges } from '../format';
import { useI18n } from '../i18n';
import TripleDate from './TripleDate';

const presets = ['today', 'week', 'month', 'all'];

export default function PeriodBar({ from, to, onChange }) {
  const { t, lang } = useI18n();
  const { calendar } = useAuth();
  const all = ranges(lang, calendar);
  const active = Object.entries(all).find(([, range]) => range.from === from && range.to === to)?.[0];

  return (
    <div className="period no-print">
      <div className="chips">
        {presets.map((key) => (
          <button
            key={key}
            type="button"
            className={active === key ? 'chip active' : 'chip'}
            onClick={() => onChange(all[key])}
          >
            {t(`period.${key}`)}
          </button>
        ))}
      </div>
      <label className="date-field">
        {t('period.from')}
        <input type="date" value={from} onChange={(event) => onChange({ from: event.target.value, to })} />
        {from ? <TripleDate value={from} withTime={false} /> : null}
      </label>
      <label className="date-field">
        {t('period.to')}
        <input type="date" value={to} onChange={(event) => onChange({ from, to: event.target.value })} />
        {to ? <TripleDate value={to} withTime={false} /> : null}
      </label>
    </div>
  );
}
