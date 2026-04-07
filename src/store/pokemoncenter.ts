import type {Store} from './model';
import {config} from '../config';

export const pokemoncenter: Store = {
  name: 'pokemoncenter',
  strategy: 'puppeteer',
  supportsLocalStock: false,
  localStores: [],
  minSleep: config.pageSleepMin * 2, // Be gentler — official store
  maxSleep: config.pageSleepMax * 2,
  labels: {
    container: '.product-detail',
    inStock: [
      'Add to Cart',
      '.add-to-cart:not([disabled])',
    ],
    outOfStock: [
      'Out of Stock',
      'Notify Me',
      '.notify-me-button',
    ],
    price: '.product-price',
  },
  products: [
    {
      canonicalName: 'Prismatic Evolutions ETB',
      name: 'Prismatic Evolutions Pokemon Center Elite Trainer Box',
      type: 'etb',
      set: 'Prismatic Evolutions',
      url: 'https://www.pokemoncenter.com/product/100-10351/pokemon-tcg-scarlet-and-violet-prismatic-evolutions-pokemon-center-elite-trainer-box',
    },
    {
      canonicalName: 'Surging Sparks ETB',
      name: 'Surging Sparks Pokemon Center Elite Trainer Box',
      type: 'etb',
      set: 'Surging Sparks',
      url: 'https://www.pokemoncenter.com/product/100-10307/pokemon-tcg-scarlet-and-violet-surging-sparks-pokemon-center-elite-trainer-box',
    },
  ],
};
