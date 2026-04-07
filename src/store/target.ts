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
// Returns real availability status per store — way more reliable than HTML scraping.
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

  // Check shipping availability (online)
  const shippingStatus = fulfillment?.shipping_options?.availability_status;
  if (shippingStatus === 'IN_STOCK' || shippingStatus === 'LIMITED_STOCK') {
    inStock = true;
  }

  // Check store pickup / in-store options
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

  // Extract price
  let price: number | null = null;
  if (product?.price?.current_retail != null) {
    price = product.price.current_retail;
  } else if (product?.price?.formatted_current_price) {
    price = parsePrice(product.price.formatted_current_price);
  }

  return {inStock, price};
}

// For local store checks, we hit the same API with a specific store_id.
// The API returns availability for that exact store.
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
  // These labels are kept as fallback for the generic HTML checker,
  // but the poller will prefer checkTargetFulfillment() for Target.
  labels: {
    container: '[data-test="product-details"]',
    inStock: [
      '[data-test="addToCartButton"]',
      '[data-test="shipItButton"]',
      'Add to cart',
      'Pick it up',
    ],
    outOfStock: [
      '[data-test="soldOutButton"]',
      'Out of stock',
      'Sold out',
    ],
    price: '[data-test="product-price"]',
  },
  products: [
    // ── Prismatic Evolutions (the hottest set right now) ──
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
    // ── Surging Sparks ──
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
    // ── Journey Together (newest set, March 2025) ──
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
