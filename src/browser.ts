import rebrowser from 'rebrowser-puppeteer';
import {type Browser} from 'puppeteer';
import {logger} from './logger';

const REMOTE_PORT = parseInt(process.env['CHROME_DEBUG_PORT'] || '9222', 10);
const REMOTE_HOST = process.env['CHROME_DEBUG_HOST'] || '127.0.0.1';

let browser: Browser | null = null;

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

async function launchWithRebrowser(): Promise<Browser> {
  logger.info('Launching Chromium via rebrowser-puppeteer...');
  const b = await rebrowser.launch({
    headless: true,
    executablePath: process.env['CHROME_PATH'] || '/usr/bin/chromium-browser',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
  }) as unknown as Browser;
  logger.info('Chromium launched (rebrowser).');
  return b;
}

export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.connected) {
    try {
      browser = await connectToRunningChrome();
    } catch (err) {
      logger.warn(`Could not connect to Chrome on port ${REMOTE_PORT}: ${err}`);
      logger.info('Launching own browser via rebrowser-puppeteer...');
      browser = await launchWithRebrowser();
    }
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
