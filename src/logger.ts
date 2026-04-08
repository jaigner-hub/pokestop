import winston from 'winston';
import chalk from 'chalk';
import Table from 'cli-table3';
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
  let isScalper = false;
  if (record.price != null) {
    const priceText = `$${record.price.toFixed(2)}`;
    if (record.msrp && record.price > record.msrp * 1.2) {
      priceStr = chalk.red(`${priceText} (3P - MSRP $${record.msrp.toFixed(2)})`);
      isScalper = true;
    } else {
      priceStr = chalk.green(priceText);
    }
  } else {
    priceStr = chalk.gray('(no price)');
  }

  const linkedName = link(record.canonicalName, record.url);
  const msg = `[${record.store}] ${linkedName} @ ${loc} — ${status} ${priceStr}`;

  // MSRP in-stock: always log at info — this is what the user cares about
  // 3P/scalper: log at info on first detection, then debug on repeats
  if (isScalper && !record.firstSeen) {
    logger.debug(msg);
  } else {
    logger.info(msg);
  }
}

export function printSummary(rows: PriceRow[]): void {
  if (rows.length === 0) return;

  const table = new Table({
    head: [
      chalk.cyan('Product'),
      chalk.cyan('Store'),
      chalk.cyan('Location'),
      chalk.cyan('Price'),
      chalk.cyan('MSRP?'),
      chalk.cyan('Link'),
    ],
    style: {head: [], border: []},
    colWidths: [38, 10, 12, 10, 7, 30],
    wordWrap: true,
  });

  for (const r of rows) {
    const priceStr = r.price != null ? `$${r.price.toFixed(2)}` : chalk.gray('—');

    // Determine if retail or scalper
    let msrpFlag = '';
    if (r.price != null) {
      // We don't have the product type in PriceRow, so use a simple heuristic:
      // ETBs are ~$50, bundles ~$27, boxes ~$144, UPCs ~$120
      // If price > 2x typical MSRP for the cheapest type ($27), flag it
      const name = r.canonicalName.toLowerCase();
      let expectedMsrp = 49.99;
      if (name.includes('booster box') || name.includes('display')) expectedMsrp = 143.64;
      else if (name.includes('bundle')) expectedMsrp = 26.99;
      else if (name.includes('upc') || name.includes('ultra premium')) expectedMsrp = 119.99;
      else if (name.includes('binder') || name.includes('collection') || name.includes('super premium')) expectedMsrp = 49.99;

      if (r.price <= expectedMsrp * 1.2) {
        msrpFlag = chalk.green('MSRP');
      } else {
        msrpFlag = chalk.red('3P');
      }
    }

    // Shorten URL for table display
    const shortUrl = r.url
      .replace('https://www.', '')
      .replace('https://', '')
      .substring(0, 28);

    table.push([
      r.canonicalName,
      r.store,
      r.storeLocation ?? r.channel,
      priceStr,
      msrpFlag,
      link(shortUrl, r.url),
    ]);
  }

  console.log('\n' + table.toString());

  // Best prices footer — only show MSRP/retail prices
  const withPrice = rows.filter(r => r.price != null);
  const noPrice = rows.filter(r => r.price == null);

  const bestMap = new Map<string, PriceRow>();
  for (const r of withPrice) {
    const existing = bestMap.get(r.canonicalName);
    if (!existing || (r.price! < existing.price!)) {
      bestMap.set(r.canonicalName, r);
    }
  }

  if (bestMap.size > 0) {
    console.log(chalk.bold('\nBest prices:'));
    for (const r of bestMap.values()) {
      const loc =
        r.storeLocation
          ? `${r.storeLocation} (in-store)`
          : `${r.store} online`;
      const priceText = `$${r.price!.toFixed(2)}`;

      // Flag scalper prices in the best-price list too
      const name = r.canonicalName.toLowerCase();
      let expectedMsrp = 49.99;
      if (name.includes('booster box') || name.includes('display')) expectedMsrp = 143.64;
      else if (name.includes('bundle')) expectedMsrp = 26.99;
      else if (name.includes('upc') || name.includes('ultra premium')) expectedMsrp = 119.99;

      const tag = r.price! <= expectedMsrp * 1.2
        ? chalk.green('MSRP')
        : chalk.red('3P');

      console.log(
        `  ${r.canonicalName.padEnd(40)} → ${loc} @ ${priceText} [${tag}]`
      );
    }
  }

  for (const r of noPrice) {
    const loc = r.storeLocation ?? `${r.store} online`;
    console.log(
      chalk.gray(`  (* ${loc} has ${r.canonicalName} in stock but price unavailable)`)
    );
  }

  console.log('');
}
