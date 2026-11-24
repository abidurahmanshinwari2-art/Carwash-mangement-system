import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  ];
  const tab = tabs.some(([key]) => key === params.get('tab')) ? params.get('tab') : 'expenses';
  const { data, error, loading } = useSummary(period.from, period.to);
  const title = tabs.find(([key]) => key === tab)?.[1] || t('reports.title');

  function shown(value, withTime = true) {
    return formatShown(value, calendar, lang, withTime);
  }

  function exportCsv() {
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
          <button type="button" className="btn ghost" onClick={() => window.print()} disabled={!data}>{t('common.print')}</button>
          <button type="button" className="btn primary" onClick={exportCsv} disabled={!data}>{t('common.download')}</button>
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
      <Banner error={error} />
      {loading && !data ? <p className="muted">{t('reports.preparing')}</p> : null}
      {data ? (
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
