import type {Store} from './model';
import {config} from '../config';

export const pokemoncenter: Store = {
  name: 'pokemoncenter',
  strategy: 'puppeteer',
  supportsLocalStock: false,
  localStores: [],
  minSleep: config.pageSleepMin * 2, // Be gentler — official store + Cloudflare
  maxSleep: config.pageSleepMax * 2,
  labels: {
    container: 'body',  // Broad container since SPA rendering varies
    inStock: [
      'Add to Cart',
      'Add to Bag',
      '.add-to-cart:not([disabled])',
    ],
    outOfStock: [
      'Out of Stock',
      'Notify Me',
      'Sold Out',
      '.notify-me-button',
    ],
    price: '.product-price, [data-testid="price"]',
  },
  products: [
    // ── Prismatic Evolutions ──
    {
      canonicalName: 'Prismatic Evolutions ETB (PC Exclusive)',
      name: 'Prismatic Evolutions Pokemon Center Elite Trainer Box',
      type: 'etb',
      set: 'Prismatic Evolutions',
      url: 'https://www.pokemoncenter.com/product/100-10351/pokemon-tcg-scarlet-and-violet-prismatic-evolutions-pokemon-center-elite-trainer-box',
    },
    // ── Surging Sparks ──
    {
      canonicalName: 'Surging Sparks ETB (PC Exclusive)',
      name: 'Surging Sparks Pokemon Center Elite Trainer Box',
      type: 'etb',
      set: 'Surging Sparks',
      url: 'https://www.pokemoncenter.com/product/100-10307/pokemon-tcg-scarlet-and-violet-surging-sparks-pokemon-center-elite-trainer-box',
    },
    // ── Journey Together ──
    {
      canonicalName: 'Journey Together ETB (PC Exclusive)',
      name: 'Journey Together Pokemon Center Elite Trainer Box',
      type: 'etb',
      set: 'Journey Together',
      url: 'https://www.pokemoncenter.com/product/100-10356/pokemon-tcg-scarlet-and-violet-journey-together-pokemon-center-elite-trainer-box',
    },
    {
      canonicalName: 'Journey Together Booster Bundle',
      name: 'Journey Together Booster Bundle (6 Packs)',
      type: 'bundle',
      set: 'Journey Together',
      url: 'https://www.pokemoncenter.com/product/100-10341/pokemon-tcg-scarlet-and-violet-journey-together-booster-bundle-6-packs',
    },
  ],
};
