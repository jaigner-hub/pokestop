import type {Store, Product, CheckResult} from './model';
import {config} from '../config';
import nodeFetch from 'node-fetch';
import {parsePrice} from '../price';

const REDSKY_KEY = 'ff457966e64d5e877fdbad070f276d18ecec4a01';

function extractTcin(url: string): string {
  const match = url.match(/\/A-(\d+)/);
  if (!match) throw new Error(`Cannot extract TCIN from Target URL: ${url}`);
  return match[1];
}

export async function checkTargetFulfillment(
  product: Product,
  storeId?: string,
  zipCode?: string
): Promise<CheckResult> {
  const tcin = extractTcin(product.url);
  const params = new URLSearchParams({
    key: REDSKY_KEY,
    tcin,
    zip: zipCode ?? config.zipCode ?? '90210',
    has_pricing_store_id: 'true',
    has_store_positions_store_id: 'true',
  });
  if (storeId) {
    params.set('store_id', storeId);
    params.set('store_positions_store_id', storeId);
    params.set('pricing_store_id', storeId);
  }

  const url = `https://redsky.target.com/redsky_aggregations/v1/web/product_fulfillment_v1?${params}`;
  const res = await nodeFetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Referer': 'https://www.target.com/',
      'Origin': 'https://www.target.com',
    },
  });

  if (res.status === 404) {
    const {NotFoundError} = require('../checker');
    throw new NotFoundError(`https://www.target.com/p/-/A-${tcin}`);
  }
  if (!res.ok) throw new Error(`Target Redsky API HTTP ${res.status} for TCIN ${tcin}`);
  const data = await res.json() as TargetFulfillmentResponse;
  return parseTargetFulfillment(data);
}

type TargetFulfillmentResponse = {
  data?: {
    product?: {
      fulfillment?: {
        store_options?: Array<{
          order_pickup?: {availability_status?: string};
          ship_to_store?: {availability_status?: string};
          in_store_only?: {availability_status?: string};
        }>;
        shipping_options?: { availability_status?: string };
      };
      price?: {
        current_retail?: number;
        formatted_current_price?: string;
      };
    };
  };
};

function parseTargetFulfillment(data: TargetFulfillmentResponse): CheckResult {
  const product = data?.data?.product;
  const fulfillment = product?.fulfillment;
  let inStock = false;

  const shippingStatus = fulfillment?.shipping_options?.availability_status;
  if (shippingStatus === 'IN_STOCK' || shippingStatus === 'LIMITED_STOCK') inStock = true;

  for (const opt of fulfillment?.store_options ?? []) {
    const pickup = opt.order_pickup?.availability_status;
    const inStoreOnly = opt.in_store_only?.availability_status;
    if (pickup === 'IN_STOCK' || pickup === 'LIMITED_STOCK' ||
        inStoreOnly === 'IN_STOCK' || inStoreOnly === 'LIMITED_STOCK') {
      inStock = true;
      break;
    }
  }

  let price: number | null = null;
  if (product?.price?.current_retail != null) price = product.price.current_retail;
  else if (product?.price?.formatted_current_price) price = parsePrice(product.price.formatted_current_price);

  return {inStock, price};
}

function buildLocalUrl(product: Product, storeId: string): string {
  const tcin = extractTcin(product.url);
  return `https://www.target.com/p/-/A-${tcin}?preselect=${tcin}&type=3&storeId=${storeId}`;
}

export const target: Store = {
  name: 'target',
  strategy: 'fetch',
  supportsLocalStock: true,
  localStores: [],
  minSleep: config.pageSleepMin,
  maxSleep: config.pageSleepMax,
  buildLocalUrl,
  customCheck: checkTargetFulfillment,
  labels: {
    container: '[data-test="product-details"]',
    inStock: ['[data-test="addToCartButton"]', '[data-test="shipItButton"]', 'Add to cart', 'Pick it up'],
    outOfStock: ['[data-test="soldOutButton"]', 'Out of stock', 'Sold out'],
    price: '[data-test="product-price"]',
  },
  products: [
    // ── Prismatic Evolutions (SV8.5) ──
    {canonicalName: 'Prismatic Evolutions ETB', name: 'Pokemon SV Prismatic Evolutions Elite Trainer Box', type: 'etb', set: 'Prismatic Evolutions', url: 'https://www.target.com/p/2024-pok-scarlet-violet-s8-5-elite-trainer-box/-/A-93954435'},
    {canonicalName: 'Prismatic Evolutions Booster Bundle', name: 'Pokemon SV Prismatic Evolutions Booster Bundle', type: 'bundle', set: 'Prismatic Evolutions', url: 'https://www.target.com/p/pok-233-mon-trading-card-game-scarlet-38-violet-prismatic-evolutions-booster-bundle/-/A-93954446'},

    // ── Pokemon 151 (SV3.5) ──
    {canonicalName: 'Pokemon 151 ETB', name: 'Pokemon SV 151 Elite Trainer Box', type: 'etb', set: 'Pokemon 151', url: 'https://www.target.com/p/pokemon-trading-card-game-scarlet-38-violet-151-elite-trainer-box/-/A-88897899'},
    {canonicalName: 'Pokemon 151 Booster Bundle', name: 'Pokemon SV 151 Booster Bundle', type: 'bundle', set: 'Pokemon 151', url: 'https://www.target.com/p/pokemon-trading-card-game-scarlet-38-violet-151-booster-bundle/-/A-88897904'},
    {canonicalName: 'Pokemon 151 Ultra Premium Collection', name: 'Pokemon SV 151 Ultra Premium Collection', type: 'upc', set: 'Pokemon 151', url: 'https://www.target.com/p/pokemon-trading-card-game-scarlet-38-violet-151-ultra-premium-collection/-/A-88897906'},
    {canonicalName: 'Pokemon 151 Binder Collection', name: 'Pokemon SV 151 Binder Collection', type: 'collection-box', set: 'Pokemon 151', url: 'https://www.target.com/p/pok-233-mon-trading-card-game-scarlet-38-violet-151-binder-collection/-/A-89444929'},

    // ── Perfect Order (ME3) ──
    {canonicalName: 'Perfect Order ETB', name: 'Pokemon ME Perfect Order Elite Trainer Box', type: 'etb', set: 'Perfect Order', url: 'https://www.target.com/p/pok-233-mon-trading-card-game-mega-evolution-perfect-order-elite-trainer-box/-/A-95230445'},
    {canonicalName: 'Perfect Order Booster Box', name: 'Pokemon ME Perfect Order Booster Display', type: 'booster-box', set: 'Perfect Order', url: 'https://www.target.com/p/pok-233-mon-trading-card-game-mega-evolution-perfect-order-booster-display/-/A-95252674'},
    {canonicalName: 'Perfect Order Booster Bundle', name: 'Pokemon ME Perfect Order Booster Bundle', type: 'bundle', set: 'Perfect Order', url: 'https://www.target.com/p/pok-233-mon-mega-evolution-s3-perfect-order-booster-bundle-box/-/A-95230447'},

    // ── Destined Rivals (SV10) ──
    {canonicalName: 'Destined Rivals ETB', name: 'Pokemon SV Destined Rivals Elite Trainer Box', type: 'etb', set: 'Destined Rivals', url: 'https://www.target.com/p/pok-233-mon-trading-card-game-scarlet-38-violet-8212-destined-rivals-elite-trainer-box/-/A-94300069'},
    {canonicalName: 'Destined Rivals Booster Bundle', name: 'Pokemon SV Destined Rivals Booster Bundle', type: 'bundle', set: 'Destined Rivals', url: 'https://www.target.com/p/pok-233-mon-trading-card-game-scarlet-38-violet-8212-destined-rivals-booster-bundle/-/A-94300067'},

    // ── Ascended Heroes (ME2.5) — user is collecting this ──
    {canonicalName: 'Ascended Heroes ETB', name: 'Pokemon ME Ascended Heroes Elite Trainer Box', type: 'etb', set: 'Ascended Heroes', url: 'https://www.target.com/p/2025-pok-me-2-5-elite-trainer-box/-/A-95082118'},
    {canonicalName: 'Ascended Heroes Booster Bundle', name: 'Pokemon ME Ascended Heroes Booster Bundle', type: 'bundle', set: 'Ascended Heroes', url: 'https://www.target.com/p/pok-233-mon-trading-card-game-mega-evolution-ascended-heroes-booster-bundle/-/A-95120834'},

    // ── Phantasmal Flames (ME2) ──
    {canonicalName: 'Phantasmal Flames ETB', name: 'Pokemon ME Phantasmal Flames Elite Trainer Box', type: 'etb', set: 'Phantasmal Flames', url: 'https://www.target.com/p/pok-233-mon-trading-card-game-mega-evolution-8212-phantasmal-flames-elite-trainer-box/-/A-94860231'},
    {canonicalName: 'Phantasmal Flames Booster Box', name: 'Pokemon ME Phantasmal Flames Booster Display', type: 'booster-box', set: 'Phantasmal Flames', url: 'https://www.target.com/p/pok-233-mon-trading-card-game-mega-evolution-8212-phantasmal-flames-booster-display/-/A-95040142'},
    {canonicalName: 'Phantasmal Flames Booster Bundle', name: 'Pokemon ME Phantasmal Flames Booster Bundle', type: 'bundle', set: 'Phantasmal Flames', url: 'https://www.target.com/p/pok-233-mon-trading-card-game-mega-evolution-8212-phantasmal-flames-booster-bundle/-/A-94884496'},
    {canonicalName: 'Mega Charizard X ex UPC', name: 'Pokemon Charizard X ex Ultra Premium Collection', type: 'upc', set: 'Phantasmal Flames', url: 'https://www.target.com/p/pok-233-mon-trading-card-game-charizard-x-ex-ultra-premium-collection/-/A-94681790'},

    // ── Black Bolt / White Flare (SV10.5) ──
    {canonicalName: 'Black Bolt ETB', name: 'Pokemon SV Black Bolt Elite Trainer Box', type: 'etb', set: 'Black Bolt', url: 'https://www.target.com/p/pok-233-mon-scarlet-violet-s10-5-elite-trainer-box-2-trading-cards/-/A-94636862'},
    {canonicalName: 'White Flare ETB', name: 'Pokemon SV White Flare Elite Trainer Box', type: 'etb', set: 'White Flare', url: 'https://www.target.com/p/pok-233-mon-trading-card-game-scarlet-38-violet-8212-white-flare-elite-trainer-box/-/A-94636860'},
    {canonicalName: 'Black Bolt Booster Bundle', name: 'Pokemon SV Black Bolt Booster Bundle', type: 'bundle', set: 'Black Bolt', url: 'https://www.target.com/p/pok-233-mon-trading-card-game-scarlet-38-violet-8212-black-bolt-booster-bundle/-/A-94681770'},
    {canonicalName: 'White Flare Booster Bundle', name: 'Pokemon SV White Flare Booster Bundle', type: 'bundle', set: 'White Flare', url: 'https://www.target.com/p/pok-233-mon-trading-card-game-scarlet-38-violet-8212-white-flare-booster-bundle/-/A-94681785'},

    // ── Paldean Fates (SV4.5) ──
    {canonicalName: 'Paldean Fates ETB', name: 'Pokemon SV Paldean Fates Elite Trainer Box', type: 'etb', set: 'Paldean Fates', url: 'https://www.target.com/p/pok-233-mon-trading-card-game-scarlet-38-violet-8212-paldean-fates-elite-trainer-box/-/A-89432659'},
    {canonicalName: 'Paldean Fates Booster Bundle', name: 'Pokemon SV Paldean Fates Booster Bundle', type: 'bundle', set: 'Paldean Fates', url: 'https://www.target.com/p/pok-233-mon-trading-card-game-scarlet-38-violet-8212-paldean-fates-booster-bundle/-/A-89432660'},

    // ── Surging Sparks (SV08) ──
    {canonicalName: 'Surging Sparks ETB', name: 'Pokemon SV Surging Sparks Elite Trainer Box', type: 'etb', set: 'Surging Sparks', url: 'https://www.target.com/p/pokemon-trading-card-game-scarlet-38-violet-surging-sparks-elite-trainer-box/-/A-91619922'},
    {canonicalName: 'Surging Sparks Booster Bundle', name: 'Pokemon SV Surging Sparks Booster Bundle', type: 'bundle', set: 'Surging Sparks', url: 'https://www.target.com/p/pokemon-trading-card-game-scarlet-38-violet-surging-sparks-booster-bundle/-/A-91619929'},

  ],
};
