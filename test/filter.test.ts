import assert from 'assert';
import {filterProducts} from '../src/filter';
import type {Product} from '../src/store/model';

const products: Product[] = [
  {canonicalName: 'PE ETB', name: 'PE ETB', type: 'etb', set: 'Prismatic Evolutions', url: 'https://example.com/1'},
  {canonicalName: 'SS Box', name: 'SS Box', type: 'booster-box', set: 'Surging Sparks', url: 'https://example.com/2'},
  {canonicalName: 'PE Tin', name: 'PE Tin', type: 'tin', set: 'Prismatic Evolutions', url: 'https://example.com/3'},
  {canonicalName: 'No Set Bundle', name: 'Bundle', type: 'bundle', url: 'https://example.com/4'},
];

describe('filterProducts', () => {
  it('returns all products when no filters active', () => {
    const result = filterProducts(products, null, null);
    assert.strictEqual(result.length, 4);
  });

  it('filters by type', () => {
    const result = filterProducts(products, ['etb', 'booster-box'], null);
    assert.strictEqual(result.length, 2);
    assert.ok(result.every(p => p.type === 'etb' || p.type === 'booster-box'));
  });

  it('filters by set name', () => {
    const result = filterProducts(products, null, ['Prismatic Evolutions']);
    // Products with matching set are included; products with no set are also included
    const names = result.map(p => p.canonicalName);
    assert.ok(names.includes('PE ETB'));
    assert.ok(names.includes('PE Tin'));
    assert.ok(names.includes('No Set Bundle')); // no set = not excluded
    assert.ok(!names.includes('SS Box'));
  });

  it('combines type and set filters', () => {
    const result = filterProducts(products, ['etb'], ['Prismatic Evolutions']);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].canonicalName, 'PE ETB');
  });

  it('returns empty array when no products match', () => {
    const result = filterProducts(products, ['blister'], null);
    assert.strictEqual(result.length, 0);
  });

  it('returns all products when type filter is empty array', () => {
    const result = filterProducts(products, [], null);
    assert.strictEqual(result.length, 4);
  });
});
