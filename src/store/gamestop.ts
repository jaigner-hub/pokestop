import type {Browser} from 'puppeteer';
import type {Store, Product, CheckResult} from './model';
import {config} from '../config';
import {parsePrice} from '../price';
import {logger} from '../logger';

function buildLocalUrl(product: Product, storeId: string): string {
  const base = product.url.split('?')[0];
  return `${base}?selectedStore=${storeId}`;
}

// Intercept GameStop's Demandware/SFCC XHR calls for structured product data
async function checkGameStopPuppeteer(product: Product, browser?: Browser): Promise<CheckResult> {
  if (!browser) throw new Error('Browser required for gamestop');
  const page = await browser.newPage();
  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );

    let apiData: Record<string, unknown> | null = null;

    // Intercept Demandware / SFCC API responses
    page.on('response', async (response) => {
      const url = response.url();
      if (apiData) return;
      try {
        if (
          url.includes('demandware.store') ||
          url.includes('Product-Variation') ||
          url.includes('Product-Show') ||
          url.includes('Availability') ||
          url.includes('/api/')
        ) {
          const ct = response.headers()['content-type'] ?? '';
          if (ct.includes('json')) {
            const json = await response.json();
            if (json && typeof json === 'object') {
              apiData = json as Record<string, unknown>;
            }
          }
        }
      } catch { /* consumed or failed */ }
    });

    await page.goto(product.url, {
      waitUntil: 'networkidle2',
      timeout: config.pageTimeout,
    });

    await new Promise(r => setTimeout(r, 3000));

    // Try intercepted API data
    if (apiData) {
      const result = parseGameStopApiData(apiData);
      if (result) {
        logger.debug(`[gamestop] Got API data for ${product.canonicalName}: inStock=${result.inStock}`);
        return result;
      }
    }

    // Fallback: check for structured data in the page
    const pageData = await page.evaluate(() => {
      // GameStop sometimes embeds product data in a script tag
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent ?? '');
          if (data['@type'] === 'Product' || data.availability) {
            return data;
          }
        } catch { /* skip */ }
      }
      return null;
    });

    if (pageData) {
      const result = parseLdJson(pageData);
      if (result) return result;
    }

    // Last fallback: scrape rendered HTML
    const html = await page.content();
    return parseGameStopHtml(html);
  } finally {
    await page.close();
  }
}

function parseGameStopApiData(data: Record<string, unknown>): CheckResult | null {
  const str = JSON.stringify(data);

  // Demandware availability patterns
  const availMatch = str.match(/"availability"\s*:\s*\{[^}]*"status"\s*:\s*"([^"]+)"/);
  const inStockMatch = str.match(/"inStock"\s*:\s*(true|false)/);
  const readyMatch = str.match(/"readyToOrder"\s*:\s*(true|false)/);
  const priceMatch = str.match(/"price"\s*:\s*([\d.]+)/);

  if (availMatch) {
    const inStock = availMatch[1] === 'IN_STOCK' || availMatch[1] === 'AVAILABLE';
    return {inStock, price: parsePrice(priceMatch?.[1] ?? null)};
  }

  if (inStockMatch || readyMatch) {
    const inStock = inStockMatch?.[1] === 'true' || readyMatch?.[1] === 'true';
    return {inStock, price: parsePrice(priceMatch?.[1] ?? null)};
  }

  return null;
}

function parseLdJson(data: Record<string, unknown>): CheckResult | null {
  const offers = data.offers as Record<string, unknown> | undefined;
  if (!offers) return null;

  const availability = String(offers.availability ?? '');
  const inStock = availability.includes('InStock') || availability.includes('PreOrder');
  const price = parsePrice(String(offers.price ?? ''));
  return {inStock, price};
}

function parseGameStopHtml(html: string): CheckResult {
  const lc = html.toLowerCase();
  const outOfStock = lc.includes('not available') || lc.includes('out of stock');
  const inStock = !outOfStock && (lc.includes('add to cart') || lc.includes('in store only'));

  const priceMatch = html.match(/\$([\d,]+\.\d{2})/);
  const price = priceMatch ? parsePrice(priceMatch[0]) : null;

  return {inStock, price};
}

export const gamestop: Store = {
  name: 'gamestop',
  strategy: 'custom',
  supportsLocalStock: true,
  localStores: [],
  minSleep: config.pageSleepMin,
  maxSleep: config.pageSleepMax,
  buildLocalUrl,
  customChecker: checkGameStopPuppeteer,
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
    price: '.actual-price, .product-price .price, [data-testid="price"], .price-module span',
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
    {
      canonicalName: 'Ascended Heroes ETB',
      name: 'Pokémon TCG Mega Evolution Ascended Heroes Elite Trainer Box',
      type: 'etb',
      set: 'Ascended Heroes',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-ascended-heroes-elite-trainer-box/20030564.html',
    },
    {
      canonicalName: 'Black Bolt ETB',
      name: 'Pokémon TCG SV Black Bolt Elite Trainer Box',
      type: 'etb',
      set: 'Black Bolt',
      url: 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-black-bolt-elite-trainer-box/20021662.html',
    },
  ],
};
