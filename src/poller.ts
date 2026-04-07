import type {Browser} from 'puppeteer';
import type {Store} from './store/model';
import {checkOnline, checkLocalStore, NotFoundError} from './checker';
import {logCheck, logger, printSummary} from './logger';
import type {Db} from './db';

function getSleepTime(store: Store): number {
  return store.minSleep + Math.random() * (store.maxSleep - store.minSleep);
}

async function pollStore(
  store: Store,
  db: Db,
  browser: Browser | undefined,
  skipped404: Set<string>
): Promise<void> {
  for (const product of store.products) {
    // ── Online check ──────────────────────────────────────────────────────
    if (!skipped404.has(product.url)) {
      try {
        const result = await checkOnline(store, product, browser);
        const record = {
          canonicalName: product.canonicalName,
          store: store.name,
          channel: 'online' as const,
          inStock: result.inStock,
          price: result.price,
          url: product.url,
          checkedAt: new Date().toISOString(),
        };
        try {
          db.insertPrice(record);
        } catch (dbErr) {
          logger.error(`[${store.name}] DB write failed: ${dbErr}`);
        }
        logCheck(record);
      } catch (err) {
        if (err instanceof NotFoundError) {
          logger.warn(`[${store.name}] ${product.canonicalName} not found (404) — skipping for session`);
          skipped404.add(product.url);
        } else {
          logger.error(`[${store.name}] Error checking ${product.canonicalName} online: ${err}`);
        }
      }
    }

    // ── Local store checks ────────────────────────────────────────────────
    if (store.supportsLocalStock && store.localStores.length > 0 && store.buildLocalUrl) {
      for (const localStore of store.localStores) {
        const localUrl = store.buildLocalUrl(product, localStore.storeId);
        if (skipped404.has(localUrl)) continue;

        try {
          const result = await checkLocalStore(
            product,
            localStore.storeId,
            store.buildLocalUrl,
            store.labels,
            store.headers
          );
          const record = {
            canonicalName: product.canonicalName,
            store: store.name,
            channel: 'in-store' as const,
            storeLocation: `${localStore.name}, ${localStore.address}`,
            inStock: result.inStock,
            price: result.price,
            url: localUrl,
            checkedAt: new Date().toISOString(),
          };
          try {
            db.insertPrice(record);
          } catch (dbErr) {
            logger.error(`[${store.name}] DB write failed: ${dbErr}`);
          }
          logCheck(record);
        } catch (err) {
          if (err instanceof NotFoundError) {
            logger.warn(`[${store.name}] ${product.canonicalName} not found at ${localStore.name} (404) — skipping`);
            skipped404.add(localUrl);
          } else {
            logger.error(`[${store.name}] Error checking ${product.canonicalName} at ${localStore.name}: ${err}`);
          }
        }
      }
    }
  }
}

export function startPolling(store: Store, db: Db, browser?: Browser): void {
  const skipped404 = new Set<string>();

  async function tryPollAndLoop(): Promise<void> {
    logger.info(`[${store.name}] Starting poll cycle (${store.products.length} products)`);
    try {
      await pollStore(store, db, browser, skipped404);
      printSummary(db.getBestPrices());
    } catch (err) {
      logger.error(`[${store.name}] Unexpected error in poll cycle: ${err}`);
    }
    const sleepMs = getSleepTime(store);
    logger.info(`[${store.name}] Next poll in ${Math.round(sleepMs / 1000)}s`);
    setTimeout(() => void tryPollAndLoop(), sleepMs);
  }

  // Start first poll quickly (1-3s jitter to stagger stores)
  const initialDelay = 1000 + Math.random() * 2000;
  logger.info(`[${store.name}] First poll in ${Math.round(initialDelay / 1000)}s`);
  setTimeout(() => void tryPollAndLoop(), initialDelay);
}
