import BetterSqlite3 from 'better-sqlite3';
import type {PriceRecord} from './store/model';

export type PriceRow = {
  id: number;
  canonicalName: string;
  store: string;
  channel: string;
  storeLocation: string | null;
  inStock: boolean;
  price: number | null;
  url: string;
  checkedAt: string;
};

export class Db {
  private sqlite: BetterSqlite3.Database;

  constructor(path: string) {
    this.sqlite = new BetterSqlite3(path);
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS prices (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        canonicalName TEXT NOT NULL,
        store         TEXT NOT NULL,
        channel       TEXT NOT NULL DEFAULT 'online',
        storeLocation TEXT,
        inStock       INTEGER NOT NULL,
        price         REAL,
        url           TEXT NOT NULL,
        checkedAt     TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_canonical_store
        ON prices (canonicalName, store, channel);
    `);
  }

  insertPrice(record: PriceRecord): void {
    this.sqlite
      .prepare(
        `INSERT INTO prices (canonicalName, store, channel, storeLocation, inStock, price, url, checkedAt)
         VALUES (@canonicalName, @store, @channel, @storeLocation, @inStock, @price, @url, @checkedAt)`
      )
      .run({
        canonicalName: record.canonicalName,
        store: record.store,
        channel: record.channel,
        storeLocation: record.storeLocation ?? null,
        inStock: record.inStock ? 1 : 0,
        price: record.price ?? null,
        url: record.url,
        checkedAt: record.checkedAt,
      });
  }

  // Returns all latest in-stock records per (canonicalName, store, channel, storeLocation).
  // "Latest" = the most recent checkedAt for that combination.
  getBestPrices(): PriceRow[] {
    const rows = this.sqlite
      .prepare(
        `SELECT p.*
         FROM prices p
         INNER JOIN (
           SELECT canonicalName, store, channel,
                  COALESCE(storeLocation, '') AS sl,
                  MAX(checkedAt) AS maxChecked
           FROM prices
           GROUP BY canonicalName, store, channel, COALESCE(storeLocation, '')
         ) latest
           ON p.canonicalName = latest.canonicalName
          AND p.store = latest.store
          AND p.channel = latest.channel
          AND COALESCE(p.storeLocation, '') = latest.sl
          AND p.checkedAt = latest.maxChecked
         WHERE p.inStock = 1
         ORDER BY p.canonicalName, p.price ASC`
      )
      .all() as Array<Omit<PriceRow, 'inStock'> & {inStock: number}>;

    return rows.map(r => ({...r, inStock: Boolean(r.inStock)}));
  }

  getPriceHistory(canonicalName: string): PriceRow[] {
    const rows = this.sqlite
      .prepare(
        `SELECT * FROM prices WHERE canonicalName = ? ORDER BY checkedAt DESC`
      )
      .all(canonicalName) as Array<Omit<PriceRow, 'inStock'> & {inStock: number}>;

    return rows.map(r => ({...r, inStock: Boolean(r.inStock)}));
  }

  close(): void {
    this.sqlite.close();
  }
}
