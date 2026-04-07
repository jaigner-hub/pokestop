import nodeFetch from 'node-fetch';
import {logger} from './logger';
import type {LocalStoreLocation} from './store/model';

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

async function fetchJson(url: string, headers = {}): Promise<unknown> {
  const res = await nodeFetch(url, {headers: {...DEFAULT_HEADERS, ...headers}});
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

// Target uses a public Redsky API key available in their web bundle.
// Endpoint: https://redsky.target.com/v3/stores/nearby
// Response shape: { locations: [{ location_id, city, state, address: { address_line1 }, distance }] }
async function findTargetStores(
  zipCode: string,
  count: number
): Promise<LocalStoreLocation[]> {
  const url =
    `https://redsky.target.com/v3/stores/nearby` +
    `?key=ff457966e64d5e877fdbad070f276d18ecec4a01` +
    `&place=${encodeURIComponent(zipCode)}&limit=${count}&within=50&unit=mile`;
  const data = (await fetchJson(url)) as {locations?: Record<string, unknown>[]};
  return (data.locations ?? []).slice(0, count).map((loc: Record<string, unknown>) => ({
    storeId: String(loc['location_id']),
    name: `Target - ${loc['city']}`,
    address: `${(loc['address'] as Record<string, unknown>)?.['address_line1']}, ${loc['city']}, ${loc['state']}`,
    distanceMiles: Number(loc['distance']),
  }));
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

// Walmart store finder. Uses their internal store locator API.
// Response shape varies — inspect network tab at walmart.com/store/finder for current shape.
async function findWalmartStores(
  zipCode: string,
  count: number
): Promise<LocalStoreLocation[]> {
  const url =
    `https://www.walmart.com/store/ajax/view` +
    `?location=${encodeURIComponent(zipCode)}&count=${count}`;
  const data = (await fetchJson(url, {Referer: 'https://www.walmart.com/'})) as {
    payload?: {storesData?: {stores?: Record<string, unknown>[]}};
  };
  const stores = data?.payload?.storesData?.stores ?? [];
  return stores.slice(0, count).map((s: Record<string, unknown>) => ({
    storeId: String(s['id']),
    name: `Walmart - ${s['displayName'] ?? s['city']}`,
    address: `${(s['address'] as Record<string, unknown>)?.['streetAddress']}, ${(s['address'] as Record<string, unknown>)?.['city']}, ${(s['address'] as Record<string, unknown>)?.['state']}`,
    distanceMiles: Number(s['distance']),
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
  const res = await nodeFetch(url, {headers: DEFAULT_HEADERS});
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
