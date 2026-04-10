import winston from 'winston';
import chalk from 'chalk';
import {writeFileSync} from 'fs';
import {config} from './config';
import type {PriceRecord} from './store/model';
import type {PriceRow} from './db';

export const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp({format: 'HH:mm:ss'}),
    winston.format.printf(({level, message, timestamp}) => {
      const colorFn =
        level === 'error'
          ? chalk.red
          : level === 'warn'
          ? chalk.yellow
          : chalk.cyan;
      return `${chalk.gray(String(timestamp))} ${colorFn(level.toUpperCase().padEnd(5))} ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

// Terminal hyperlink (works in iTerm2, Windows Terminal, most modern terminals)
function link(text: string, url: string): string {
  return `\x1b]8;;${url}\x1b\\${text}\x1b]8;;\x1b\\`;
}

export function logCheck(record: PriceRecord & {msrp?: number; firstSeen?: boolean}): void {
  const status = record.inStock
    ? chalk.green('IN STOCK')
    : chalk.red('OUT');
  const loc =
    record.channel === 'in-store'
      ? record.storeLocation ?? 'in-store'
      : 'online';

  // Only log in-stock at info level; out-of-stock goes to debug
  if (!record.inStock) {
    logger.debug(`[${record.store}] ${record.canonicalName} @ ${loc} — ${status}`);
    return;
  }

  let priceStr: string;
  const msrp = record.msrp ?? estimateMsrp(record.canonicalName);
  const scalper = record.price != null && record.price > msrp * REASONABLE_CEILING;

  if (record.price != null) {
    const priceText = `$${record.price.toFixed(2)}`;
    if (record.price <= msrp * MSRP_CEILING) {
      priceStr = chalk.green(priceText);
    } else if (record.price <= msrp * REASONABLE_CEILING) {
      priceStr = chalk.yellow(`${priceText} (2nd Mkt - MSRP $${msrp.toFixed(2)})`);
    } else {
      priceStr = chalk.red(`${priceText} (Scalper - MSRP $${msrp.toFixed(2)})`);
    }
  } else {
    priceStr = chalk.gray('(no price)');
  }

  const linkedName = link(record.canonicalName, record.url);
  const msg = `[${record.store}] ${linkedName} @ ${loc} — ${status} ${priceStr}`;

  // MSRP/2nd market: always log at info
  // Scalper: log at info on first detection, then debug on repeats
  if (scalper && !record.firstSeen) {
    logger.debug(msg);
  } else {
    logger.info(msg);
  }
}

function estimateMsrp(canonicalName: string): number {
  const name = canonicalName.toLowerCase();
  if (name.includes('booster box') || name.includes('display')) return 143.64;
  if (name.includes('bundle')) return 26.99;
  if (name.includes('upc') || name.includes('ultra premium')) return 119.99;
  return 49.99; // ETBs, tins, collections
}

// Price tiers:
//   MSRP    = at or below retail (up to 1.2x MSRP to account for tax/shipping)
//   2nd Mkt = reasonable secondary market (1.2x–2x MSRP)
//   Scalper = gouging (above 2x MSRP) — hidden from summary
const MSRP_CEILING = 1.2;
const REASONABLE_CEILING = 2.0;

type Tier = 'msrp' | '2nd' | 'scalper' | 'unknown';

function tierOf(price: number | null, canonicalName: string): Tier {
  if (price == null) return 'unknown';
  const msrp = estimateMsrp(canonicalName);
  if (price <= msrp * MSRP_CEILING) return 'msrp';
  if (price <= msrp * REASONABLE_CEILING) return '2nd';
  return 'scalper';
}

const TIER_ORDER: Record<Tier, number> = {msrp: 0, '2nd': 1, scalper: 2, unknown: 3};

function tierLabel(tier: Tier): string {
  switch (tier) {
    case 'msrp':    return chalk.green('MSRP');
    case '2nd':     return chalk.yellow('2nd Mkt');
    case 'scalper': return chalk.red('Scalper');
    case 'unknown': return chalk.gray('?');
  }
}

function colorPrice(price: number | null, tier: Tier): string {
  if (price == null) return chalk.gray('—');
  const text = `$${price.toFixed(2)}`;
  switch (tier) {
    case 'msrp':    return chalk.green(text);
    case '2nd':     return chalk.yellow(text);
    case 'scalper': return chalk.red(text);
    case 'unknown': return chalk.gray(text);
  }
}

// Visible character count, ignoring SGR colors and OSC 8 hyperlink markers.
// cli-table3 doesn't strip OSC 8, which is why we hand-roll alignment here.
function visibleWidth(s: string): number {
  return s
    // Strip OSC 8 hyperlink wrappers (open form: ESC]8;;URL ESC\) and close form (ESC]8;; ESC\)
    .replace(/\x1b\]8;;[^\x1b]*\x1b\\/g, '')
    // Strip SGR color sequences
    .replace(/\x1b\[[0-9;]*m/g, '')
    .length;
}

function padEndVisible(s: string, width: number): string {
  const pad = width - visibleWidth(s);
  return pad > 0 ? s + ' '.repeat(pad) : s;
}

type Annotated = {row: PriceRow; tier: Tier; msrp: number};

function annotate(rows: PriceRow[]): Annotated[] {
  const annotated = rows.map(r => ({
    row: r,
    tier: tierOf(r.price, r.canonicalName),
    msrp: estimateMsrp(r.canonicalName),
  }));
  annotated.sort((a, b) => {
    const t = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    if (t !== 0) return t;
    if (a.row.price != null && b.row.price != null) {
      const dp = a.row.price - b.row.price;
      if (dp !== 0) return dp;
    }
    return a.row.canonicalName.localeCompare(b.row.canonicalName);
  });
  return annotated;
}

function tierCounts(annotated: Annotated[]): Record<Tier, number> {
  return annotated.reduce<Record<Tier, number>>(
    (acc, a) => { acc[a.tier]++; return acc; },
    {msrp: 0, '2nd': 0, scalper: 0, unknown: 0},
  );
}

export function printSummary(rows: PriceRow[]): void {
  if (rows.length === 0) return;

  const annotated = annotate(rows);
  const counts = tierCounts(annotated);

  console.log(
    chalk.bold(`\nIn Stock — ${annotated.length} listing(s):`) +
    chalk.gray(
      ` ${counts.msrp} MSRP, ${counts['2nd']} 2nd Mkt, ${counts.scalper} Scalper` +
      (counts.unknown > 0 ? `, ${counts.unknown} unknown` : ''),
    ),
  );

  // Build cell content (with colors + OSC 8 links) so we can measure widths
  type Cell = {product: string; store: string; price: string; ratio: string; tier: string; tierKey: Tier};
  const cells: Cell[] = annotated.map(({row: r, tier, msrp}) => ({
    product: link(r.canonicalName, r.url),
    store: r.storeLocation ? `${r.store} (store)` : r.store,
    price: colorPrice(r.price, tier),
    ratio: r.price != null ? `${(r.price / msrp).toFixed(2)}x` : chalk.gray('—'),
    tier: tierLabel(tier),
    tierKey: tier,
  }));

  const headers = {
    product: chalk.bold('Product'),
    store:   chalk.bold('Store'),
    price:   chalk.bold('Price'),
    ratio:   chalk.bold('vs MSRP'),
    tier:    chalk.bold('Tier'),
  };

  // Compute column widths from headers + all cells
  const widths = {
    product: visibleWidth(headers.product),
    store:   visibleWidth(headers.store),
    price:   visibleWidth(headers.price),
    ratio:   visibleWidth(headers.ratio),
    tier:    visibleWidth(headers.tier),
  };
  for (const c of cells) {
    if (visibleWidth(c.product) > widths.product) widths.product = visibleWidth(c.product);
    if (visibleWidth(c.store)   > widths.store)   widths.store   = visibleWidth(c.store);
    if (visibleWidth(c.price)   > widths.price)   widths.price   = visibleWidth(c.price);
    if (visibleWidth(c.ratio)   > widths.ratio)   widths.ratio   = visibleWidth(c.ratio);
    if (visibleWidth(c.tier)    > widths.tier)    widths.tier    = visibleWidth(c.tier);
  }

  const sep = '  ';
  const renderRow = (c: {product: string; store: string; price: string; ratio: string; tier: string}): string =>
    padEndVisible(c.product, widths.product) + sep +
    padEndVisible(c.store,   widths.store)   + sep +
    padEndVisible(c.price,   widths.price)   + sep +
    padEndVisible(c.ratio,   widths.ratio)   + sep +
    padEndVisible(c.tier,    widths.tier);

  const totalWidth =
    widths.product + widths.store + widths.price + widths.ratio + widths.tier + sep.length * 4;

  console.log();
  console.log(renderRow(headers));
  console.log(chalk.gray('─'.repeat(totalWidth)));

  let prevTier: Tier | null = null;
  for (const c of cells) {
    if (prevTier !== null && prevTier !== c.tierKey) {
      console.log(chalk.gray('·'.repeat(totalWidth)));
    }
    prevTier = c.tierKey;
    console.log(renderRow(c));
  }
  console.log('');
}

// ─── Markdown export ────────────────────────────────────────────────────────

function escapeMdCell(s: string): string {
  // Pipe and backslash break table cells; brackets confuse the link parser.
  return s.replace(/[|\\]/g, '\\$&').replace(/\n/g, ' ');
}

export function formatMarkdownSummary(rows: PriceRow[]): string {
  const annotated = annotate(rows);
  const counts = tierCounts(annotated);

  const lines: string[] = [];
  lines.push('# Pokestop In-Stock Summary');
  lines.push('');
  lines.push(`_Generated ${new Date().toISOString()}_`);
  lines.push('');
  lines.push(
    `**${annotated.length} listing(s)**: ` +
    `${counts.msrp} MSRP · ${counts['2nd']} 2nd Mkt · ${counts.scalper} Scalper` +
    (counts.unknown > 0 ? ` · ${counts.unknown} Unknown` : ''),
  );
  lines.push('');

  const sectionTitles: Record<Tier, string> = {
    msrp:    'MSRP',
    '2nd':   '2nd Market',
    scalper: 'Scalper',
    unknown: 'Unknown / No Price',
  };

  for (const tier of ['msrp', '2nd', 'scalper', 'unknown'] as Tier[]) {
    const subset = annotated.filter(a => a.tier === tier);
    if (subset.length === 0) continue;

    lines.push(`## ${sectionTitles[tier]} (${subset.length})`);
    lines.push('');
    lines.push('| Product | Store | Price | vs MSRP |');
    lines.push('|---|---|---|---|');
    for (const {row: r, msrp} of subset) {
      const product = `[${escapeMdCell(r.canonicalName)}](${r.url})`;
      const store = r.storeLocation ? `${r.store} (store)` : r.store;
      const price = r.price != null ? `$${r.price.toFixed(2)}` : '—';
      const ratio = r.price != null ? `${(r.price / msrp).toFixed(2)}x` : '—';
      lines.push(`| ${product} | ${escapeMdCell(store)} | ${price} | ${ratio} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function writeMarkdownSummary(rows: PriceRow[], path: string): void {
  writeFileSync(path, formatMarkdownSummary(rows));
}
