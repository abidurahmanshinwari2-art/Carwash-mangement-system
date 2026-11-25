import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../data');

let db;

export class HttpError extends Error {
  constructor(status, message, code = 'generic') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function stamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function money(value) {
  return Math.round(Number(value) * 100) / 100;
}

function requireText(value, field, max) {
  const text = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (!text) throw new HttpError(400, `${field} is required`, `required.${field}`);
  if (text.length > max) throw new HttpError(400, `${field} is too long`, `tooLong.${field}`);
  return text;
}

function requireAmount(value, field, { allowZero = false } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n) || (allowZero ? n < 0 : n <= 0)) {
    throw new HttpError(400, `${field} must be a valid amount`, `amount.${field}`);
  }
  return money(n);
}

function optionalNote(value) {
  const text = String(value ?? '').trim();
  if (text.length > 300) throw new HttpError(400, 'Note must be 300 characters or less', 'note.max');
  return text || null;
}

export function normalizeWhen(value) {
  if (value == null || value === '') return stamp();
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) return `${text}:00`;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(text)) return text;
  throw new HttpError(400, 'Enter a valid date and time', 'datetime.invalid');
}

function assertYmd(value) {
  if (value == null || value === '') return '';
  const text = String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new HttpError(400, 'Enter a valid date', 'date.invalid');
  return text;
}

function nextDayStart(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d + 1);
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T00:00:00`;
}

function rangeClause(column, from, to, params) {
  const parts = [];
  if (from) {
    parts.push(`${column} >= ?`);
    params.push(`${from}T00:00:00`);
  }
  if (to) {
    parts.push(`${column} < ?`);
    params.push(nextDayStart(to));
  }
  return parts.length ? `WHERE ${parts.join(' AND ')}` : '';
}

function mapItem(row) {
  return {
    id: row.id,
    name: row.name,
    cost: row.cost,
    active: row.active === 1,
    createdAt: row.created_at,
  };
}

function mapWash(row) {
  return {
    id: row.id,
    itemId: row.item_id,
    itemName: row.item_name,
    unitCost: row.unit_cost,
    quantity: row.quantity,
    total: row.total,
    washedAt: row.washed_at,
    note: row.note || '',
  };
}

function mapExpense(row) {
  return {
    id: row.id,
    title: row.title,
    amount: row.amount,
    category: row.category,
    expenseAt: row.expense_at,
    note: row.note || '',
  };
}

function mapInvestor(row) {
  return {
    id: row.id,
    name: row.name,
    percentage: row.percentage,
    sortOrder: row.sort_order,
  };
}

export function getAuthSecret() {
  fs.mkdirSync(dataDir, { recursive: true });
  const secretPath = path.join(dataDir, 'auth.secret');
  if (fs.existsSync(secretPath)) return fs.readFileSync(secretPath, 'utf8');
  const secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(secretPath, secret, { encoding: 'utf8' });
  return secret;
}

export function init() {
  if (db) return;
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = process.env.ZAMZAM_DB || path.join(dataDir, 'zamzam.db');
  db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS wash_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL COLLATE NOCASE UNIQUE,
      cost REAL NOT NULL,
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
      created_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS washes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER REFERENCES wash_items(id) ON DELETE SET NULL,
      item_name TEXT NOT NULL,
      unit_cost REAL NOT NULL,
      quantity INTEGER NOT NULL,
      total REAL NOT NULL,
      washed_at TEXT NOT NULL,
      note TEXT
    ) STRICT;

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      expense_at TEXT NOT NULL,
      note TEXT
    ) STRICT;

    CREATE TABLE IF NOT EXISTS investors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      percentage REAL NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
      sort_order INTEGER NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    ) STRICT;

    CREATE INDEX IF NOT EXISTS idx_washes_when ON washes(washed_at);
    CREATE INDEX IF NOT EXISTS idx_expenses_when ON expenses(expense_at);

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL COLLATE NOCASE UNIQUE,
      rent REAL NOT NULL,
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
      created_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id INTEGER REFERENCES rooms(id) ON DELETE RESTRICT,
      room_name TEXT NOT NULL,
      person_name TEXT NOT NULL,
      phone TEXT,
      note TEXT,
      monthly_fee REAL NOT NULL,
      moved_in TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
      left_at TEXT
    ) STRICT;

    CREATE TABLE IF NOT EXISTS rent_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
      amount REAL NOT NULL,
      paid_at TEXT NOT NULL,
      note TEXT
    ) STRICT;

    CREATE INDEX IF NOT EXISTS idx_rent_paid ON rent_payments(paid_at);
    CREATE INDEX IF NOT EXISTS idx_tenants_room ON tenants(room_id, active);
  `);
  seed();
}

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (userCount === 0) {
    db.prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)').run(
      'admin',
      bcrypt.hashSync('admin123', 10),
      stamp(),
    );
  }

  const itemCount = db.prepare('SELECT COUNT(*) AS n FROM wash_items').get().n;
  if (itemCount === 0) {
    const insert = db.prepare('INSERT INTO wash_items (name, cost, active, created_at) VALUES (?, ?, 1, ?)');
    const now = stamp();
    const catalog = [
      ['Exterior Wash', 500],
      ['Interior Cleaning', 700],
      ['Full Service', 1200],
      ['Engine Wash', 600],
      ['Wax & Polish', 1500],
      ['Underbody Wash', 400],
    ];
    for (const [name, cost] of catalog) insert.run(name, cost, now);
  }

  const investorCount = db.prepare('SELECT COUNT(*) AS n FROM investors').get().n;
  if (investorCount === 0) {
    const insert = db.prepare('INSERT INTO investors (name, percentage, sort_order) VALUES (?, ?, ?)');
    insert.run('Investor 1', 33.34, 1);
    insert.run('Investor 2', 33.33, 2);
    insert.run('Investor 3', 33.33, 3);
  }

  const put = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  put.run('business_name', 'ZAMZAM Carwash');
  put.run('currency', 'Rs');
  put.run('calendar', 'meladi');
}

export function getUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

export function getUserById(id) {
  const row = db.prepare('SELECT id, username FROM users WHERE id = ?').get(id);
  return row || null;
}

export function updatePassword(userId, passwordHash) {
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, userId);
}

export function listItems() {
  return db.prepare('SELECT * FROM wash_items ORDER BY active DESC, name COLLATE NOCASE').all().map(mapItem);
}

export function createItem({ name, cost }) {
  const cleanName = requireText(name, 'washName', 80);
  const cleanCost = requireAmount(cost, 'washingCost', { allowZero: true });
  const dupe = db.prepare('SELECT id FROM wash_items WHERE name = ?').get(cleanName);
  if (dupe) throw new HttpError(400, 'That wash item already exists', 'item.duplicate');
  const info = db.prepare('INSERT INTO wash_items (name, cost, active, created_at) VALUES (?, ?, 1, ?)').run(
    cleanName,
    cleanCost,
    stamp(),
  );
  return mapItem(db.prepare('SELECT * FROM wash_items WHERE id = ?').get(Number(info.lastInsertRowid)));
}

export function updateItem(id, { name, cost, active }) {
  const existing = db.prepare('SELECT * FROM wash_items WHERE id = ?').get(id);
  if (!existing) throw new HttpError(404, 'Wash item not found', 'item.missing');
  const cleanName = requireText(name, 'washName', 80);
  const cleanCost = requireAmount(cost, 'washingCost', { allowZero: true });
  const dupe = db.prepare('SELECT id FROM wash_items WHERE name = ? AND id != ?').get(cleanName, id);
  if (dupe) throw new HttpError(400, 'That wash item already exists', 'item.duplicate');
  const flag = active ? 1 : 0;
  db.prepare('UPDATE wash_items SET name = ?, cost = ?, active = ? WHERE id = ?').run(cleanName, cleanCost, flag, id);
  return mapItem(db.prepare('SELECT * FROM wash_items WHERE id = ?').get(id));
}

export function deleteItem(id) {
  const existing = db.prepare('SELECT * FROM wash_items WHERE id = ?').get(id);
  if (!existing) throw new HttpError(404, 'Wash item not found', 'item.missing');
  const used = db.prepare('SELECT COUNT(*) AS n FROM washes WHERE item_id = ?').get(id).n;
  if (used) {
    throw new HttpError(400, 'This item has washes, so it stays in history. Turn it off instead.', 'item.inUse');
  }
  db.prepare('DELETE FROM wash_items WHERE id = ?').run(id);
}

export function listWashes(from, to) {
  const params = [];
  const where = rangeClause('washed_at', assertYmd(from), assertYmd(to), params);
  return db.prepare(`SELECT * FROM washes ${where} ORDER BY washed_at DESC, id DESC`).all(...params).map(mapWash);
}

export function createWash({ itemId, quantity, washedAt, note }) {
  const item = db.prepare('SELECT * FROM wash_items WHERE id = ? AND active = 1').get(Number(itemId));
  if (!item) throw new HttpError(400, 'Choose a wash item that is turned on', 'wash.item');
  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
    throw new HttpError(400, 'Quantity must be a whole number from 1 to 100', 'wash.quantity');
  }
  const when = normalizeWhen(washedAt);
  const total = money(item.cost * qty);
  const info = db.prepare(`
    INSERT INTO washes (item_id, item_name, unit_cost, quantity, total, washed_at, note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(item.id, item.name, item.cost, qty, total, when, optionalNote(note));
  return mapWash(db.prepare('SELECT * FROM washes WHERE id = ?').get(Number(info.lastInsertRowid)));
}

export function deleteWash(id) {
  const result = db.prepare('DELETE FROM washes WHERE id = ?').run(id);
  if (result.changes === 0) throw new HttpError(404, 'Wash not found', 'wash.missing');
}

export function createExpense({ title, amount, category, expenseAt, note }) {
  const info = db.prepare(`
    INSERT INTO expenses (title, amount, category, expense_at, note)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    requireText(title, 'expenseName', 120),
    requireAmount(amount, 'amount'),
    requireText(category || 'other', 'category', 40),
    normalizeWhen(expenseAt),
    optionalNote(note),
  );
  return mapExpense(db.prepare('SELECT * FROM expenses WHERE id = ?').get(Number(info.lastInsertRowid)));
}

export function updateExpense(id, input) {
  const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
  if (!existing) throw new HttpError(404, 'Expense not found', 'expense.missing');
  db.prepare(`
    UPDATE expenses SET title = ?, amount = ?, category = ?, expense_at = ?, note = ? WHERE id = ?
  `).run(
    requireText(input.title, 'expenseName', 120),
    requireAmount(input.amount, 'amount'),
    requireText(input.category || 'other', 'category', 40),
    normalizeWhen(input.expenseAt),
    optionalNote(input.note),
    id,
  );
  return mapExpense(db.prepare('SELECT * FROM expenses WHERE id = ?').get(id));
}

export function deleteExpense(id) {
  const result = db.prepare('DELETE FROM expenses WHERE id = ?').run(id);
  if (result.changes === 0) throw new HttpError(404, 'Expense not found', 'expense.missing');
}

export function listInvestors() {
  return db.prepare('SELECT * FROM investors ORDER BY sort_order, id').all().map(mapInvestor);
}

export function saveInvestors(list) {
  if (!Array.isArray(list) || list.length !== 3) {
    throw new HttpError(400, 'Enter exactly three investment partners', 'partners.count');
  }
  const cleaned = list.map((row, index) => ({
    id: Number(row.id),
    name: requireText(row.name, 'partnerName', 80),
    percentage: money(row.percentage),
  }));
  if (cleaned.some((row) => !Number.isInteger(row.id))) {
    throw new HttpError(400, 'Partner record is invalid', 'partners.invalid');
  }
  if (cleaned.some((row) => row.percentage < 0 || row.percentage > 100)) {
    throw new HttpError(400, 'Each percentage must be between 0 and 100', 'partners.range');
  }
  const totalCents = cleaned.reduce((sum, row) => sum + Math.round(row.percentage * 100), 0);
  if (totalCents !== 10000) {
    throw new HttpError(400, 'Investment percentages must add up to 100', 'partners.total');
  }
  const existing = db.prepare('SELECT id FROM investors ORDER BY sort_order, id').all();
  if (existing.length !== 3) throw new HttpError(400, 'Partner records are missing', 'partners.missing');
  const known = new Set(existing.map((row) => row.id));
  if (cleaned.some((row) => !known.has(row.id))) throw new HttpError(400, 'Partner record is invalid', 'partners.invalid');

  db.exec('BEGIN');
  try {
    const update = db.prepare('UPDATE investors SET name = ?, percentage = ?, sort_order = ? WHERE id = ?');
    cleaned.forEach((row, index) => update.run(row.name, row.percentage, index + 1, row.id));
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return listInvestors();
}

export function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const calendar = ['meladi', 'shamsi', 'hijri'].includes(map.calendar) ? map.calendar : 'meladi';
  return {
    businessName: map.business_name || 'ZAMZAM Carwash',
    currency: map.currency || 'Rs',
    calendar,
  };
}

export function saveSettings({ businessName, currency, calendar }) {
  const name = requireText(businessName, 'businessName', 80);
  const symbol = requireText(currency, 'currency', 8);
  const kind = ['meladi', 'shamsi', 'hijri'].includes(calendar) ? calendar : 'meladi';
  const put = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  put.run('business_name', name);
  put.run('currency', symbol);
  put.run('calendar', kind);
  return getSettings();
}

function distribute(net, investors) {
  const netCents = Math.round(Number(net) * 100);
  const rows = investors.map((inv) => {
    const percentCents = Math.round(Number(inv.percentage) * 100);
    return {
      id: inv.id,
      name: inv.name,
      percentage: inv.percentage,
      cents: Math.round((netCents * percentCents) / 10000),
    };
  });
  const drift = netCents - rows.reduce((sum, row) => sum + row.cents, 0);
  if (rows[0]) rows[0].cents += drift;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    percentage: row.percentage,
    share: row.cents / 100,
  }));
}

export function getSummary(fromInput, toInput) {
  const from = assertYmd(fromInput);
  const to = assertYmd(toInput);
  const washParams = [];
  const washWhere = rangeClause('washed_at', from, to, washParams);
  const incomeRow = db.prepare(`
    SELECT COALESCE(SUM(total), 0) AS income,
           COALESCE(SUM(quantity), 0) AS washCount,
           COUNT(*) AS tickets
    FROM washes ${washWhere}
  `).get(...washParams);

  const expenseParams = [];
  const expenseWhere = rangeClause('expense_at', from, to, expenseParams);
  const expenseRow = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS expenseTotal FROM expenses ${expenseWhere}
  `).get(...expenseParams);

  const groupParams = [];
  const groupWhere = rangeClause('w.washed_at', from, to, groupParams);
  const grouped = db.prepare(`
    SELECT COALESCE(i.name, w.item_name) AS name,
           SUM(w.quantity) AS count,
           SUM(w.total) AS revenue
    FROM washes w
    LEFT JOIN wash_items i ON i.id = w.item_id
    ${groupWhere}
    GROUP BY COALESCE(i.name, w.item_name)
  `).all(...groupParams);

  const byName = new Map(grouped.map((row) => [row.name, {
    name: row.name,
    count: Number(row.count) || 0,
    revenue: money(row.revenue),
  }]));
  const activeItems = db.prepare('SELECT name FROM wash_items WHERE active = 1 ORDER BY name COLLATE NOCASE').all();
  for (const item of activeItems) {
    if (!byName.has(item.name)) byName.set(item.name, { name: item.name, count: 0, revenue: 0 });
  }
  const byItem = [...byName.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const washes = db.prepare(`SELECT * FROM washes ${washWhere} ORDER BY washed_at DESC, id DESC`).all(...washParams).map(mapWash);
  const expenseRows = db.prepare(`SELECT * FROM expenses ${expenseWhere} ORDER BY expense_at DESC, id DESC`).all(...expenseParams).map(mapExpense);

  const days = new Map();
  const touch = (iso, field, amount) => {
    const key = String(iso).slice(0, 10);
    if (!days.has(key)) days.set(key, { date: key, income: 0, expenses: 0 });
    const bucket = days.get(key);
    bucket[field] = money(bucket[field] + amount);
  };
  for (const wash of washes) touch(wash.washedAt, 'income', wash.total);
  for (const expense of expenseRows) touch(expense.expenseAt, 'expenses', expense.amount);
  const byDay = [...days.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((day) => ({ ...day, net: money(day.income - day.expenses) }));

  const income = money(incomeRow.income);
  const expenseTotal = money(expenseRow.expenseTotal);
  const netProfit = money(income - expenseTotal);
  const investors = listInvestors();
  const percentageTotal = money(investors.reduce((sum, row) => sum + row.percentage, 0));

  return {
    from: from || null,
    to: to || null,
    income,
    expenseTotal,
    netProfit,
    washCount: Number(incomeRow.washCount) || 0,
    ticketCount: Number(incomeRow.tickets) || 0,
    byItem,
    byDay,
    washes,
    expenseRows,
    distribution: distribute(netProfit, investors),
    percentageTotal,
  };
}

function optionalPhone(value) {
  const text = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (text.length > 40) throw new HttpError(400, 'Phone is too long', 'tooLong.phone');
  return text || null;
}

function rentStatus(paid, due) {
  const paidCents = Math.round(Number(paid) * 100);
  const dueCents = Math.round(Number(due) * 100);
  if (dueCents <= 0) return 'paid';
  if (paidCents <= 0) return 'unpaid';
  if (paidCents < dueCents) return 'partial';
  return 'paid';
}

function rentBounds(from, to) {
  let start = assertYmd(from);
  let end = assertYmd(to);
  if (!start || !end) {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
    end = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }
  return { from: start, to: end, startAt: `${start}T00:00:00`, endAt: nextDayStart(end) };
}

function mapRoom(row) {
  return {
    id: row.id,
    name: row.name,
    rent: money(row.rent),
    active: Boolean(row.active),
    createdAt: row.created_at,
  };
}

export function listRooms() {
  return db.prepare(`
    SELECT id, name, rent, active, created_at
    FROM rooms
    ORDER BY name COLLATE NOCASE
  `).all().map(mapRoom);
}

export function createRoom(body) {
  const name = requireText(body.name, 'roomName', 80);
  const rent = requireAmount(body.rent, 'roomRent', { allowZero: true });
  try {
    const info = db.prepare(`
      INSERT INTO rooms (name, rent, active, created_at) VALUES (?, ?, 1, ?)
    `).run(name, rent, stamp());
    return mapRoom(db.prepare('SELECT * FROM rooms WHERE id = ?').get(info.lastInsertRowid));
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      throw new HttpError(400, 'That room already exists', 'room.duplicate');
    }
    throw error;
  }
}

export function updateRoom(id, body) {
  const current = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
  if (!current) throw new HttpError(404, 'Room not found', 'room.missing');
  const name = requireText(body.name, 'roomName', 80);
  const rent = requireAmount(body.rent, 'roomRent', { allowZero: true });
  try {
    db.prepare('UPDATE rooms SET name = ?, rent = ? WHERE id = ?').run(name, rent, id);
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      throw new HttpError(400, 'That room already exists', 'room.duplicate');
    }
    throw error;
  }
  return mapRoom(db.prepare('SELECT * FROM rooms WHERE id = ?').get(id));
}

export function deleteRoom(id) {
  const current = db.prepare('SELECT id FROM rooms WHERE id = ?').get(id);
  if (!current) throw new HttpError(404, 'Room not found', 'room.missing');
  const used = db.prepare('SELECT COUNT(*) AS count FROM tenants WHERE room_id = ?').get(id).count;
  if (used) throw new HttpError(400, 'This room is on the rent screen, so it stays.', 'room.inUse');
  db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
}

function paidByTenant(bounds) {
  const rows = db.prepare(`
    SELECT tenant_id, COALESCE(SUM(amount), 0) AS paid, COUNT(*) AS count
    FROM rent_payments
    WHERE paid_at >= ? AND paid_at < ?
    GROUP BY tenant_id
  `).all(bounds.startAt, bounds.endAt);
  return new Map(rows.map((row) => [row.tenant_id, { paid: money(row.paid), count: Number(row.count) }]));
}

function personView(row, paid) {
  const monthlyFee = money(row.monthly_fee);
  const paidThisMonth = money(paid?.paid || 0);
  const remaining = money(Math.max(0, monthlyFee - paidThisMonth));
  return {
    id: row.id,
    roomId: row.room_id,
    roomName: row.live_room_name || row.room_name,
    personName: row.person_name,
    phone: row.phone || '',
    note: row.note || '',
    monthlyFee,
    movedIn: row.moved_in,
    paidThisMonth,
    remaining,
    status: rentStatus(paidThisMonth, monthlyFee),
  };
}

export function getRentDesk(from, to) {
  const bounds = rentBounds(from, to);
  const paid = paidByTenant(bounds);
  const people = db.prepare(`
    SELECT t.*, r.name AS live_room_name
    FROM tenants t
    LEFT JOIN rooms r ON r.id = t.room_id
    WHERE t.active = 1
    ORDER BY t.person_name COLLATE NOCASE
  `).all().map((row) => personView(row, paid.get(row.id)));
  const totals = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS income, COUNT(*) AS count
    FROM rent_payments
    WHERE paid_at >= ? AND paid_at < ?
  `).get(bounds.startAt, bounds.endAt);
  return {
    from: bounds.from,
    to: bounds.to,
    rooms: listRooms(),
    cards: {
      rentedRooms: people.length,
      monthIncome: money(totals.income),
      paymentsCollected: Number(totals.count) || 0,
      partialPeople: people.filter((person) => person.status === 'partial').length,
    },
    people,
  };
}

export function getRentReport(from, to) {
  const bounds = rentBounds(from, to);
  const paid = paidByTenant(bounds);
  const people = db.prepare(`
    SELECT t.*, r.name AS live_room_name
    FROM tenants t
    LEFT JOIN rooms r ON r.id = t.room_id
    WHERE t.moved_in <= ?
      AND (t.active = 1 OR t.left_at IS NULL OR t.left_at >= ?)
    ORDER BY room_name COLLATE NOCASE, person_name COLLATE NOCASE
  `).all(bounds.to, bounds.startAt).map((row) => personView(row, paid.get(row.id)));
  return {
    from: bounds.from,
    to: bounds.to,
    people,
    counts: {
      unpaid: people.filter((person) => person.status === 'unpaid').length,
      partial: people.filter((person) => person.status === 'partial').length,
      paid: people.filter((person) => person.status === 'paid').length,
    },
    collected: money(people.reduce((sum, person) => sum + person.paidThisMonth, 0)),
  };
}

export function createTenant(body) {
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(Number(body.roomId));
  if (!room || !room.active) throw new HttpError(400, 'Choose a room that is saved in Settings', 'room.missing');
  const taken = db.prepare('SELECT id FROM tenants WHERE room_id = ? AND active = 1').get(room.id);
  if (taken) throw new HttpError(400, 'This room is already given to someone', 'tenant.occupied');
  const personName = requireText(body.personName, 'personName', 80);
  const phone = optionalPhone(body.phone);
  const note = optionalNote(body.note);
  const monthlyFee = body.monthlyFee == null || body.monthlyFee === ''
    ? money(room.rent)
    : requireAmount(body.monthlyFee, 'roomRent', { allowZero: true });
  const movedIn = assertYmd(body.movedIn) || stamp().slice(0, 10);
  const info = db.prepare(`
    INSERT INTO tenants (
      room_id, room_name, person_name, phone, note, monthly_fee, moved_in, active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).run(room.id, room.name, personName, phone, note, monthlyFee, movedIn);
  const row = db.prepare(`
    SELECT t.*, r.name AS live_room_name
    FROM tenants t
    LEFT JOIN rooms r ON r.id = t.room_id
    WHERE t.id = ?
  `).get(info.lastInsertRowid);
  return personView(row, { paid: 0, count: 0 });
}

export function leaveTenant(id) {
  const row = db.prepare('SELECT * FROM tenants WHERE id = ?').get(id);
  if (!row) throw new HttpError(404, 'Person not found', 'tenant.missing');
  if (!row.active) throw new HttpError(400, 'This person already left the room', 'tenant.left');
  db.prepare('UPDATE tenants SET active = 0, left_at = ? WHERE id = ?').run(stamp(), id);
}

export function payRent(body) {
  const tenant = db.prepare(`
    SELECT t.*, r.name AS live_room_name
    FROM tenants t
    LEFT JOIN rooms r ON r.id = t.room_id
    WHERE t.id = ?
  `).get(Number(body.tenantId));
  if (!tenant || !tenant.active) throw new HttpError(404, 'Person not found', 'tenant.missing');
  const amount = requireAmount(body.amount, 'rentPay');
  const paidAt = normalizeWhen(body.paidAt);
  const note = optionalNote(body.note);
  const info = db.prepare(`
    INSERT INTO rent_payments (tenant_id, amount, paid_at, note) VALUES (?, ?, ?, ?)
  `).run(tenant.id, amount, paidAt, note);
  const bounds = rentBounds(body.from, body.to);
  const month = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS paid
    FROM rent_payments
    WHERE tenant_id = ? AND paid_at >= ? AND paid_at < ?
  `).get(tenant.id, bounds.startAt, bounds.endAt);
  const view = personView(tenant, { paid: month.paid, count: 0 });
  return {
    payment: {
      id: Number(info.lastInsertRowid),
      tenantId: tenant.id,
      amount,
      paidAt,
      note: note || '',
    },
    receipt: {
      id: Number(info.lastInsertRowid),
      personName: view.personName,
      phone: view.phone,
      roomName: view.roomName,
      note: note || '',
      amount,
      paidAt,
      monthlyFee: view.monthlyFee,
      paidThisMonth: view.paidThisMonth,
      remaining: view.remaining,
      status: view.status,
    },
  };
}
