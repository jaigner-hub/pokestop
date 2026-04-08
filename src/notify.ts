import nodeFetch from 'node-fetch';
import {config} from './config';
import {logger} from './logger';
import type {PriceRecord} from './store/model';

// Tracks what was in stock last check so we only notify on transitions.
// Key: "canonicalName|store|channel|storeLocation"
const lastStockState = new Map<string, boolean>();

function stateKey(record: PriceRecord): string {
  return `${record.canonicalName}|${record.store}|${record.channel}|${record.storeLocation ?? ''}`;
}

// Returns true if this is a new in-stock event (was previously out of stock or first check).
export function isNewInStock(record: PriceRecord): boolean {
  const key = stateKey(record);
  const wasInStock = lastStockState.get(key) ?? false;
  lastStockState.set(key, record.inStock);

  // Only notify on the transition: was NOT in stock, now IS in stock
  return record.inStock && !wasInStock;
}

export async function sendDiscordAlert(record: PriceRecord): Promise<void> {
  if (!config.discordWebhookUrl) return;

  const location = record.channel === 'in-store'
    ? record.storeLocation ?? 'in-store'
    : 'Online';

  const priceStr = record.price != null
    ? `$${record.price.toFixed(2)}`
    : 'Price unavailable';

  const storeUpper = record.store.charAt(0).toUpperCase() + record.store.slice(1);

  // Color: green for in-stock with price, yellow for in-stock without price
  const color = record.price != null ? 0x00ff00 : 0xffaa00;

  const embed = {
    title: `🟢 IN STOCK: ${record.canonicalName}`,
    description: `**${storeUpper}** — ${location}`,
    color,
    fields: [
      {name: 'Price', value: priceStr, inline: true},
      {name: 'Channel', value: record.channel === 'in-store' ? '🏪 In-Store' : '🌐 Online', inline: true},
    ],
    url: record.url,
    timestamp: record.checkedAt,
    footer: {text: 'Pokestop Monitor'},
  };

  // Add location field for in-store alerts
  if (record.channel === 'in-store' && record.storeLocation) {
    embed.fields.push({
      name: 'Location',
      value: record.storeLocation,
      inline: false,
    });
  }

  try {
    const res = await nodeFetch(config.discordWebhookUrl, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        username: 'Pokestop',
        embeds: [embed],
      }),
    });

    if (res.status === 429) {
      // Rate limited — log and skip
      const retry = await res.json() as {retry_after?: number};
      logger.warn(`Discord rate limited, retry after ${retry.retry_after ?? '?'}ms`);
    } else if (!res.ok) {
      logger.warn(`Discord webhook returned ${res.status}`);
    }
  } catch (err) {
    logger.error(`Discord notification failed: ${err}`);
  }
}
