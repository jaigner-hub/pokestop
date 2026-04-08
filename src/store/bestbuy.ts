import type {Store, Product} from './model';
import {config} from '../config';

function extractSkuId(url: string): string {
  const match = url.match(/\/(\d+)\.p/);
  if (!match) throw new Error(`Cannot extract SKU ID from Best Buy URL: ${url}`);
  return match[1];
}

// Best Buy shows store pickup availability when storeId query param is set.
// The page renders a "Pickup" section when the item is available at that location.
function buildLocalUrl(product: Product, storeId: string): string {
  const skuId = extractSkuId(product.url);
  return `${product.url.split('?')[0]}?skuId=${skuId}&storeId=${storeId}`;
}

export const bestbuy: Store = {
  name: 'bestbuy',
  strategy: 'puppeteer',
  supportsLocalStock: true,
  localStores: [],
  minSleep: config.pageSleepMin,
  maxSleep: config.pageSleepMax,
  headers: {
    'Accept-Language': 'en-US,en;q=0.9',
  },
  buildLocalUrl,
  labels: {
    container: '.shop-fulfillment-button-wrapper, .fulfillment-fulfillment-summary',
    inStock: [
      '.add-to-cart-button:not([disabled])',
      'Add to Cart',
    ],
    outOfStock: [
      'Sold Out',
      'Coming Soon',
      'Unavailable',
    ],
    price: '.priceView-customer-price span:first-child',
  },
  products: [
    {
      canonicalName: 'Prismatic Evolutions ETB',
      name: 'Pokémon SV Prismatic Evolutions Elite Trainer Box',
      type: 'etb',
      set: 'Prismatic Evolutions',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-prismatic-evolutions-elite-trainer-box/6606082.p?skuId=6606082',
    },
    {
      canonicalName: 'Prismatic Evolutions Booster Bundle',
      name: 'Pokémon SV Prismatic Evolutions Booster Bundle',
      type: 'bundle',
      set: 'Prismatic Evolutions',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-prismatic-evolutions-booster-bundle/6608206.p?skuId=6608206',
    },
    {
      canonicalName: 'Surging Sparks Booster Box',
      name: 'Pokémon SV Surging Sparks Booster Box (36 Packs)',
      type: 'booster-box',
      set: 'Surging Sparks',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-surging-sparks-booster-box-36-packs/6598558.p?skuId=6598558',
    },
    {
      canonicalName: 'Surging Sparks ETB',
      name: 'Pokémon SV Surging Sparks Elite Trainer Box',
      type: 'etb',
      set: 'Surging Sparks',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-surging-sparks-elite-trainer-box/6598557.p?skuId=6598557',
    },
    {
      canonicalName: 'Ascended Heroes ETB',
      name: 'Pokémon Mega Evolution Ascended Heroes Elite Trainer Box',
      type: 'etb',
      set: 'Ascended Heroes',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-mega-evolution-ascended-heroes-elite-trainer-box/12228720.p?skuId=12228720',
    },
    {
      canonicalName: 'Black Bolt ETB',
      name: 'Pokémon SV Black Bolt Elite Trainer Box',
      type: 'etb',
      set: 'Black Bolt',
      url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-black-bolt-elite-trainer-box/6632397.p?skuId=6632397',
    },
  ],
};
