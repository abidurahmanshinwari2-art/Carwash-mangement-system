import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  HttpError,
  init,
  getAuthSecret,
  getUserByUsername,
  getUserById,
  updatePassword,
  listItems,
  createItem,
  updateItem,
  deleteItem,
  createWash,
  deleteWash,
  createExpense,
  updateExpense,
  deleteExpense,
  listInvestors,
  saveInvestors,
  getSettings,
  saveSettings,
  getSummary,
  listRooms,
  createRoom,
  updateRoom,
  deleteRoom,
  getRentDesk,
  getRentReport,
  createTenant,
  leaveTenant,
  payRent,
} from './db.js';

init();
const authSecret = getAuthSecret();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, '../../client/dist');
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 3001);

const app = express();
app.use(express.json({ limit: '1mb' }));

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  try {
    const payload = jwt.verify(token, authSecret);
    const user = getUserById(payload.uid);
    if (!user) return res.status(401).json({ error: 'Please sign in again' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Please sign in again' });
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'ZAMZAM Carwash', computerName: os.hostname() });
});

app.post('/api/auth/login', asyncRoute(async (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');
  const user = username ? getUserByUsername(username) : null;
  const match = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!match) throw new HttpError(401, 'Username or password is incorrect', 'auth.bad');
  const token = jwt.sign({ uid: user.id }, authSecret, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, username: user.username } });
}));

app.use('/api', auth);

app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/password', asyncRoute(async (req, res) => {
  const currentPassword = String(req.body?.currentPassword ?? '');
  const newPassword = String(req.body?.newPassword ?? '');
  if (newPassword.length < 6) throw new HttpError(400, 'New password must be at least 6 characters', 'auth.short');
  const user = getUserByUsername(req.user.username);
  const match = await bcrypt.compare(currentPassword, user.password_hash);
  if (!match) throw new HttpError(400, 'Current password is incorrect', 'auth.current');
  updatePassword(user.id, await bcrypt.hash(newPassword, 10));
  res.json({ ok: true });
}));

app.get('/api/items', (req, res) => {
  res.json({ items: listItems() });
});

app.post('/api/items', asyncRoute(async (req, res) => {
  res.status(201).json({ item: createItem(req.body || {}) });
}));

app.put('/api/items/:id', asyncRoute(async (req, res) => {
  res.json({ item: updateItem(Number(req.params.id), req.body || {}) });
}));

app.delete('/api/items/:id', asyncRoute(async (req, res) => {
  deleteItem(Number(req.params.id));
  res.json({ ok: true });
}));

app.post('/api/washes', asyncRoute(async (req, res) => {
  res.status(201).json({ wash: createWash(req.body || {}) });
}));

app.delete('/api/washes/:id', asyncRoute(async (req, res) => {
  deleteWash(Number(req.params.id));
  res.json({ ok: true });
}));

app.post('/api/expenses', asyncRoute(async (req, res) => {
  res.status(201).json({ expense: createExpense(req.body || {}) });
}));

app.put('/api/expenses/:id', asyncRoute(async (req, res) => {
  res.json({ expense: updateExpense(Number(req.params.id), req.body || {}) });
}));

app.delete('/api/expenses/:id', asyncRoute(async (req, res) => {
  deleteExpense(Number(req.params.id));
  res.json({ ok: true });
}));

app.get('/api/investors', (req, res) => {
  res.json({ investors: listInvestors() });
});

app.put('/api/investors', asyncRoute(async (req, res) => {
  res.json({ investors: saveInvestors(req.body?.investors) });
}));

app.get('/api/settings', (req, res) => {
  res.json(getSettings());
});

app.put('/api/settings', asyncRoute(async (req, res) => {
  res.json(saveSettings(req.body || {}));
}));

app.get('/api/summary', (req, res) => {
  res.json(getSummary(req.query.from, req.query.to));
});

app.get('/api/rooms', (req, res) => {
  res.json({ rooms: listRooms() });
});

app.post('/api/rooms', asyncRoute(async (req, res) => {
  res.status(201).json({ room: createRoom(req.body || {}) });
}));

app.put('/api/rooms/:id', asyncRoute(async (req, res) => {
  res.json({ room: updateRoom(Number(req.params.id), req.body || {}) });
}));

app.delete('/api/rooms/:id', asyncRoute(async (req, res) => {
  deleteRoom(Number(req.params.id));
  res.json({ ok: true });
}));

app.get('/api/rent', (req, res) => {
  res.json(getRentDesk(req.query.from, req.query.to));
});

app.get('/api/rent/report', (req, res) => {
  res.json(getRentReport(req.query.from, req.query.to));
});

app.post('/api/rent/tenants', asyncRoute(async (req, res) => {
  res.status(201).json({ person: createTenant(req.body || {}) });
}));

app.post('/api/rent/tenants/:id/leave', asyncRoute(async (req, res) => {
  leaveTenant(Number(req.params.id));
  res.json({ ok: true });
}));

app.post('/api/rent/payments', asyncRoute(async (req, res) => {
  res.status(201).json(payRent(req.body || {}));
}));

if (fs.existsSync(dist)) {
  app.use(express.static(dist));
}

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexFile = path.join(dist, 'index.html');
  if (req.method === 'GET' && fs.existsSync(indexFile)) return res.sendFile(indexFile);
  next();
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', code: 'notFound' });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 ? 'Something went wrong' : err.message,
    code: err.code || 'generic',
  });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`ZAMZAM Carwash is stored on ${os.hostname()} and listening at http://${HOST}:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Close the other ZAMZAM window and try again.`);
    process.exit(1);
  }
  throw err;
});
