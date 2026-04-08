import type {Store} from './model';
import {config} from '../config';

export const tcgplayer: Store = {
  name: 'tcgplayer',
  strategy: 'puppeteer',
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
    price: '.spotlight__price, .price-points__upper__price',
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
    {
      canonicalName: 'Ascended Heroes ETB',
      name: 'ME Ascended Heroes Elite Trainer Box',
      type: 'etb',
      set: 'Ascended Heroes',
      url: 'https://www.tcgplayer.com/product/668496/pokemon-me-ascended-heroes-ascended-heroes-elite-trainer-box',
    },
    {
      canonicalName: 'Black Bolt ETB',
      name: 'SV Black Bolt Elite Trainer Box',
      type: 'etb',
      set: 'Black Bolt',
      url: 'https://www.tcgplayer.com/product/630686/pokemon-sv-black-bolt-black-bolt-elite-trainer-box',
    },
  ],
};
