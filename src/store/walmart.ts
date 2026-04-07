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
  const nextDataResult = extractFromNextData(html);
  if (nextDataResult) return nextDataResult;
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

    let inStock = false;
    const availability = productData.availabilityStatus;
    if (availability) {
      const status = typeof availability === 'string'
        ? availability
        : availability.value ?? availability.display ?? '';
      inStock = status === 'IN_STOCK' || status === 'AVAILABLE' ||
        status.toLowerCase().includes('in stock');
    }

    const fulfillment = productData.fulfillmentOptions ?? productData.fulfillment;
    if (Array.isArray(fulfillment)) {
      for (const opt of fulfillment) {
        if (opt.type === 'PICKUP' && opt.availabilityStatus === 'IN_STOCK') {
          inStock = true;
        }
      }
    }

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
    inStock: ['Add to cart', '[data-tl-id*="add-to-cart"]', 'Pick up today'],
    outOfStock: ['Out of stock', 'Get in-stock alert', 'unavailable'],
    price: '[itemprop="price"], .price-characteristic',
  },
  products: [
    // ══════════════════════════════════════════════════════════════════════
    //  TIER 1 — Hardest to find
    // ══════════════════════════════════════════════════════════════════════

    // ── Prismatic Evolutions (SV8.5) ──
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

    // ── Pokemon 151 (SV3.5) ──
    {
      canonicalName: 'Pokemon 151 ETB',
      name: 'Pokemon SV 151 Elite Trainer Box',
      type: 'etb',
      set: 'Pokemon 151',
      url: 'https://www.walmart.com/ip/Pok-mon-Trading-Card-Games-Scarlet-Violet-3-5-151-Elite-Trainer-Box/3417089291',
    },
    {
      canonicalName: 'Pokemon 151 Booster Bundle',
      name: 'Pokemon SV 151 Booster Bundle',
      type: 'bundle',
      set: 'Pokemon 151',
      url: 'https://www.walmart.com/ip/Pokemon-Trading-Card-Games-Scarlet-Violet-3-5-151-Booster-Bundle-with-6-Booster-Card-Packs/1160437186',
    },
    {
      canonicalName: 'Pokemon 151 Ultra Premium Collection',
      name: 'Pokemon SV 151 Ultra Premium Collection',
      type: 'upc',
      set: 'Pokemon 151',
      url: 'https://www.walmart.com/ip/Pokemon-TCG-Scarlet-Violet-3-5-Pokemon-151-Ultra-Premium-Collection/3606845180',
    },

    // ── Perfect Order (ME) ──
    {
      canonicalName: 'Perfect Order ETB',
      name: 'Pokemon Mega Evolution Perfect Order Elite Trainer Box',
      type: 'etb',
      set: 'Perfect Order',
      url: 'https://www.walmart.com/ip/Pokemon-TCG-Mega-Evolution-Perfect-Order-Elite-Trainer-Box/19402160990',
    },
    {
      canonicalName: 'Perfect Order Booster Box',
      name: 'Pokemon Mega Evolution Perfect Order Booster Box',
      type: 'booster-box',
      set: 'Perfect Order',
      url: 'https://www.walmart.com/ip/Pokemon-TCG-Mega-Evolution-Perfect-Order-Booster-Box-36-Packs/19376602103',
    },
    {
      canonicalName: 'Perfect Order Booster Bundle',
      name: 'Pokemon Mega Evolution Perfect Order Booster Bundle',
      type: 'bundle',
      set: 'Perfect Order',
      url: 'https://www.walmart.com/ip/Pokemon-TCG-Mega-Evolution-Perfect-Order-Booster-Bundle-6-Packs/19380764160',
    },

    // ── Destined Rivals (SV10) ──
    {
      canonicalName: 'Destined Rivals ETB',
      name: 'Pokemon SV Destined Rivals Elite Trainer Box',
      type: 'etb',
      set: 'Destined Rivals',
      url: 'https://www.walmart.com/ip/Pok-mon-TCG-Scarlet-Violet-Destined-Rivals-Pok-mon-Center-Elite-Trainer-Box/15718673510',
    },
    {
      canonicalName: 'Destined Rivals Booster Bundle',
      name: 'Pokemon SV Destined Rivals Booster Bundle',
      type: 'bundle',
      set: 'Destined Rivals',
      url: 'https://www.walmart.com/ip/Pokemon-TCG-Scarlet-Violet-Destined-Rivals-Booster-Bundle-6-Packs/16019713971',
    },
    {
      canonicalName: 'Destined Rivals Booster Box',
      name: 'Pokemon SV Destined Rivals Booster Display Box',
      type: 'booster-box',
      set: 'Destined Rivals',
      url: 'https://www.walmart.com/ip/Pokemon-TCG-Scarlet-Violet-Destined-Rivals-Booster-Display-Box-36-Packs/16017668684',
    },

    // ══════════════════════════════════════════════════════════════════════
    //  TIER 2 — Hard to find
    // ══════════════════════════════════════════════════════════════════════

    // ── Ascended Heroes (ME) — user is collecting this ──
    {
      canonicalName: 'Ascended Heroes ETB',
      name: 'Pokemon Mega Evolution Ascended Heroes Elite Trainer Box',
      type: 'etb',
      set: 'Ascended Heroes',
      url: 'https://www.walmart.com/ip/Pok-mon-Trading-Card-Game-Mega-Evolution-Ascended-Heroes-Elite-Trainer-Box/18710966734',
    },
    {
      canonicalName: 'Ascended Heroes Booster Bundle',
      name: 'Pokemon Mega Evolution Ascended Heroes Booster Bundle',
      type: 'bundle',
      set: 'Ascended Heroes',
      url: 'https://www.walmart.com/ip/Pok-mon-TCG-Mega-Evolution-Ascended-Heroes-Booster-Bundle-6-Packs/18728422476',
    },

    // ── Phantasmal Flames (ME) ──
    {
      canonicalName: 'Phantasmal Flames ETB',
      name: 'Pokemon Mega Evolution Phantasmal Flames Elite Trainer Box',
      type: 'etb',
      set: 'Phantasmal Flames',
      url: 'https://www.walmart.com/ip/POKEMON-ME2-PHANTASMAL-FLAMES-ELITE-TRAINER-BOX/17780209250',
    },
    {
      canonicalName: 'Phantasmal Flames Booster Box',
      name: 'Pokemon Mega Evolution Phantasmal Flames Booster Box',
      type: 'booster-box',
      set: 'Phantasmal Flames',
      url: 'https://www.walmart.com/ip/POKEMON-ME2-PHANTASMAL-FLAMES-BOOSTER/17823513616',
    },
    {
      canonicalName: 'Mega Charizard X ex UPC',
      name: 'Pokemon Mega Charizard X ex Ultra Premium Collection',
      type: 'upc',
      set: 'Phantasmal Flames',
      url: 'https://www.walmart.com/ip/POKEMON-CHARIZARD-X-EX-ULTRA-PREMIUM-COLLECTION/17823811037',
    },

    // ── Black Bolt / White Flare (SV10.5) ──
    {
      canonicalName: 'Black Bolt ETB',
      name: 'Pokemon SV Black Bolt Elite Trainer Box',
      type: 'etb',
      set: 'Black Bolt',
      url: 'https://www.walmart.com/ip/Pokemon-TCG-Scarlet-Violet-10-5-Black-Bolt-Elite-Trainer-Box-9-Packs-Promo-Card/16498668973',
    },
    {
      canonicalName: 'White Flare ETB',
      name: 'Pokemon SV White Flare Elite Trainer Box',
      type: 'etb',
      set: 'White Flare',
      url: 'https://www.walmart.com/ip/Pokemon-TCG-Scarlet-Violet-10-5-White-Flare-Elite-Trainer-Box-9-Packs-Promo-Card/16446322202',
    },

    // ── Paldean Fates (SV4.5) ──
    {
      canonicalName: 'Paldean Fates ETB',
      name: 'Pokemon SV Paldean Fates Elite Trainer Box',
      type: 'etb',
      set: 'Paldean Fates',
      url: 'https://www.walmart.com/ip/POKEMON-SV4-5-PALDEAN-FATES-ETB/5226743070',
    },
    {
      canonicalName: 'Paldean Fates Booster Bundle',
      name: 'Pokemon SV Paldean Fates Booster Bundle',
      type: 'bundle',
      set: 'Paldean Fates',
      url: 'https://www.walmart.com/ip/Pokemon-Trading-Card-Games-SV4-5-Paldean-Fates-Booster-Bundle/5226743077',
    },

    // ══════════════════════════════════════════════════════════════════════
    //  TIER 3 — Worth watching
    // ══════════════════════════════════════════════════════════════════════

    // ── Chaos Rising (ME, pre-order May 22 2026) ──
    {
      canonicalName: 'Chaos Rising ETB',
      name: 'Pokemon Mega Evolution Chaos Rising Elite Trainer Box',
      type: 'etb',
      set: 'Chaos Rising',
      url: 'https://www.walmart.com/ip/Pokemon-TCG-Mega-Evolution-Chaos-Rising-Elite-Trainer-Box/19988614228',
    },

    // ── Surging Sparks (SV08) ──
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

    // ── Journey Together (SV09) ──
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
