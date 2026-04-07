# Pokestop — Session Handoff

## What This Project Is

**Pokestop** is a Pokemon card product stock and price monitor. It polls 7 retailers on a randomized interval, records in-stock status and price to a SQLite database, and displays a live terminal summary showing in-stock status and lowest prices across all stores and locations (both online and in-store).

## Current State: FULLY IMPLEMENTED

All tasks (1-18) are complete. The project compiles, all 27 tests pass, and is ready to run.

### Key Improvements Made

| Enhancement | Details |
|-------------|---------|
| Target Redsky API | Uses structured JSON fulfillment API instead of HTML scraping — real availability data per store |
| Walmart __NEXT_DATA__ | Extracts product data from Next.js embedded JSON for reliability |
| GameStop Puppeteer | Switched from fetch to puppeteer (Cloudflare blocks plain HTTP) |
| Journey Together | Added newest Pokemon set across all stores |
| More products | Prismatic Evolutions expanded (Binder Collection, Surprise Box, etc.) |

### Monitored Products

- **Prismatic Evolutions**: ETB, Booster Bundle, Binder Collection, Surprise Box
- **Surging Sparks**: ETB, Booster Box, Booster Bundle
- **Journey Together**: ETB, Booster Bundle, Booster Box

### Retailers

| Store | Strategy | Local Stock | Special |
|-------|----------|-------------|---------|
| Target | Redsky JSON API | Yes (API per-store) | Custom `checkTargetFulfillment()` |
| Best Buy | fetch + HTML | Yes | |
| Walmart | fetch + `__NEXT_DATA__` | Yes | Custom `checkWalmartProduct()` |
| GameStop | puppeteer | Yes | Cloudflare requires browser |
| Amazon | fetch + HTML | No | Aggressive bot detection |
| Pokemon Center | puppeteer | No | SPA + Cloudflare |
| TCGPlayer | fetch + HTML | No | |

## How to Run

```bash
cp .env.example .env
# Edit .env: set ZIPCODE to your zip code
npm start
```

## Architecture

- **Language:** TypeScript 5, Node.js
- **Database:** SQLite via `better-sqlite3` — full price history retained
- **Key design:** `inStock` and `price` tracked independently
- **Custom checks:** Stores can provide `customCheck` function for API-based checking instead of HTML scraping
- **Local stock:** Target, Best Buy, Walmart, GameStop resolve zip code to nearby stores at startup

## Key Documents

| Document | Path |
|----------|------|
| Design spec | `docs/superpowers/specs/2026-04-07-pokestop-design.md` |
| Implementation plan | `docs/superpowers/plans/2026-04-07-pokestop.md` |
