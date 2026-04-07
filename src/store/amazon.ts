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
    // ── Prismatic Evolutions ──
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
    // ── Surging Sparks ──
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
    // ── Journey Together ──
    {
      canonicalName: 'Journey Together ETB',
      name: 'Pokemon TCG: SV Journey Together Elite Trainer Box',
      type: 'etb',
      set: 'Journey Together',
      url: 'https://www.amazon.com/dp/B0DT12WHCF',
    },
    {
      canonicalName: 'Journey Together Booster Bundle',
      name: 'Pokemon TCG: SV Journey Together Booster Bundle',
      type: 'bundle',
      set: 'Journey Together',
      url: 'https://www.amazon.com/dp/B0DT141TM3',
    },
  ],
};
