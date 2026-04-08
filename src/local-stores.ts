import nodeFetch from 'node-fetch';
import {logger} from './logger';
import type {LocalStoreLocation} from './store/model';

const FETCH_TIMEOUT_MS = 15_000;

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

async function fetchJson(url: string, headers = {}): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await nodeFetch(url, {
      headers: {...DEFAULT_HEADERS, ...headers},
      signal: controller.signal as never,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Target store finder using their aggregations API (v3/stores/nearby was retired, returning 410).
// The aggregations endpoint is used by target.com's store locator page.
// Response shape: { data: { nearby_stores: { stores: [{ location_id, store_name, mailing_address: { ... }, distance }] } } }
async function findTargetStores(
  zipCode: string,
  count: number
): Promise<LocalStoreLocation[]> {
  const url =
    `https://redsky.target.com/redsky_aggregations/v1/web/nearby_stores_v1` +
    `?key=9f36aeafbe60771e321a7cc95a78140772ab3e96` +
    `&limit=${count}&within=50&place=${encodeURIComponent(zipCode)}` +
    `&unit=mile`;
  const data = (await fetchJson(url)) as {
    data?: {nearby_stores?: {stores?: Record<string, unknown>[]}};
  };
  const stores = data?.data?.nearby_stores?.stores ?? [];
  return stores.slice(0, count).map((s: Record<string, unknown>) => {
    const addr = (s['mailing_address'] ?? s['address'] ?? {}) as Record<string, unknown>;
    return {
      storeId: String(s['location_id']),
      name: `Target - ${addr['city'] ?? s['store_name']}`,
      address: `${addr['address_line1'] ?? ''}, ${addr['city'] ?? ''}, ${addr['state'] ?? ''}`,
      distanceMiles: Number(s['distance'] ?? 0),
    };
  });
}

// Best Buy store finder API. Returns nearby stores by postal code.
// Response shape: { stores: [{ storeId, city, state, address, distance }] }
async function findBestBuyStores(
  zipCode: string,
  count: number
): Promise<LocalStoreLocation[]> {
  const url =
    `https://www.bestbuy.com/api/v2/stores/nearby` +
    `?postalCode=${encodeURIComponent(zipCode)}&count=${count}`;
  const data = (await fetchJson(url, {Referer: 'https://www.bestbuy.com/'})) as {
    stores?: Record<string, unknown>[];
  };
  return (data.stores ?? []).slice(0, count).map((s: Record<string, unknown>) => ({
    storeId: String(s['storeId']),
    name: `Best Buy - ${s['city']}`,
    address: `${s['address']}, ${s['city']}, ${s['state']}`,
    distanceMiles: Number(s['distance']),
  }));
}

// Walmart store finder — Walmart's store-finder page is behind PerimeterX CAPTCHA
// that blocks both fetch and headless browsers. Use WALMART_STORES env var instead.
// Find store IDs from walmart.com/store/{id} URLs or your local store's page.
async function findWalmartStores(
  _zipCode: string,
  count: number
): Promise<LocalStoreLocation[]> {
  const envStores = process.env['WALMART_STORES'];
  if (!envStores) {
    logger.warn(
      '[walmart] WALMART_STORES not set — local stock checks disabled. ' +
      'Set WALMART_STORES=1234,5678 with your nearby store IDs (from walmart.com/store/{id}).'
    );
    return [];
  }
  const ids = envStores.split(',').map(s => s.trim()).filter(Boolean);
  return ids.map(id => ({
    storeId: id,
    name: `Walmart #${id}`,
    address: '',
    distanceMiles: 0,
  }));
}

// GameStop store locator. Uses their DemandWare store finder endpoint.
// Response shape: HTML page with embedded JSON — inspect network tab for current JSON endpoint.
async function findGameStopStores(
  zipCode: string,
  count: number
): Promise<LocalStoreLocation[]> {
  const url =
    `https://www.gamestop.com/on/demandware.store/Sites-gamestop-us-Site/en_US/Stores-FindStores` +
    `?dwfrm_storelocator_countryCode=US` +
    `&dwfrm_storelocator_postalCode=${encodeURIComponent(zipCode)}` +
    `&dwfrm_storelocator_maxdistance=50` +
    `&dwfrm_storelocator_findbyzipcode=Find+Store`;
  // GameStop returns HTML; extract JSON from the storeLocatorData script tag.
  const gsController = new AbortController();
  const gsTimer = setTimeout(() => gsController.abort(), FETCH_TIMEOUT_MS);
  const res = await nodeFetch(url, {
    headers: DEFAULT_HEADERS,
    signal: gsController.signal as never,
  }).finally(() => clearTimeout(gsTimer));
  if (!res.ok) throw new Error(`GameStop store finder HTTP ${res.status}`);
  const html = await res.text();
  const match = html.match(/window\.storeLocatorData\s*=\s*(\[.*?\]);/s);
  if (!match) throw new Error('Could not extract GameStop store data from HTML');
  const stores: Record<string, unknown>[] = JSON.parse(match[1]);
  return stores.slice(0, count).map(s => ({
    storeId: String(s['ID']),
    name: `GameStop - ${s['city']}`,
    address: `${s['address1']}, ${s['city']}, ${s['stateCode']}`,
    distanceMiles: Number(s['distancei']),
  }));
}

type StoreFinderFn = (zipCode: string, count: number) => Promise<LocalStoreLocation[]>;

const FINDERS: Record<string, StoreFinderFn> = {
  target: findTargetStores,
  bestbuy: findBestBuyStores,
  walmart: findWalmartStores,
  gamestop: findGameStopStores,
};

export async function resolveLocalStores(
  storeName: string,
  zipCode: string,
  count: number
): Promise<LocalStoreLocation[]> {
  const finder = FINDERS[storeName];
  if (!finder) return [];
  try {
    const locations = await finder(zipCode, count);
    logger.info(
      `[${storeName}] Resolved ${locations.length} nearby store(s) for zip ${zipCode}`
    );
    return locations;
  } catch (err) {
    logger.warn(`[${storeName}] Could not resolve local stores: ${err}`);
    return [];
  }
}
