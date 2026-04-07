import {config} from '../config';
import type {Store} from './model';
import {amazon} from './amazon';
import {bestbuy} from './bestbuy';
import {gamestop} from './gamestop';
import {pokemoncenter} from './pokemoncenter';
import {target} from './target';
import {tcgplayer} from './tcgplayer';
import {walmart} from './walmart';

const ALL_STORES: Record<string, Store> = {
  amazon,
  bestbuy,
  gamestop,
  pokemoncenter,
  target,
  tcgplayer,
  walmart,
};

export function getActiveStores(): Store[] {
  return config.stores
    .map(name => {
      const store = ALL_STORES[name];
      if (!store) {
        throw new Error(`Unknown store: "${name}". Valid names: ${Object.keys(ALL_STORES).join(', ')}`);
      }
      return store;
    });
}
