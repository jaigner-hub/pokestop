import type {Store, Product} from './model';
import {config} from '../config';

// GameStop uses Cloudflare WAF + client-side React rendering.
// Plain fetch returns empty HTML shells. Must use Puppeteer.
function buildLocalUrl(product: Product, storeId: string): string {
  const base = product.url.split('?')[0];
  return `${base}?selectedStore=${storeId}`;
}

export const gamestop: Store = {
  name: 'gamestop',
  strategy: 'puppeteer',  // Cloudflare blocks plain fetch
  supportsLocalStock: true,
  localStores: [],
  minSleep: config.pageSleepMin * 1.5,  // Be a bit gentler with Puppeteer
  maxSleep: config.pageSleepMax * 1.5,
  buildLocalUrl,
  labels: {
    container: 'body',  // Broader container since CSR might render differently
    inStock: [
      'Add to Cart',
      '.add-to-cart:not([disabled])',
      'In Store Only',
      'Buy Now',
    ],
    outOfStock: [
      'Not Available',
      'Out of Stock',
      'Pre-order',
      'Unavailable',
    ],
    price: '.actual-price, .product-price .price, [data-testid="price"]',
  },
  products: [
    // ── Prismatic Evolutions ──
    {
      canonicalName: 'Prismatic Evolutions ETB',
      name: 'Pokemon TCG Prismatic Evolutions Elite Trainer Box',
      type: 'etb',
      set: 'Prismatic Evolutions',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-prismatic-evolutions-elite-trainer-box/417631.html',
    },
    {
      canonicalName: 'Prismatic Evolutions Booster Bundle',
      name: 'Pokemon TCG Prismatic Evolutions Booster Bundle',
      type: 'bundle',
      set: 'Prismatic Evolutions',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-prismatic-evolutions-booster-bundle/20018824.html',
    },
    // ── Surging Sparks ──
    {
      canonicalName: 'Surging Sparks Booster Box',
      name: 'Pokemon TCG SV Surging Sparks Booster Box (36 Count)',
      type: 'booster-box',
      set: 'Surging Sparks',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-scarlet-and-violet-surging-sparks-booster-box-36-count/20015279.html',
    },
    {
      canonicalName: 'Surging Sparks ETB',
      name: 'Pokemon TCG SV Surging Sparks Elite Trainer Box',
      type: 'etb',
      set: 'Surging Sparks',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-scarlet-and-violet-surging-sparks-elite-trainer-box/20015259.html',
    },
    // ── Journey Together ──
    {
      canonicalName: 'Journey Together ETB',
      name: 'Pokemon TCG SV Journey Together Elite Trainer Box',
      type: 'etb',
      set: 'Journey Together',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-scarlet-violet-journey-together-elite-trainer-box/20022103.html',
    },
  ],
};
