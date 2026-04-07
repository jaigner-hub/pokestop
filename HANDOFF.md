# Pokestop — Session Handoff

## What This Project Is

**Pokestop** is a Pokemon card product stock and price monitor. It polls 7 retailers on a randomized interval, records in-stock status and price to a SQLite database, and displays a live terminal summary showing in-stock status and lowest prices across all stores and locations (both online and in-store).

## Key Documents

| Document | Path |
|----------|------|
| Design spec | `docs/superpowers/specs/2026-04-07-pokestop-design.md` |
| Implementation plan | `docs/superpowers/plans/2026-04-07-pokestop.md` |

**Read the spec first, then the plan.** The spec explains what and why; the plan explains how.

---

## Current State

**We are mid-execution of the implementation plan using Subagent-Driven Development.**

### Completed Tasks

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Scaffold Project | ✅ Complete | `d804248` |

### Remaining Tasks (2–18)

| # | Task |
|---|------|
| 2 | Core Types (`src/store/model.ts`) |
| 3 | Price Parsing — TDD (`src/price.ts` + `test/price.test.ts`) |
| 4 | Product Filter — TDD (`src/filter.ts` + `test/filter.test.ts`) |
| 5 | Database Module — TDD (`src/db.ts` + `test/db.test.ts`) |
| 6 | Config Module (`src/config.ts`) |
| 7 | Logger Module (`src/logger.ts`) |
| 8 | Browser Module (`src/browser.ts`) |
| 9 | Checker Module (`src/checker.ts`) |
| 10 | Local Stores Module (`src/local-stores.ts`) |
| 11 | Poller Module (`src/poller.ts`) |
| 12 | Online-Only Store Definitions (Amazon, Pokemon Center, TCGPlayer) |
| 13 | Target Store Definition (with local stock) |
| 14 | Best Buy Store Definition (with local stock) |
| 15 | Walmart Store Definition (with local stock) |
| 16 | GameStop Store Definition (with local stock) |
| 17 | Store Index + Entry Point (`src/store/index.ts`, `src/index.ts`) |
| 18 | Build Verification + Smoke Test |

---

## How to Continue

Tell Claude:

> "I'm picking up the pokestop project. Read `HANDOFF.md`, the spec at `docs/superpowers/specs/2026-04-07-pokestop-design.md`, and the implementation plan at `docs/superpowers/plans/2026-04-07-pokestop.md`. Task 1 is complete (commit `d804248`). Continue from Task 2 using Subagent-Driven Development."

Claude will use the `superpowers:subagent-driven-development` skill to continue dispatching implementation subagents for each remaining task, with two-stage review (spec compliance + code quality) after each one.

---

## Architecture Summary (for quick context)

- **Language/Runtime:** TypeScript 5, Node.js
- **Scraping:** `node-fetch` + `cheerio` for most stores; Puppeteer for Pokemon Center
- **Database:** SQLite via `better-sqlite3` — full price history retained
- **Retailers:** Amazon, Best Buy, GameStop, Pokemon Center, Target, TCGPlayer, Walmart
- **Local stock:** Target, Best Buy, Walmart, GameStop — resolved from `ZIPCODE` at startup
- **Notifications:** Terminal only (v1)
- **Key design:** `inStock` and `price` tracked independently — in-stock with no price is valid

## File Map (what each file will do when built)

```
src/
├── index.ts              ← Entry point
├── config.ts             ← .env loader
├── logger.ts             ← Winston + summary table printer
├── poller.ts             ← Per-store setTimeout polling loop
├── checker.ts            ← Fetch/Puppeteer dispatch + stock/price detection
├── browser.ts            ← Shared Puppeteer browser
├── db.ts                 ← SQLite interface
├── filter.ts             ← Product filter by type/set
├── price.ts              ← Price string parser
├── local-stores.ts       ← Zip code → nearby store locations
└── store/
    ├── model.ts          ← All shared TypeScript types
    ├── index.ts          ← Active store loader
    ├── amazon.ts
    ├── bestbuy.ts
    ├── gamestop.ts
    ├── pokemoncenter.ts
    ├── target.ts
    ├── tcgplayer.ts
    └── walmart.ts
test/
├── price.test.ts
├── filter.test.ts
└── db.test.ts
```

## Post-Build: Update Product URLs

The store definition files (Tasks 12–16) use **placeholder product URLs**. After the build is complete, you'll need to replace them with real product page URLs from each retailer. The plan notes this clearly in each store task.

---

## Environment Setup (when ready to run)

```bash
cp .env.example .env
# Edit .env:
# - Set ZIPCODE to your zip code
# - Optionally narrow SHOW_ONLY_TYPES / SHOW_ONLY_SETS
# - Update product URLs in src/store/*.ts with real URLs
npm start
```
