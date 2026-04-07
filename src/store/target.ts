import type {Store, Product, CheckResult} from './model';
import {config} from '../config';
import nodeFetch from 'node-fetch';
import {parsePrice} from '../price';

// Target's public Redsky API key (embedded in their web bundle)
const REDSKY_KEY = 'ff457966e64d5e877fdbad070f276d18ecec4a01';

function extractTcin(url: string): string {
  const match = url.match(/\/A-(\d+)/);
  if (!match) throw new Error(`Cannot extract TCIN from Target URL: ${url}`);
  return match[1];
}

// Hits Target's Redsky fulfillment API directly for structured JSON.
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

  const url = `https://redsky.target.com/redsky_aggregations/v1/web/pdp_fulfillment_v1?${params}`;

  const res = await nodeFetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Referer': 'https://www.target.com/',
      'Origin': 'https://www.target.com',
    },
  });

  if (!res.ok) {
    throw new Error(`Target Redsky API HTTP ${res.status} for TCIN ${tcin}`);
  }

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
        shipping_options?: {
          availability_status?: string;
        };
      };
      price?: {
        current_retail?: number;
        formatted_current_price?: string;
        reg_retail?: number;
      };
    };
  };
};

function parseTargetFulfillment(data: TargetFulfillmentResponse): CheckResult {
  const product = data?.data?.product;
  const fulfillment = product?.fulfillment;
  let inStock = false;

  const shippingStatus = fulfillment?.shipping_options?.availability_status;
  if (shippingStatus === 'IN_STOCK' || shippingStatus === 'LIMITED_STOCK') {
    inStock = true;
  }

  const storeOptions = fulfillment?.store_options ?? [];
  for (const opt of storeOptions) {
    const pickupStatus = opt.order_pickup?.availability_status;
    const inStoreStatus = opt.in_store_only?.availability_status;
    if (
      pickupStatus === 'IN_STOCK' || pickupStatus === 'LIMITED_STOCK' ||
      inStoreStatus === 'IN_STOCK' || inStoreStatus === 'LIMITED_STOCK'
    ) {
      inStock = true;
      break;
    }
  }

  let price: number | null = null;
  if (product?.price?.current_retail != null) {
    price = product.price.current_retail;
  } else if (product?.price?.formatted_current_price) {
    price = parsePrice(product.price.formatted_current_price);
  }

  return {inStock, price};
}

function buildLocalUrl(product: Product, storeId: string): string {
  const tcin = extractTcin(product.url);
  return (
    `https://www.target.com/p/-/A-${tcin}` +
    `?preselect=${tcin}&type=3&storeId=${storeId}`
  );
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
    // ══════════════════════════════════════════════════════════════════════
    //  TIER 1 — Hardest to find
    // ══════════════════════════════════════════════════════════════════════

    // ── Prismatic Evolutions (SV8.5) ──
    {
      canonicalName: 'Prismatic Evolutions ETB',
      name: 'Pokemon SV Prismatic Evolutions Elite Trainer Box',
      type: 'etb',
      set: 'Prismatic Evolutions',
      url: 'https://www.target.com/p/2024-pok-scarlet-violet-s8-5-elite-trainer-box/-/A-93954435',
    },
    {
      canonicalName: 'Prismatic Evolutions Booster Bundle',
      name: 'Pokemon SV Prismatic Evolutions Booster Bundle',
      type: 'bundle',
      set: 'Prismatic Evolutions',
      url: 'https://www.target.com/p/pok-233-mon-trading-card-game-scarlet-38-violet-prismatic-evolutions-booster-bundle/-/A-93954446',
    },
    {
      canonicalName: 'Prismatic Evolutions Binder Collection',
      name: 'Pokemon SV Prismatic Evolutions Binder Collection',
      type: 'collection-box',
      set: 'Prismatic Evolutions',
      url: 'https://www.target.com/p/pok-233-mon-trading-card-game-scarlet-38-violet-prismatic-evolutions-binder-collection/-/A-93954437',
    },
    {
      canonicalName: 'Prismatic Evolutions Surprise Box',
      name: 'Pokemon SV Prismatic Evolutions Surprise Box',
      type: 'collection-box',
      set: 'Prismatic Evolutions',
      url: 'https://www.target.com/p/pok-233-mon-trading-card-game-scarlet-38-violet-prismatic-evolutions-surprise-box/-/A-93954449',
    },

    // ── Pokemon 151 (SV3.5) ──
    {
      canonicalName: 'Pokemon 151 ETB',
      name: 'Pokemon SV 151 Elite Trainer Box',
      type: 'etb',
      set: 'Pokemon 151',
      url: 'https://www.target.com/p/pok-233-mon-trading-card-game-scarlet-38-violet-151-elite-trainer-box/-/A-89233803',
    },
    {
      canonicalName: 'Pokemon 151 Booster Bundle',
      name: 'Pokemon SV 151 Booster Bundle',
      type: 'bundle',
      set: 'Pokemon 151',
      url: 'https://www.target.com/p/pok-233-mon-trading-card-game-scarlet-38-violet-151-booster-bundle/-/A-89233804',
    },
    {
      canonicalName: 'Pokemon 151 Ultra Premium Collection',
      name: 'Pokemon SV 151 Ultra Premium Collection',
      type: 'upc',
      set: 'Pokemon 151',
      url: 'https://www.target.com/p/pok-233-mon-trading-card-game-scarlet-38-violet-151-ultra-premium-collection/-/A-89233810',
    },

    // ── Perfect Order (ME) ──
    {
      canonicalName: 'Perfect Order ETB',
      name: 'Pokemon Mega Evolution Perfect Order Elite Trainer Box',
      type: 'etb',
      set: 'Perfect Order',
      url: 'https://www.target.com/p/pokemon-tcg-mega-evolution-perfect-order-elite-trainer-box/-/A-95288901',
    },
    {
      canonicalName: 'Perfect Order Booster Box',
      name: 'Pokemon Mega Evolution Perfect Order Booster Box',
      type: 'booster-box',
      set: 'Perfect Order',
      url: 'https://www.target.com/p/pokemon-tcg-mega-evolution-perfect-order-booster-box/-/A-95288902',
    },
    {
      canonicalName: 'Perfect Order Booster Bundle',
      name: 'Pokemon Mega Evolution Perfect Order Booster Bundle',
      type: 'bundle',
      set: 'Perfect Order',
      url: 'https://www.target.com/p/pokemon-tcg-mega-evolution-perfect-order-booster-bundle/-/A-95288903',
    },

    // ── Destined Rivals (SV10) ──
    {
      canonicalName: 'Destined Rivals ETB',
      name: 'Pokemon SV Destined Rivals Elite Trainer Box',
      type: 'etb',
      set: 'Destined Rivals',
      url: 'https://www.target.com/p/pokemon-trading-card-game-scarlet-violet-destined-rivals-elite-trainer-box/-/A-94601254',
    },
    {
      canonicalName: 'Destined Rivals Booster Bundle',
      name: 'Pokemon SV Destined Rivals Booster Bundle',
      type: 'bundle',
      set: 'Destined Rivals',
      url: 'https://www.target.com/p/pokemon-trading-card-game-scarlet-violet-destined-rivals-booster-bundle/-/A-94601255',
    },

    // ══════════════════════════════════════════════════════════════════════
    //  TIER 2 — Hard to find
    // ══════════════════════════════════════════════════════════════════════

    // ── Ascended Heroes (ME) — user is collecting this ──
    {
      canonicalName: 'Ascended Heroes ETB',
      name: 'Pokemon Mega Evolution Ascended Heroes Elite Trainer Box',
      type: 'etb',
      set: 'Ascended Heroes',
      url: 'https://www.target.com/p/pokemon-tcg-mega-evolution-ascended-heroes-elite-trainer-box/-/A-95518901',
    },
    {
      canonicalName: 'Ascended Heroes Booster Bundle',
      name: 'Pokemon Mega Evolution Ascended Heroes Booster Bundle',
      type: 'bundle',
      set: 'Ascended Heroes',
      url: 'https://www.target.com/p/pokemon-tcg-mega-evolution-ascended-heroes-booster-bundle/-/A-95518902',
    },

    // ── Phantasmal Flames (ME) ──
    {
      canonicalName: 'Phantasmal Flames ETB',
      name: 'Pokemon Mega Evolution Phantasmal Flames Elite Trainer Box',
      type: 'etb',
      set: 'Phantasmal Flames',
      url: 'https://www.target.com/p/pokemon-tcg-mega-evolution-phantasmal-flames-elite-trainer-box/-/A-95108901',
    },
    {
      canonicalName: 'Phantasmal Flames Booster Box',
      name: 'Pokemon Mega Evolution Phantasmal Flames Booster Box',
      type: 'booster-box',
      set: 'Phantasmal Flames',
      url: 'https://www.target.com/p/pokemon-tcg-mega-evolution-phantasmal-flames-booster-box/-/A-95108902',
    },
    {
      canonicalName: 'Mega Charizard X ex UPC',
      name: 'Pokemon Mega Charizard X ex Ultra Premium Collection',
      type: 'upc',
      set: 'Phantasmal Flames',
      url: 'https://www.target.com/p/pokemon-tcg-mega-charizard-x-ex-ultra-premium-collection/-/A-95108910',
    },

    // ── Black Bolt / White Flare (SV10.5) ──
    {
      canonicalName: 'Black Bolt ETB',
      name: 'Pokemon SV Black Bolt Elite Trainer Box',
      type: 'etb',
      set: 'Black Bolt',
      url: 'https://www.target.com/p/pokemon-trading-card-game-scarlet-violet-black-bolt-elite-trainer-box/-/A-94801254',
    },
    {
      canonicalName: 'White Flare ETB',
      name: 'Pokemon SV White Flare Elite Trainer Box',
      type: 'etb',
      set: 'White Flare',
      url: 'https://www.target.com/p/pokemon-trading-card-game-scarlet-violet-white-flare-elite-trainer-box/-/A-94801255',
    },

    // ── Paldean Fates (SV4.5) ──
    {
      canonicalName: 'Paldean Fates ETB',
      name: 'Pokemon SV Paldean Fates Elite Trainer Box',
      type: 'etb',
      set: 'Paldean Fates',
      url: 'https://www.target.com/p/pok-233-mon-trading-card-game-scarlet-38-violet-paldean-fates-elite-trainer-box/-/A-90648601',
    },

    // ══════════════════════════════════════════════════════════════════════
    //  TIER 3 — Worth watching
    // ══════════════════════════════════════════════════════════════════════

    // ── Chaos Rising (ME, pre-order May 22 2026) ──
    {
      canonicalName: 'Chaos Rising ETB',
      name: 'Pokemon Mega Evolution Chaos Rising Elite Trainer Box',
      type: 'etb',
      set: 'Chaos Rising',
      url: 'https://www.target.com/p/pokemon-tcg-mega-evolution-chaos-rising-elite-trainer-box/-/A-95608901',
    },

    // ── Surging Sparks (SV08) ──
    {
      canonicalName: 'Surging Sparks ETB',
      name: 'Pokemon SV Surging Sparks Elite Trainer Box',
      type: 'etb',
      set: 'Surging Sparks',
      url: 'https://www.target.com/p/pokemon-trading-card-game-scarlet-38-violet-surging-sparks-elite-trainer-box/-/A-91619922',
    },
    {
      canonicalName: 'Surging Sparks Booster Bundle',
      name: 'Pokemon SV Surging Sparks Booster Bundle',
      type: 'bundle',
      set: 'Surging Sparks',
      url: 'https://www.target.com/p/pokemon-trading-card-game-scarlet-38-violet-surging-sparks-booster-bundle/-/A-91619929',
    },

    // ── Journey Together (SV09) ──
    {
      canonicalName: 'Journey Together ETB',
      name: 'Pokemon SV Journey Together Elite Trainer Box',
      type: 'etb',
      set: 'Journey Together',
      url: 'https://www.target.com/p/pokemon-trading-card-game-scarlet-violet-journey-together-elite-trainer-box/-/A-94372863',
    },
    {
      canonicalName: 'Journey Together Booster Bundle',
      name: 'Pokemon SV Journey Together Booster Bundle',
      type: 'bundle',
      set: 'Journey Together',
      url: 'https://www.target.com/p/pokemon-trading-card-game-scarlet-violet-journey-together-booster-bundle/-/A-94372864',
    },
  ],
};
