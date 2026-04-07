import type {Store, Product} from './model';
import {config} from '../config';

// GameStop shows store-specific availability when selectedStore query param is set.
function buildLocalUrl(product: Product, storeId: string): string {
  const base = product.url.split('?')[0];
  return `${base}?selectedStore=${storeId}`;
}

export const gamestop: Store = {
  name: 'gamestop',
  strategy: 'fetch',
  supportsLocalStock: true,
  localStores: [],
  minSleep: config.pageSleepMin,
  maxSleep: config.pageSleepMax,
  buildLocalUrl,
  labels: {
    container: '.product-pdp-details, [data-pdp]',
    inStock: [
      'Add to Cart',
      '.add-to-cart:not([disabled])',
      'In Store Only',
    ],
    outOfStock: [
      'Not Available',
      'Out of Stock',
      'Pre-order',
    ],
    price: '.actual-price, .product-price .price',
  },
  products: [
    {
      canonicalName: 'Prismatic Evolutions ETB',
      name: 'Pokémon TCG Prismatic Evolutions Elite Trainer Box',
      type: 'etb',
      set: 'Prismatic Evolutions',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-prismatic-evolutions-elite-trainer-box/417631.html',
    },
    {
      canonicalName: 'Prismatic Evolutions Booster Bundle',
      name: 'Pokémon TCG Prismatic Evolutions Booster Bundle',
      type: 'bundle',
      set: 'Prismatic Evolutions',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-prismatic-evolutions-booster-bundle/20018824.html',
    },
    {
      canonicalName: 'Surging Sparks Booster Box',
      name: 'Pokémon TCG SV Surging Sparks Booster Box (36 Count)',
      type: 'booster-box',
      set: 'Surging Sparks',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-scarlet-and-violet-surging-sparks-booster-box-36-count/20015279.html',
    },
    {
      canonicalName: 'Surging Sparks ETB',
      name: 'Pokémon TCG SV Surging Sparks Elite Trainer Box',
      type: 'etb',
      set: 'Surging Sparks',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-scarlet-and-violet-surging-sparks-elite-trainer-box/20015259.html',
    },
  ],
};
