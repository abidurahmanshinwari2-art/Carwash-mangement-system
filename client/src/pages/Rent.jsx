import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Banner } from '../components/Banner';
import { formatMonthYear, formatShown } from '../dates';
import { money, nowInputValue, ranges, ymd } from '../format';
import { useI18n } from '../i18n';

const emptyPerson = () => ({
  personName: '',
  phone: '',
  roomId: '',
  monthlyFee: '',
  note: '',
  movedIn: ymd(new Date()),
});

export default function Rent() {
  const { currency, calendar, businessName, computerName } = useAuth();
  const { t, lang } = useI18n();
  const month = useMemo(() => ranges(lang, calendar).month, [lang, calendar]);
  const [desk, setDesk] = useState(null);
  const [form, setForm] = useState(emptyPerson);
  const [paying, setPaying] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const query = new URLSearchParams({ from: month.from, to: month.to });
    setDesk(await api(`/api/rent?${query.toString()}`));
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [month.from, month.to]);

  const rooms = desk?.rooms || [];
  const people = desk?.people || [];
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? people.filter((person) => [person.personName, person.roomName, person.phone, person.note]
      .some((value) => String(value || '').toLowerCase().includes(needle)))
    : people;
  const cards = desk?.cards || { rentedRooms: 0, monthIncome: 0, paymentsCollected: 0, partialPeople: 0 };
  const takenIds = new Set(people.map((person) => person.roomId));
  const freeRooms = rooms.filter((room) => !takenIds.has(room.id));

  function chooseRoom(roomId) {
    const room = rooms.find((row) => String(row.id) === String(roomId));
    setForm((current) => ({
      ...current,
      roomId,
      monthlyFee: room ? String(room.rent) : current.monthlyFee,
    }));
  }

  async function savePerson(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/api/rent/tenants', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          roomId: Number(form.roomId),
        }),
      });
      setForm(emptyPerson());
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function openPay(person) {
    setError('');
    setPaying(person);
    setPayAmount(String(person.remaining > 0 ? person.remaining : person.monthlyFee));
    setPayNote('');
  }

  async function takePayment(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api('/api/rent/payments', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: paying.id,
          amount: payAmount,
          paidAt: nowInputValue(),
          note: payNote,
          from: month.from,
          to: month.to,
        }),
      });
      setPaying(null);
      setReceipt(result.receipt);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function leaveRoom(person) {
    if (!window.confirm(t('rent.confirmLeave'))) return;
    setError('');
    try {
      await api(`/api/rent/tenants/${person.id}/leave`, { method: 'POST' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  function statusText(status) {
    if (status === 'paid') return t('rent.paid');
    if (status === 'partial') return t('rent.partialStatus');
    return t('rent.unpaid');
  }

  return (
    <div>
      <div className={receipt ? 'no-print' : undefined}>
        <div className="page-head">
          <div>
            <p className="eyebrow">{t('rent.eyebrow')}</p>
            <h1>{t('rent.title')}</h1>
          </div>
          <p className="shown-date">{formatMonthYear(new Date(), calendar, lang)}</p>
        </div>
        <Banner error={error} />

        <section className="metrics">
          <article className="card metric">
            <span>{t('rent.rented')}</span>
            <strong>{cards.rentedRooms}</strong>
          </article>
          <article className="card metric">
            <span>{t('rent.monthIncome')}</span>
            <strong>{money(cards.monthIncome, currency)}</strong>
          </article>
          <article className="card metric">
            <span>{t('rent.collected')}</span>
            <strong>{cards.paymentsCollected}</strong>
          </article>
          <article className="card metric">
            <span>{t('rent.partial')}</span>
            <strong>{cards.partialPeople}</strong>
          </article>
        </section>

        <label className="rent-search">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('rent.search')}
          />
        </label>

        <div className="rent-layout">
          <form className="card stack" onSubmit={savePerson}>
            <h2>{t('rent.assign')}</h2>
            <label>
              {t('rent.room')}
              <select value={form.roomId} onChange={(event) => chooseRoom(event.target.value)} required>
                <option value="">{t('rent.room')}</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id} disabled={takenIds.has(room.id)}>
                    {takenIds.has(room.id) ? `${room.name} · ${t('rent.given')}` : room.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t('rent.person')}
              <input value={form.personName} onChange={(event) => setForm({ ...form, personName: event.target.value })} required maxLength={80} />
            </label>
            <label>
              {t('rent.phone')}
              <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} maxLength={40} />
            </label>
            <label>
              {t('rent.fee')}
              <input type="number" min="0" step="0.01" value={form.monthlyFee} onChange={(event) => setForm({ ...form, monthlyFee: event.target.value })} required />
            </label>
            <label>
              {t('rent.movedIn')}
              <input type="date" value={form.movedIn} onChange={(event) => setForm({ ...form, movedIn: event.target.value })} required />
            </label>
            <label>
              {t('rent.note')}
              <textarea value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} maxLength={300} rows={3} />
            </label>
            <button className="btn primary" type="submit" disabled={busy || freeRooms.length === 0}>{t('rent.savePerson')}</button>
          </form>

          <section className="card stack">
            <h2>{t('rent.rented')}</h2>
            {people.length === 0 ? <p className="muted">{t('rent.noPeople')}</p> : null}
            {people.length > 0 && shown.length === 0 ? <p className="muted">{t('rent.noMatch')}</p> : null}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('rent.person')}</th>
                    <th>{t('rent.phone')}</th>
                    <th>{t('rent.room')}</th>
                    <th>{t('rent.note')}</th>
                    <th>{t('rent.fee')}</th>
                    <th>{t('rent.paidMonth')}</th>
                    <th>{t('rent.remaining')}</th>
                    <th>{t('rent.status')}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((person) => (
                    <tr key={person.id}>
                      <td><strong>{person.personName}</strong></td>
                      <td>{person.phone}</td>
                      <td>{person.roomName}</td>
                      <td>{person.note}</td>
                      <td>{money(person.monthlyFee, currency)}</td>
                      <td>{money(person.paidThisMonth, currency)}</td>
                      <td>{money(person.remaining, currency)}</td>
                      <td><span className={`pill ${person.status}`}>{statusText(person.status)}</span></td>
                      <td className="row-actions">
                        <button type="button" className="btn gold tiny" onClick={() => openPay(person)}>{t('rent.pay')}</button>
                        <button type="button" className="btn ghost tiny" onClick={() => leaveRoom(person)}>{t('rent.leave')}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {paying ? (
          <div className="modal-back">
            <form className="card stack pay-box" onSubmit={takePayment}>
              <h2>{t('rent.pay')} · {paying.personName}</h2>
              <p className="muted">{paying.roomName} · {statusText(paying.status)} · {t('rent.remaining')} {money(paying.remaining, currency)}</p>
              <label>
                {t('rent.amount')}
                <input type="number" min="0.01" step="0.01" value={payAmount} onChange={(event) => setPayAmount(event.target.value)} required />
              </label>
              <label>
                {t('common.note')}
                <input value={payNote} onChange={(event) => setPayNote(event.target.value)} maxLength={300} />
              </label>
              <div className="receipt-actions">
                <button type="button" className="btn ghost" onClick={() => setPaying(null)}>{t('rent.cancel')}</button>
                <button className="btn primary" type="submit" disabled={busy}>{t('rent.payNow')}</button>
              </div>
            </form>
          </div>
        ) : null}
      </div>

      {receipt ? (
        <div className="modal-back">
          <article className="card receipt-sheet">
            <p className="receipt-brand"><strong>{businessName || t('brand.full')}</strong></p>
            <h2>{t('rent.receipt')}</h2>
            <p className="muted" style={{ textAlign: 'center' }}>{computerName || t('computer.this')}</p>
            <div className="receipt-lines">
              <div><span>{t('rent.receiptNo')}</span><strong>#{receipt.id}</strong></div>
              <div><span>{t('rent.person')}</span><strong>{receipt.personName}</strong></div>
              {receipt.phone ? <div><span>{t('rent.phone')}</span><strong>{receipt.phone}</strong></div> : null}
              <div><span>{t('rent.room')}</span><strong>{receipt.roomName}</strong></div>
              <div><span>{t('rent.fee')}</span><strong>{money(receipt.monthlyFee, currency)}</strong></div>
              <div><span>{t('rent.amount')}</span><strong>{money(receipt.amount, currency)}</strong></div>
              <div><span>{t('rent.paidMonth')}</span><strong>{money(receipt.paidThisMonth, currency)}</strong></div>
              <div><span>{t('rent.remaining')}</span><strong>{money(receipt.remaining, currency)}</strong></div>
              <div><span>{t('rent.status')}</span><strong>{statusText(receipt.status)}</strong></div>
              <div><span>{t('reports.colWhen')}</span><strong>{formatShown(receipt.paidAt, calendar, lang, true)}</strong></div>
              {receipt.note ? <div><span>{t('common.note')}</span><strong>{receipt.note}</strong></div> : null}
            </div>
            <div className="receipt-actions no-print">
              <button type="button" className="btn ghost" onClick={() => setReceipt(null)}>{t('rent.close')}</button>
              <button type="button" className="btn primary" onClick={() => window.print()}>{t('rent.print')}</button>
            </div>
          </article>
        </div>
      ) : null}
    </div>
  );
}
