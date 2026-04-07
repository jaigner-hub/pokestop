import assert from 'assert';
import {parsePrice} from '../src/price';

describe('parsePrice', () => {
  it('parses a simple dollar amount', () => {
    assert.strictEqual(parsePrice('$44.99'), 44.99);
  });

  it('parses a price with comma thousands separator', () => {
    assert.strictEqual(parsePrice('$1,299.00'), 1299.00);
  });

  it('parses a price without dollar sign', () => {
    assert.strictEqual(parsePrice('44.99'), 44.99);
  });

  it('returns null for empty string', () => {
    assert.strictEqual(parsePrice(''), null);
  });

  it('returns null for null input', () => {
    assert.strictEqual(parsePrice(null), null);
  });

  it('returns null for undefined input', () => {
    assert.strictEqual(parsePrice(undefined), null);
  });

  it('returns null for non-price text', () => {
    assert.strictEqual(parsePrice('Out of stock'), null);
  });

  it('returns null for bare dollar sign', () => {
    assert.strictEqual(parsePrice('$'), null);
  });

  it('returns the first price in a range', () => {
    assert.strictEqual(parsePrice('$44.99 - $49.99'), 44.99);
  });

  it('parses a whole-dollar price', () => {
    assert.strictEqual(parsePrice('$50'), 50);
  });
});
