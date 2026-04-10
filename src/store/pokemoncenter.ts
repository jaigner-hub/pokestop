import type {Store, Product, CheckResult} from './model';
import {config} from '../config';
import {parsePrice} from '../price';
import {logger} from '../logger';
import {getBrowser} from '../browser';

// Pokémon Center uses Akamai WAF.  When connected to a real Chrome via debug
// port, new tabs already share the browser's cookie jar, but we must NOT
// override the real UA string — that mismatch is an easy fingerprint signal.
// We also navigate to the homepage first if the page has no PC cookies yet,
// so Akamai sees a warm session before we hit a product page.

let pcCookiesWarmed = false;

async function checkPokemonCenterPuppeteer(product: Product): Promise<CheckResult> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    // Do NOT call setUserAgent — let the real Chrome UA pass through.

    // First-run: warm cookies by visiting the homepage so Akamai sets its
    // bot-management cookies (_abck, bm_sz, etc.) before we hit product pages.
    if (!pcCookiesWarmed) {
      logger.info('[pokemoncenter] Warming cookies via homepage...');
      try {
        await page.goto('https://www.pokemoncenter.com/', {
          waitUntil: 'networkidle2',
          timeout: config.pageTimeout,
        });
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
        pcCookiesWarmed = true;
        logger.info('[pokemoncenter] Cookies warmed.');
      } catch (err) {
        logger.warn(`[pokemoncenter] Homepage warm-up failed: ${err}`);
      }
    }

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

    await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));

    // Check if we got blocked
    const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 500) ?? '');
    if (bodyText.includes('blocked by our security service') || bodyText.includes('Access Denied')) {
      logger.warn(`[pokemoncenter] Blocked on ${product.canonicalName} — resetting cookie state for next cycle`);
      pcCookiesWarmed = false;
      return {inStock: false, price: null};
    }

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
  customCheck: checkPokemonCenterPuppeteer,
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
