import type {Browser} from 'puppeteer';
import type {Store, Product, CheckResult} from './model';
import {config} from '../config';
import {parsePrice} from '../price';
import {logger} from '../logger';

// Pokémon Center uses Next.js — product/stock data is embedded in __NEXT_DATA__
async function checkPokemonCenterPuppeteer(product: Product, browser?: Browser): Promise<CheckResult> {
  if (!browser) throw new Error('Browser required for pokemoncenter');
  const page = await browser.newPage();
  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );

    let apiData: Record<string, unknown> | null = null;

    // Intercept any ecommerce API calls the SPA makes
    page.on('response', async (response) => {
      const url = response.url();
      if (apiData) return;
      try {
        if (
          url.includes('ecommerce') ||
          url.includes('product') ||
          url.includes('availability')
        ) {
          const ct = response.headers()['content-type'] ?? '';
          if (ct.includes('json') && !url.includes('.js')) {
            const json = await response.json();
            if (json && typeof json === 'object') {
              const str = JSON.stringify(json);
              // Only capture if it looks like product data
              if (str.includes('availability') || str.includes('inStock') || str.includes('purchasable') || str.includes('addToCart')) {
                apiData = json as Record<string, unknown>;
              }
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

    // Try intercepted API data first
    if (apiData) {
      const result = parsePcApiData(apiData);
      if (result) {
        logger.debug(`[pokemoncenter] Got API data for ${product.canonicalName}: inStock=${result.inStock}`);
        return result;
      }
    }

    // Try __NEXT_DATA__ (Next.js server-side props)
    const nextData = await page.evaluate(() => {
      const el = document.querySelector('script#__NEXT_DATA__');
      return el?.textContent ?? null;
    });

    if (nextData) {
      try {
        const json = JSON.parse(nextData);
        const result = parseNextData(json);
        if (result) {
          logger.debug(`[pokemoncenter] Got __NEXT_DATA__ for ${product.canonicalName}: inStock=${result.inStock}`);
          return result;
        }
      } catch { /* parse failed */ }
    }

    // Try LD+JSON structured data
    const ldJson = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const data = JSON.parse(script.textContent ?? '');
          if (data['@type'] === 'Product' || data.offers) return data;
        } catch { /* skip */ }
      }
      return null;
    });

    if (ldJson) {
      const result = parseLdJson(ldJson);
      if (result) return result;
    }

    // Last fallback: scrape rendered HTML
    const html = await page.content();
    return parsePcHtml(html);
  } finally {
    await page.close();
  }
}

function parsePcApiData(data: Record<string, unknown>): CheckResult | null {
  const str = JSON.stringify(data);

  const availMatch = str.match(/"availability"\s*:\s*"([^"]+)"/);
  const purchasableMatch = str.match(/"purchasable"\s*:\s*(true|false)/);
  const inStockMatch = str.match(/"inStock"\s*:\s*(true|false)/);
  const priceMatch = str.match(/"price"\s*:\s*([\d.]+)/);

  if (purchasableMatch || inStockMatch || availMatch) {
    let inStock = false;
    if (purchasableMatch) inStock = purchasableMatch[1] === 'true';
    else if (inStockMatch) inStock = inStockMatch[1] === 'true';
    else if (availMatch) inStock = availMatch[1].includes('InStock');
    return {inStock, price: parsePrice(priceMatch?.[1] ?? null)};
  }

  return null;
}

function parseNextData(data: Record<string, unknown>): CheckResult | null {
  // Deeply search the props for product availability
  const str = JSON.stringify(data);
  return parsePcApiData(JSON.parse(str));
}

function parseLdJson(data: Record<string, unknown>): CheckResult | null {
  const offers = data.offers as Record<string, unknown> | undefined;
  if (!offers) return null;

  const availability = String(offers.availability ?? '');
  const inStock = availability.includes('InStock') || availability.includes('PreOrder');
  const price = parsePrice(String(offers.price ?? ''));
  return {inStock, price};
}

function parsePcHtml(html: string): CheckResult {
  const lc = html.toLowerCase();
  const outOfStock = lc.includes('out of stock') || lc.includes('notify me');
  const inStock = !outOfStock && lc.includes('add to cart');

  const priceMatch = html.match(/\$([\d,]+\.\d{2})/);
  const price = priceMatch ? parsePrice(priceMatch[0]) : null;

  return {inStock, price};
}

export const pokemoncenter: Store = {
  name: 'pokemoncenter',
  strategy: 'custom',
  supportsLocalStock: false,
  localStores: [],
  minSleep: config.pageSleepMin * 2,
  maxSleep: config.pageSleepMax * 2,
  customChecker: checkPokemonCenterPuppeteer,
  labels: {
    container: 'body',
    inStock: ['Add to Cart', 'Add to Bag', '.add-to-cart:not([disabled])'],
    outOfStock: ['Out of Stock', 'Notify Me', 'Sold Out', '.notify-me-button'],
    price: '.product-price, [data-testid="price"]',
  },
  products: [
    // Pokemon Center exclusives are the most sought-after versions (extra packs + alt art)

    // ── Prismatic Evolutions (SV8.5) ──
    {canonicalName: 'Prismatic Evolutions ETB (PC Exclusive)', name: 'Prismatic Evolutions Pokemon Center ETB', type: 'etb', set: 'Prismatic Evolutions', url: 'https://www.pokemoncenter.com/product/100-10351/pokemon-tcg-scarlet-and-violet-prismatic-evolutions-pokemon-center-elite-trainer-box'},

    // ── Pokemon 151 (SV3.5) ──
    {canonicalName: 'Pokemon 151 ETB (PC Exclusive)', name: '151 Pokemon Center ETB', type: 'etb', set: 'Pokemon 151', url: 'https://www.pokemoncenter.com/product/290-85466/pokemon-tcg-scarlet-and-violet-151-pokemon-center-elite-trainer-box'},

    // ── Perfect Order (ME3) ──
    {canonicalName: 'Perfect Order ETB (PC Exclusive)', name: 'Perfect Order Pokemon Center ETB', type: 'etb', set: 'Perfect Order', url: 'https://www.pokemoncenter.com/product/10-10372-109/pokemon-tcg-mega-evolution-perfect-order-pokemon-center-elite-trainer-box'},

    // ── Destined Rivals (SV10) ──
    {canonicalName: 'Destined Rivals ETB (PC Exclusive)', name: 'Destined Rivals Pokemon Center ETB', type: 'etb', set: 'Destined Rivals', url: 'https://www.pokemoncenter.com/product/100-10653/pokemon-tcg-scarlet-and-violet-destined-rivals-pokemon-center-elite-trainer-box'},

    // ── Ascended Heroes (ME2.5) — user is collecting this ──
    {canonicalName: 'Ascended Heroes ETB (PC Exclusive)', name: 'Ascended Heroes Pokemon Center ETB', type: 'etb', set: 'Ascended Heroes', url: 'https://www.pokemoncenter.com/product/10-10315-108/pokemon-tcg-mega-evolution-ascended-heroes-pokemon-center-elite-trainer-box'},

    // ── Phantasmal Flames (ME2) ──
    {canonicalName: 'Phantasmal Flames ETB (PC Exclusive)', name: 'Phantasmal Flames Pokemon Center ETB', type: 'etb', set: 'Phantasmal Flames', url: 'https://www.pokemoncenter.com/product/10-10186-109/pokemon-tcg-mega-evolution-phantasmal-flames-pokemon-center-elite-trainer-box'},
    {canonicalName: 'Mega Charizard X ex UPC', name: 'Mega Charizard X ex Ultra Premium Collection', type: 'upc', set: 'Phantasmal Flames', url: 'https://www.pokemoncenter.com/product/10-10065-109/pokemon-tcg-mega-charizard-x-ex-ultra-premium-collection'},

    // ── Paldean Fates (SV4.5) ──
    {canonicalName: 'Paldean Fates ETB (PC Exclusive)', name: 'Paldean Fates Pokemon Center ETB', type: 'etb', set: 'Paldean Fates', url: 'https://www.pokemoncenter.com/product/290-85619/pokemon-tcg-scarlet-and-violet-paldean-fates-pokemon-center-elite-trainer-box'},

    // ── Surging Sparks (SV08) ──
    {canonicalName: 'Surging Sparks ETB (PC Exclusive)', name: 'Surging Sparks Pokemon Center ETB', type: 'etb', set: 'Surging Sparks', url: 'https://www.pokemoncenter.com/product/100-10307/pokemon-tcg-scarlet-and-violet-surging-sparks-pokemon-center-elite-trainer-box'},

    // ── Journey Together (SV09) ──
    {canonicalName: 'Journey Together ETB (PC Exclusive)', name: 'Journey Together Pokemon Center ETB', type: 'etb', set: 'Journey Together', url: 'https://www.pokemoncenter.com/product/100-10356/pokemon-tcg-scarlet-and-violet-journey-together-pokemon-center-elite-trainer-box'},
    {canonicalName: 'Journey Together Booster Bundle', name: 'Journey Together Booster Bundle', type: 'bundle', set: 'Journey Together', url: 'https://www.pokemoncenter.com/product/100-10341/pokemon-tcg-scarlet-and-violet-journey-together-booster-bundle-6-packs'},
  ],
};
