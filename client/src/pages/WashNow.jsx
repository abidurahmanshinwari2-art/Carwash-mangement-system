import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { Banner } from '../components/Banner';
import TripleDate from '../components/TripleDate';
import { money, ranges } from '../format';
import { useI18n } from '../i18n';

export default function WashNow() {
  const { currency, calendar, computerName } = useAuth();
  const { t, lang } = useI18n();
  const computer = computerName || t('computer.this');
  const today = ranges(lang, calendar).today;
  const [items, setItems] = useState([]);
  const [washes, setWashes] = useState([]);
  const [qty, setQty] = useState({});
  const [note, setNote] = useState('');
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [savingId, setSavingId] = useState(0);
  const [adding, setAdding] = useState(false);

  async function load() {
    const query = new URLSearchParams({ from: today.from, to: today.to });
    const [itemData, summary] = await Promise.all([
      api('/api/items'),
      api(`/api/summary?${query.toString()}`),
    ]);
    setItems(itemData.items);
    setWashes(summary.washes);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  function countFor(item) {
    return washes.filter((wash) => wash.itemId === item.id || wash.itemName === item.name)
      .reduce((sum, wash) => sum + wash.quantity, 0);
  }

  async function record(item) {
    setSavingId(item.id);
    setError('');
    setMessage('');
    try {
      await api('/api/washes', {
        method: 'POST',
        body: JSON.stringify({
          itemId: item.id,
          quantity: Number(qty[item.id] || 1),
          note,
        }),
      });
      setNote('');
      setQty((current) => ({ ...current, [item.id]: 1 }));
      setMessage(t('wash.saved', { name: item.name }));
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(0);
    }
  }

  async function addItem(event) {
    event.preventDefault();
    setAdding(true);
    setError('');
    setMessage('');
    try {
      await api('/api/items', {
        method: 'POST',
        body: JSON.stringify({ name, cost }),
      });
      setName('');
      setCost('');
      setMessage(t('wash.itemSaved', { computer }));
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function removeWash(wash) {
    if (!window.confirm(t('wash.removeAsk', { name: wash.itemName }))) return;
    setError('');
    try {
      await api(`/api/washes/${wash.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  const active = items.filter((item) => item.active);

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">{t('wash.eyebrow')}</p>
          <h1>{t('wash.title')}</h1>
          <p className="lede">{t('wash.lede')}</p>
        </div>
      </div>
      <Banner error={error} message={message} />

      <div className="wash-layout">
        <section>
          <label className="note-line">
            {t('wash.note')}
            <input value={note} onChange={(event) => setNote(event.target.value)} placeholder={t('wash.notePlaceholder')} maxLength={300} />
          </label>
          <div className="wash-grid">
            {active.map((item) => (
              <article className="wash-card" key={item.id}>
                <div>
                  <h2>{item.name}</h2>
                  <p>{money(item.cost, currency)}</p>
                  <small>{t('wash.washedToday')}: {countFor(item)}</small>
                </div>
                <div className="qty">
                  <button type="button" onClick={() => setQty((current) => ({ ...current, [item.id]: Math.max(1, Number(current[item.id] || 1) - 1) }))}>−</button>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={qty[item.id] || 1}
                    onChange={(event) => setQty((current) => ({ ...current, [item.id]: event.target.value }))}
                    aria-label={`${t('reports.colQty')} ${item.name}`}
                  />
                  <button type="button" onClick={() => setQty((current) => ({ ...current, [item.id]: Math.min(100, Number(current[item.id] || 1) + 1) }))}>+</button>
                </div>
                <button className="btn primary" type="button" disabled={savingId === item.id} onClick={() => record(item)}>
                  {savingId === item.id ? t('wash.saving') : t('wash.record')}
                </button>
              </article>
            ))}
            {active.length === 0 ? <p className="muted">{t('wash.empty')}</p> : null}
          </div>

          <article className="card table-card">
            <div className="card-head">
              <h2>{t('wash.todayTitle')}</h2>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('reports.colWhen')}</th>
                    <th>{t('reports.colItem')}</th>
                    <th>{t('reports.colQty')}</th>
                    <th>{t('reports.colTotal')}</th>
                    <th>{t('common.note')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {washes.map((wash) => (
                    <tr key={wash.id}>
                      <td><TripleDate value={wash.washedAt} /></td>
                      <td>{wash.itemName}</td>
                      <td>{wash.quantity}</td>
                      <td>{money(wash.total, currency)}</td>
                      <td>{wash.note || '—'}</td>
                      <td><button type="button" className="btn ghost tiny" onClick={() => removeWash(wash)}>{t('common.remove')}</button></td>
                    </tr>
                  ))}
                  {washes.length === 0 ? (
                    <tr><td colSpan="6" className="muted">{t('wash.none')}</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </article>
        </section>

        <aside>
          <form className="card stack" onSubmit={addItem}>
            <h2>{t('wash.newTitle')}</h2>
            <p className="muted">{t('wash.newHint')}</p>
            <label>
              {t('wash.washName')}
              <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} placeholder={t('settings.newPlaceholder')} />
            </label>
            <label>
              {t('wash.cost')}
              <input type="number" min="0" step="0.01" value={cost} onChange={(event) => setCost(event.target.value)} required placeholder="0.00" />
            </label>
            <button className="btn gold" type="submit" disabled={adding}>{adding ? t('common.saving') : t('wash.saveItem')}</button>
            <Link to="/settings">{t('wash.editLink')}</Link>
          </form>
        </aside>
      </div>
    </div>
  );
}
