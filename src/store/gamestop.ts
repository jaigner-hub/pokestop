import type {Store, Product} from './model';
import {config} from '../config';

// GameStop uses Cloudflare WAF + client-side React rendering.
function buildLocalUrl(product: Product, storeId: string): string {
  const base = product.url.split('?')[0];
  return `${base}?selectedStore=${storeId}`;
}

export const gamestop: Store = {
  name: 'gamestop',
  strategy: 'puppeteer',  // Cloudflare blocks plain fetch
  supportsLocalStock: true,
  localStores: [],
  minSleep: config.pageSleepMin * 1.5,
  maxSleep: config.pageSleepMax * 1.5,
  buildLocalUrl,
  labels: {
    container: 'body',
    inStock: ['Add to Cart', '.add-to-cart:not([disabled])', 'In Store Only', 'Buy Now'],
    outOfStock: ['Not Available', 'Out of Stock', 'Pre-order', 'Unavailable'],
    price: '.actual-price, .product-price .price, [data-testid="price"]',
  },
  products: [
    // ══════════════════════════════════════════════════════════════════════
    //  TIER 1 — Hardest to find
    // ══════════════════════════════════════════════════════════════════════

    // ── Prismatic Evolutions (SV8.5) ──
    {
      canonicalName: 'Prismatic Evolutions ETB',
      name: 'Pokemon TCG Prismatic Evolutions Elite Trainer Box',
      type: 'etb',
      set: 'Prismatic Evolutions',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-prismatic-evolutions-elite-trainer-box/417631.html',
    },
    {
      canonicalName: 'Prismatic Evolutions Booster Bundle',
      name: 'Pokemon TCG Prismatic Evolutions Booster Bundle',
      type: 'bundle',
      set: 'Prismatic Evolutions',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-prismatic-evolutions-booster-bundle/20018824.html',
    },

    // ── Pokemon 151 (SV3.5) ──
    {
      canonicalName: 'Pokemon 151 ETB',
      name: 'Pokemon TCG SV 151 Collection Elite Trainer Box',
      type: 'etb',
      set: 'Pokemon 151',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-scarlet-and-violet-151-collection-elite-trainer-box/20006082.html',
    },
    {
      canonicalName: 'Pokemon 151 Booster Bundle',
      name: 'Pokemon TCG SV 151 Collection Booster Bundle',
      type: 'bundle',
      set: 'Pokemon 151',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-scarlet-and-violet-151-collection-booster-bundle/20006081.html',
    },

    // ── Perfect Order (ME) ──
    {
      canonicalName: 'Perfect Order ETB',
      name: 'Pokemon TCG Perfect Order Elite Trainer Box',
      type: 'etb',
      set: 'Perfect Order',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-perfect-order-elite-trainer-box/20031957.html',
    },
    {
      canonicalName: 'Perfect Order Booster Box',
      name: 'Pokemon TCG Perfect Order Booster Box',
      type: 'booster-box',
      set: 'Perfect Order',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-perfect-order-booster-box/20032538.html',
    },
    {
      canonicalName: 'Perfect Order Booster Bundle',
      name: 'Pokemon TCG Perfect Order Booster Bundle',
      type: 'bundle',
      set: 'Perfect Order',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-perfect-order-booster-bundle/20031960.html',
    },

    // ── Destined Rivals (SV10) ──
    {
      canonicalName: 'Destined Rivals ETB',
      name: 'Pokemon TCG Destined Rivals Elite Trainer Box',
      type: 'etb',
      set: 'Destined Rivals',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-destined-rivals-elite-trainer-box/20021586.html',
    },
    {
      canonicalName: 'Destined Rivals Booster Bundle',
      name: 'Pokemon TCG Destined Rivals Booster Bundle',
      type: 'bundle',
      set: 'Destined Rivals',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-destined-rivals-booster-bundle/20021585.html',
    },
    {
      canonicalName: 'Destined Rivals Booster Box',
      name: 'Pokemon TCG Destined Rivals Booster Box',
      type: 'booster-box',
      set: 'Destined Rivals',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-destined-rivals-booster-box/20021587.html',
    },

    // ══════════════════════════════════════════════════════════════════════
    //  TIER 2 — Hard to find
    // ══════════════════════════════════════════════════════════════════════

    // ── Ascended Heroes (ME) — user is collecting this ──
    {
      canonicalName: 'Ascended Heroes ETB',
      name: 'Pokemon TCG Ascended Heroes Elite Trainer Box',
      type: 'etb',
      set: 'Ascended Heroes',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-ascended-heroes-elite-trainer-box/20030564.html',
    },
    {
      canonicalName: 'Ascended Heroes Booster Bundle',
      name: 'Pokemon TCG Ascended Heroes Booster Bundle',
      type: 'bundle',
      set: 'Ascended Heroes',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-ascended-heroes-booster-bundle/20030569.html',
    },

    // ── Phantasmal Flames (ME) ──
    {
      canonicalName: 'Phantasmal Flames ETB',
      name: 'Pokemon TCG Phantasmal Flames Elite Trainer Box',
      type: 'etb',
      set: 'Phantasmal Flames',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-phantasmal-flames-elite-trainer-box/20027391.html',
    },
    {
      canonicalName: 'Phantasmal Flames Booster Box',
      name: 'Pokemon TCG Phantasmal Flames Booster Box',
      type: 'booster-box',
      set: 'Phantasmal Flames',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-phantasmal-flames-booster-box/20027387.html',
    },
    {
      canonicalName: 'Mega Charizard X ex UPC',
      name: 'Pokemon TCG Mega Charizard X ex Ultra Premium Collection',
      type: 'upc',
      set: 'Phantasmal Flames',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-mega-charizard-x-ex-ultra-premium-collection/20026985.html',
    },

    // ── Black Bolt / White Flare (SV10.5) ──
    {
      canonicalName: 'Black Bolt ETB',
      name: 'Pokemon TCG Black Bolt Elite Trainer Box',
      type: 'etb',
      set: 'Black Bolt',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-black-bolt-elite-trainer-box/20021662.html',
    },
    {
      canonicalName: 'White Flare ETB',
      name: 'Pokemon TCG White Flare Elite Trainer Box',
      type: 'etb',
      set: 'White Flare',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-white-flare-elite-trainer-box/20021658.html',
    },

    // ── Paldean Fates (SV4.5) ──
    {
      canonicalName: 'Paldean Fates ETB',
      name: 'Pokemon TCG Paldean Fates Elite Trainer Box',
      type: 'etb',
      set: 'Paldean Fates',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-paldean-fates-elite-trainer-box/402360.html',
    },
    {
      canonicalName: 'Paldean Fates Booster Bundle',
      name: 'Pokemon TCG Paldean Fates Booster Bundle',
      type: 'bundle',
      set: 'Paldean Fates',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-paldean-fates-booster-bundle/20009334.html',
    },

    // ══════════════════════════════════════════════════════════════════════
    //  TIER 3 — Worth watching
    // ══════════════════════════════════════════════════════════════════════

    // ── Chaos Rising (ME, pre-order May 22 2026) ──
    {
      canonicalName: 'Chaos Rising ETB',
      name: 'Pokemon TCG Chaos Rising Elite Trainer Box',
      type: 'etb',
      set: 'Chaos Rising',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-chaos-rising-elite-trainer-box/20033749.html',
    },

    // ── Surging Sparks (SV08) ──
    {
      canonicalName: 'Surging Sparks Booster Box',
      name: 'Pokemon TCG SV Surging Sparks Booster Box (36 Count)',
      type: 'booster-box',
      set: 'Surging Sparks',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-scarlet-and-violet-surging-sparks-booster-box-36-count/20015279.html',
    },
    {
      canonicalName: 'Surging Sparks ETB',
      name: 'Pokemon TCG SV Surging Sparks Elite Trainer Box',
      type: 'etb',
      set: 'Surging Sparks',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-scarlet-and-violet-surging-sparks-elite-trainer-box/20015259.html',
    },

    // ── Journey Together (SV09) ──
    {
      canonicalName: 'Journey Together ETB',
      name: 'Pokemon TCG SV Journey Together Elite Trainer Box',
      type: 'etb',
      set: 'Journey Together',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-scarlet-violet-journey-together-elite-trainer-box/20022103.html',
    },
  ],
};
