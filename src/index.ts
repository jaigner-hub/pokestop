import {config} from './config';
import {logger, printSummary, writeMarkdownSummary} from './logger';
import {Db} from './db';
import {getBrowser, closeBrowser} from './browser';
import {resolveLocalStores} from './local-stores';
import {filterProducts} from './filter';
import {startPolling, startSummaryPrinter, pollStore} from './poller';
import {getActiveStores} from './store/index';
import fs from 'fs';
import path from 'path';

async function main(): Promise<void> {
  logger.info('Pokestop starting...');

  // Ensure data directory exists
  const dbDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, {recursive: true});

  const db = new Db(config.dbPath);
  logger.info(`Database ready at ${config.dbPath}`);

  // --md [path]: also write a markdown summary file. Default path: summary.md
  // Combine with --show or --once. Without a path arg, defaults to summary.md.
  const mdIdx = process.argv.indexOf('--md');
  const mdPath: string | null = mdIdx >= 0
    ? (process.argv[mdIdx + 1] && !process.argv[mdIdx + 1].startsWith('--')
        ? process.argv[mdIdx + 1]
        : 'summary.md')
    : null;

  // --show: dump latest in-stock data from the db without scanning anything.
  if (process.argv.includes('--show')) {
    const rows = db.getBestPrices();
    if (rows.length > 0) {
      printSummary(rows);
      if (mdPath) {
        writeMarkdownSummary(rows, mdPath);
        logger.info(`Wrote markdown summary to ${mdPath}`);
      }
    } else {
      logger.info('No in-stock items in the database. Run a scan first.');
    }
    db.close();
    return;
  }

  // Load and filter stores
  let stores = getActiveStores();
  stores = stores.map(store => ({
    ...store,
    products: filterProducts(store.products, config.showOnlyTypes, config.showOnlySets),
  }));

  const activeStores = stores.filter(s => s.products.length > 0);
  if (activeStores.length === 0) {
    logger.warn('No products to monitor after applying filters. Check SHOW_ONLY_TYPES / SHOW_ONLY_SETS.');
    process.exit(0);
  }

  // Resolve local store locations for stores that support it
  if (config.zipCode) {
    for (const store of activeStores) {
      if (store.supportsLocalStock) {
        store.localStores = await resolveLocalStores(
          store.name,
          config.zipCode,
          config.localStoreCount
        );
      }
    }
  } else {
    const localStoreNames = activeStores.filter(s => s.supportsLocalStock).map(s => s.name);
    if (localStoreNames.length > 0) {
      logger.warn(
        `ZIPCODE not set — local stock checks disabled for: ${localStoreNames.join(', ')}`
      );
    }
  }

  // Launch browser only if needed
  const needsBrowser = activeStores.some(
    s => s.strategy === 'puppeteer' || s.customCheck != null
  );
  const browser = needsBrowser ? await getBrowser() : undefined;

  logger.info(
    `Monitoring ${activeStores.length} store(s): ${activeStores.map(s => s.name).join(', ')}`
  );
  logger.info(
    `Products per store: ${activeStores.map(s => `${s.name}(${s.products.length})`).join(' ')}`
  );

  const runOnce = process.argv.includes('--once');

  if (runOnce) {
    // Single pass: check all stores in parallel, print summary, exit.
    // Stores run concurrently (matching continuous-mode behavior); products
    // within each store stay sequential to keep cookies/sessions coherent.
    const skipped404 = new Set<string>();
    await Promise.all(
      activeStores.map(async store => {
        logger.info(`[${store.name}] Checking ${store.products.length} products...`);
        try {
          await pollStore(store, db, browser, skipped404);
        } catch (err) {
          logger.error(`[${store.name}] Error: ${err}`);
        }
      }),
    );

    const rows = db.getBestPrices();
    if (rows.length > 0) {
      printSummary(rows);
      if (mdPath) {
        writeMarkdownSummary(rows, mdPath);
        logger.info(`Wrote markdown summary to ${mdPath}`);
      }
    } else {
      logger.info('No in-stock items found.');
    }

    await closeBrowser();
    db.close();
    return;
  }

  // Start one polling loop per store
  for (const store of activeStores) {
    startPolling(store, db, browser);
  }

  // Print consolidated summary every 60s (not per-store)
  startSummaryPrinter(db, 60000);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down...');
    await closeBrowser();
    db.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Shutting down...');
    await closeBrowser();
    db.close();
    process.exit(0);
  });
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
