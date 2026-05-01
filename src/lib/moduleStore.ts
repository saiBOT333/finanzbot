import { useSyncExternalStore } from "react";
import { KEYS, readJSON, writeJSON } from "./storage";

export type ModuleStore<T> = {
  getSnapshot: () => T;
  subscribe: (listener: () => void) => () => void;
  set: (partial: Partial<T>) => void;
  replace: (next: T) => void;
  reset: () => void;
  useState: () => T;
};

/**
 * Module-level singletons survive Vite HMR reloads by living on globalThis.
 * Without this, an HMR update can create a *second* `pensionStore` while old
 * components still hold a reference to the first — leading to "saved state
 * looks correct in localStorage but UI shows defaults" type ghost bugs.
 */
type StoreCache = Map<string, ModuleStore<object>>;

const STORE_CACHE_KEY = "__finanzbotStoreCache__";
const globalAny = globalThis as unknown as Record<string, unknown>;

function getStoreCache(): StoreCache {
  let cache = globalAny[STORE_CACHE_KEY] as StoreCache | undefined;
  if (!cache) {
    cache = new Map();
    globalAny[STORE_CACHE_KEY] = cache;
  }
  return cache;
}

/**
 * Persistent module-local store. Lives at finanzbot:module:<id>.
 * Each module gets its own; the same pattern as profileStore but generic.
 *
 * Re-uses an existing instance for the same `id` across HMR reloads so all
 * components share a single subscriber list.
 */
export function createModuleStore<T extends object>(id: string, defaults: T): ModuleStore<T> {
  const cache = getStoreCache();
  const cached = cache.get(id);
  if (cached) return cached as unknown as ModuleStore<T>;

  const storageKey = KEYS.moduleKey(id);
  let state: T = { ...defaults, ...(readJSON<Partial<T>>(storageKey) ?? {}) } as T;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((l) => l());

  const store: ModuleStore<T> = {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(partial) {
      state = { ...state, ...partial };
      writeJSON(storageKey, state);
      notify();
    },
    replace(next) {
      state = next;
      writeJSON(storageKey, state);
      notify();
    },
    reset() {
      state = { ...defaults };
      writeJSON(storageKey, state);
      notify();
    },
    useState() {
      return useSyncExternalStore(store.subscribe, store.getSnapshot);
    },
  };

  cache.set(id, store as unknown as ModuleStore<object>);
  return store;
}
