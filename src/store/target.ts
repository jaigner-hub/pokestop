import type {Store, Product} from './model';
import {config} from '../config';

function extractTcin(url: string): string {
  const match = url.match(/\/A-(\d+)/);
  if (!match) throw new Error(`Cannot extract TCIN from Target URL: ${url}`);
  return match[1];
}

// Constructs a local store availability URL for a Target product.
// The Redsky fulfillment API returns in-store availability JSON when queried with a store_id.
// Response shape to look for: { data: { product: { fulfillment: { store_options: [...] } } } }
// The page HTML at this URL also renders a "Pick it up" section when in stock.
function buildLocalUrl(product: Product, storeId: string): string {
  const tcin = extractTcin(product.url);
  return (
    `https://www.target.com/p/-/A-${tcin}` +
    `?preselect=${tcin}&type=3&storeId=${storeId}`
  );
}

export const target: Store = {
  name: 'target',
  strategy: 'fetch',
  supportsLocalStock: true,
  localStores: [],
  minSleep: config.pageSleepMin,
  maxSleep: config.pageSleepMax,
  buildLocalUrl,
  labels: {
    container: '[data-test="product-details"]',
    inStock: [
      '[data-test="addToCartButton"]',
      '[data-test="shipItButton"]',
      'Add to cart',
    ],
    outOfStock: [
      '[data-test="soldOutButton"]',
      'Out of stock',
      'Sold out',
    ],
    price: '[data-test="product-price"]',
  },
  products: [
    {
      canonicalName: 'Prismatic Evolutions ETB',
      name: 'Pokémon SV Prismatic Evolutions Elite Trainer Box',
      type: 'etb',
      set: 'Prismatic Evolutions',
      url: 'https://www.target.com/p/2024-pok-scarlet-violet-s8-5-elite-trainer-box/-/A-93954435',
    },
    {
      canonicalName: 'Prismatic Evolutions Booster Bundle',
      name: 'Pokémon SV Prismatic Evolutions Booster Bundle',
      type: 'bundle',
      set: 'Prismatic Evolutions',
      url: 'https://www.target.com/p/pok-233-mon-trading-card-game-scarlet-38-violet-prismatic-evolutions-booster-bundle/-/A-93954446',
    },
    {
      canonicalName: 'Surging Sparks ETB',
      name: 'Pokémon SV Surging Sparks Elite Trainer Box',
      type: 'etb',
      set: 'Surging Sparks',
      url: 'https://www.target.com/p/pokemon-trading-card-game-scarlet-38-violet-surging-sparks-elite-trainer-box/-/A-91619922',
    },
    {
      canonicalName: 'Surging Sparks Booster Bundle',
      name: 'Pokémon SV Surging Sparks Booster Bundle',
      type: 'bundle',
      set: 'Surging Sparks',
      url: 'https://www.target.com/p/pokemon-trading-card-game-scarlet-38-violet-surging-sparks-booster-bundle/-/A-91619929',
    },
  ],
};
