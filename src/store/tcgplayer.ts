import type {Store} from './model';
import {config} from '../config';

export const tcgplayer: Store = {
  name: 'tcgplayer',
  strategy: 'fetch',
  supportsLocalStock: false,
  localStores: [],
  minSleep: config.pageSleepMin,
  maxSleep: config.pageSleepMax,
  labels: {
    container: 'body',
    inStock: [
      'Add to Cart',
      'Listings',
      '.add-to-cart__button:not([disabled])',
    ],
    outOfStock: [
      'Sold Out',
      'Out of Stock',
      'No Listings',
    ],
    price: '.price-point__data, .product-listing__price, .spotlight__price',
  },
  products: [
    // ── Prismatic Evolutions ──
    {
      canonicalName: 'Prismatic Evolutions ETB',
      name: 'SV Prismatic Evolutions Elite Trainer Box',
      type: 'etb',
      set: 'Prismatic Evolutions',
      url: 'https://www.tcgplayer.com/product/593355/pokemon-sv-prismatic-evolutions-prismatic-evolutions-elite-trainer-box',
    },
    // ── Surging Sparks ──
    {
      canonicalName: 'Surging Sparks Booster Box',
      name: 'SV Surging Sparks Booster Box',
      type: 'booster-box',
      set: 'Surging Sparks',
      url: 'https://www.tcgplayer.com/product/565606/pokemon-sv08-surging-sparks-surging-sparks-booster-box',
    },
    {
      canonicalName: 'Surging Sparks ETB',
      name: 'SV Surging Sparks Elite Trainer Box',
      type: 'etb',
      set: 'Surging Sparks',
      url: 'https://www.tcgplayer.com/product/565630/pokemon-sv08-surging-sparks-surging-sparks-elite-trainer-box',
    },
    // ── Prismatic Evolutions (more SKUs) ──
    {
      canonicalName: 'Prismatic Evolutions Booster Bundle',
      name: 'SV Prismatic Evolutions Booster Bundle',
      type: 'bundle',
      set: 'Prismatic Evolutions',
      url: 'https://www.tcgplayer.com/product/600518/pokemon-sv-prismatic-evolutions-prismatic-evolutions-booster-bundle',
    },
    // ── Journey Together ──
    {
      canonicalName: 'Journey Together ETB',
      name: 'SV Journey Together Elite Trainer Box',
      type: 'etb',
      set: 'Journey Together',
      url: 'https://www.tcgplayer.com/product/610930/pokemon-sv09-journey-together-journey-together-elite-trainer-box',
    },
    {
      canonicalName: 'Journey Together Booster Box',
      name: 'SV Journey Together Booster Box',
      type: 'booster-box',
      set: 'Journey Together',
      url: 'https://www.tcgplayer.com/product/610931/pokemon-sv09-journey-together-journey-together-booster-box',
    },
    {
      canonicalName: 'Journey Together Booster Bundle',
      name: 'SV Journey Together Booster Bundle',
      type: 'bundle',
      set: 'Journey Together',
      url: 'https://www.tcgplayer.com/product/610953/pokemon-sv09-journey-together-journey-together-booster-bundle',
    },
  ],
};
