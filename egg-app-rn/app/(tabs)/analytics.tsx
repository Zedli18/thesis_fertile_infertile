import { useMemo } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader } from "@/components/AppHeader";
import { DonutChart } from "@/components/DonutChart";
import { useScans } from "@/lib/egg-storage";
import { batchSummaryCsv, shareCsv } from "@/lib/egg-csv";
import { COLORS } from "@/theme/colors";

export default function Analytics() {
  const { scans, hydrated } = useScans();

  const stats = useMemo(() => {
    const total = scans.length;
    const fertile = scans.filter((s) => s.prediction === "Fertile").length;
    const rate = total ? Math.round((fertile / total) * 100) : 0;
    const avgConfidence = total
      ? Math.round(scans.reduce((a, s) => a + s.confidence, 0) / total)
      : 0;

    const byBatch = new Map<string, { fertile: number; infertile: number }>();
    for (const s of scans) {
      const key = s.batch || "Untagged";
      const e = byBatch.get(key) ?? { fertile: 0, infertile: 0 };
      if (s.prediction === "Fertile") e.fertile += 1;
      else e.infertile += 1;
      byBatch.set(key, e);
    }
    const batchData = [...byBatch.entries()]
      .map(([batch, v]) => ({
        batch: batch.length > 10 ? `${batch.slice(0, 9)}…` : batch,
        ...v,
        total: v.fertile + v.infertile,
      }))
      .slice(0, 8);
    const maxBatchTotal = Math.max(1, ...batchData.map((b) => b.total));

    return { total, fertile, infertile: total - fertile, rate, avgConfidence, batchData, maxBatchTotal };
  }, [scans]);

  async function exportReport() {
    if (!scans.length) {
      Alert.alert("Nothing to export", "No data to export yet.");
      return;
    }
    await shareCsv("fertility-report.csv", batchSummaryCsv(scans));
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Analytics" subtitle="Hatchery performance overview" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsGrid}>
          <Stat label="Fertility rate" value={`${stats.rate}%`} />
          <Stat label="Eggs scanned" value={`${stats.total}`} />
          <Stat label="Fertile" value={`${stats.fertile}`} />
          <Stat label="Avg. confidence" value={`${stats.avgConfidence}%`} />
        </View>

        {hydrated && !stats.total ? (
          <Text style={styles.emptyText}>Save a few scans to unlock charts.</Text>
        ) : null}

        {stats.total ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Fertile vs infertile</Text>
              <View style={styles.donutWrap}>
                <DonutChart
                  segments={[
                    { value: stats.fertile, color: COLORS.fertile },
                    { value: stats.infertile, color: COLORS.infertile },
                  ]}
                />
              </View>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: COLORS.fertile }]} />
                  <Text style={styles.legendText}>Fertile ({stats.fertile})</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: COLORS.infertile }]} />
                  <Text style={styles.legendText}>Infertile ({stats.infertile})</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Batch comparison</Text>
              <View style={styles.barsCol}>
                {stats.batchData.map((b) => (
                  <View key={b.batch} style={styles.barRow}>
                    <Text style={styles.barLabel} numberOfLines={1}>
                      {b.batch}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barSegment,
                          {
                            width: `${(b.fertile / stats.maxBatchTotal) * 100}%`,
                            backgroundColor: COLORS.fertile,
                            borderTopLeftRadius: 4,
                            borderBottomLeftRadius: 4,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.barSegment,
                          {
                            width: `${(b.infertile / stats.maxBatchTotal) * 100}%`,
                            backgroundColor: COLORS.infertile,
                            borderTopRightRadius: 4,
                            borderBottomRightRadius: 4,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.barTotal}>{b.total}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : null}

        <Pressable style={styles.exportButton} onPress={exportReport}>
          <Ionicons name="download-outline" size={16} color={COLORS.text} />
          <Text style={styles.exportText}>Export report (CSV)</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: {
    width: "47%",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  statLabel: { fontSize: 12, color: COLORS.textMuted },
  statValue: { fontSize: 22, fontWeight: "700", color: COLORS.text, marginTop: 2 },
  emptyText: {
    textAlign: "center",
    color: COLORS.textMuted,
    fontSize: 13,
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, gap: 12 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  donutWrap: { alignItems: "center", paddingVertical: 4 },
  legendRow: { flexDirection: "row", justifyContent: "center", gap: 20 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: COLORS.textMuted },
  barsCol: { gap: 12 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { width: 64, fontSize: 11, color: COLORS.textMuted },
  barTrack: { flex: 1, flexDirection: "row", height: 14, borderRadius: 4, overflow: "hidden" },
  barSegment: { height: "100%" },
  barTotal: { width: 24, fontSize: 11, color: COLORS.textMuted, textAlign: "right" },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.divider,
    backgroundColor: COLORS.surface,
  },
  exportText: { fontWeight: "600", color: COLORS.text, fontSize: 13 },
});
