import type {Browser} from 'puppeteer';

export type Strategy = 'fetch' | 'puppeteer' | 'custom';

export type ProductType =
  | 'booster-box'
  | 'etb'
  | 'tin'
  | 'blister'
  | 'collection-box'
  | 'bundle'
  | 'mini-tin'
  | 'upc';

export type Channel = 'online' | 'in-store';

export type Product = {
  canonicalName: string; // Shared identity across stores, e.g. "Prismatic Evolutions ETB"
  name: string;          // Store-specific listing name (used in logs)
  type: ProductType;
  set?: string;          // e.g. "Prismatic Evolutions", "Surging Sparks"
  url: string;
  cartUrl?: string;
  msrp?: number;         // Override per-product MSRP (otherwise uses type default)
};

// Default MSRP by product type
export const DEFAULT_MSRP: Record<ProductType, number> = {
  'etb': 49.99,
  'booster-box': 143.64,
  'bundle': 26.99,
  'tin': 24.99,
  'blister': 13.99,
  'collection-box': 39.99,
  'mini-tin': 8.99,
  'upc': 119.99,
};

// Returns MSRP for a product (per-product override > type default)
export function getMsrp(product: Product): number {
  return product.msrp ?? DEFAULT_MSRP[product.type] ?? 49.99;
}

// Price is "retail" if within 20% of MSRP. Above that = 3rd party/scalper.
export function isRetailPrice(price: number, product: Product): boolean {
  const msrp = getMsrp(product);
  return price <= msrp * 1.2;
}

export type Labels = {
  container?: string;    // CSS selector to scope all searches (default: 'body')
  inStock?: string[];    // Text strings OR CSS selectors (start with . # [) indicating in stock
  outOfStock?: string[]; // Text strings OR CSS selectors indicating out of stock (checked first)
  price?: string;        // CSS selector for the price element
};

export type LocalStoreLocation = {
  storeId: string;       // Retailer-specific store ID
  name: string;          // e.g. "Target - Springfield"
  address: string;       // Human-readable address
  distanceMiles: number;
};

export type CheckResult = {
  inStock: boolean;
  price: number | null;
};

// Custom check function for stores that use APIs or Puppeteer directly.
// When defined, the poller calls this instead of the generic HTML checker.
// Signature varies by store — API checks use (product, storeId?, zipCode?),
// Puppeteer checks use (product, browser?). We use a loose type here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CustomCheckFn = (product: Product, ...args: any[]) => Promise<CheckResult>;

export type Store = {
  name: string;
  strategy: Strategy;
  labels: Labels;
  products: Product[];
  minSleep: number;      // ms — minimum between poll cycles
  maxSleep: number;      // ms — maximum between poll cycles
  headers?: Record<string, string>;
  supportsLocalStock: boolean;
  localStores: LocalStoreLocation[];  // Populated at startup; empty array until resolved
  buildLocalUrl?: (product: Product, storeId: string) => string;
  customCheck?: CustomCheckFn;  // API-based check (overrides HTML scraping)
};

export type PriceRecord = {
  canonicalName: string;
  store: string;
  channel: Channel;
  storeLocation?: string;  // "Target - Springfield, 123 Main St" — only for in-store
  inStock: boolean;
  price: number | null;    // null if price parse failed; independent of inStock
  url: string;
  checkedAt: string;       // ISO 8601 timestamp
};

// Shape returned by db.getBestPrices() rows
export type PriceRow = {
  id: number;
  canonicalName: string;
  store: string;
  channel: string;
  storeLocation: string | null;
  inStock: number;   // SQLite stores as 0/1
  price: number | null;
  url: string;
  checkedAt: string;
};
