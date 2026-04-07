import type {Store} from './model';
import {config} from '../config';

export const amazon: Store = {
  name: 'amazon',
  strategy: 'fetch',
  supportsLocalStock: false,
  localStores: [],
  minSleep: config.pageSleepMin * 1.5,  // Amazon is aggressive with bot detection
  maxSleep: config.pageSleepMax * 2,
  headers: {
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
  labels: {
    container: '#centerCol, #ppd',
    inStock: [
      '#add-to-cart-button',
      '#buy-now-button',
      'In Stock',
      'in stock',
    ],
    outOfStock: [
      'Currently unavailable',
      'out of stock',
      '#outOfStock',
      '#availabilityInsideBuyBox_feature_div .a-color-price',
    ],
    price: '.a-price .a-offscreen',
  },
  products: [
    // ══════════════════════════════════════════════════════════════════════
    //  TIER 1 — Hardest to find, aggressive monitoring
    // ══════════════════════════════════════════════════════════════════════

    // ── Prismatic Evolutions (SV8.5) ──
    {
      canonicalName: 'Prismatic Evolutions ETB',
      name: 'Pokemon TCG: SV Prismatic Evolutions Elite Trainer Box',
      type: 'etb',
      set: 'Prismatic Evolutions',
      url: 'https://www.amazon.com/dp/B0DLPL7LC5',
    },
    {
      canonicalName: 'Prismatic Evolutions Booster Bundle',
      name: 'Pokemon TCG: SV Prismatic Evolutions Booster Bundle',
      type: 'bundle',
      set: 'Prismatic Evolutions',
      url: 'https://www.amazon.com/dp/B0DN98RVZM',
    },
    {
      canonicalName: 'Prismatic Evolutions Binder Collection',
      name: 'Pokemon TCG: SV Prismatic Evolutions Binder Collection',
      type: 'collection-box',
      set: 'Prismatic Evolutions',
      url: 'https://www.amazon.com/dp/B0DLQBQ1XB',
    },
    {
      canonicalName: 'Prismatic Evolutions Accessory Pouch Collection',
      name: 'Pokemon TCG: SV Prismatic Evolutions Accessory Pouch Special Collection',
      type: 'collection-box',
      set: 'Prismatic Evolutions',
      url: 'https://www.amazon.com/dp/B0DLQMWC4H',
    },

    // ── Pokemon 151 (SV3.5) ──
    {
      canonicalName: 'Pokemon 151 ETB',
      name: 'Pokemon TCG: SV 151 Elite Trainer Box',
      type: 'etb',
      set: 'Pokemon 151',
      url: 'https://www.amazon.com/dp/B0C8YN3BY4',
    },
    {
      canonicalName: 'Pokemon 151 Booster Bundle',
      name: 'Pokemon TCG: SV 151 Booster Bundle',
      type: 'bundle',
      set: 'Pokemon 151',
      url: 'https://www.amazon.com/dp/B0C8YBXDYQ',
    },
    {
      canonicalName: 'Pokemon 151 Ultra Premium Collection',
      name: 'Pokemon TCG: SV 151 Ultra Premium Collection',
      type: 'upc',
      set: 'Pokemon 151',
      url: 'https://www.amazon.com/dp/B0C8XNMGWK',
    },

    // ── Perfect Order (ME) ──
    {
      canonicalName: 'Perfect Order ETB',
      name: 'Pokemon TCG: Mega Evolution Perfect Order Elite Trainer Box',
      type: 'etb',
      set: 'Perfect Order',
      url: 'https://www.amazon.com/dp/B0GFZV1ZVV',
    },
    {
      canonicalName: 'Perfect Order Booster Box',
      name: 'Pokemon TCG: Mega Evolution Perfect Order Booster Display Box',
      type: 'booster-box',
      set: 'Perfect Order',
      url: 'https://www.amazon.com/dp/B0GG16Q4X1',
    },
    {
      canonicalName: 'Perfect Order Booster Bundle',
      name: 'Pokemon TCG: Mega Evolution Perfect Order Booster Bundle',
      type: 'bundle',
      set: 'Perfect Order',
      url: 'https://www.amazon.com/dp/B0GG11K25W',
    },

    // ── Destined Rivals (SV10) ──
    {
      canonicalName: 'Destined Rivals ETB',
      name: 'Pokemon TCG: SV Destined Rivals Elite Trainer Box',
      type: 'etb',
      set: 'Destined Rivals',
      url: 'https://www.amazon.com/dp/B0F2BDXW4J',
    },
    {
      canonicalName: 'Destined Rivals Booster Bundle',
      name: 'Pokemon TCG: SV Destined Rivals Booster Bundle',
      type: 'bundle',
      set: 'Destined Rivals',
      url: 'https://www.amazon.com/dp/B0F2BCG1Y5',
    },
    {
      canonicalName: 'Destined Rivals Booster Box',
      name: 'Pokemon TCG: SV Destined Rivals Booster Display Box',
      type: 'booster-box',
      set: 'Destined Rivals',
      url: 'https://www.amazon.com/dp/B0F2GZJ3TZ',
    },

    // ══════════════════════════════════════════════════════════════════════
    //  TIER 2 — Hard to find, active monitoring
    // ══════════════════════════════════════════════════════════════════════

    // ── Ascended Heroes (ME) — user is collecting this set ──
    {
      canonicalName: 'Ascended Heroes ETB',
      name: 'Pokemon TCG: Mega Evolution Ascended Heroes Elite Trainer Box',
      type: 'etb',
      set: 'Ascended Heroes',
      url: 'https://www.amazon.com/dp/B0G3CY83L5',
    },
    {
      canonicalName: 'Ascended Heroes Booster Bundle',
      name: 'Pokemon TCG: Mega Evolution Ascended Heroes Booster Bundle',
      type: 'bundle',
      set: 'Ascended Heroes',
      url: 'https://www.amazon.com/dp/B0G3CV6Z9D',
    },

    // ── Phantasmal Flames (ME) ──
    {
      canonicalName: 'Phantasmal Flames ETB',
      name: 'Pokemon TCG: Mega Evolution Phantasmal Flames Elite Trainer Box',
      type: 'etb',
      set: 'Phantasmal Flames',
      url: 'https://www.amazon.com/dp/B0FPM3LQJ4',
    },
    {
      canonicalName: 'Phantasmal Flames Booster Box',
      name: 'Pokemon TCG: Mega Evolution Phantasmal Flames Booster Display Box',
      type: 'booster-box',
      set: 'Phantasmal Flames',
      url: 'https://www.amazon.com/dp/B0FPLKXJZD',
    },
    {
      canonicalName: 'Mega Charizard X ex UPC',
      name: 'Pokemon TCG: Mega Charizard X ex Ultra Premium Collection',
      type: 'upc',
      set: 'Phantasmal Flames',
      url: 'https://www.amazon.com/dp/B0FPDLTVVV',
    },

    // ── Black Bolt / White Flare (SV10.5) ──
    {
      canonicalName: 'Black Bolt ETB',
      name: 'Pokemon TCG: SV Black Bolt Elite Trainer Box',
      type: 'etb',
      set: 'Black Bolt',
      url: 'https://www.amazon.com/dp/B0F6PTRKTH',
    },
    {
      canonicalName: 'White Flare ETB',
      name: 'Pokemon TCG: SV White Flare Elite Trainer Box',
      type: 'etb',
      set: 'White Flare',
      url: 'https://www.amazon.com/dp/B0F6Q92F5H',
    },

    // ── Paldean Fates (SV4.5) ──
    {
      canonicalName: 'Paldean Fates ETB',
      name: 'Pokemon TCG: SV Paldean Fates Elite Trainer Box',
      type: 'etb',
      set: 'Paldean Fates',
      url: 'https://www.amazon.com/dp/B0CNFSY3Y3',
    },
    {
      canonicalName: 'Paldean Fates Booster Bundle',
      name: 'Pokemon TCG: SV Paldean Fates Booster Bundle',
      type: 'bundle',
      set: 'Paldean Fates',
      url: 'https://www.amazon.com/dp/B0CNFJ4QBP',
    },

    // ══════════════════════════════════════════════════════════════════════
    //  TIER 3 — Worth watching
    // ══════════════════════════════════════════════════════════════════════

    // ── Chaos Rising (ME, pre-order May 22 2026) ──
    {
      canonicalName: 'Chaos Rising ETB',
      name: 'Pokemon TCG: Mega Evolution Chaos Rising Elite Trainer Box',
      type: 'etb',
      set: 'Chaos Rising',
      url: 'https://www.amazon.com/dp/B0GR6N18F6',
    },
    {
      canonicalName: 'Chaos Rising Booster Box',
      name: 'Pokemon TCG: Mega Evolution Chaos Rising Booster Display Box',
      type: 'booster-box',
      set: 'Chaos Rising',
      url: 'https://www.amazon.com/dp/B0GSJMQ3QQ',
    },

    // ── Surging Sparks (SV08) ──
    {
      canonicalName: 'Surging Sparks Booster Box',
      name: 'Pokemon TCG: SV Surging Sparks Booster Display Box',
      type: 'booster-box',
      set: 'Surging Sparks',
      url: 'https://www.amazon.com/dp/B0DFBGYFD3',
    },
    {
      canonicalName: 'Surging Sparks ETB',
      name: 'Pokemon TCG: SV Surging Sparks Elite Trainer Box',
      type: 'etb',
      set: 'Surging Sparks',
      url: 'https://www.amazon.com/dp/B0DDYXQCZ4',
    },

    // ── Journey Together (SV09) ──
    {
      canonicalName: 'Journey Together ETB',
      name: 'Pokemon TCG: SV Journey Together Elite Trainer Box',
      type: 'etb',
      set: 'Journey Together',
      url: 'https://www.amazon.com/dp/B0DSLY7DZZ',
    },
    {
      canonicalName: 'Journey Together Booster Bundle',
      name: 'Pokemon TCG: SV Journey Together Booster Bundle',
      type: 'bundle',
      set: 'Journey Together',
      url: 'https://www.amazon.com/dp/B0DSLXPCJW',
    },
    {
      canonicalName: 'Journey Together Booster Box',
      name: 'Pokemon TCG: SV Journey Together Booster Display Box (36 Packs)',
      type: 'booster-box',
      set: 'Journey Together',
      url: 'https://www.amazon.com/dp/B0F1GXTFGL',
    },
  ],
};
