import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { DateRange } from '../components/TripleDate';
import PeriodBar from '../components/PeriodBar';
import { Banner } from '../components/Banner';
import { money, percent, ranges } from '../format';
import { useI18n } from '../i18n';
import { useSummary } from '../useSummary';

export default function Dashboard() {
  const { currency, calendar } = useAuth();
  const { t, lang } = useI18n();
  const initial = ranges(lang, calendar).today;
  const [period, setPeriod] = useState(initial);
  const { data, error, loading } = useSummary(period.from, period.to);
  const max = Math.max(1, ...(data?.byItem.map((item) => item.count) || [1]));

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{t('dashboard.title')}</h1>
          <p className="lede">{t('dashboard.lede')}</p>
          <DateRange from={period.from} to={period.to} />
        </div>
      </div>
      <PeriodBar from={period.from} to={period.to} onChange={setPeriod} />
      <Banner error={error} />
      {loading && !data ? <p className="muted">{t('common.loading')}</p> : null}
      {data ? (
        <>
          <section className="metrics">
            <article className="metric">
              <span>{t('dashboard.washes')}</span>
              <strong>{data.washCount}</strong>
              <small>{data.ticketCount} {t('dashboard.tickets')}</small>
            </article>
            <article className="metric">
              <span>{t('dashboard.income')}</span>
              <strong>{money(data.income, currency)}</strong>
              <small>{t('dashboard.fromWashes')}</small>
            </article>
            <article className="metric">
              <span>{t('dashboard.expenses')}</span>
              <strong>{money(data.expenseTotal, currency)}</strong>
              <small>{t('dashboard.allCosts')}</small>
            </article>
            <article className={`metric ${data.netProfit < 0 ? 'loss' : ''}`}>
              <span>{t('dashboard.net')}</span>
              <strong>{money(data.netProfit, currency)}</strong>
              <small>{t('dashboard.netHint')}</small>
            </article>
          </section>

          <section className="split">
            <article className="card">
              <div className="card-head">
                <h2>{t('dashboard.byType')}</h2>
                <Link to="/wash">{t('dashboard.record')}</Link>
              </div>
              <div className="bars">
                {data.byItem.map((item) => (
                  <div className="bar-row" key={item.name}>
                    <div className="bar-label">
                      <strong>{item.name}</strong>
                      <span>{item.count} {t('dashboard.washed')} · {money(item.revenue, currency)}</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(item.count / max) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {data.byItem.length === 0 ? <p className="muted">{t('dashboard.empty')}</p> : null}
              </div>
            </article>

            <article className="card">
              <div className="card-head">
                <h2>{t('dashboard.splitTitle')}</h2>
                <Link to="/distribution">{t('dashboard.fullSplit')}</Link>
              </div>
              <p className="formula">{t('dashboard.formula')}</p>
              <div className="share-list">
                {data.distribution.map((partner, index) => (
                  <div className="share-card" key={partner.id}>
                    <div>
                      <span className={`dot dot-${index}`}> </span>
                      <strong>{partner.name}</strong>
                      <small>{t('dashboard.invested', { value: percent(partner.percentage) })}</small>
                    </div>
                    <b className={partner.share < 0 ? 'neg' : ''}>{money(partner.share, currency)}</b>
                  </div>
                ))}
              </div>
              {data.percentageTotal !== 100 ? (
                <p className="banner bad">{t('dashboard.percentWarn', { value: percent(data.percentageTotal) })}</p>
              ) : null}
            </article>
          </section>
        </>
      ) : null}
    </div>
  );
}
