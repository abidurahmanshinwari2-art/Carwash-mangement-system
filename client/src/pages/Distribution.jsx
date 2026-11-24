import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { Banner } from '../components/Banner';
import PeriodBar from '../components/PeriodBar';
import { DateRange } from '../components/TripleDate';
import { money, percent, ranges } from '../format';
import { useI18n } from '../i18n';
import { useSummary } from '../useSummary';

export default function Distribution() {
  const { currency, calendar } = useAuth();
  const { t, lang } = useI18n();
  const initial = ranges(lang, calendar).month;
  const [period, setPeriod] = useState(initial);
  const { data, error, loading } = useSummary(period.from, period.to);

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">{t('dist.eyebrow')}</p>
          <h1>{t('dist.title')}</h1>
          <p className="lede">{t('dist.lede')}</p>
          <DateRange from={period.from} to={period.to} />
        </div>
      </div>
      <PeriodBar from={period.from} to={period.to} onChange={setPeriod} />
      <Banner error={error} />
      {loading && !data ? <p className="muted">{t('common.loading')}</p> : null}
      {data ? (
        <>
          <section className="equation">
            <div>
              <span>{t('dist.income')}</span>
              <strong>{money(data.income, currency)}</strong>
            </div>
            <em>−</em>
            <div>
              <span>{t('dist.expenses')}</span>
              <strong>{money(data.expenseTotal, currency)}</strong>
            </div>
            <em>=</em>
            <div className={data.netProfit < 0 ? 'loss' : ''}>
              <span>{t('dist.net')}</span>
              <strong>{money(data.netProfit, currency)}</strong>
            </div>
          </section>
          <p className="muted center-note">
            <Link to="/settings">{t('dist.settings')}</Link>
          </p>
          <section className="partner-grid">
            {data.distribution.map((partner, index) => (
              <article className="card partner" key={partner.id}>
                <span className={`dot dot-${index}`}> </span>
                <h2>{partner.name}</h2>
                <p>{t('dist.percentOf', { value: percent(partner.percentage) })}</p>
                <strong className={partner.share < 0 ? 'neg' : ''}>{money(partner.share, currency)}</strong>
                <small>{t('dist.shareHint', { value: percent(partner.percentage) })}</small>
              </article>
            ))}
          </section>
          {data.percentageTotal !== 100 ? (
            <p className="banner bad">{t('dist.percentWarn', { value: percent(data.percentageTotal) })}</p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
