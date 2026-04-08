import type {Browser} from 'puppeteer';

export type Strategy = 'fetch' | 'puppeteer' | 'custom';

export type CheckResult = {
  inStock: boolean;
  price: number | null;
};

export type CustomChecker = (
  product: Product,
  browser?: Browser
) => Promise<CheckResult>;

export type ProductType =
  | 'booster-box'
  | 'etb'
  | 'tin'
  | 'blister'
  | 'collection-box'
  | 'bundle';

export type Channel = 'online' | 'in-store';

export type Product = {
  canonicalName: string; // Shared identity across stores, e.g. "Prismatic Evolutions ETB"
  name: string;          // Store-specific listing name (used in logs)
  type: ProductType;
  set?: string;          // e.g. "Prismatic Evolutions", "Surging Sparks"
  url: string;
  cartUrl?: string;
};

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
  customChecker?: CustomChecker;
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
