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
  const res = await nodeFetch(url, {
    headers: {...DEFAULT_HEADERS, ...headers},
    timeout: 10000,  // 10s timeout — don't hang if API is unreachable
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

// Target's Redsky store finder API is behind bot detection.
// Use TARGET_STORES env var with store IDs (find them at target.com/sl/{city}/{id}).
async function findTargetStores(
  _zipCode: string,
  count: number
): Promise<LocalStoreLocation[]> {
  const envStores = process.env['TARGET_STORES'];
  if (!envStores) {
    logger.warn(
      '[target] TARGET_STORES not set — local stock checks disabled. ' +
      'Set TARGET_STORES=1234,5678 with your nearby store IDs (from target.com/sl/{city}/{id}).'
    );
    return [];
  }
  const ids = envStores.split(',').map(s => s.trim()).filter(Boolean);
  return ids.slice(0, count).map(id => ({
    storeId: id,
    name: `Target #${id}`,
    address: '',
    distanceMiles: 0,
  }));
}

// Best Buy store finder API is behind bot detection.
// Use BESTBUY_STORES env var with store IDs (from bestbuy.com/site/store-locator).
async function findBestBuyStores(
  _zipCode: string,
  count: number
): Promise<LocalStoreLocation[]> {
  const envStores = process.env['BESTBUY_STORES'];
  if (!envStores) {
    logger.warn(
      '[bestbuy] BESTBUY_STORES not set — local stock checks disabled. ' +
      'Set BESTBUY_STORES=1234,5678 with your nearby store IDs.'
    );
    return [];
  }
  const ids = envStores.split(',').map(s => s.trim()).filter(Boolean);
  return ids.slice(0, count).map(id => ({
    storeId: id,
    name: `Best Buy #${id}`,
    address: '',
    distanceMiles: 0,
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
