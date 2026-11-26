import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Banner } from '../components/Banner';
import { percent } from '../format';
import { useI18n } from '../i18n';

export default function Settings() {
  const { currency, refreshSettings, computerName } = useAuth();
  const { t } = useI18n();
  const computer = computerName || t('computer.this');
  const [businessName, setBusinessName] = useState('');
  const [symbol, setSymbol] = useState('Rs');
  const [calendarKind, setCalendarKind] = useState('meladi');
  const [investors, setInvestors] = useState([]);
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [itemName, setItemName] = useState('');
  const [itemCost, setItemCost] = useState('');
  const [rooms, setRooms] = useState([]);
  const [roomDrafts, setRoomDrafts] = useState({});
  const [roomName, setRoomName] = useState('');
  const [roomRent, setRoomRent] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [revision, setRevision] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function load() {
    const [settings, partnerData, itemData, roomData] = await Promise.all([
      api('/api/settings'),
      api('/api/investors'),
      api('/api/items'),
      api('/api/rooms'),
    ]);
    setBusinessName(settings.businessName);
    setSymbol(settings.currency);
    setCalendarKind(settings.calendar || 'meladi');
    setInvestors(partnerData.investors);
    setItems(itemData.items);
    setDrafts(Object.fromEntries(itemData.items.map((item) => [item.id, { name: item.name, cost: String(item.cost), active: item.active }])));
    setRooms(roomData.rooms);
    setRoomDrafts(Object.fromEntries(roomData.rooms.map((room) => [room.id, { name: room.name, rent: String(room.rent) }])));
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
    api('/api/system').then(setRevision).catch(() => {});
  }, []);

  const percentCents = investors.reduce((sum, row) => sum + Math.round(Number(row.percentage || 0) * 100), 0);
  const percentReady = percentCents === 10000 && investors.every((row) => row.name.trim());

  async function saveBusiness(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await api('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ businessName, currency: symbol, calendar: calendarKind }),
      });
      await refreshSettings();
      setMessage(t('settings.businessSaved'));
    } catch (err) {
      setError(err.message);
    }
  }

  function splitEqually() {
    setInvestors((current) => current.map((row, index) => ({
      ...row,
      percentage: index === 0 ? 33.34 : 33.33,
    })));
  }

  async function savePartners(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const result = await api('/api/investors', {
        method: 'PUT',
        body: JSON.stringify({ investors }),
      });
      setInvestors(result.investors);
      setMessage(t('settings.partnersSaved'));
    } catch (err) {
      setError(err.message);
    }
  }

  async function addRoom(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await api('/api/rooms', { method: 'POST', body: JSON.stringify({ name: roomName, rent: roomRent }) });
      setRoomName('');
      setRoomRent('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveRoom(id) {
    setError('');
    setMessage('');
    try {
      await api(`/api/rooms/${id}`, { method: 'PUT', body: JSON.stringify(roomDrafts[id]) });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeRoom(room) {
    if (!window.confirm(t('settings.deleteAsk', { name: room.name }))) return;
    setError('');
    try {
      await api(`/api/rooms/${room.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function addItem(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await api('/api/items', { method: 'POST', body: JSON.stringify({ name: itemName, cost: itemCost }) });
      setItemName('');
      setItemCost('');
      setMessage(t('settings.itemSaved'));
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveItem(id) {
    setError('');
    setMessage('');
    try {
      await api(`/api/items/${id}`, { method: 'PUT', body: JSON.stringify(drafts[id]) });
      setMessage(t('settings.itemUpdated'));
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeItem(item) {
    if (!window.confirm(t('settings.deleteAsk', { name: item.name }))) return;
    setError('');
    try {
      await api(`/api/items/${item.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function runUpdate() {
    setError('');
    setMessage('');
    setUpdating(true);
    try {
      const result = await api('/api/system/update', { method: 'POST' });
      setRevision(result);
      setMessage(result.status === 'current'
        ? t('settings.updateNone')
        : t('settings.updateDone', { note: result.subject || result.commit }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await api('/api/auth/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setMessage(t('settings.passwordSaved', { computer }));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <p className="eyebrow">{t('settings.eyebrow')}</p>
          <h1>{t('settings.title')}</h1>
          <p className="lede">{t('settings.lede')}</p>
        </div>
      </div>
      <Banner error={error} message={message} />

      <div className="settings-grid">
        <form className="card stack" onSubmit={saveBusiness}>
          <h2>{t('settings.business')}</h2>
          <label>
            {t('settings.reportName')}
            <input value={businessName} onChange={(event) => setBusinessName(event.target.value)} required maxLength={80} />
          </label>
          <label>
            {t('settings.currency')}
            <input value={symbol} onChange={(event) => setSymbol(event.target.value)} required maxLength={8} />
          </label>
          <label>
            {t('settings.calendar')}
            <select value={calendarKind} onChange={(event) => setCalendarKind(event.target.value)}>
              <option value="meladi">{t('cal.meladi')}</option>
              <option value="shamsi">{t('cal.shamsi')}</option>
              <option value="hijri">{t('cal.hijri')}</option>
            </select>
          </label>
          <p className="muted">{t('settings.calendarHint', { computer })}</p>
          <button className="btn primary" type="submit">{t('settings.saveBusiness')}</button>
        </form>

        <form className="card stack settings-span" onSubmit={savePartners}>
          <div className="card-head">
            <h2>{t('settings.partners')}</h2>
            <button type="button" className="btn ghost tiny" onClick={splitEqually}>{t('settings.splitEqual')}</button>
          </div>
          <p className="muted">{t('settings.partnerHint')}</p>
          {investors.map((partner, index) => (
            <div className="partner-edit" key={partner.id}>
              <label>
                {t('settings.partner', { n: index + 1 })}
                <input
                  value={partner.name}
                  onChange={(event) => setInvestors((current) => current.map((row) => (
                    row.id === partner.id ? { ...row, name: event.target.value } : row
                  )))}
                  required
                  maxLength={80}
                />
              </label>
              <label>
                {t('settings.percent')}
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={partner.percentage}
                  onChange={(event) => setInvestors((current) => current.map((row) => (
                    row.id === partner.id ? { ...row, percentage: event.target.value } : row
                  )))}
                  required
                />
              </label>
              <label>
                {t('settings.invested')}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={partner.investment ?? ''}
                  onChange={(event) => setInvestors((current) => current.map((row) => (
                    row.id === partner.id ? { ...row, investment: event.target.value } : row
                  )))}
                  required
                />
              </label>
            </div>
          ))}
          <p className={percentReady ? 'ok-line' : 'warn-line'}>{t('settings.totalMust', { value: percent(percentCents / 100) })}</p>
          <button className="btn primary" type="submit" disabled={!percentReady}>{t('settings.savePartners')}</button>
        </form>

        <section className="card stack settings-span">
          <h2>{t('settings.rooms')}</h2>
          <p className="muted">{t('settings.roomsHint')}</p>
          <form className="inline-add" onSubmit={addRoom}>
            <input value={roomName} onChange={(event) => setRoomName(event.target.value)} placeholder={t('settings.roomPlaceholder')} required maxLength={80} />
            <input type="number" min="0" step="0.01" value={roomRent} onChange={(event) => setRoomRent(event.target.value)} placeholder={t('settings.rentPlaceholder')} required />
            <button className="btn gold" type="submit">{t('settings.addRoom')}</button>
          </form>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('common.name')}</th>
                  <th>{t('settings.roomFee')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id}>
                    <td>
                      <input
                        value={roomDrafts[room.id]?.name || ''}
                        onChange={(event) => setRoomDrafts((current) => ({ ...current, [room.id]: { ...current[room.id], name: event.target.value } }))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={roomDrafts[room.id]?.rent ?? ''}
                        onChange={(event) => setRoomDrafts((current) => ({ ...current, [room.id]: { ...current[room.id], rent: event.target.value } }))}
                      />
                    </td>
                    <td className="row-actions">
                      <button type="button" className="btn ghost tiny" onClick={() => saveRoom(room.id)}>{t('common.save')}</button>
                      <button type="button" className="btn ghost tiny" onClick={() => removeRoom(room)}>{t('common.delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card stack settings-span">
          <h2>{t('settings.items')}</h2>
          <p className="muted">{t('settings.itemsHint')}</p>
          <form className="inline-add" onSubmit={addItem}>
            <input value={itemName} onChange={(event) => setItemName(event.target.value)} placeholder={t('settings.newPlaceholder')} required maxLength={80} />
            <input type="number" min="0" step="0.01" value={itemCost} onChange={(event) => setItemCost(event.target.value)} placeholder={t('settings.costPlaceholder')} required />
            <button className="btn gold" type="submit">{t('settings.addItem')}</button>
          </form>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('common.name')}</th>
                  <th>{t('wash.cost')}</th>
                  <th>{t('settings.onCounter')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        value={drafts[item.id]?.name || ''}
                        onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], name: event.target.value } }))}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={drafts[item.id]?.cost ?? ''}
                        onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], cost: event.target.value } }))}
                      />
                    </td>
                    <td>
                      <label className="check">
                        <input
                          type="checkbox"
                          checked={Boolean(drafts[item.id]?.active)}
                          onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: { ...current[item.id], active: event.target.checked } }))}
                        />
                        {drafts[item.id]?.active ? t('settings.showing') : t('settings.hidden')}
                      </label>
                    </td>
                    <td className="row-actions">
                      <button type="button" className="btn ghost tiny" onClick={() => saveItem(item.id)}>{t('common.save')}</button>
                      <button type="button" className="btn ghost tiny" onClick={() => removeItem(item)}>{t('common.delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted">{t('settings.symbolNote', { value: currency })}</p>
        </section>

        <form className="card stack" onSubmit={changePassword}>
          <h2>{t('settings.password')}</h2>
          <label>
            {t('settings.current')}
            <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required />
          </label>
          <label>
            {t('settings.next')}
            <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" minLength={6} required />
          </label>
          <button className="btn primary" type="submit">{t('settings.change')}</button>
        </form>

        <article className="card stack settings-span">
          <h2>{t('settings.update')}</h2>
          {revision?.subject ? <p>{revision.subject}</p> : null}
          <button type="button" className="btn primary" onClick={runUpdate} disabled={updating}>
            {updating ? t('settings.updating') : t('settings.updateButton')}
          </button>
        </article>

        <article className="card stack">
          <h2>{t('settings.storageTitle')}</h2>
          <p>{t('settings.storage', { computer })}</p>
        </article>
      </div>
    </div>
  );
}
