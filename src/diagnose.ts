import {getBrowser, closeBrowser} from './browser';
import nodeFetch from 'node-fetch';
import {config} from './config';

const TESTS = [
  {
    name: 'Best Buy API',
    type: 'fetch' as const,
    url: () => {
      const skuId = '6606082';
      const paths = JSON.stringify([
        ['shop', 'buttonstate', 'v5', 'item', 'skus', skuId,
         'conditions', 'NONE', 'destinationZipCode', config.zipCode ?? '10001',
         'storeId', ' ', 'context', 'cyp', 'addAll', 'false'],
      ]);
      return `https://www.bestbuy.com/api/tcfb/model.json?paths=${encodeURIComponent(paths)}&method=get`;
    },
  },
  {
    name: 'Walmart',
    type: 'puppeteer' as const,
    url: () => 'https://www.walmart.com/ip/Pokemon-Scarlet-Violet-Prismatic-Evolutions-Elite-Trainer-Box/13816151308',
  },
  {
    name: 'GameStop',
    type: 'puppeteer' as const,
    url: () => 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-trading-card-game-prismatic-evolutions-elite-trainer-box/417631.html',
  },
  {
    name: 'Pokemon Center',
    type: 'puppeteer' as const,
    url: () => 'https://www.pokemoncenter.com/product/100-10351/pokemon-tcg-scarlet-and-violet-prismatic-evolutions-pokemon-center-elite-trainer-box',
  },
  {
    name: 'TCGPlayer',
    type: 'puppeteer' as const,
    url: () => 'https://www.tcgplayer.com/product/593355/pokemon-sv-prismatic-evolutions-prismatic-evolutions-elite-trainer-box',
  },
];

async function diagnoseFetch(name: string, url: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${name}] Fetching: ${url.slice(0, 80)}...`);
  try {
    const res = await nodeFetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
    });
    const body = await res.text();
    console.log(`  Status: ${res.status}`);
    console.log(`  Content-Type: ${res.headers.get('content-type')}`);
    console.log(`  Body length: ${body.length}`);
    console.log(`  First 500 chars:\n${body.slice(0, 500)}`);

    // Check for common block indicators
    const lc = body.toLowerCase();
    if (lc.includes('captcha') || lc.includes('challenge') || lc.includes('blocked') || lc.includes('perimeterx') || lc.includes('incapsula') || lc.includes('access denied')) {
      console.log(`  ⚠ BLOCKED — detected bot protection keywords`);
    }
    if (lc.includes('buttonstate') || lc.includes('add_to_cart') || lc.includes('sold_out')) {
      console.log(`  ✓ Found stock-related data!`);
    }
  } catch (err) {
    console.log(`  ✗ Error: ${err}`);
  }
}

async function diagnosePuppeteer(name: string, url: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${name}] Loading with Puppeteer: ${url.slice(0, 80)}...`);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );

    // Track XHR responses
    const xhrUrls: string[] = [];
    page.on('response', async (response) => {
      const u = response.url();
      const ct = response.headers()['content-type'] ?? '';
      if (ct.includes('json') && !u.endsWith('.js') && !u.includes('analytics') && !u.includes('tracking')) {
        xhrUrls.push(`${response.status()} ${u.slice(0, 100)}`);
      }
    });

    const res = await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    await new Promise(r => setTimeout(r, 3000));

    const status = res?.status() ?? 'unknown';
    const html = await page.content();
    const title = await page.title();

    console.log(`  Status: ${status}`);
    console.log(`  Title: ${title}`);
    console.log(`  HTML length: ${html.length}`);

    // Check for __NEXT_DATA__
    const hasNextData = html.includes('__NEXT_DATA__');
    console.log(`  __NEXT_DATA__: ${hasNextData ? 'YES' : 'no'}`);

    // Check for LD+JSON
    const ldJsonMatch = html.match(/<script type="application\/ld\+json">/g);
    console.log(`  LD+JSON scripts: ${ldJsonMatch?.length ?? 0}`);

    // Check for block indicators
    const lc = html.toLowerCase();
    const blocked = lc.includes('captcha') || lc.includes('challenge-running') || lc.includes('blocked')
      || lc.includes('perimeterx') || lc.includes('incapsula') || lc.includes('access denied')
      || lc.includes('pardon our interruption') || lc.includes('just a moment');
    if (blocked) {
      console.log(`  ⚠ BLOCKED — detected bot protection page`);
      // Show what kind
      if (lc.includes('perimeterx') || lc.includes('_pxhd')) console.log(`    → PerimeterX`);
      if (lc.includes('incapsula') || lc.includes('imperva')) console.log(`    → Imperva/Incapsula`);
      if (lc.includes('cloudflare') || lc.includes('just a moment')) console.log(`    → Cloudflare`);
      if (lc.includes('akamai')) console.log(`    → Akamai`);
      if (lc.includes('captcha')) console.log(`    → CAPTCHA required`);
    }

    // Check for stock signals
    const hasCart = lc.includes('add to cart');
    const hasOos = lc.includes('out of stock') || lc.includes('sold out') || lc.includes('notify me') || lc.includes('not available');
    const hasPrice = /\$\d+\.\d{2}/.test(html);
    console.log(`  Stock signals: cart=${hasCart}, oos=${hasOos}, price=${hasPrice}`);

    // JSON XHR responses captured
    if (xhrUrls.length > 0) {
      console.log(`  JSON XHR responses (${xhrUrls.length}):`);
      for (const u of xhrUrls.slice(0, 10)) {
        console.log(`    ${u}`);
      }
    } else {
      console.log(`  JSON XHR responses: none captured`);
    }

    if (!blocked && !hasCart && !hasOos && !hasPrice && html.length < 5000) {
      console.log(`  ⚠ Page seems empty/minimal — likely blocked silently`);
      console.log(`  First 500 chars of body:\n${html.slice(0, 500)}`);
    }

  } catch (err) {
    console.log(`  ✗ Error: ${err}`);
  } finally {
    await page.close();
  }
}

async function main() {
  console.log('Pokestop Store Diagnostics');
  console.log(`Stealth plugin loaded via browser.ts`);

  for (const test of TESTS) {
    try {
      if (test.type === 'fetch') {
        await diagnoseFetch(test.name, test.url());
      } else {
        await diagnosePuppeteer(test.name, test.url());
      }
    } catch (err) {
      console.log(`\n[${test.name}] FATAL: ${err}`);
    }
  }

  await closeBrowser();
  console.log('\n\nDone.');
}

main().catch(console.error);
