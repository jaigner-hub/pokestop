import type {Store, Product} from './model';
import {config} from '../config';

function extractSkuId(url: string): string {
  const match = url.match(/\/(\d+)\.p/);
  if (!match) throw new Error(`Cannot extract SKU ID from Best Buy URL: ${url}`);
  return match[1];
}

function buildLocalUrl(product: Product, storeId: string): string {
  const skuId = extractSkuId(product.url);
  return `${product.url.split('?')[0]}?skuId=${skuId}&storeId=${storeId}`;
}

export const bestbuy: Store = {
  name: 'bestbuy',
  strategy: 'puppeteer',
  supportsLocalStock: true,
  localStores: [],
  minSleep: config.pageSleepMin,
  maxSleep: config.pageSleepMax,
  headers: {'Accept-Language': 'en-US,en;q=0.9'},
  buildLocalUrl,
  labels: {
    container: '.shop-fulfillment-button-wrapper, .fulfillment-fulfillment-summary, .shop-product-button',
    inStock: ['.add-to-cart-button:not([disabled])', 'Add to Cart', 'Pickup'],
    outOfStock: ['Sold Out', 'Coming Soon', 'Unavailable', 'Check Stores'],
    price: '.priceView-customer-price span:first-child',
  },
  products: [
    // ── Prismatic Evolutions (SV8.5) ──
    {canonicalName: 'Prismatic Evolutions ETB', name: 'Pokemon SV Prismatic Evolutions Elite Trainer Box', type: 'etb', set: 'Prismatic Evolutions', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-prismatic-evolutions-elite-trainer-box/6606082.p?skuId=6606082'},
    {canonicalName: 'Prismatic Evolutions Booster Bundle', name: 'Pokemon SV Prismatic Evolutions Booster Bundle', type: 'bundle', set: 'Prismatic Evolutions', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-prismatic-evolutions-booster-bundle/6608206.p?skuId=6608206'},
    {canonicalName: 'Prismatic Evolutions Binder Collection', name: 'Pokemon SV Prismatic Evolutions Binder Collection', type: 'collection-box', set: 'Prismatic Evolutions', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-prismatic-evolutions-binder-collection/6606079.p?skuId=6606079'},
    {canonicalName: 'Prismatic Evolutions Super Premium Collection', name: 'Pokemon SV Prismatic Evolutions Super Premium Collection', type: 'collection-box', set: 'Prismatic Evolutions', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-prismatic-evolutions-super-premium-collection/6621081.p?skuId=6621081'},

    // ── Pokemon 151 (SV3.5) ──
    {canonicalName: 'Pokemon 151 ETB', name: 'Pokemon SV 151 Elite Trainer Box', type: 'etb', set: 'Pokemon 151', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-151-elite-trainer-box/6548366.p?skuId=6548366'},
    {canonicalName: 'Pokemon 151 Booster Bundle', name: 'Pokemon SV 151 Booster Bundle', type: 'bundle', set: 'Pokemon 151', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-151-6pk-booster-bundle/6548371.p?skuId=6548371'},
    {canonicalName: 'Pokemon 151 Ultra Premium Collection', name: 'Pokemon SV 151 Ultra Premium Collection', type: 'upc', set: 'Pokemon 151', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-151-ultra-premium-collection/6548367.p?skuId=6548367'},

    // ── Perfect Order (ME3) ──
    {canonicalName: 'Perfect Order ETB', name: 'Pokemon ME Perfect Order Elite Trainer Box', type: 'etb', set: 'Perfect Order', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-mega-evolution-perfect-order-elite-trainer-box/6668619.p?skuId=6668619'},
    {canonicalName: 'Perfect Order Booster Box', name: 'Pokemon ME Perfect Order Booster Box', type: 'booster-box', set: 'Perfect Order', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-mega-evolution-perfect-order-booster-box-36-packs/6668620.p?skuId=6668620'},

    // ── Destined Rivals (SV10) ──
    {canonicalName: 'Destined Rivals ETB', name: 'Pokemon SV Destined Rivals Elite Trainer Box', type: 'etb', set: 'Destined Rivals', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-destined-rivals-elite-trainer-box/6624825.p?skuId=6624825'},
    {canonicalName: 'Destined Rivals Booster Bundle', name: 'Pokemon SV Destined Rivals Booster Bundle', type: 'bundle', set: 'Destined Rivals', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-destined-rivals-6pk-booster-bundle/6624828.p?skuId=6624828'},
    {canonicalName: 'Destined Rivals Booster Box', name: 'Pokemon SV Destined Rivals Booster Box', type: 'booster-box', set: 'Destined Rivals', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-destined-rivals-booster-box-36-packs/6624826.p?skuId=6624826'},

    // ── Ascended Heroes (ME2.5) — user is collecting this ──
    {canonicalName: 'Ascended Heroes ETB', name: 'Pokemon ME Ascended Heroes Elite Trainer Box', type: 'etb', set: 'Ascended Heroes', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-mega-evolution-ascended-heroes-elite-trainer-box/6665449.p?skuId=6665449'},

    // ── Phantasmal Flames (ME2) ──
    {canonicalName: 'Phantasmal Flames ETB', name: 'Pokemon ME Phantasmal Flames Elite Trainer Box', type: 'etb', set: 'Phantasmal Flames', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-mega-evolution-phantasmal-flames-elite-trainer-box/6645345.p?skuId=6645345'},
    {canonicalName: 'Phantasmal Flames Booster Box', name: 'Pokemon ME Phantasmal Flames Booster Box', type: 'booster-box', set: 'Phantasmal Flames', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-mega-evolution-phantasmal-flames-booster-box-36-packs/6645341.p?skuId=6645341'},
    {canonicalName: 'Phantasmal Flames Booster Bundle', name: 'Pokemon ME Phantasmal Flames Booster Bundle', type: 'bundle', set: 'Phantasmal Flames', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-mega-evolution-phantasmal-flames-6pk-booster-bundle/6645343.p?skuId=6645343'},

    // ── Black Bolt / White Flare (SV10.5) ──
    {canonicalName: 'Black Bolt ETB', name: 'Pokemon SV Black Bolt Elite Trainer Box', type: 'etb', set: 'Black Bolt', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-black-bolt-elite-trainer-box/6632397.p?skuId=6632397'},
    {canonicalName: 'White Flare ETB', name: 'Pokemon SV White Flare Elite Trainer Box', type: 'etb', set: 'White Flare', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-white-flare-elite-trainer-box/6632394.p?skuId=6632394'},
    {canonicalName: 'Black Bolt Booster Bundle', name: 'Pokemon SV Black Bolt Booster Bundle', type: 'bundle', set: 'Black Bolt', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-black-bolt-booster-bundle/6632402.p?skuId=6632402'},
    {canonicalName: 'White Flare Booster Bundle', name: 'Pokemon SV White Flare Booster Bundle', type: 'bundle', set: 'White Flare', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-white-flare-booster-bundle/6632399.p?skuId=6632399'},

    // ── Paldean Fates (SV4.5) ──
    {canonicalName: 'Paldean Fates ETB', name: 'Pokemon SV Paldean Fates Elite Trainer Box', type: 'etb', set: 'Paldean Fates', url: 'https://www.bestbuy.com/site/pokemon-tcg-scarlet-violet-paldean-fates-elite-trainer-box/6568010.p?skuId=6568010'},
    {canonicalName: 'Paldean Fates Booster Bundle', name: 'Pokemon SV Paldean Fates Booster Bundle', type: 'bundle', set: 'Paldean Fates', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-paldean-fates-6pk-booster-bundle/6568006.p?skuId=6568006'},

    // ── Surging Sparks (SV08) ──
    {canonicalName: 'Surging Sparks Booster Box', name: 'Pokemon SV Surging Sparks Booster Box', type: 'booster-box', set: 'Surging Sparks', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-surging-sparks-booster-box-36-packs/6598558.p?skuId=6598558'},
    {canonicalName: 'Surging Sparks ETB', name: 'Pokemon SV Surging Sparks Elite Trainer Box', type: 'etb', set: 'Surging Sparks', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-surging-sparks-elite-trainer-box/6598557.p?skuId=6598557'},

    // ── Journey Together (SV09) ──
    {canonicalName: 'Journey Together ETB', name: 'Pokemon SV Journey Together Elite Trainer Box', type: 'etb', set: 'Journey Together', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-journey-together-elite-trainer-box/6614267.p?skuId=6614267'},
    {canonicalName: 'Journey Together Booster Bundle', name: 'Pokemon SV Journey Together Booster Bundle', type: 'bundle', set: 'Journey Together', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-journey-together-booster-bundle-6-pk/6614264.p?skuId=6614264'},
    {canonicalName: 'Journey Together Booster Box', name: 'Pokemon SV Journey Together Booster Box', type: 'booster-box', set: 'Journey Together', url: 'https://www.bestbuy.com/site/pokemon-trading-card-game-scarlet-violet-journey-together-booster-box-36-packs/6614262.p?skuId=6614262'},
  ],
};
