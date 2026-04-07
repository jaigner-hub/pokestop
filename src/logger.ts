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

export function logCheck(record: PriceRecord): void {
  const status = record.inStock
    ? chalk.green('IN STOCK')
    : chalk.red('OUT OF STOCK');
  const priceStr = record.price != null
    ? chalk.yellow(`$${record.price.toFixed(2)}`)
    : chalk.gray('(no price)');
  const loc =
    record.channel === 'in-store'
      ? record.storeLocation ?? 'in-store'
      : 'online';
  logger.info(`[${record.store}] ${record.canonicalName} @ ${loc} — ${status} ${priceStr}`);
}

export function printSummary(rows: PriceRow[]): void {
  if (rows.length === 0) {
    logger.info('No in-stock items found in last check cycle.');
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan('Product'),
      chalk.cyan('Store'),
      chalk.cyan('Location'),
      chalk.cyan('Price'),
      chalk.cyan('Stock'),
      chalk.cyan('Checked'),
    ],
    style: {head: [], border: []},
  });

  for (const r of rows) {
    table.push([
      r.canonicalName,
      r.store,
      r.storeLocation ?? r.channel,
      r.price != null ? `$${r.price.toFixed(2)}` : chalk.gray('—'),
      r.inStock ? chalk.green('✓') : chalk.red('✗'),
      r.checkedAt.substring(11, 19),
    ]);
  }

  console.log('\n' + table.toString());

  // Best prices footer
  const withPrice = rows.filter(r => r.price != null);
  const noPrice = rows.filter(r => r.price == null);

  // Lowest price per canonicalName
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
      console.log(
        `  ${r.canonicalName.padEnd(40)} → ${loc} @ $${r.price!.toFixed(2)}`
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
