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
    container: '.product-details',
    inStock: [
      'Add to Cart',
      '.add-to-cart__button:not([disabled])',
    ],
    outOfStock: [
      'Sold Out',
      'Out of Stock',
    ],
    price: '.product-listing__price',
  },
  products: [
    {
      canonicalName: 'Prismatic Evolutions ETB',
      name: 'SV Prismatic Evolutions Elite Trainer Box',
      type: 'etb',
      set: 'Prismatic Evolutions',
      url: 'https://www.tcgplayer.com/product/593355/pokemon-sv-prismatic-evolutions-prismatic-evolutions-elite-trainer-box',
    },
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
  ],
};
