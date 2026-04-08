import type {Browser} from 'puppeteer';
import type {Store, Product, CheckResult} from './model';
import {config} from '../config';
import {parsePrice} from '../price';
import {logger} from '../logger';

function extractItemId(url: string): string {
  const match = url.match(/\/ip\/[^/]+\/(\d+)/);
  if (!match) throw new Error(`Cannot extract item ID from Walmart URL: ${url}`);
  return match[1];
}

function buildLocalUrl(product: Product, storeId: string): string {
  const itemId = extractItemId(product.url);
  return `https://www.walmart.com/store/${storeId}/product/ip/${itemId}`;
}

// Intercept Walmart's own XHR responses during page load to get structured data
async function checkWalmartPuppeteer(product: Product, browser?: Browser): Promise<CheckResult> {
  if (!browser) throw new Error('Browser required for walmart');
  const page = await browser.newPage();
  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );

    let apiData: Record<string, unknown> | null = null;

    // Listen for XHR responses that contain product data
    page.on('response', async (response) => {
      const url = response.url();
      if (apiData) return; // already captured
      try {
        if (url.includes('/terra-firma/') || url.includes('/orchestra/') || url.includes('/ip/api/')) {
          const ct = response.headers()['content-type'] ?? '';
          if (ct.includes('json')) {
            const json = await response.json();
            if (json && typeof json === 'object') {
              apiData = json as Record<string, unknown>;
            }
          }
        }
      } catch {
        // response may have been consumed or failed
      }
    });

    await page.goto(product.url, {
      waitUntil: 'networkidle2',
      timeout: config.pageTimeout,
    });

    // Give extra time for XHR to complete
    await new Promise(r => setTimeout(r, 3000));

    // Try to parse intercepted API data
    if (apiData) {
      const result = parseWalmartApiData(apiData);
      if (result) {
        logger.debug(`[walmart] Got API data for ${product.canonicalName}: inStock=${result.inStock}`);
        return result;
      }
    }

    // Fallback: try __NEXT_DATA__ or initial state
    const nextData = await page.evaluate(() => {
      const el = document.querySelector('script#__NEXT_DATA__');
      if (el) return el.textContent;
      // Walmart also embeds state in window.__PRELOADED_STATE__
      try {
        return JSON.stringify((window as unknown as Record<string, unknown>).__PRELOADED_STATE__);
      } catch { return null; }
    });

    if (nextData) {
      try {
        const json = JSON.parse(nextData);
        const result = parseWalmartPageData(json);
        if (result) return result;
      } catch { /* parse failed */ }
    }

    // Last fallback: scrape the rendered page
    const html = await page.content();
    return parseWalmartHtml(html);
  } finally {
    await page.close();
  }
}

function parseWalmartApiData(data: Record<string, unknown>): CheckResult | null {
  const str = JSON.stringify(data);

  // Look for availability status fields
  const availMatch = str.match(/"availabilityStatus"\s*:\s*"([^"]+)"/);
  const priceMatch = str.match(/"priceInfo"[^}]*"currentPrice"[^}]*"price"\s*:\s*([\d.]+)/);
  const altPriceMatch = str.match(/"currentPrice"\s*:\s*([\d.]+)/);

  if (availMatch) {
    const status = availMatch[1];
    const inStock = status === 'IN_STOCK' || status === 'AVAILABLE';
    const price = parsePrice(priceMatch?.[1] ?? altPriceMatch?.[1] ?? null);
    return {inStock, price};
  }

  // Look for add-to-cart eligibility
  const cartMatch = str.match(/"canAddToCart"\s*:\s*(true|false)/);
  if (cartMatch) {
    const price = parsePrice(priceMatch?.[1] ?? altPriceMatch?.[1] ?? null);
    return {inStock: cartMatch[1] === 'true', price};
  }

  return null;
}

function parseWalmartPageData(data: Record<string, unknown>): CheckResult | null {
  const str = JSON.stringify(data);
  return parseWalmartApiData(data) ?? parseWalmartApiData(JSON.parse(str));
}

function parseWalmartHtml(html: string): CheckResult {
  const lc = html.toLowerCase();
  const outOfStock = lc.includes('out of stock') || lc.includes('get in-stock alert');
  const inStock = !outOfStock && (lc.includes('add to cart') || lc.includes('pick up today'));

  const priceMatch = html.match(/\$([\d,]+\.\d{2})/);
  const price = priceMatch ? parsePrice(priceMatch[0]) : null;

  return {inStock, price};
}

export const walmart: Store = {
  name: 'walmart',
  strategy: 'custom',
  supportsLocalStock: true,
  localStores: [],
  minSleep: config.pageSleepMin,
  maxSleep: config.pageSleepMax,
  headers: {
    'Accept-Language': 'en-US,en;q=0.9',
  },
  buildLocalUrl,
  customChecker: checkWalmartPuppeteer,
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
    price: '[itemprop="price"], .price-characteristic, [data-automation-id="product-price"], [data-testid="price-wrap"] span',
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
    {
      canonicalName: 'Ascended Heroes ETB',
      name: 'Pokémon Mega Evolution Ascended Heroes Elite Trainer Box',
      type: 'etb',
      set: 'Ascended Heroes',
      url: 'https://www.walmart.com/ip/Pok-mon-Trading-Card-Game-Mega-Evolution-Ascended-Heroes-Elite-Trainer-Box/18710966734',
    },
    {
      canonicalName: 'Black Bolt ETB',
      name: 'Pokémon SV Black Bolt Elite Trainer Box',
      type: 'etb',
      set: 'Black Bolt',
      url: 'https://www.walmart.com/ip/Pokemon-TCG-Scarlet-Violet-10-5-Black-Bolt-Elite-Trainer-Box-9-Packs-Promo-Card/16498668973',
    },
  ],
};
