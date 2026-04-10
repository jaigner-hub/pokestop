import {spawn} from 'child_process';
import {existsSync, mkdirSync, openSync} from 'fs';
import {homedir} from 'os';
import {join} from 'path';
import rebrowser from 'rebrowser-puppeteer';
import {type Browser} from 'puppeteer';
import {logger} from './logger';

// Default to 19222 instead of Chrome's usual 9222 because WSL2/Hyper-V often
// reserves ports in the 9000s range underneath the VM, making them unbindable
// even though no Linux process holds them. Override with CHROME_DEBUG_PORT.
const REMOTE_PORT = parseInt(process.env['CHROME_DEBUG_PORT'] || '19222', 10);
const REMOTE_HOST = process.env['CHROME_DEBUG_HOST'] || '127.0.0.1';
const CHROME_PATH = process.env['CHROME_PATH'] || '/usr/bin/google-chrome';
const USER_DATA_DIR = process.env['CHROME_USER_DATA_DIR'] || join(homedir(), '.pokestop-chrome');
const CHROME_LOG = join(USER_DATA_DIR, 'chrome-stderr.log');

let browser: Browser | null = null;

async function isDebugPortLive(): Promise<boolean> {
  try {
    const res = await fetch(`http://${REMOTE_HOST}:${REMOTE_PORT}/json/version`);
    return res.ok;
  } catch {
    return false;
  }
}

async function spawnChrome(): Promise<void> {
  if (!existsSync(USER_DATA_DIR)) mkdirSync(USER_DATA_DIR, {recursive: true});

  // Strip env vars that leak in when you `su` (without `-`) from another
  // user. They make Chrome point at the wrong dbus socket / dconf profile /
  // runtime dir, which causes a flood of permission errors and can break
  // its IPC. Then re-set XDG_RUNTIME_DIR to match our actual UID.
  const childEnv = {...process.env};
  for (const k of [
    'DBUS_SESSION_BUS_ADDRESS',
    'DBUS_SYSTEM_BUS_ADDRESS',
    'XDG_RUNTIME_DIR',
    'XDG_DATA_DIRS',
    'XDG_CONFIG_DIRS',
    'XDG_CONFIG_HOME',
    'XDG_DATA_HOME',
    'XDG_CACHE_HOME',
    'XDG_STATE_HOME',
    'DCONF_PROFILE',
  ]) {
    delete childEnv[k];
  }
  const uid = process.getuid?.() ?? 0;
  const runtimeDir = `/run/user/${uid}`;
  if (existsSync(runtimeDir)) {
    childEnv['XDG_RUNTIME_DIR'] = runtimeDir;
  }

  const logFd = openSync(CHROME_LOG, 'a');
  logger.info(`Spawning Chrome (${CHROME_PATH}) on debug port ${REMOTE_PORT}, profile ${USER_DATA_DIR}`);
  logger.info(`Chrome stderr -> ${CHROME_LOG}`);
  logger.info(`XDG_RUNTIME_DIR=${childEnv['XDG_RUNTIME_DIR']}`);

  const child = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${REMOTE_PORT}`,
      `--remote-debugging-address=127.0.0.1`,
      `--user-data-dir=${USER_DATA_DIR}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-features=ChromeWhatsNewUI',
      'about:blank',
    ],
    {detached: true, stdio: ['ignore', logFd, logFd], env: childEnv},
  );
  child.unref();

  let exitedEarly = false;
  child.on('exit', code => {
    exitedEarly = true;
    logger.error(`Chrome exited early with code ${code}. See ${CHROME_LOG}`);
  });

  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await isDebugPortLive()) {
      logger.info('Chrome debug port is live.');
      return;
    }
    if (exitedEarly) {
      throw new Error(`Chrome exited before opening debug port. Check ${CHROME_LOG}`);
    }
    await new Promise(r => setTimeout(r, 250));
  }
  throw new Error(`Chrome did not open debug port ${REMOTE_PORT} within 30s. Check ${CHROME_LOG}`);
}

async function connectToRunningChrome(): Promise<Browser> {
  const endpoint = `http://${REMOTE_HOST}:${REMOTE_PORT}`;
  logger.info(`Connecting to Chrome at ${endpoint}...`);

  const res = await fetch(`${endpoint}/json/version`);
  if (!res.ok) throw new Error(`Chrome debug endpoint returned ${res.status}`);
  const info = (await res.json()) as {webSocketDebuggerUrl: string};

  const wsUrl = info.webSocketDebuggerUrl.replace(/ws:\/\/[^/]+/, `ws://${REMOTE_HOST}:${REMOTE_PORT}`);
  logger.info(`Connecting via WebSocket: ${wsUrl}`);

  const b = await rebrowser.connect({browserWSEndpoint: wsUrl}) as unknown as Browser;
  logger.info('Connected to Chrome.');
  return b;
}

export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.connected) {
    if (!(await isDebugPortLive())) {
      await spawnChrome();
    }
    browser = await connectToRunningChrome();
  }
  return browser;
}

export async function closeBrowser(): Promise<void> {
  if (browser) {
    try {
      browser.disconnect();
    } catch {
      try { await browser.close(); } catch { /* already closed */ }
    }
    browser = null;
  }
}
