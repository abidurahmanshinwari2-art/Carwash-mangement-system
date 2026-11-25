import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Banner } from '../components/Banner';
import PeriodBar from '../components/PeriodBar';
import TripleDate, { DateRange } from '../components/TripleDate';
import { formatShown } from '../dates';
import { money, percent, ranges } from '../format';
import { categoryLabel, useI18n } from '../i18n';
import { useSummary } from '../useSummary';

function download(filename, rows) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { businessName, currency, calendar } = useAuth();
  const { t, lang } = useI18n();
  const initial = ranges(lang, calendar).month;
  const [period, setPeriod] = useState(initial);
  const [params, setParams] = useSearchParams();
  const tabs = [
    ['expenses', t('reports.expenses')],
    ['income', t('reports.income')],
    ['profit', t('reports.profit')],
    ['distribution', t('reports.distribution')],
    ['rent', t('reports.rent')],
  ];
  const tab = tabs.some(([key]) => key === params.get('tab')) ? params.get('tab') : 'expenses';
  const { data, error, loading } = useSummary(period.from, period.to);
  const [rent, setRent] = useState(null);
  const [rentError, setRentError] = useState('');
  const title = tabs.find(([key]) => key === tab)?.[1] || t('reports.title');

  useEffect(() => {
    const query = new URLSearchParams();
    if (period.from) query.set('from', period.from);
    if (period.to) query.set('to', period.to);
    let cancel = false;
    api(`/api/rent/report?${query.toString()}`)
      .then((result) => { if (!cancel) setRent(result); })
      .catch((err) => { if (!cancel) setRentError(err.message); });
    return () => { cancel = true; };
  }, [period.from, period.to]);

  function shown(value, withTime = true) {
    return formatShown(value, calendar, lang, withTime);
  }

  function statusText(status) {
    if (status === 'paid') return t('rent.paid');
    if (status === 'partial') return t('rent.partialStatus');
    return t('rent.unpaid');
  }

  function exportCsv() {
    if (tab === 'rent') {
      if (!rent) return;
      const stamp = `${period.from || 'start'}_${period.to || 'end'}`;
      download(`zamzam-room-rent-${stamp}.csv`, [
        [t('rent.person'), t('rent.phone'), t('rent.room'), t('rent.fee'), t('rent.paidMonth'), t('rent.remaining'), t('rent.status')],
        ...rent.people.map((row) => [row.personName, row.phone, row.roomName, row.monthlyFee, row.paidThisMonth, row.remaining, statusText(row.status)]),
      ]);
      return;
    }
    if (!data) return;
    const stamp = `${period.from || 'start'}_${period.to || 'end'}`;
    if (tab === 'expenses') {
      download(`zamzam-expenses-${stamp}.csv`, [
        [t('reports.colWhen'), t('reports.colName'), t('reports.colCategory'), t('reports.colNote'), t('reports.colAmount')],
        ...data.expenseRows.map((row) => [shown(row.expenseAt), row.title, categoryLabel(row.category, t), row.note, row.amount]),
        ['', '', '', t('common.total'), data.expenseTotal],
      ]);
    } else if (tab === 'income') {
      download(`zamzam-income-${stamp}.csv`, [
        [t('reports.colWhen'), t('reports.colItem'), t('reports.colQty'), t('reports.colUnit'), t('reports.colTotal'), t('reports.colNote')],
        ...data.washes.map((row) => [shown(row.washedAt), row.itemName, row.quantity, row.unitCost, row.total, row.note]),
        ['', '', '', t('dashboard.income'), data.income, ''],
      ]);
    } else if (tab === 'profit') {
      download(`zamzam-net-profit-${stamp}.csv`, [
        [t('reports.colDate'), t('reports.colIncome'), t('reports.colExpenses'), t('reports.colNet')],
        ...data.byDay.map((day) => [shown(day.date, false), day.income, day.expenses, day.net]),
        [t('common.total'), data.income, data.expenseTotal, data.netProfit],
      ]);
    } else {
      download(`zamzam-distribution-${stamp}.csv`, [
        [t('dashboard.net'), data.netProfit],
        [t('reports.partner'), t('reports.investment'), t('reports.share')],
        ...data.distribution.map((row) => [row.name, row.percentage, row.share]),
      ]);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">{t('reports.eyebrow')}</p>
          <h1>{t('reports.title')}</h1>
          <p className="lede">{t('reports.lede')}</p>
        </div>
        <div className="row-actions no-print">
          <button type="button" className="btn ghost" onClick={() => window.print()} disabled={tab === 'rent' ? !rent : !data}>{t('common.print')}</button>
          <button type="button" className="btn primary" onClick={exportCsv} disabled={tab === 'rent' ? !rent : !data}>{t('common.download')}</button>
        </div>
      </div>
      <PeriodBar from={period.from} to={period.to} onChange={setPeriod} />
      <div className="tabs no-print">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={tab === key ? 'chip active' : 'chip'}
            onClick={() => setParams({ tab: key })}
          >
            {label}
          </button>
        ))}
      </div>
      <Banner error={tab === 'rent' ? rentError : error} />
      {tab !== 'rent' && loading && !data ? <p className="muted">{t('reports.preparing')}</p> : null}
      {tab === 'rent' ? <RentReport rent={rent} currency={currency} businessName={businessName} statusText={statusText} /> : null}
      {tab !== 'rent' && data ? (
        <article className="card report-sheet">
          <header className="report-head">
            <p className="eyebrow">{businessName}</p>
            <h2>{title}</h2>
            <DateRange from={period.from} to={period.to} />
          </header>
          {tab === 'expenses' ? <ExpenseTable rows={data.expenseRows} total={data.expenseTotal} currency={currency} /> : null}
          {tab === 'income' ? <IncomeTable data={data} currency={currency} /> : null}
          {tab === 'profit' ? <ProfitTable data={data} currency={currency} /> : null}
          {tab === 'distribution' ? <DistributionTable data={data} currency={currency} /> : null}
        </article>
      ) : null}
    </div>
  );
}

function RentReport({ rent, currency, businessName, statusText }) {
  const { t } = useI18n();
  if (!rent) return <p className="muted">{t('reports.preparing')}</p>;
  const people = rent.people || [];
  return (
    <article className="card report-sheet">
      <header className="report-head">
        <p className="eyebrow">{businessName}</p>
        <h2>{t('reports.rent')}</h2>
        <DateRange from={rent.from} to={rent.to} />
        <p className="muted">{t('reports.rentNote')}</p>
      </header>
      <div className="mini-stats">
        <div><span>{t('rent.unpaid')}</span><strong>{rent.counts.unpaid}</strong></div>
        <div><span>{t('rent.partialStatus')}</span><strong>{rent.counts.partial}</strong></div>
        <div><span>{t('rent.paid')}</span><strong>{rent.counts.paid}</strong></div>
        <div><span>{t('rent.monthIncome')}</span><strong>{money(rent.collected, currency)}</strong></div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('rent.person')}</th>
              <th>{t('rent.phone')}</th>
              <th>{t('rent.room')}</th>
              <th>{t('rent.fee')}</th>
              <th>{t('rent.paidMonth')}</th>
              <th>{t('rent.remaining')}</th>
              <th>{t('rent.status')}</th>
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <tr key={person.id}>
                <td>{person.personName}</td>
                <td>{person.phone || '—'}</td>
                <td>{person.roomName}</td>
                <td>{money(person.monthlyFee, currency)}</td>
                <td>{money(person.paidThisMonth, currency)}</td>
                <td>{money(person.remaining, currency)}</td>
                <td>{statusText(person.status)}</td>
              </tr>
            ))}
            {people.length === 0 ? <tr><td colSpan="7" className="muted">{t('reports.noRent')}</td></tr> : null}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function ExpenseTable({ rows, total, currency }) {
  const { t } = useI18n();
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{t('reports.colWhen')}</th>
            <th>{t('reports.colName')}</th>
            <th>{t('reports.colCategory')}</th>
            <th>{t('reports.colNote')}</th>
            <th>{t('reports.colAmount')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td><TripleDate value={row.expenseAt} /></td>
              <td>{row.title}</td>
              <td>{categoryLabel(row.category, t)}</td>
              <td>{row.note || '—'}</td>
              <td>{money(row.amount, currency)}</td>
            </tr>
          ))}
          {rows.length === 0 ? <tr><td colSpan="5" className="muted">{t('reports.noExpenses')}</td></tr> : null}
        </tbody>
        <tfoot>
          <tr><td colSpan="4">{t('reports.totalExpenses')}</td><td>{money(total, currency)}</td></tr>
        </tfoot>
      </table>
    </div>
  );
}

function IncomeTable({ data, currency }) {
  const { t } = useI18n();
  return (
    <>
      <div className="mini-stats">
        {data.byItem.map((item) => (
          <div key={item.name}>
            <span>{item.name}</span>
            <strong>{item.count}</strong>
            <small>{money(item.revenue, currency)}</small>
          </div>
        ))}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('reports.colWhen')}</th>
              <th>{t('reports.colItem')}</th>
              <th>{t('reports.colQty')}</th>
              <th>{t('reports.colUnit')}</th>
              <th>{t('reports.colTotal')}</th>
              <th>{t('reports.colNote')}</th>
            </tr>
          </thead>
          <tbody>
            {data.washes.map((row) => (
              <tr key={row.id}>
                <td><TripleDate value={row.washedAt} /></td>
                <td>{row.itemName}</td>
                <td>{row.quantity}</td>
                <td>{money(row.unitCost, currency)}</td>
                <td>{money(row.total, currency)}</td>
                <td>{row.note || '—'}</td>
              </tr>
            ))}
            {data.washes.length === 0 ? <tr><td colSpan="6" className="muted">{t('reports.noIncome')}</td></tr> : null}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="4">{t('dashboard.income')} · {t('reports.washesCount', { count: data.washCount })}</td>
              <td>{money(data.income, currency)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}

function ProfitTable({ data, currency }) {
  const { t } = useI18n();
  return (
    <>
      <section className="equation compact">
        <div><span>{t('dist.income')}</span><strong>{money(data.income, currency)}</strong></div>
        <em>−</em>
        <div><span>{t('dist.expenses')}</span><strong>{money(data.expenseTotal, currency)}</strong></div>
        <em>=</em>
        <div><span>{t('dist.net')}</span><strong>{money(data.netProfit, currency)}</strong></div>
      </section>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('reports.colDate')}</th>
              <th>{t('reports.colIncome')}</th>
              <th>{t('reports.colExpenses')}</th>
              <th>{t('reports.colNet')}</th>
            </tr>
          </thead>
          <tbody>
            {data.byDay.map((day) => (
              <tr key={day.date}>
                <td><TripleDate value={day.date} withTime={false} /></td>
                <td>{money(day.income, currency)}</td>
                <td>{money(day.expenses, currency)}</td>
                <td>{money(day.net, currency)}</td>
              </tr>
            ))}
            {data.byDay.length === 0 ? <tr><td colSpan="4" className="muted">{t('reports.noActivity')}</td></tr> : null}
          </tbody>
        </table>
      </div>
    </>
  );
}

function DistributionTable({ data, currency }) {
  const { t } = useI18n();
  return (
    <>
      <p className="formula">{t('reports.formula', { amount: money(data.netProfit, currency) })}</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('reports.partner')}</th>
              <th>{t('reports.investment')}</th>
              <th>{t('reports.share')}</th>
            </tr>
          </thead>
          <tbody>
            {data.distribution.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{percent(row.percentage)}</td>
                <td>{money(row.share, currency)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>{t('common.total')}</td>
              <td>{percent(data.percentageTotal)}</td>
              <td>{money(data.distribution.reduce((sum, row) => sum + row.share, 0), currency)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}
