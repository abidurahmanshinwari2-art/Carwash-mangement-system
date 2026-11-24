import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const file = path.join(os.tmpdir(), `zamzam-check-${Date.now()}.db`);
process.env.ZAMZAM_DB = file;

const db = await import('./src/db.js');
db.init();

const item = db.createItem({ name: 'Foam Wash', cost: 1000 });
const wash = db.createWash({ itemId: item.id, quantity: 2, note: 'ABC 123' });
if (wash.total !== 2000) throw new Error(`expected wash total 2000, got ${wash.total}`);

db.createExpense({ title: 'Shampoo', amount: 400, category: 'Soap & chemicals', note: 'bottle' });
const summary = db.getSummary('', '');
if (summary.income !== 2000) throw new Error(`income ${summary.income}`);
if (summary.expenseTotal !== 400) throw new Error(`expenses ${summary.expenseTotal}`);
if (summary.netProfit !== 1600) throw new Error(`net ${summary.netProfit}`);
if (summary.washCount !== 2) throw new Error(`count ${summary.washCount}`);

const investors = db.listInvestors();
const shares = summary.distribution.map((row) => row.share);
const shareSum = Math.round(shares.reduce((sum, value) => sum + value, 0) * 100);
if (shareSum !== 160000) throw new Error(`shares ${shares.join(',')} sum cents ${shareSum}`);
if (investors.length !== 3) throw new Error('expected 3 investors');

let rejected = false;
try {
  db.saveInvestors(investors.map((row) => ({ ...row, percentage: 10 })));
} catch (error) {
  rejected = error.status === 400;
}
if (!rejected) throw new Error('bad percentages were accepted');

const renamed = db.updateItem(item.id, { name: 'Foam Wash Plus', cost: 1100, active: true });
const after = db.getSummary('', '');
const names = after.byItem.map((row) => `${row.name}:${row.count}`);
if (!names.includes('Foam Wash Plus:2')) throw new Error(`rename grouping failed: ${names.join('|')}`);
if (after.washes[0].unitCost !== 1000) throw new Error('history price changed');

console.log('self-check ok', { net: summary.netProfit, shares, renamed: renamed.name });
fs.rmSync(file, { force: true });
for (const suffix of ['-wal', '-shm']) fs.rmSync(file + suffix, { force: true });
