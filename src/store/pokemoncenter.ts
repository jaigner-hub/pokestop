import type {Store} from './model';
import {config} from '../config';

export const pokemoncenter: Store = {
  name: 'pokemoncenter',
  strategy: 'puppeteer',
  supportsLocalStock: false,
  localStores: [],
  minSleep: config.pageSleepMin * 2,
  maxSleep: config.pageSleepMax * 2,
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
