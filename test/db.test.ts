import assert from 'assert';
import fs from 'fs';
import {Db} from '../src/db';
import type {PriceRecord} from '../src/store/model';

const TEST_DB = './test/test.db';

function makeRecord(overrides: Partial<PriceRecord> = {}): PriceRecord {
  return {
    canonicalName: 'Prismatic Evolutions ETB',
    store: 'target',
    channel: 'online',
    inStock: true,
    price: 44.99,
    url: 'https://target.com/product',
    checkedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('Db', () => {
  let db: Db;

  beforeEach(() => {
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
    db = new Db(TEST_DB);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  });

  describe('insertPrice', () => {
    it('inserts a record without error', () => {
      assert.doesNotThrow(() => db.insertPrice(makeRecord()));
    });

    it('retains full history (multiple inserts for same product)', () => {
      db.insertPrice(makeRecord({checkedAt: '2026-01-01T10:00:00.000Z'}));
      db.insertPrice(makeRecord({checkedAt: '2026-01-01T11:00:00.000Z', price: 42.99}));
      const history = db.getPriceHistory('Prismatic Evolutions ETB');
      assert.strictEqual(history.length, 2);
    });

    it('stores inStock as boolean-convertible integer', () => {
      db.insertPrice(makeRecord({inStock: false, price: null}));
      const history = db.getPriceHistory('Prismatic Evolutions ETB');
      assert.strictEqual(history[0].inStock, false);
    });
  });

  describe('getBestPrices', () => {
    it('returns empty array when no records', () => {
      const results = db.getBestPrices();
      assert.strictEqual(results.length, 0);
    });

    it('returns only in-stock records', () => {
      db.insertPrice(makeRecord({inStock: true, price: 44.99}));
      db.insertPrice(makeRecord({store: 'walmart', inStock: false, price: null}));
      const results = db.getBestPrices();
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].store, 'target');
    });

    it('returns the latest record per (canonicalName, store, channel, storeLocation)', () => {
      const earlier = '2026-01-01T10:00:00.000Z';
      const later = '2026-01-01T11:00:00.000Z';
      db.insertPrice(makeRecord({checkedAt: earlier, price: 49.99}));
      db.insertPrice(makeRecord({checkedAt: later, price: 44.99}));
      const results = db.getBestPrices();
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].price, 44.99);
    });

    it('returns in-stock records with null price', () => {
      db.insertPrice(makeRecord({price: null}));
      const results = db.getBestPrices();
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].price, null);
    });

    it('returns separate records for online and in-store channels', () => {
      db.insertPrice(makeRecord({channel: 'online', price: 49.99}));
      db.insertPrice(makeRecord({
        channel: 'in-store',
        storeLocation: 'Target - Springfield, 123 Main St',
        price: 44.99,
      }));
      const results = db.getBestPrices();
      assert.strictEqual(results.length, 2);
    });

    it('returns separate records for different in-store locations', () => {
      db.insertPrice(makeRecord({
        channel: 'in-store',
        storeLocation: 'Target - Springfield, 123 Main St',
        price: 44.99,
      }));
      db.insertPrice(makeRecord({
        channel: 'in-store',
        storeLocation: 'Target - Shelbyville, 456 Oak Ave',
        price: null,
      }));
      const results = db.getBestPrices();
      assert.strictEqual(results.length, 2);
    });
  });

  describe('getPriceHistory', () => {
    it('returns all records for a canonical name ordered by checkedAt DESC', () => {
      db.insertPrice(makeRecord({checkedAt: '2026-01-01T10:00:00.000Z', price: 49.99}));
      db.insertPrice(makeRecord({checkedAt: '2026-01-01T11:00:00.000Z', price: 44.99}));
      db.insertPrice(makeRecord({
        canonicalName: 'Other Product',
        checkedAt: '2026-01-01T10:00:00.000Z',
        price: 20.00,
      }));
      const history = db.getPriceHistory('Prismatic Evolutions ETB');
      assert.strictEqual(history.length, 2);
      assert.strictEqual(history[0].price, 44.99); // most recent first
      assert.strictEqual(history[1].price, 49.99);
    });

    it('returns empty array for unknown product', () => {
      const history = db.getPriceHistory('Unknown Product');
      assert.strictEqual(history.length, 0);
    });
  });
});
