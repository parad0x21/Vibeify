"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * SSR-safe localStorage hook. Reads via `useSyncExternalStore` so React can
 * tear during concurrent renders without producing stale values, and so we
 * avoid the `react-hooks/set-state-in-effect` rule.
 *
 * Cross-tab updates piggyback on the native `storage` event; same-tab updates
 * fire a synthetic event so other subscribers in this tab also re-render.
 */
const SYNTHETIC_EVENT = "vibeify:local-storage";

function subscribe(callback: () => void) {
  const handler = () => callback();
  window.addEventListener("storage", handler);
  window.addEventListener(SYNTHETIC_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(SYNTHETIC_EVENT, handler);
  };
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function useLocalStorage<T>(
  key: string,
  fallback: T,
): [T, (next: T | ((prev: T) => T)) => void] {
  const getSnapshot = useCallback(() => readRaw(key), [key]);
  const getServerSnapshot = useCallback(() => null, []);
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo<T>(() => {
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }, [raw, fallback]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const current: T =
        raw === null
          ? fallback
          : (() => {
              try {
                return JSON.parse(raw) as T;
              } catch {
                return fallback;
              }
            })();
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(current) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
        window.dispatchEvent(new Event(SYNTHETIC_EVENT));
      } catch {
        // Ignore quota / access errors.
      }
    },
    [key, raw, fallback],
  );

  return [value, update];
}
