import { KEYS, readJSON, writeJSON } from "../storage";
import { EMPTY_PROFILE, type Profile } from "./types";

type Listener = () => void;

type ProfileStore = {
  getSnapshot: () => Profile;
  subscribe: (listener: Listener) => () => void;
  set: (partial: Partial<Profile>) => void;
  replace: (next: Profile) => void;
  reset: () => void;
};

/**
 * Singleton lives on globalThis so a Vite HMR reload doesn't create a second
 * profileStore alongside the original. Identical pattern to moduleStore.ts —
 * see comment there for the failure mode this prevents.
 */
const PROFILE_STORE_KEY = "__finanzbotProfileStore__";
const globalAny = globalThis as unknown as Record<string, unknown>;

function buildStore(): ProfileStore {
  let state: Profile = readJSON<Profile>(KEYS.profile) ?? EMPTY_PROFILE;
  const listeners = new Set<Listener>();

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(partial) {
      const next: Profile = { ...state, ...partial };
      if (shallowEqual(state, next)) return;
      state = next;
      writeJSON(KEYS.profile, state);
      listeners.forEach((l) => l());
    },
    replace(next) {
      state = next;
      writeJSON(KEYS.profile, state);
      listeners.forEach((l) => l());
    },
    reset() {
      state = EMPTY_PROFILE;
      writeJSON(KEYS.profile, state);
      listeners.forEach((l) => l());
    },
  };
}

export const profileStore: ProfileStore =
  (globalAny[PROFILE_STORE_KEY] as ProfileStore | undefined) ??
  ((globalAny[PROFILE_STORE_KEY] = buildStore()), globalAny[PROFILE_STORE_KEY] as ProfileStore);

function shallowEqual(a: Profile, b: Profile): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof Profile>;
  for (const k of keys) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}
