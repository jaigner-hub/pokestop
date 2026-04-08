import nodeFetch from 'node-fetch';
import * as cheerio from 'cheerio';
import type {CheerioAPI} from 'cheerio';
import type {Browser} from 'puppeteer';
import {config} from './config';
import {parsePrice} from './price';
import {logger} from './logger';
import type {Labels, Store, Product} from './store/model';

export class NotFoundError extends Error {
  constructor(url: string) {
    super(`404 Not Found: ${url}`);
    this.name = 'NotFoundError';
  }
}

export type CheckResult = {
  inStock: boolean;
  price: number | null;
};

// CSS selectors start with . # or [
const CSS_SELECTOR_RE = /^[.#[]/;

function matchesLabel($: CheerioAPI, container: string, label: string): boolean {
  if (CSS_SELECTOR_RE.test(label)) {
    try {
      return $(container).find(label).length > 0;
    } catch {
      // Invalid selector, fall through
    }
    return false;
  }
  // Plain text search (case-insensitive)
  return $(container).text().toLowerCase().includes(label.toLowerCase());
}

function detectStockAndPrice(html: string, labels: Labels): CheckResult {
  const $ = cheerio.load(html);
  const container = labels.container ?? 'body';

  // Check out-of-stock first (overrides in-stock)
  if (labels.outOfStock) {
    for (const label of labels.outOfStock) {
      if (matchesLabel($, container, label)) {
        return {inStock: false, price: extractPrice($, labels.price)};
      }
    }
  }

  // Check in-stock
  let inStock = false;
  if (labels.inStock) {
    for (const label of labels.inStock) {
      if (matchesLabel($, container, label)) {
        inStock = true;
        break;
      }
    }
  }
  // If neither matched, default to out of stock (indeterminate = not confirmed)

  return {inStock, price: extractPrice($, labels.price)};
}

function extractPrice($: CheerioAPI, selector?: string): number | null {
  if (!selector) return null;
  const text = $(selector).first().text().trim();
  return parsePrice(text);
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
];

function randomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithBackoff(
  url: string,
  headers: Record<string, string> = {},
  maxRetries = 5
): Promise<string> {
  let delay = 2000;
  const mergedHeaders = {
    'User-Agent': randomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    ...headers,
  };

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await nodeFetch(url, {headers: mergedHeaders, redirect: 'follow'});

    if (res.status === 404) {
      throw new NotFoundError(url);
    }
    if (res.status === 429 || res.status === 503) {
      if (attempt === maxRetries) {
        throw new Error(`HTTP ${res.status} after ${maxRetries} retries: ${url}`);
      }
      logger.warn(`HTTP ${res.status} at ${url}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
      await sleep(delay);
      delay *= 2;
      continue;
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${url}`);
    }
    return res.text();
  }
  throw new Error('Max retries exceeded');
}

export async function checkWithFetch(
  url: string,
  labels: Labels,
  headers?: Record<string, string>
): Promise<CheckResult> {
  const html = await fetchWithBackoff(url, headers ?? {});
  return detectStockAndPrice(html, labels);
}

export async function checkWithPuppeteer(
  browser: Browser,
  url: string,
  labels: Labels
): Promise<CheckResult> {
  const page = await browser.newPage();
  try {
    await page.setUserAgent(randomUserAgent());
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: config.pageTimeout,
    });
    // Give JS frameworks a moment to finish rendering stock UI
    await sleep(2000);
    const html = await page.content();
    return detectStockAndPrice(html, labels);
  } finally {
    await page.close();
  }
}

export async function checkOnline(
  store: Store,
  product: Product,
  browser?: Browser
): Promise<CheckResult> {
  if (store.strategy === 'puppeteer') {
    if (!browser) throw new Error(`Browser required for store: ${store.name}`);
    return checkWithPuppeteer(browser, product.url, store.labels);
  }
  return checkWithFetch(product.url, store.labels, store.headers);
}

export async function checkLocalStore(
  product: Product,
  storeId: string,
  buildLocalUrl: (product: Product, storeId: string) => string,
  labels: Labels,
  headers?: Record<string, string>
): Promise<CheckResult> {
  const url = buildLocalUrl(product, storeId);
  return checkWithFetch(url, labels, headers);
}
