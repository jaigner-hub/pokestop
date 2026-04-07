import type {Store, Product} from './model';
import {config} from '../config';

function extractSkuId(url: string): string {
  const match = url.match(/\/(\d+)\.p/);
  if (!match) throw new Error(`Cannot extract SKU ID from Best Buy URL: ${url}`);
  return match[1];
}

// Best Buy shows store pickup availability when storeId query param is set.
// The page renders a "Pickup" section when the item is available at that location.
function buildLocalUrl(product: Product, storeId: string): string {
  const skuId = extractSkuId(product.url);
  return `${product.url.split('?')[0]}?skuId=${skuId}&storeId=${storeId}`;
}

export const bestbuy: Store = {
  name: 'bestbuy',
  strategy: 'fetch',
  supportsLocalStock: true,
  localStores: [],
  minSleep: config.pageSleepMin,
  maxSleep: config.pageSleepMax,
  headers: {
    'Accept-Language': 'en-US,en;q=0.9',
  },
  buildLocalUrl,
  labels: {
    container: '.shop-fulfillment-button-wrapper, .fulfillment-fulfillment-summary, .shop-product-button',
    inStock: [
      '.add-to-cart-button:not([disabled])',
      'Add to Cart',
      'Pickup',
    ],
    outOfStock: [
      'Sold Out',
      'Coming Soon',
      'Unavailable',
      'Check Stores',
    ],
    price: '.priceView-customer-price span:first-child',
  },
  products: [
    // ── Prismatic Evolutions ──
    {
      canonicalName: 'Prismatic Evolutions ETB',
      name: 'Pokemon SV Prismatic Evolutions Elite Trainer Box',
      type: 'etb',
      set: 'Prismatic Evolutions',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-prismatic-evolutions-elite-trainer-box/6606082.p?skuId=6606082',
    },
    {
      canonicalName: 'Prismatic Evolutions Booster Bundle',
      name: 'Pokemon SV Prismatic Evolutions Booster Bundle',
      type: 'bundle',
      set: 'Prismatic Evolutions',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-prismatic-evolutions-booster-bundle/6608206.p?skuId=6608206',
    },
    // ── Surging Sparks ──
    {
      canonicalName: 'Surging Sparks Booster Box',
      name: 'Pokemon SV Surging Sparks Booster Box (36 Packs)',
      type: 'booster-box',
      set: 'Surging Sparks',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-surging-sparks-booster-box-36-packs/6598558.p?skuId=6598558',
    },
    {
      canonicalName: 'Surging Sparks ETB',
      name: 'Pokemon SV Surging Sparks Elite Trainer Box',
      type: 'etb',
      set: 'Surging Sparks',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-surging-sparks-elite-trainer-box/6598557.p?skuId=6598557',
    },
    // ── Prismatic Evolutions (more SKUs) ──
    {
      canonicalName: 'Prismatic Evolutions Binder Collection',
      name: 'Pokemon SV Prismatic Evolutions Binder Collection',
      type: 'collection-box',
      set: 'Prismatic Evolutions',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-prismatic-evolutions-binder-collection/6606079.p?skuId=6606079',
    },
    {
      canonicalName: 'Prismatic Evolutions Super Premium Collection',
      name: 'Pokemon SV Prismatic Evolutions Super Premium Collection',
      type: 'collection-box',
      set: 'Prismatic Evolutions',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-prismatic-evolutions-super-premium-collection/6621081.p?skuId=6621081',
    },
    // ── Journey Together ──
    {
      canonicalName: 'Journey Together ETB',
      name: 'Pokemon SV Journey Together Elite Trainer Box',
      type: 'etb',
      set: 'Journey Together',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-journey-together-elite-trainer-box/6614267.p?skuId=6614267',
    },
    {
      canonicalName: 'Journey Together Booster Bundle',
      name: 'Pokemon SV Journey Together Booster Bundle',
      type: 'bundle',
      set: 'Journey Together',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-journey-together-booster-bundle-6-pk/6614264.p?skuId=6614264',
    },
    {
      canonicalName: 'Journey Together Booster Box',
      name: 'Pokemon SV Journey Together Booster Box (36 Packs)',
      type: 'booster-box',
      set: 'Journey Together',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-journey-together-booster-box-36-packs/6614262.p?skuId=6614262',
    },
  ],
};
