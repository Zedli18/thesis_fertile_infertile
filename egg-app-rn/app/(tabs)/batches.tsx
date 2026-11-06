import { useMemo } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader } from "@/components/AppHeader";
import { ProgressBar } from "@/components/ProgressBar";
import { useScans } from "@/lib/egg-storage";
import { batchSummaryCsv, scansToCsv, shareCsv } from "@/lib/egg-csv";
import { COLORS } from "@/theme/colors";

interface BatchEntry {
  total: number;
  fertile: number;
  trays: Set<string>;
  flocks: Set<string>;
  last: number;
}

export default function Batches() {
  const { scans, hydrated } = useScans();

  const batches = useMemo(() => {
    const map = new Map<string, BatchEntry>();
    for (const s of scans) {
      const key = s.batch || "Untagged";
      const e = map.get(key) ?? { total: 0, fertile: 0, trays: new Set(), flocks: new Set(), last: 0 };
      e.total += 1;
      if (s.prediction === "Fertile") e.fertile += 1;
      if (s.tray) e.trays.add(s.tray);
      if (s.flock) e.flocks.add(s.flock);
      e.last = Math.max(e.last, s.createdAt);
      map.set(key, e);
    }
    return [...map.entries()].sort((a, b) => b[1].last - a[1].last);
  }, [scans]);

  async function exportSummary() {
    if (!scans.length) {
      Alert.alert("Nothing to export", "No scans to export yet.");
      return;
    }
    await shareCsv("batch-summary.csv", batchSummaryCsv(scans));
  }

  async function exportBatch(name: string) {
    const rows = scans.filter((s) => (s.batch || "Untagged") === name);
    await shareCsv(`${name.replace(/\s+/g, "-")}-scans.csv`, scansToCsv(rows));
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Incubator batches" subtitle={`${batches.length} tracked batches`} />
      <FlatList
        data={batches}
        keyExtractor={([name]) => name}
        style={styles.flexList}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Pressable style={styles.exportAllButton} onPress={exportSummary}>
            <Ionicons name="download-outline" size={16} color={COLORS.text} />
            <Text style={styles.exportAllText}>Export batch summary (CSV)</Text>
          </Pressable>
        }
        ListEmptyComponent={
          hydrated ? (
            <Text style={styles.emptyText}>
              Tag your scans with a batch number to see them grouped here.
            </Text>
          ) : null
        }
        renderItem={({ item: [name, b] }) => {
          const rate = Math.round((b.fertile / b.total) * 100);
          return (
            <View style={styles.card}>
              <View style={styles.headerRow}>
                <View style={styles.flex1}>
                  <View style={styles.nameRow}>
                    <Ionicons name="layers-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.name}>{name}</Text>
                  </View>
                  <Text style={styles.subMeta} numberOfLines={1}>
                    {b.trays.size ? `Trays: ${[...b.trays].join(", ")}` : "No tray tags"}
                    {b.flocks.size ? ` · ${[...b.flocks].join(", ")}` : ""}
                  </Text>
                </View>
                <Text style={styles.rate}>{rate}%</Text>
              </View>
              <ProgressBar value={rate} />
              <View style={styles.statsRow}>
                <Text style={styles.statText}>{b.total} eggs scanned</Text>
                <Text style={styles.statText}>
                  {b.fertile} fertile · {b.total - b.fertile} infertile
                </Text>
              </View>
              <Pressable style={styles.exportBatchButton} onPress={() => exportBatch(name)}>
                <Text style={styles.exportBatchText}>Export this batch</Text>
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  flexList: { flex: 1 },
  listContent: { padding: 16, gap: 12 },
  flex1: { flex: 1, minWidth: 0 },
  exportAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.divider,
    backgroundColor: COLORS.surface,
    marginBottom: 12,
  },
  exportAllText: { fontWeight: "600", color: COLORS.text, fontSize: 13 },
  emptyText: {
    textAlign: "center",
    color: COLORS.textMuted,
    fontSize: 13,
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, gap: 10, marginBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { fontSize: 15, fontWeight: "700", color: COLORS.text },
  subMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  rate: { fontSize: 20, fontWeight: "700", color: COLORS.text },
  statsRow: { flexDirection: "row", justifyContent: "space-between" },
  statText: { fontSize: 12, color: COLORS.textMuted },
  exportBatchButton: {
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  exportBatchText: { fontSize: 13, fontWeight: "600", color: COLORS.text },
});
