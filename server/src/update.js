import { execFile, spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpError } from './db.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function run(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, {
      cwd: root,
      windowsHide: true,
      timeout: 180000,
      maxBuffer: 2_000_000,
    }, (error, stdout, stderr) => {
      if (error) {
        error.detail = `${stdout || ''}\n${stderr || ''}`.trim();
        reject(error);
        return;
      }
      resolve(`${stdout || ''}`.trim());
    });
  });
}

export async function currentRevision() {
  try {
    const commit = await run('git', ['rev-parse', '--short', 'HEAD']);
    const subject = await run('git', ['log', '-1', '--pretty=%s']);
    return { commit, subject };
  } catch {
    return { commit: '', subject: '' };
  }
}

export async function updateFromGitHub() {
  let before = '';
  try {
    before = await run('git', ['rev-parse', 'HEAD']);
    await run('git', ['fetch', 'origin', 'main']);
    await run('git', ['pull', '--ff-only', 'origin', 'main']);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new HttpError(503, 'Git is not available on this computer.', 'update.git');
    }
    const detail = String(error.detail || error.message || '');
    if (/could not resolve|unable to access|failed to connect|timed out/i.test(detail)) {
      throw new HttpError(503, 'Cannot reach GitHub. Check the internet and try again.', 'update.offline');
    }
    throw new HttpError(409, 'The update could not be applied.', 'update.git');
  }

  const after = await run('git', ['rev-parse', 'HEAD']);
  const current = await currentRevision();
  if (before === after) return { status: 'current', ...current, restart: false };

  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  try {
    await run(npm, ['install']);
    await run(npm, ['run', 'build']);
  } catch {
    throw new HttpError(500, 'The new files arrived, but preparing them failed.', 'update.build');
  }
  return { status: 'updated', ...current, restart: true };
}

export function restartDesk() {
  if (process.execArgv.includes('--watch')) {
    setTimeout(() => process.exit(0), 500);
    return;
  }
  if (process.platform === 'win32') {
    spawn('cmd.exe', ['/c', 'start', 'ZAMZAM Carwash', 'cmd', '/k', 'npm run start -w server'], {
      cwd: root,
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    }).unref();
  } else {
    spawn('npm', ['run', 'start', '-w', 'server'], {
      cwd: root,
      detached: true,
      stdio: 'ignore',
    }).unref();
  }
  setTimeout(() => process.exit(0), 700);
}
