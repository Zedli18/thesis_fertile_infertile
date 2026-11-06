import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import type { Scan } from "./egg-types";

function esc(value: string | number) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function scansToCsv(scans: Scan[]): string {
  const header = [
    "Scan ID",
    "Date",
    "Batch",
    "Tray/Rack",
    "Flock/Farm",
    "Prediction",
    "Confidence %",
    "Vein density",
    "Air cell clarity",
    "Embryo movement",
    "Opacity",
    "Source",
    "Notes",
  ];
  const rows = scans.map((s) => [
    s.id,
    new Date(s.createdAt).toISOString(),
    s.batch,
    s.tray,
    s.flock,
    s.prediction,
    s.confidence,
    s.candling.veinDensity,
    s.candling.airCellClarity,
    s.candling.embryoMovement,
    s.candling.opacity,
    s.source,
    s.notes,
  ]);
  return [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
}

export function batchSummaryCsv(scans: Scan[]): string {
  const map = new Map<string, { total: number; fertile: number }>();
  for (const s of scans) {
    const key = s.batch || "Untagged";
    const entry = map.get(key) ?? { total: 0, fertile: 0 };
    entry.total += 1;
    if (s.prediction === "Fertile") entry.fertile += 1;
    map.set(key, entry);
  }
  const rows = [...map.entries()].map(([batch, v]) => [
    batch,
    v.total,
    v.fertile,
    v.total - v.fertile,
    ((v.fertile / v.total) * 100).toFixed(1),
  ]);
  return [["Batch", "Eggs scanned", "Fertile", "Infertile", "Fertility rate %"], ...rows]
    .map((r) => r.map(esc).join(","))
    .join("\n");
}

/** Writes the CSV to a temp file and opens the native share sheet. */
export async function shareCsv(filename: string, csv: string) {
  const path = `${(FileSystem as any).cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, csv, { encoding: FileSystem.EncodingType.UTF8 });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(path, { mimeType: "text/csv", dialogTitle: filename });
  }
  return path;
}