import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Scan } from "./egg-types";

const SCANS_KEY = "efd.scans.v1";
const BATCHES_KEY = "efd.batches.v1";

/** Tiny pub/sub so every screen's hook stays in sync after a mutation. */
type Listener = () => void;
const listeners = new Set<Listener>();
function notify() {
  for (const l of listeners) l();
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    notify();
  } catch {
    /* storage full or unavailable */
  }
}

function useForceUpdate() {
  const [, setTick] = useState(0);
  return useCallback(() => setTick((t) => t + 1), []);
}

export function useScans() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const forceUpdate = useForceUpdate();

  const reload = useCallback(async () => {
    const value = await readJson<Scan[]>(SCANS_KEY, []);
    setScans(value);
    setHydrated(true);
  }, []);

  useEffect(() => {
    reload();
    const listener = () => {
      reload();
      forceUpdate();
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [reload, forceUpdate]);

  const addScan = useCallback(async (scan: Scan) => {
    const current = await readJson<Scan[]>(SCANS_KEY, []);
    await writeJson(SCANS_KEY, [scan, ...current]);
  }, []);

  const updateScan = useCallback(async (id: string, patch: Partial<Scan>) => {
    const current = await readJson<Scan[]>(SCANS_KEY, []);
    await writeJson(
      SCANS_KEY,
      current.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    );
  }, []);

  const removeScan = useCallback(async (id: string) => {
    const current = await readJson<Scan[]>(SCANS_KEY, []);
    await writeJson(
      SCANS_KEY,
      current.filter((s) => s.id !== id),
    );
  }, []);

  const clearScans = useCallback(async () => {
    await writeJson(SCANS_KEY, []);
  }, []);

  return { scans, hydrated, addScan, updateScan, removeScan, clearScans };
}

export function useBatchNames() {
  const [batchNames, setBatchNames] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const reload = useCallback(async () => {
    const value = await readJson<string[]>(BATCHES_KEY, []);
    setBatchNames(value);
    setHydrated(true);
  }, []);

  useEffect(() => {
    reload();
    const listener = () => reload();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [reload]);

  const rememberBatch = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const existing = await readJson<string[]>(BATCHES_KEY, []);
    if (existing.some((b) => b.toLowerCase() === trimmed.toLowerCase())) return;
    await writeJson(BATCHES_KEY, [...existing, trimmed].sort((a, b) => a.localeCompare(b)));
  }, []);

  return { batchNames, rememberBatch, hydrated };
}
