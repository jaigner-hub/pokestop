import nodeFetch from 'node-fetch';
import type {Store, Product, CheckResult} from './model';
import {config} from '../config';
import {parsePrice} from '../price';
import {logger} from '../logger';

function extractSkuId(url: string): string {
  const match = url.match(/\/(\d+)\.p/);
  if (!match) throw new Error(`Cannot extract SKU ID from Best Buy URL: ${url}`);
  return match[1];
}

function buildLocalUrl(product: Product, storeId: string): string {
  const skuId = extractSkuId(product.url);
  return `${product.url.split('?')[0]}?skuId=${skuId}&storeId=${storeId}`;
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];

// Best Buy Falcor "button state" API — returns stock status as JSON
async function checkBestBuyApi(product: Product): Promise<CheckResult> {
  const skuId = extractSkuId(product.url);
  const paths = JSON.stringify([
    ['shop', 'buttonstate', 'v5', 'item', 'skus', skuId,
     'conditions', 'NONE', 'destinationZipCode', config.zipCode ?? '10001',
     'storeId', ' ', 'context', 'cyp', 'addAll', 'false'],
  ]);
  const url = `https://www.bestbuy.com/api/tcfb/model.json?paths=${encodeURIComponent(paths)}&method=get`;

  const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const res = await nodeFetch(url, {
    headers: {
      'User-Agent': ua,
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    timeout: config.pageTimeout,
  });

  if (!res.ok) {
    throw new Error(`Best Buy API HTTP ${res.status} for SKU ${skuId}`);
  }

  const body = await res.text();

  // Try structured JSON parse first
  try {
    const json = JSON.parse(body);
    const skus = json?.jsonGraph?.shop?.buttonstate?.v5?.item?.skus;
    if (skus) {
      const skuData = skus[skuId];
      const infos = skuData?.buttonStateResponseInfos ?? skuData?.conditions?.NONE?.destinationZipCode?.[config.zipCode ?? '10001']?.storeId?.[' ']?.context?.cyp?.addAll?.false?.buttonStateResponseInfos;
      if (infos && infos.length > 0) {
        const info = infos[0];
        const buttonState: string = info.buttonState ?? info?.value?.buttonState ?? '';
        const inStock = buttonState === 'ADD_TO_CART' || buttonState === 'PRE_ORDER';
        logger.debug(`[bestbuy] SKU ${skuId} buttonState=${buttonState}`);
        return {inStock, price: null};
      }
    }
  } catch {
    // JSON parse failed, try string matching
  }

  // Fallback: search raw response for buttonState strings
  const inStock = body.includes('"ADD_TO_CART"') || body.includes('"PRE_ORDER"');
  const soldOut = body.includes('"SOLD_OUT"') || body.includes('"COMING_SOON"');
  if (inStock || soldOut) {
    return {inStock, price: null};
  }

  // Try to extract price from response
  const priceMatch = body.match(/"currentPrice":([\d.]+)/);
  const price = priceMatch ? parsePrice(priceMatch[1]) : null;

  logger.warn(`[bestbuy] Could not parse buttonState for SKU ${skuId}, treating as out of stock`);
  return {inStock: false, price};
}

export const bestbuy: Store = {
  name: 'bestbuy',
  strategy: 'custom',
  supportsLocalStock: true,
  localStores: [],
  minSleep: config.pageSleepMin,
  maxSleep: config.pageSleepMax,
  headers: {
    'Accept-Language': 'en-US,en;q=0.9',
  },
  buildLocalUrl,
  customChecker: checkBestBuyApi,
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
    price: '.priceView-customer-price span:first-child, [data-testid="customer-price"] span, .pricing-price__regular-price span',
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
