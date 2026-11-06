import { StyleSheet, View } from "react-native";
import { COLORS } from "@/theme/colors";

export function ProgressBar({
  value,
  color = COLORS.primary,
  trackColor = COLORS.divider,
  height = 8,
}: {
  value: number; // 0-100
  color?: string;
  trackColor?: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View style={[styles.track, { backgroundColor: trackColor, height, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          { width: `${pct}%`, backgroundColor: color, borderRadius: height / 2 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: "100%", overflow: "hidden" },
  fill: { height: "100%" },
});
