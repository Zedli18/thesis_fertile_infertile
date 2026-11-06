import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader } from "@/components/AppHeader";
import { BatchCombobox } from "@/components/BatchCombobox";
import { useBatchNames, useScans } from "@/lib/egg-storage";
import { scansToCsv, shareCsv } from "@/lib/egg-csv";
import type { Scan } from "@/lib/egg-types";
import { COLORS } from "@/theme/colors";

export default function History() {
  const { scans, removeScan, updateScan, hydrated } = useScans();
  const { rememberBatch } = useBatchNames();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Scan | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scans;
    return scans.filter((s) =>
      [s.batch, s.tray, s.flock, s.notes, s.prediction].join(" ").toLowerCase().includes(q),
    );
  }, [scans, query]);

  async function onExport() {
    if (!scans.length) {
      Alert.alert("Nothing to export", "No scans to export yet.");
      return;
    }
    await shareCsv("egg-scan-history.csv", scansToCsv(scans));
  }

  async function onSaveEdit() {
    if (!editing) return;
    const { id, ...patch } = editing;
    await updateScan(id, patch);
    if (editing.batch.trim()) await rememberBatch(editing.batch);
    setEditing(null);
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Scan logbook" subtitle={`${scans.length} saved scans`} />
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search batch, tray, notes…"
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <Pressable style={styles.exportButton} onPress={onExport}>
          <Ionicons name="download-outline" size={18} color={COLORS.text} />
        </Pressable>
      </View>

      {hydrated && !filtered.length ? (
        <Text style={styles.emptyText}>No scans yet. Analyze an egg to start your logbook.</Text>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        style={styles.flexList}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: s }) => (
          <View style={styles.card}>
            <Image source={{ uri: s.imageUri }} style={styles.thumb} />
            <View style={styles.cardBody}>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        s.prediction === "Fertile" ? COLORS.fertileTint : COLORS.infertileTint,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: s.prediction === "Fertile" ? COLORS.fertile : COLORS.infertile },
                    ]}
                  >
                    {s.prediction}
                  </Text>
                </View>
                <Text style={styles.confidenceText}>{s.confidence}%</Text>
              </View>
              <Text style={styles.metaText} numberOfLines={1}>
                {[s.batch || "Untagged", s.tray, s.flock].filter(Boolean).join(" · ")}
              </Text>
              <Text style={styles.dateText}>{new Date(s.createdAt).toLocaleString()}</Text>
              {s.notes ? (
                <Text style={styles.notesText} numberOfLines={2}>
                  {s.notes}
                </Text>
              ) : null}
            </View>
            <View style={styles.cardActions}>
              <Pressable style={styles.iconButton} onPress={() => setEditing(s)}>
                <Ionicons name="pencil" size={17} color={COLORS.text} />
              </Pressable>
              <Pressable
                style={styles.iconButton}
                onPress={() =>
                  Alert.alert("Delete scan?", "This can't be undone.", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => removeScan(s.id) },
                  ])
                }
              >
                <Ionicons name="trash-outline" size={17} color={COLORS.infertile} />
              </Pressable>
            </View>
          </View>
        )}
      />

      <Modal visible={!!editing} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit scan details</Text>
            {editing ? (
              <View style={styles.modalForm}>
                <View style={styles.row2}>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Batch</Text>
                    <BatchCombobox
                      value={editing.batch}
                      onChange={(v) => setEditing({ ...editing, batch: v })}
                    />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.label}>Tray / rack</Text>
                    <TextInput
                      style={styles.input}
                      value={editing.tray}
                      onChangeText={(t) => setEditing({ ...editing, tray: t })}
                    />
                  </View>
                </View>
                <View>
                  <Text style={styles.label}>Flock / farm</Text>
                  <TextInput
                    style={styles.input}
                    value={editing.flock}
                    onChangeText={(t) => setEditing({ ...editing, flock: t })}
                  />
                </View>
                <View>
                  <Text style={styles.label}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    value={editing.notes}
                    onChangeText={(t) => setEditing({ ...editing, notes: t })}
                    multiline
                  />
                </View>
              </View>
            ) : null}
            <View style={styles.modalActions}>
              <Pressable style={styles.modalCancel} onPress={() => setEditing(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalSave} onPress={onSaveEdit}>
                <Text style={styles.modalSaveText}>Save changes</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  searchRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  flexList: { flex: 1 },
  searchBox: { flex: 1, position: "relative", justifyContent: "center" },
  searchIcon: { position: "absolute", left: 10, zIndex: 1 },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.divider,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingLeft: 34,
    paddingRight: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
  },
  emptyText: {
    textAlign: "center",
    color: COLORS.textMuted,
    fontSize: 13,
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  listContent: { padding: 16, gap: 12 },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  thumb: { width: 76, height: 76, borderRadius: 10, backgroundColor: COLORS.divider },
  cardBody: { flex: 1, minWidth: 0, gap: 2 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  confidenceText: { fontSize: 12, fontWeight: "600", color: COLORS.text },
  metaText: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  dateText: { fontSize: 11, color: COLORS.textMuted },
  notesText: { fontSize: 12, color: COLORS.text, marginTop: 2 },
  cardActions: { justifyContent: "center", gap: 6 },
  iconButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },

  modalBackdrop: { flex: 1, backgroundColor: "rgba(28,27,31,0.4)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 16,
    maxHeight: "85%",
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  modalForm: { gap: 12 },
  row2: { flexDirection: "row", gap: 12 },
  flex1: { flex: 1 },
  label: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  textarea: { height: 80, textAlignVertical: "top" },
  modalActions: { flexDirection: "row", gap: 10 },
  modalCancel: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: { fontWeight: "600", color: COLORS.text },
  modalSave: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveText: { fontWeight: "700", color: COLORS.white },
});
