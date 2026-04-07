# Pokestop Design Spec
_Date: 2026-04-07_

## Overview

Pokestop is a Pokemon card product stock and price monitor. It polls a configurable set of retailers on a randomized interval, records in-stock status and price to a SQLite database, and logs a live summary table to the terminal. It is built from scratch in TypeScript/Node.js, inspired by the architecture of streetmerchant but purpose-built for Pokemon products — no GPU/CPU domain concepts.

---

## Goals

- Monitor booster boxes, ETBs, tins, blister packs, collection boxes, and bundles across 7 retailers
- Track in-stock status and price independently — a product can be recorded as in stock even when price parsing fails
- Persist all checks to SQLite for price history and cross-store comparison
- Surface lowest in-stock price per product across all stores in the terminal
- Terminal-only output for now (no external notifications)

---

## Retailers

| Store | Strategy | Local Stock |
|-------|----------|-------------|
| Amazon | `fetch` | No (online only) |
| Best Buy | `fetch` | Yes |
| GameStop | `fetch` | Yes |
| Pokemon Center | `puppeteer` (heavy client-side rendering) | No (online only) |
| Target | `fetch` | Yes |
| TCGPlayer | `fetch` | No (online only) |
| Walmart | `fetch` | Yes |

Strategy is declared per store. Puppeteer is only launched if at least one active store requires it.

Stores that support local stock resolve a zip code to nearby store locations at startup, then check both online and in-store availability on each poll cycle.

---

## Directory Structure

```
pokestop/
├── src/
│   ├── index.ts              # Entry point: loads stores, resolves local stores, starts polling loops
│   ├── config.ts             # Loads and validates .env
│   ├── logger.ts             # Winston terminal logger + summary table printer
│   ├── poller.ts             # Per-store polling loop (setTimeout recursion)
│   ├── checker.ts            # Dispatches fetch vs puppeteer strategy, extracts stock/price
│   ├── browser.ts            # Shared Puppeteer browser lifecycle (lazy init)
│   ├── db.ts                 # SQLite interface (better-sqlite3)
│   ├── filter.ts             # Filters products by type/set from env config
│   ├── price.ts              # Price string parsing utility
│   ├── local-stores.ts       # Resolves zip code → nearest store locations per retailer
│   └── store/
│       ├── model.ts          # Core types: Store, Product, Labels, Strategy, PriceRecord
│       ├── index.ts          # Exports only stores listed in STORES env var
│       ├── amazon.ts
│       ├── bestbuy.ts
│       ├── gamestop.ts
│       ├── pokemoncenter.ts
│       ├── target.ts
│       ├── tcgplayer.ts
│       └── walmart.ts
├── data/                     # SQLite DB lives here (gitignored)
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Data Models

### `store/model.ts`

```typescript
type Strategy = 'fetch' | 'puppeteer';

type ProductType = 'booster-box' | 'etb' | 'tin' | 'blister' | 'collection-box' | 'bundle';

type Product = {
  canonicalName: string;  // Shared identity across stores, e.g. "Prismatic Evolutions ETB"
  name: string;           // Store-specific listing name (used in logs)
  type: ProductType;
  set?: string;           // e.g. "Prismatic Evolutions", "Surging Sparks"
  url: string;
  cartUrl?: string;
};

type Labels = {
  container?: string;    // CSS selector to scope all searches (default: 'body')
  inStock?: string[];    // Text strings or CSS selectors indicating in stock
  outOfStock?: string[]; // Text strings or CSS selectors indicating out of stock (overrides inStock)
  price?: string;        // CSS selector for the price element
};

type LocalStoreLocation = {
  storeId: string;       // Retailer-specific store ID
  name: string;          // e.g. "Target - Springfield"
  address: string;       // Human-readable address
  distanceMiles: number;
};

type Store = {
  name: string;
  strategy: Strategy;
  labels: Labels;
  products: Product[];
  minSleep: number;      // ms between poll cycles
  maxSleep: number;
  headers?: Record<string, string>;
  supportsLocalStock: boolean;
  localStores?: LocalStoreLocation[];  // Populated at startup via local-stores.ts; empty until resolved
  buildLocalUrl?: (product: Product, storeId: string) => string;  // Constructs per-store local availability URL
};
```

### `PriceRecord` (written to DB)

```typescript
type Channel = 'online' | 'in-store';

type PriceRecord = {
  canonicalName: string;
  store: string;
  channel: Channel;
  storeLocation?: string;  // e.g. "Target - Springfield, 123 Main St" — only set when channel = 'in-store'
  inStock: boolean;
  price: number | null;    // null if price couldn't be parsed; inStock tracked independently
  url: string;
  checkedAt: string;       // ISO 8601 timestamp
};
```

`inStock` and `price` are always set independently:

| Scenario | inStock | price |
|----------|---------|-------|
| In stock, price parsed | `true` | `44.99` |
| In stock, price parse fails | `true` | `null` |
| Out of stock | `false` | `null` |

Each local store check produces its own `PriceRecord` (one per `storeId`), so in-store availability is tracked per location.

---

## Polling & Check Flow

### Startup (`index.ts`)

1. Load config from `.env`
2. Determine active stores from `STORES` env var; apply `SHOW_ONLY_TYPES` / `SHOW_ONLY_SETS` filters
3. For each active store where `supportsLocalStock: true`, call `local-stores.ts` to resolve `ZIPCODE` + `LOCAL_STORE_COUNT` → populate `store.localStores[]`
4. If any active store uses `strategy: 'puppeteer'`, lazily launch shared Chromium instance
5. Initialize SQLite DB (create tables if not exist)
6. For each active store, kick off an independent `setTimeout` polling loop

### Per-store loop (`poller.ts`)

```
tryPollAndLoop(store)
  → checker.checkStore(store)
      → for each product in store.products:
          // Online check
          fetch/puppeteer → detect stock + price → db.insertPrice({channel: 'online', ...})

          // Local store checks (only if supportsLocalStock and localStores populated)
          for each localStore in store.localStores:
            store.buildLocalUrl(product, localStore.storeId)
            → fetch → detect stock + price
            → db.insertPrice({channel: 'in-store', storeLocation: localStore.name + address, ...})

          → logger.logCheck(record)
  → logger.printSummary(db.getBestPrices())
  → sleep(random between minSleep and maxSleep)
  → reschedule self
```

### Stock & Price Detection (`checker.ts`)

1. Parse HTML (cheerio) or puppeteer page content
2. Search `container` scope (default `body`) for `outOfStock` labels first — if matched, `inStock = false`
3. If no out-of-stock match, search for `inStock` labels — if matched, `inStock = true`
4. If neither `outOfStock` nor `inStock` labels match, default to `inStock = false` (assume out of stock when status is indeterminate)
5. Attempt to extract price text from `labels.price` selector, parse via `price.ts`
6. If price selector not found or text unparseable, `price = null` — does not affect `inStock`

---

## Database (`db.ts`)

- `better-sqlite3` (synchronous, no async complexity)
- DB file path from `DB_PATH` env var (default: `./data/prices.db`)

### Schema

```sql
CREATE TABLE IF NOT EXISTS prices (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  canonicalName TEXT NOT NULL,
  store         TEXT NOT NULL,
  channel       TEXT NOT NULL DEFAULT 'online',  -- 'online' | 'in-store'
  storeLocation TEXT,                             -- NULL for online; "Target - Springfield, 123 Main St" for in-store
  inStock       INTEGER NOT NULL,                 -- 0 or 1
  price         REAL,                             -- NULL if parse failed
  url           TEXT NOT NULL,
  checkedAt     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_canonical_store ON prices (canonicalName, store, channel);
```

### Operations

- `insertPrice(record)` — inserts a new row (full history retained; never overwrites)
- `getBestPrices()` — returns latest record per (canonicalName, store, channel, storeLocation), then picks lowest in-stock price per canonicalName across all channels and locations. Also returns in-stock rows with `price = null` separately, noting whether they are online or in-store.
- `getPriceHistory(canonicalName)` — all rows for a product ordered by `checkedAt DESC`

---

## Terminal Output (`logger.ts`)

After each full poll cycle, prints a summary table:

```
┌─────────────────────────────────┬──────────────┬──────────────────────────────┬────────┬───────┬──────────────┐
│ Product                         │ Store        │ Location                     │ Price  │ Stock │ Last Checked │
├─────────────────────────────────┼──────────────┼──────────────────────────────┼────────┼───────┼──────────────┤
│ Prismatic Evolutions ETB        │ target       │ online                       │ $49.99 │  ✓    │ 10:32:01     │
│ Prismatic Evolutions ETB        │ target       │ Target - Springfield         │ $44.99 │  ✓    │ 10:32:02     │
│ Prismatic Evolutions ETB        │ target       │ Target - Shelbyville         │   —    │  ✓    │ 10:32:03     │
│ Prismatic Evolutions ETB        │ walmart      │ online                       │ $49.99 │  ✓    │ 10:32:04     │
│ Prismatic Evolutions ETB        │ amazon       │ online                       │   —    │  ✓    │ 10:32:09     │
│ Surging Sparks Booster Box      │ bestbuy      │ online                       │ $89.99 │  ✓    │ 10:32:12     │
│ Surging Sparks Booster Box      │ bestbuy      │ Best Buy - Capitol City      │ $89.99 │  ✓    │ 10:32:13     │
└─────────────────────────────────┴──────────────┴──────────────────────────────┴────────┴───────┴──────────────┘
Best prices:
  Prismatic Evolutions ETB      → Target - Springfield (in-store) @ $44.99
  Surging Sparks Booster Box    → bestbuy online @ $89.99
  (* amazon has Prismatic Evolutions ETB in stock online but price unavailable)
  (* Target - Shelbyville has Prismatic Evolutions ETB in stock but price unavailable)
```

In-stock rows with `price = null` are shown with `—` and called out in the best-prices footer, with channel noted.

---

## Configuration (`.env`)

```
# Comma-separated list of active stores
STORES=target,walmart,bestbuy,gamestop,amazon,pokemoncenter,tcgplayer

# Optional filters (omit to monitor everything)
SHOW_ONLY_TYPES=etb,booster-box
SHOW_ONLY_SETS=Prismatic Evolutions

# Local store lookup (required for Target, Best Buy, Walmart, GameStop)
ZIPCODE=62701
LOCAL_STORE_COUNT=3    # Number of nearest stores to check per retailer

# Polling intervals (ms)
PAGE_SLEEP_MIN=10000
PAGE_SLEEP_MAX=20000

# Navigation timeout (ms)
PAGE_TIMEOUT=30000

# SQLite database path
DB_PATH=./data/prices.db

# Logging
LOG_LEVEL=info
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| HTTP 429 / 503 | Exponential backoff (2× per retry, max 5 retries), log warning |
| HTTP 404 | Log once, skip product for remainder of session |
| Price parse failure | Log warning, store `price: null`, continue |
| Puppeteer navigation timeout | Log error, skip product, continue loop |
| DB write failure | Log error, continue polling (monitoring runs even if DB unavailable) |

---

## Testing

- Unit tests for `filter.ts` — product type and set filtering
- Unit tests for `price.ts` — parse `$44.99`, `$1,299.00`, missing/malformed price strings
- Unit tests for `db.ts` — insert, `getBestPrices()` with null prices and mixed online/in-store records, `getPriceHistory()`
- No automated browser/network tests — integration tested manually per store
- `local-stores.ts` store resolution tested manually against live retailer APIs

---

## Out of Scope (v1)

- External notifications (Discord, SMS, email) — terminal only for now
- Auto-checkout / cart URLs (defined in model but not acted on)
- Web dashboard / REST API
- Price alerts / thresholds
