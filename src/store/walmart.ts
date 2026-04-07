import type {Store, Product, CheckResult} from './model';
import {config} from '../config';
import nodeFetch from 'node-fetch';
import * as cheerio from 'cheerio';
import {parsePrice} from '../price';

function extractItemId(url: string): string {
  const match = url.match(/\/ip\/[^/]+\/(\d+)/) ?? url.match(/\/ip\/(\d+)/);
  if (!match) throw new Error(`Cannot extract item ID from Walmart URL: ${url}`);
  return match[1];
}

function buildLocalUrl(product: Product, storeId: string): string {
  const itemId = extractItemId(product.url);
  return `https://www.walmart.com/store/${storeId}/product/ip/${itemId}`;
}

// Walmart uses Next.js — all product data is embedded in __NEXT_DATA__ as JSON.
// This is way more reliable than CSS selectors since we get structured data directly.
async function checkWalmartProduct(
  product: Product,
  storeId?: string,
): Promise<CheckResult> {
  const url = storeId ? buildLocalUrl(product, storeId) : product.url;

  const res = await nodeFetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`Walmart HTTP ${res.status}: ${url}`);
  }

  const html = await res.text();

  // Try __NEXT_DATA__ extraction first
  const nextDataResult = extractFromNextData(html);
  if (nextDataResult) return nextDataResult;

  // Fallback to HTML scraping
  return extractFromHtml(html);
}

function extractFromNextData(html: string): CheckResult | null {
  const $ = cheerio.load(html);
  const scriptText = $('script#__NEXT_DATA__').text();
  if (!scriptText) return null;

  try {
    const data = JSON.parse(scriptText);
    const productData = data?.props?.pageProps?.initialData?.data?.product
      ?? data?.props?.pageProps?.initialData?.data?.contentLayout?.modules?.find(
        (m: Record<string, unknown>) => m['type'] === 'ProductHero'
      )?.data?.product;

    if (!productData) return null;

    // Check availability
    let inStock = false;
    const availability = productData.availabilityStatus;
    if (availability) {
      const status = typeof availability === 'string'
        ? availability
        : availability.value ?? availability.display ?? '';
      inStock = status === 'IN_STOCK' || status === 'AVAILABLE' ||
        status.toLowerCase().includes('in stock');
    }

    // Check fulfillment options for pickup availability
    const fulfillment = productData.fulfillmentOptions ?? productData.fulfillment;
    if (Array.isArray(fulfillment)) {
      for (const opt of fulfillment) {
        if (opt.type === 'PICKUP' && opt.availabilityStatus === 'IN_STOCK') {
          inStock = true;
        }
      }
    }

    // Extract price
    let price: number | null = null;
    if (productData.priceInfo?.currentPrice?.price != null) {
      price = productData.priceInfo.currentPrice.price;
    } else if (productData.priceInfo?.currentPrice?.priceString) {
      price = parsePrice(productData.priceInfo.currentPrice.priceString);
    }

    return {inStock, price};
  } catch {
    return null;
  }
}

function extractFromHtml(html: string): CheckResult {
  const $ = cheerio.load(html);
  const text = $('body').text().toLowerCase();

  const inStock = (text.includes('add to cart') || text.includes('pick up today'))
    && !text.includes('out of stock')
    && !text.includes('get in-stock alert');

  let price: number | null = null;
  const priceEl = $('[itemprop="price"]').first().attr('content')
    ?? $('[itemprop="price"]').first().text()
    ?? $('.price-characteristic').first().text();
  if (priceEl) {
    price = parsePrice(priceEl);
  }

  return {inStock, price};
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
  customCheck: checkWalmartProduct,
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
    // ── Prismatic Evolutions ──
    {
      canonicalName: 'Prismatic Evolutions ETB',
      name: 'Pokemon SV Prismatic Evolutions Elite Trainer Box',
      type: 'etb',
      set: 'Prismatic Evolutions',
      url: 'https://www.walmart.com/ip/Pokemon-Scarlet-Violet-Prismatic-Evolutions-Elite-Trainer-Box/13816151308',
    },
    {
      canonicalName: 'Prismatic Evolutions Booster Bundle',
      name: 'Pokemon SV Prismatic Evolutions Booster Bundle',
      type: 'bundle',
      set: 'Prismatic Evolutions',
      url: 'https://www.walmart.com/ip/POKEMON-SV8-5-PRISMATIC-EVO-BST-BUNDLE/14803962651',
    },
    // ── Surging Sparks ──
    {
      canonicalName: 'Surging Sparks Booster Box',
      name: 'Pokemon SV Surging Sparks Booster Display',
      type: 'booster-box',
      set: 'Surging Sparks',
      url: 'https://www.walmart.com/ip/Pok-mon-TCG-Scarlet-Violet-8-Surging-Sparks-Booster-Display/10677066456',
    },
    {
      canonicalName: 'Surging Sparks ETB',
      name: 'Pokemon SV Surging Sparks Elite Trainer Box',
      type: 'etb',
      set: 'Surging Sparks',
      url: 'https://www.walmart.com/ip/Pok-mon-Scarlet-Violet-Surging-Sparks-Elite-Trainer-Box/11478805541',
    },
    // ── Journey Together ──
    {
      canonicalName: 'Journey Together ETB',
      name: 'Pokemon SV Journey Together Elite Trainer Box',
      type: 'etb',
      set: 'Journey Together',
      url: 'https://www.walmart.com/ip/Pokemon-TCG-Scarlet-Violet-Journey-Together-Elite-Trainer-Box/5265736383',
    },
    {
      canonicalName: 'Journey Together Booster Bundle',
      name: 'Pokemon SV Journey Together Booster Bundle',
      type: 'bundle',
      set: 'Journey Together',
      url: 'https://www.walmart.com/ip/Pokemon-TCG-Scarlet-Violet-Journey-Together-Booster-Bundle/5265736384',
    },
  ],
};
