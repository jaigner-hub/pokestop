import dotenv from 'dotenv';
import type {ProductType} from './store/model';

dotenv.config();

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

function optionalList(name: string): string[] | null {
  const val = process.env[name];
  if (!val) return null;
  return val
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export const config = {
  stores: (process.env['STORES'] || 'target,walmart,bestbuy,gamestop,amazon,pokemoncenter,tcgplayer')
    .split(',')
    .map(s => s.trim()),
  showOnlyTypes: optionalList('SHOW_ONLY_TYPES') as ProductType[] | null,
  showOnlySets: optionalList('SHOW_ONLY_SETS'),
  zipCode: process.env['ZIPCODE'] || null,
  localStoreCount: parseInt(optional('LOCAL_STORE_COUNT', '3'), 10),
  pageSleepMin: parseInt(optional('PAGE_SLEEP_MIN', '270000'), 10),
  pageSleepMax: parseInt(optional('PAGE_SLEEP_MAX', '330000'), 10),
  pageTimeout: parseInt(optional('PAGE_TIMEOUT', '45000'), 10),
  dbPath: optional('DB_PATH', './data/prices.db'),
  logLevel: optional('LOG_LEVEL', 'info'),
  discordWebhookUrl: process.env['DISCORD_WEBHOOK_URL'] || null,
};
