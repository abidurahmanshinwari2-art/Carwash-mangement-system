import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Banner } from '../components/Banner';
import PeriodBar from '../components/PeriodBar';
import TripleDate from '../components/TripleDate';
import { clockParts, stampFromClock } from '../dates';
import { money, nowInputValue, ranges } from '../format';
import { categoryKey, categoryKeys, categoryLabel, useI18n } from '../i18n';

const emptyForm = () => ({
  title: '',
  amount: '',
  category: 'soap',
  expenseAt: nowInputValue(),
  note: '',
});

export default function Expenses() {
  const { currency, calendar } = useAuth();
  const { t, lang } = useI18n();
  const [period, setPeriod] = useState(() => ranges(lang, calendar).month);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load(next = period) {
    const query = new URLSearchParams();
    if (next.from) query.set('from', next.from);
    if (next.to) query.set('to', next.to);
    const data = await api(`/api/summary?${query.toString()}`);
    setRows(data.expenseRows);
  }

  useEffect(() => {
    load(period).catch((err) => setError(err.message));
  }, [period.from, period.to]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (editing) {
        await api(`/api/expenses/${editing}`, { method: 'PUT', body: JSON.stringify(form) });
        setMessage(t('expenses.updated'));
      } else {
        await api('/api/expenses', { method: 'POST', body: JSON.stringify(form) });
        setMessage(t('expenses.saved'));
      }
      setEditing(null);
      setForm(emptyForm());
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function edit(row) {
    setEditing(row.id);
    setForm({
      title: row.title,
      amount: String(row.amount),
      category: categoryKey(row.category),
      expenseAt: row.expenseAt.slice(0, 16),
      note: row.note,
    });
    setMessage('');
    setError('');
  }

  async function remove(row) {
    if (!window.confirm(t('expenses.deleteAsk', { name: row.title }))) return;
    setError('');
    try {
      await api(`/api/expenses/${row.id}`, { method: 'DELETE' });
      if (editing === row.id) {
        setEditing(null);
        setForm(emptyForm());
      }
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const total = rows.reduce((sum, row) => sum + Number(row.amount), 0);

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">{t('expenses.eyebrow')}</p>
          <h1>{t('expenses.title')}</h1>
          <p className="lede">{t('expenses.lede')}</p>
        </div>
      </div>
      <PeriodBar from={period.from} to={period.to} onChange={setPeriod} />
      <Banner error={error} message={message} />
      <div className="wash-layout">
        <form className="card stack" onSubmit={onSubmit}>
          <h2>{editing ? t('expenses.update') : t('expenses.add')}</h2>
          <label>
            {t('common.name')}
            <input value={form.title} onChange={(event) => update('title', event.target.value)} required maxLength={120} placeholder={t('expenses.namePlaceholder')} />
          </label>
          <label>
            {t('expenses.amount')}
            <input type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => update('amount', event.target.value)} required />
          </label>
          <label>
            {t('expenses.category')}
            <select value={form.category} onChange={(event) => update('category', event.target.value)}>
              {categoryKeys.map((key) => <option key={key} value={key}>{t(`categories.${key}`)}</option>)}
            </select>
          </label>
          <ClockFields value={form.expenseAt} onChange={(next) => update('expenseAt', next)} />
          <label>
            {t('common.note')}
            <input value={form.note} onChange={(event) => update('note', event.target.value)} maxLength={300} placeholder={t('expenses.notePlaceholder')} />
          </label>
          <div className="row-actions">
            <button className="btn primary" type="submit" disabled={busy}>
              {busy ? t('common.saving') : editing ? t('expenses.updateBtn') : t('expenses.save')}
            </button>
            {editing ? (
              <button
                className="btn ghost"
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(emptyForm());
                }}
              >
                {t('common.cancel')}
              </button>
            ) : null}
          </div>
        </form>

        <article className="card table-card">
          <div className="card-head">
            <h2>{t('expenses.list')}</h2>
            <strong>{money(total, currency)}</strong>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('expenses.when')}</th>
                  <th>{t('common.name')}</th>
                  <th>{t('expenses.category')}</th>
                  <th>{t('expenses.amount')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td><TripleDate value={row.expenseAt} /></td>
                    <td>
                      {row.title}
                      {row.note ? <small className="cell-note">{row.note}</small> : null}
                    </td>
                    <td>{categoryLabel(row.category, t)}</td>
                    <td>{money(row.amount, currency)}</td>
                    <td className="row-actions">
                      <button type="button" className="btn ghost tiny" onClick={() => edit(row)}>{t('common.edit')}</button>
                      <button type="button" className="btn ghost tiny" onClick={() => remove(row)}>{t('common.delete')}</button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? <tr><td colSpan="5" className="muted">{t('expenses.none')}</td></tr> : null}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </div>
  );
}

function ClockFields({ value, onChange }) {
  const { t } = useI18n();
  const parts = clockParts(value);
  function set(patch) {
    onChange(stampFromClock({ ...parts, ...patch }));
  }
  const hours = Array.from({ length: 12 }, (_, index) => String(index + 1));
  const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
  return (
    <div className="clock-fields">
      <label>
        {t('expenses.when')}
        <input type="date" value={parts.date} onChange={(event) => set({ date: event.target.value })} required />
        <TripleDate value={value} />
      </label>
      <div className="clock-row">
        <label>
          {t('cal.time')}
          <select value={parts.hour} onChange={(event) => set({ hour: event.target.value })}>
            {hours.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
          </select>
        </label>
        <label>
          {t('time.minute')}
          <select value={parts.minute} onChange={(event) => set({ minute: event.target.value })}>
            {minutes.map((minute) => <option key={minute} value={minute}>{minute}</option>)}
          </select>
        </label>
        <label>
          {t('time.period')}
          <select value={parts.period} onChange={(event) => set({ period: event.target.value })}>
            <option value="AM">{t('time.am')}</option>
            <option value="PM">{t('time.pm')}</option>
          </select>
        </label>
      </div>
    </div>
  );
}
