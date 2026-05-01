import { useSyncExternalStore } from "react";
import { profileStore } from "./store";
import type { Profile } from "./types";

export function useProfile(): Profile {
  return useSyncExternalStore(profileStore.subscribe, profileStore.getSnapshot);
}

export function setProfile(partial: Partial<Profile>): void {
  profileStore.set(partial);
}
