import type {Store, Product} from './model';
import {config} from '../config';

function extractItemId(url: string): string {
  const match = url.match(/\/ip\/[^/]+\/(\d+)/);
  if (!match) throw new Error(`Cannot extract item ID from Walmart URL: ${url}`);
  return match[1];
}

function buildLocalUrl(product: Product, storeId: string): string {
  const itemId = extractItemId(product.url);
  return `https://www.walmart.com/store/${storeId}/product/ip/${itemId}`;
}

export const walmart: Store = {
  name: 'walmart',
  strategy: 'fetch',
  supportsLocalStock: true,
  localStores: [],
  minSleep: config.pageSleepMin,
  maxSleep: config.pageSleepMax,
  headers: {
    'Accept-Language': 'en-US,en;q=0.9',
  },
  buildLocalUrl,
  labels: {
    container: '[data-testid="product-listing"], [itemtype="http://schema.org/Product"]',
    inStock: [
      'Add to cart',
      '[data-tl-id*="add-to-cart"]',
      'Pick up today',
    ],
    outOfStock: [
      'Out of stock',
      'Get in-stock alert',
      'unavailable',
    ],
    price: '[itemprop="price"], .price-characteristic',
  },
  products: [
    {
      canonicalName: 'Prismatic Evolutions ETB',
      name: 'Pokémon SV Prismatic Evolutions Elite Trainer Box',
      type: 'etb',
      set: 'Prismatic Evolutions',
      url: 'https://www.walmart.com/ip/Pokemon-Scarlet-Violet-Prismatic-Evolutions-Elite-Trainer-Box/13816151308',
    },
    {
      canonicalName: 'Prismatic Evolutions Booster Bundle',
      name: 'Pokémon SV Prismatic Evolutions Booster Bundle',
      type: 'bundle',
      set: 'Prismatic Evolutions',
      url: 'https://www.walmart.com/ip/POKEMON-SV8-5-PRISMATIC-EVO-BST-BUNDLE/14803962651',
    },
    {
      canonicalName: 'Surging Sparks Booster Box',
      name: 'Pokémon SV Surging Sparks Booster Display',
      type: 'booster-box',
      set: 'Surging Sparks',
      url: 'https://www.walmart.com/ip/Pok-mon-TCG-Scarlet-Violet-8-Surging-Sparks-Booster-Display/10677066456',
    },
    {
      canonicalName: 'Surging Sparks ETB',
      name: 'Pokémon SV Surging Sparks Elite Trainer Box',
      type: 'etb',
      set: 'Surging Sparks',
      url: 'https://www.walmart.com/ip/Pok-mon-Scarlet-Violet-Surging-Sparks-Elite-Trainer-Box/11478805541',
    },
  ],
};
