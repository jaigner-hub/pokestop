import type {Store, Product, CheckResult} from './model';
import {getMsrp} from './model';
import {config} from '../config';
import {parsePrice} from '../price';
import {logger} from '../logger';
import {getBrowser} from '../browser';

// TCGPlayer is a marketplace — product pages show individual card listings
// alongside the sealed product price.  The sealed price lives in the
// "Market Price" / "Listed Median" area, not in the per-card listing rows.
async function checkTcgPlayer(product: Product): Promise<CheckResult> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.goto(product.url, {
      waitUntil: 'networkidle2',
      timeout: config.pageTimeout,
    });
    await new Promise(r => setTimeout(r, 2000));

    // Floor the fallback at 50% of MSRP. The sealed-product page also lists
    // related single cards, accessories, and recommendations — anything well
    // under MSRP is almost certainly noise from those sections, not a real
    // sealed listing. (Sealed products almost never go below half MSRP, even
    // on closeout.)
    const msrp = getMsrp(product);
    const priceFloor = msrp * 0.5;

    const result = await page.evaluate((floor: number) => {
      const body = document.body?.innerText ?? '';
      const lc = body.toLowerCase();

      // Stock: look for actual "Add to Cart" button, not just "listings" text
      const outOfStock = lc.includes('no listings') || lc.includes('sold out');
      const hasAddToCart = lc.includes('add to cart');
      // "listings" alone just means single-card marketplace listings exist
      const inStock = !outOfStock && hasAddToCart;

      // Price: Market Price and Listed Median are the sealed product prices.
      // TCGPlayer shows "Market Price $49.99" or "Market Price: $49.99"
      let price: number | null = null;

      const marketMatch = body.match(/Market Price[:\s]*\$([\d,]+\.\d{2})/i);
      const medianMatch = body.match(/Listed Median[:\s]*\$([\d,]+\.\d{2})/i);
      // Also try "Normal Market Price" variant
      const normalMatch = body.match(/Normal\s+Market Price[:\s]*\$([\d,]+\.\d{2})/i);

      if (marketMatch) {
        price = parseFloat(marketMatch[1].replace(',', ''));
      } else if (normalMatch) {
        price = parseFloat(normalMatch[1].replace(',', ''));
      } else if (medianMatch) {
        price = parseFloat(medianMatch[1].replace(',', ''));
      } else {
        // Fallback: scan all $XX.XX in body and take the lowest plausible
        // sealed listing — i.e. above the per-product floor passed in.
        const all = body.match(/\$([\d,]+\.\d{2})/g) ?? [];
        const candidates = all
          .map(s => parseFloat(s.slice(1).replace(/,/g, '')))
          .filter(p => Number.isFinite(p) && p >= floor);
        if (candidates.length > 0) {
          price = Math.min(...candidates);
        }
      }

      return {inStock, price};
    }, priceFloor);

    // Belt-and-suspenders: even labeled prices below the floor are suspicious
    // (would mean the labeled "Market Price" is for a single card on the page).
    if (result.price != null && result.price < priceFloor) {
      logger.debug(`[tcgplayer] ${product.canonicalName}: discarding $${result.price.toFixed(2)} below floor $${priceFloor.toFixed(2)} (MSRP $${msrp.toFixed(2)})`);
      result.price = null;
    }

    logger.debug(`[tcgplayer] ${product.canonicalName}: inStock=${result.inStock}, price=${result.price}`);
    return result;
  } finally {
    await page.close();
  }
}

export const tcgplayer: Store = {
  name: 'tcgplayer',
  strategy: 'custom',
  supportsLocalStock: false,
  localStores: [],
  minSleep: config.pageSleepMin,
  maxSleep: config.pageSleepMax,
  customCheck: checkTcgPlayer,
  labels: {
    container: 'body',
    inStock: ['Add to Cart', 'Listings'],
    outOfStock: ['Sold Out', 'Out of Stock', 'No Listings'],
    price: '.spotlight__price',
  },
  products: [
    // ── Prismatic Evolutions (SV8.5) ──
    {canonicalName: 'Prismatic Evolutions ETB', name: 'SV Prismatic Evolutions Elite Trainer Box', type: 'etb', set: 'Prismatic Evolutions', url: 'https://www.tcgplayer.com/product/593355/pokemon-sv-prismatic-evolutions-prismatic-evolutions-elite-trainer-box'},
    {canonicalName: 'Prismatic Evolutions Booster Bundle', name: 'SV Prismatic Evolutions Booster Bundle', type: 'bundle', set: 'Prismatic Evolutions', url: 'https://www.tcgplayer.com/product/600518/pokemon-sv-prismatic-evolutions-prismatic-evolutions-booster-bundle'},

    // ── Pokemon 151 (SV3.5) ──
    {canonicalName: 'Pokemon 151 ETB', name: 'SV 151 Elite Trainer Box', type: 'etb', set: 'Pokemon 151', url: 'https://www.tcgplayer.com/product/503313/pokemon-sv-scarlet-and-violet-151-151-elite-trainer-box'},
    {canonicalName: 'Pokemon 151 Booster Bundle', name: 'SV 151 Booster Bundle', type: 'bundle', set: 'Pokemon 151', url: 'https://www.tcgplayer.com/product/502000/pokemon-sv-scarlet-and-violet-151-151-booster-bundle'},
    {canonicalName: 'Pokemon 151 Ultra Premium Collection', name: 'SV 151 Ultra Premium Collection', type: 'upc', set: 'Pokemon 151', url: 'https://www.tcgplayer.com/product/502005/pokemon-sv-scarlet-and-violet-151-151-ultra-premium-collection'},

    // ── Perfect Order (ME3) ──
    {canonicalName: 'Perfect Order ETB', name: 'ME Perfect Order Elite Trainer Box', type: 'etb', set: 'Perfect Order', url: 'https://www.tcgplayer.com/product/672401/pokemon-me03-perfect-order-perfect-order-elite-trainer-box'},
    {canonicalName: 'Perfect Order Booster Box', name: 'ME Perfect Order Booster Box', type: 'booster-box', set: 'Perfect Order', url: 'https://www.tcgplayer.com/product/672394/pokemon-me03-perfect-order-perfect-order-booster-box'},

    // ── Destined Rivals (SV10) ──
    {canonicalName: 'Destined Rivals ETB', name: 'SV Destined Rivals Elite Trainer Box', type: 'etb', set: 'Destined Rivals', url: 'https://www.tcgplayer.com/product/624676/pokemon-sv10-destined-rivals-destined-rivals-elite-trainer-box'},
    {canonicalName: 'Destined Rivals Booster Box', name: 'SV Destined Rivals Booster Box', type: 'booster-box', set: 'Destined Rivals', url: 'https://www.tcgplayer.com/product/624679/pokemon-sv10-destined-rivals-destined-rivals-booster-box'},

    // ── Ascended Heroes (ME2.5) — user is collecting this ──
    {canonicalName: 'Ascended Heroes ETB', name: 'ME Ascended Heroes Elite Trainer Box', type: 'etb', set: 'Ascended Heroes', url: 'https://www.tcgplayer.com/product/668496/pokemon-me-ascended-heroes-ascended-heroes-elite-trainer-box'},
    {canonicalName: 'Ascended Heroes Booster Bundle', name: 'ME Ascended Heroes Booster Bundle', type: 'bundle', set: 'Ascended Heroes', url: 'https://www.tcgplayer.com/product/668541/pokemon-me-ascended-heroes-ascended-heroes-booster-bundle'},

    // ── Phantasmal Flames (ME2) ──
    {canonicalName: 'Phantasmal Flames ETB', name: 'ME Phantasmal Flames Elite Trainer Box', type: 'etb', set: 'Phantasmal Flames', url: 'https://www.tcgplayer.com/product/654136/pokemon-me02-phantasmal-flames-phantasmal-flames-elite-trainer-box'},
    {canonicalName: 'Phantasmal Flames Booster Box', name: 'ME Phantasmal Flames Booster Box', type: 'booster-box', set: 'Phantasmal Flames', url: 'https://www.tcgplayer.com/product/654137/pokemon-me02-phantasmal-flames-phantasmal-flames-booster-box'},
    {canonicalName: 'Mega Charizard X ex UPC', name: 'Mega Charizard X ex Ultra Premium Collection', type: 'upc', set: 'Phantasmal Flames', url: 'https://www.tcgplayer.com/product/654213/pokemon-miscellaneous-cards-and-products-mega-charizard-x-ex-ultra-premium-collection'},

    // ── Black Bolt / White Flare (SV10.5) ──
    {canonicalName: 'Black Bolt ETB', name: 'SV Black Bolt Elite Trainer Box', type: 'etb', set: 'Black Bolt', url: 'https://www.tcgplayer.com/product/630686/pokemon-sv-black-bolt-black-bolt-elite-trainer-box'},
    {canonicalName: 'White Flare ETB', name: 'SV White Flare Elite Trainer Box', type: 'etb', set: 'White Flare', url: 'https://www.tcgplayer.com/product/630689/pokemon-sv-white-flare-white-flare-elite-trainer-box'},

    // ── Paldean Fates (SV4.5) ──
    {canonicalName: 'Paldean Fates ETB', name: 'SV Paldean Fates Elite Trainer Box', type: 'etb', set: 'Paldean Fates', url: 'https://www.tcgplayer.com/product/528040/pokemon-sv-paldean-fates-paldean-fates-elite-trainer-box'},
    {canonicalName: 'Paldean Fates Booster Bundle', name: 'SV Paldean Fates Booster Bundle', type: 'bundle', set: 'Paldean Fates', url: 'https://www.tcgplayer.com/product/528771/pokemon-sv-paldean-fates-paldean-fates-booster-bundle'},

    // ── Chaos Rising (ME4, pre-order May 22 2026) ──
    {canonicalName: 'Chaos Rising ETB', name: 'ME Chaos Rising Elite Trainer Box', type: 'etb', set: 'Chaos Rising', url: 'https://www.tcgplayer.com/product/684450/pokemon-me04-chaos-rising-chaos-rising-elite-trainer-box'},
    {canonicalName: 'Chaos Rising Booster Box', name: 'ME Chaos Rising Booster Box', type: 'booster-box', set: 'Chaos Rising', url: 'https://www.tcgplayer.com/product/684444/pokemon-me04-chaos-rising-chaos-rising-booster-box'},

    // ── Surging Sparks (SV08) ──
    {canonicalName: 'Surging Sparks Booster Box', name: 'SV Surging Sparks Booster Box', type: 'booster-box', set: 'Surging Sparks', url: 'https://www.tcgplayer.com/product/565606/pokemon-sv08-surging-sparks-surging-sparks-booster-box'},
    {canonicalName: 'Surging Sparks ETB', name: 'SV Surging Sparks Elite Trainer Box', type: 'etb', set: 'Surging Sparks', url: 'https://www.tcgplayer.com/product/565630/pokemon-sv08-surging-sparks-surging-sparks-elite-trainer-box'},

    // ── Journey Together (SV09) ──
    {canonicalName: 'Journey Together ETB', name: 'SV Journey Together Elite Trainer Box', type: 'etb', set: 'Journey Together', url: 'https://www.tcgplayer.com/product/610930/pokemon-sv09-journey-together-journey-together-elite-trainer-box'},
    {canonicalName: 'Journey Together Booster Box', name: 'SV Journey Together Booster Box', type: 'booster-box', set: 'Journey Together', url: 'https://www.tcgplayer.com/product/610931/pokemon-sv09-journey-together-journey-together-booster-box'},
    {canonicalName: 'Journey Together Booster Bundle', name: 'SV Journey Together Booster Bundle', type: 'bundle', set: 'Journey Together', url: 'https://www.tcgplayer.com/product/610953/pokemon-sv09-journey-together-journey-together-booster-bundle'},
  ],
};
