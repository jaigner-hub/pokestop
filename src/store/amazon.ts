import type {Store} from './model';
import {config} from '../config';

export const amazon: Store = {
  name: 'amazon',
  strategy: 'puppeteer',
  supportsLocalStock: false,
  localStores: [],
  minSleep: config.pageSleepMin,
  maxSleep: config.pageSleepMax,
  headers: {
    'Accept-Language': 'en-US,en;q=0.9',
  },
  labels: {
    container: '#centerCol',
    inStock: [
      '#add-to-cart-button',
      '#buy-now-button',
      'In Stock',
    ],
    outOfStock: [
      'Currently unavailable',
      'out of stock',
      '#outOfStock',
    ],
    price: '.a-price .a-offscreen',
  },
  products: [
    {
      canonicalName: 'Prismatic Evolutions ETB',
      name: 'Pokémon TCG: SV Prismatic Evolutions Elite Trainer Box',
      type: 'etb',
      set: 'Prismatic Evolutions',
      url: 'https://www.amazon.com/dp/B0DLPL7LC5',
    },
    {
      canonicalName: 'Prismatic Evolutions Booster Bundle',
      name: 'Pokémon TCG: SV Prismatic Evolutions Booster Bundle',
      type: 'bundle',
      set: 'Prismatic Evolutions',
      url: 'https://www.amazon.com/dp/B0DN98RVZM',
    },
    {
      canonicalName: 'Surging Sparks Booster Box',
      name: 'Pokémon TCG: SV Surging Sparks Booster Display Box',
      type: 'booster-box',
      set: 'Surging Sparks',
      url: 'https://www.amazon.com/dp/B0DFBGYFD3',
    },
    {
      canonicalName: 'Surging Sparks ETB',
      name: 'Pokémon TCG: SV Surging Sparks Elite Trainer Box',
      type: 'etb',
      set: 'Surging Sparks',
      url: 'https://www.amazon.com/dp/B0DDYXQCZ4',
    },
    {
      canonicalName: 'Ascended Heroes ETB',
      name: 'Pokémon TCG: Mega Evolution Ascended Heroes Elite Trainer Box',
      type: 'etb',
      set: 'Ascended Heroes',
      url: 'https://www.amazon.com/dp/B0G3CY83L5',
    },
    {
      canonicalName: 'Black Bolt ETB',
      name: 'Pokémon TCG: SV Black Bolt Elite Trainer Box',
      type: 'etb',
      set: 'Black Bolt',
      url: 'https://www.amazon.com/dp/B0F6PTRKTH',
    },
  ],
};
