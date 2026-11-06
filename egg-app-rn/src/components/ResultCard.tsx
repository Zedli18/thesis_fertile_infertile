import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { AnalysisResult } from "@/lib/egg-analysis";
import { COLORS } from "@/theme/colors";
import { ProgressBar } from "./ProgressBar";

const metrics = [
  { key: "veinDensity", label: "Vein density" },
  { key: "embryoMovement", label: "Embryo movement" },
  { key: "opacity", label: "Interior opacity" },
  { key: "airCellClarity", label: "Air cell clarity" },
] as const;

export function ResultCard({ result }: { result: AnalysisResult }) {
  const fertile = result.prediction === "Fertile";
  const statusColor = fertile ? COLORS.fertile : COLORS.infertile;
  const statusTint = fertile ? COLORS.fertileTint : COLORS.infertileTint;

  return (
    <View style={[styles.card, { borderColor: statusTint }]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconChip, { backgroundColor: statusTint }]}>
          <Ionicons
            name={fertile ? "checkmark-circle" : "close-circle-outline"}
            size={26}
            color={statusColor}
          />
        </View>
        <View style={styles.flex1}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: statusColor }]}>
              <Text style={styles.badgeText}>{result.prediction}</Text>
            </View>
            <Text style={styles.sourceText}>
              {result.source === "api" ? "Live model" : "Simulated"}
            </Text>
          </View>
          <Text style={styles.confidence}>
            {result.confidence}%<Text style={styles.confidenceLabel}> confidence</Text>
          </Text>
        </View>
      </View>

      <ProgressBar value={result.confidence} color={statusColor} height={8} />

  {result.candling?.notes ? (
          <Text style={styles.notes}>{result.candling.notes}</Text>
        ) : null}

        {result.candling ? (
          <View style={styles.metricsCol}>
            {metrics.map((m) => {
              const candlingObj = result.candling as Record<string, any>;
              const rawVal = candlingObj?.[m.key];
              const numVal = typeof rawVal === 'number' ? rawVal : parseFloat(rawVal) || 0;

              return (
                <View key={m.key} style={styles.metricRow}>
                  <View style={styles.metricLabelRow}>
                    <Text style={styles.metricLabel}>{m.label}</Text>
                    <Text style={styles.metricValue}>{rawVal ?? 0}%</Text>
                  </View>
                  <ProgressBar value={numVal} height={6} />
                </View>
              );
            })}
          </View>
        ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconChip: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  flex1: { flex: 1 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: COLORS.white, fontSize: 12, fontWeight: "700" },
  sourceText: { fontSize: 11, color: COLORS.textMuted },
  confidence: { marginTop: 4, fontSize: 24, fontWeight: "700", color: COLORS.text },
  confidenceLabel: { fontSize: 12, fontWeight: "400", color: COLORS.textMuted },
  notes: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  metricsCol: { gap: 10 },
  metricRow: { gap: 4 },
  metricLabelRow: { flexDirection: "row", justifyContent: "space-between" },
  metricLabel: { fontSize: 12, color: COLORS.textMuted },
  metricValue: { fontSize: 12, fontWeight: "600", color: COLORS.text },
});
