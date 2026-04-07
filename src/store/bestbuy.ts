import type {Store, Product} from './model';
import {config} from '../config';

function extractSkuId(url: string): string {
  const match = url.match(/\/(\d+)\.p/);
  if (!match) throw new Error(`Cannot extract SKU ID from Best Buy URL: ${url}`);
  return match[1];
}

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
    inStock: ['.add-to-cart-button:not([disabled])', 'Add to Cart', 'Pickup'],
    outOfStock: ['Sold Out', 'Coming Soon', 'Unavailable', 'Check Stores'],
    price: '.priceView-customer-price span:first-child',
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
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-prismatic-evolutions-elite-trainer-box/6606082.p?skuId=6606082',
    },
    {
      canonicalName: 'Prismatic Evolutions Booster Bundle',
      name: 'Pokemon SV Prismatic Evolutions Booster Bundle',
      type: 'bundle',
      set: 'Prismatic Evolutions',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-prismatic-evolutions-booster-bundle/6608206.p?skuId=6608206',
    },
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

    // ── Pokemon 151 (SV3.5) ──
    {
      canonicalName: 'Pokemon 151 ETB',
      name: 'Pokemon SV 151 Elite Trainer Box',
      type: 'etb',
      set: 'Pokemon 151',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-151-elite-trainer-box/6546149.p?skuId=6546149',
    },
    {
      canonicalName: 'Pokemon 151 Booster Bundle',
      name: 'Pokemon SV 151 Booster Bundle',
      type: 'bundle',
      set: 'Pokemon 151',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-151-booster-bundle/6546150.p?skuId=6546150',
    },

    // ── Perfect Order (ME) ──
    {
      canonicalName: 'Perfect Order ETB',
      name: 'Pokemon Mega Evolution Perfect Order Elite Trainer Box',
      type: 'etb',
      set: 'Perfect Order',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-mega-evolution-perfect-order-elite-trainer-box/6620801.p?skuId=6620801',
    },
    {
      canonicalName: 'Perfect Order Booster Box',
      name: 'Pokemon Mega Evolution Perfect Order Booster Box (36 Packs)',
      type: 'booster-box',
      set: 'Perfect Order',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-mega-evolution-perfect-order-booster-box-36-packs/6620802.p?skuId=6620802',
    },

    // ── Destined Rivals (SV10) ──
    {
      canonicalName: 'Destined Rivals ETB',
      name: 'Pokemon SV Destined Rivals Elite Trainer Box',
      type: 'etb',
      set: 'Destined Rivals',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-destined-rivals-elite-trainer-box/6616801.p?skuId=6616801',
    },
    {
      canonicalName: 'Destined Rivals Booster Bundle',
      name: 'Pokemon SV Destined Rivals Booster Bundle',
      type: 'bundle',
      set: 'Destined Rivals',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-destined-rivals-booster-bundle/6616802.p?skuId=6616802',
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
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-mega-evolution-ascended-heroes-elite-trainer-box/6622801.p?skuId=6622801',
    },
    {
      canonicalName: 'Ascended Heroes Booster Bundle',
      name: 'Pokemon Mega Evolution Ascended Heroes Booster Bundle',
      type: 'bundle',
      set: 'Ascended Heroes',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-mega-evolution-ascended-heroes-booster-bundle/6622802.p?skuId=6622802',
    },

    // ── Phantasmal Flames (ME) ──
    {
      canonicalName: 'Phantasmal Flames ETB',
      name: 'Pokemon Mega Evolution Phantasmal Flames Elite Trainer Box',
      type: 'etb',
      set: 'Phantasmal Flames',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-mega-evolution-phantasmal-flames-elite-trainer-box/6618801.p?skuId=6618801',
    },
    {
      canonicalName: 'Phantasmal Flames Booster Box',
      name: 'Pokemon Mega Evolution Phantasmal Flames Booster Box (36 Packs)',
      type: 'booster-box',
      set: 'Phantasmal Flames',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-mega-evolution-phantasmal-flames-booster-box-36-packs/6618802.p?skuId=6618802',
    },
    {
      canonicalName: 'Mega Charizard X ex UPC',
      name: 'Pokemon Mega Charizard X ex Ultra Premium Collection',
      type: 'upc',
      set: 'Phantasmal Flames',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-mega-charizard-x-ex-ultra-premium-collection/6618810.p?skuId=6618810',
    },

    // ── Paldean Fates (SV4.5) ──
    {
      canonicalName: 'Paldean Fates ETB',
      name: 'Pokemon SV Paldean Fates Elite Trainer Box',
      type: 'etb',
      set: 'Paldean Fates',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-paldean-fates-elite-trainer-box/6571801.p?skuId=6571801',
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
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-mega-evolution-chaos-rising-elite-trainer-box/6624801.p?skuId=6624801',
    },

    // ── Surging Sparks (SV08) ──
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

    // ── Journey Together (SV09) ──
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
