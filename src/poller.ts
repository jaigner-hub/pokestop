import type {Browser} from 'puppeteer';
import type {Store} from './store/model';
import {getMsrp} from './store/model';
import {checkOnline, checkLocalStore, NotFoundError} from './checker';
import {RateLimitError} from './store/target';
import {logCheck, logger, printSummary} from './logger';
import {isNewInStock, sendDiscordAlert, peekFirstSeen} from './notify';
import {config} from './config';
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
        const result = store.customCheck
          ? await store.customCheck(product, undefined, config.zipCode ?? undefined)
          : await checkOnline(store, product, browser);
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
        logCheck({...record, msrp: getMsrp(product), firstSeen: peekFirstSeen(record)});
        if (isNewInStock(record)) {
          void sendDiscordAlert(record);
        }
      } catch (err) {
        if (err instanceof NotFoundError) {
          logger.warn(`[${store.name}] ${product.canonicalName} not found (404) — skipping for session`);
          skipped404.add(product.url);
        } else if (err instanceof RateLimitError) {
          logger.warn(`[${store.name}] Rate limited — pausing 60s before continuing`);
          await new Promise(r => setTimeout(r, 60000));
        } else {
          logger.error(`[${store.name}] Error checking ${product.canonicalName} online: ${err}`);
        }
      }
    }

    // ── Local store checks ────────────────────────────────────────────────
    if (store.supportsLocalStock && store.localStores.length > 0) {
      for (const localStore of store.localStores) {
        try {
          let result;
          let localUrl: string;

          if (store.customCheck) {
            result = await store.customCheck(product, localStore.storeId, config.zipCode ?? undefined);
            localUrl = store.buildLocalUrl
              ? store.buildLocalUrl(product, localStore.storeId)
              : product.url;
          } else if (store.buildLocalUrl) {
            localUrl = store.buildLocalUrl(product, localStore.storeId);
            if (skipped404.has(localUrl)) continue;
            result = await checkLocalStore(
              product,
              localStore.storeId,
              store.buildLocalUrl,
              store.labels,
              store.headers
            );
          } else {
            continue;
          }

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
          logCheck({...record, msrp: getMsrp(product), firstSeen: peekFirstSeen(record)});
          if (isNewInStock(record)) {
            void sendDiscordAlert(record);
          }
        } catch (err) {
          const localUrl = store.buildLocalUrl
            ? store.buildLocalUrl(product, localStore.storeId)
            : product.url;
          if (err instanceof NotFoundError) {
            logger.warn(`[${store.name}] ${product.canonicalName} not found at ${localStore.name} (404) — skipping`);
            skipped404.add(localUrl);
          } else if (err instanceof RateLimitError) {
            logger.warn(`[${store.name}] Rate limited — pausing 60s before continuing`);
            await new Promise(r => setTimeout(r, 60000));
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
    logger.debug(`[${store.name}] Starting poll cycle`);
    try {
      await pollStore(store, db, browser, skipped404);
    } catch (err) {
      logger.error(`[${store.name}] Unexpected error in poll cycle: ${err}`);
    }
    const sleepMs = getSleepTime(store);
    logger.debug(`[${store.name}] Next poll in ${Math.round(sleepMs / 1000)}s`);
    setTimeout(() => void tryPollAndLoop(), sleepMs);
  }

  setTimeout(() => void tryPollAndLoop(), getSleepTime(store));
}

// Consolidated summary: prints once every interval instead of per-store.
// Call this from index.ts after starting all polling loops.
export function startSummaryPrinter(db: Db, intervalMs = 60000): void {
  async function printLoop(): Promise<void> {
    const rows = db.getBestPrices();
    // Only show MSRP/retail hits prominently; 3P gets a condensed count
    const retailRows = rows.filter(r => {
      if (r.price == null) return true; // Show price-unknown in-stock items
      const name = r.canonicalName.toLowerCase();
      let msrp = 49.99;
      if (name.includes('booster box') || name.includes('display')) msrp = 143.64;
      else if (name.includes('bundle')) msrp = 26.99;
      else if (name.includes('upc') || name.includes('ultra premium')) msrp = 119.99;
      return r.price <= msrp * 1.2;
    });
    const scalperCount = rows.length - retailRows.length;

    if (retailRows.length > 0) {
      printSummary(retailRows);
    }
    if (scalperCount > 0) {
      logger.info(`(${scalperCount} additional 3P/scalper listings hidden — set LOG_LEVEL=debug to see all)`);
    }
    if (retailRows.length === 0 && scalperCount === 0) {
      logger.info('No in-stock items found.');
    } else if (retailRows.length === 0 && scalperCount > 0) {
      logger.info(`No retail-price stock found. ${scalperCount} 3P listings only.`);
    }

    setTimeout(printLoop, intervalMs);
  }

  // First print after 30s (let initial polls complete), then every intervalMs
  setTimeout(printLoop, 30000);
}
