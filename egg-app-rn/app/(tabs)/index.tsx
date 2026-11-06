import * as FileSystem from 'expo-file-system/legacy';
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { AppHeader } from "@/components/AppHeader";
import { ResultCard } from "@/components/ResultCard";
import { BatchCombobox } from "@/components/BatchCombobox";
import { apiAnalyze, mockAnalyze, persistImage, type AnalysisResult } from "@/lib/egg-analysis";
import { useBatchNames, useScans } from "@/lib/egg-storage";
import { COLORS } from "@/theme/colors";

export default function Analyze() {
  const { addScan } = useScans();
  const { rememberBatch } = useBatchNames();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [meta, setMeta] = useState({ batch: "", tray: "", flock: "", notes: "" });

  function clearImage() {
    setImageUri(null);
    setResult(null);
  }

  // Core function to handle analysis with automatic mock fallback
  async function runAnalysis(uri: string) {
    setBusy(true);
    try {
      const res = await apiAnalyze(uri);
      setResult(res);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      Alert.alert(
        "Live analysis unavailable",
        `${message}. Running the built-in simulation instead.`,
      );
      setResult(await mockAnalyze(uri));
    } finally {
      setBusy(false);
    }
  }

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Camera access needed", "Enable camera access in Settings to candle eggs.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true });
    if (!res.canceled && res.assets[0]) {
      // Copy to document directory to get a clean file:// URI that Android renders natively
      const persistentUri = await persistImage(res.assets[0].uri);
      setImageUri(persistentUri);
      setResult(null);
      await runAnalysis(persistentUri);
    }
  }

  async function pickFromGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Photo access needed", "Enable photo library access in Settings.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });
    if (!res.canceled && res.assets[0]) {
      // Copy to document directory to get a clean file:// URI that Android renders natively
      const persistentUri = await persistImage(res.assets[0].uri);
      setImageUri(persistentUri);
      setResult(null);
      await runAnalysis(persistentUri);
    }
  }

  async function save() {
    if (!result || !imageUri) return;
    await addScan({
      id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      createdAt: Date.now(),
      imageUri,
      prediction: result.prediction,
      confidence: result.confidence,
      candling: result.candling,
      source: result.source,
      batch: meta.batch.trim(),
      tray: meta.tray.trim(),
      flock: meta.flock.trim(),
      notes: meta.notes.trim(),
    });
    if (meta.batch.trim()) await rememberBatch(meta.batch);
    Alert.alert("Saved", "Scan saved to your logbook.");
    clearImage();
    setMeta((m) => ({ ...m, notes: "" }));
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Egg Fertility Detector" subtitle="Candling scanner" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!imageUri ? (
          <View style={styles.dashedCard}>
            <View style={styles.iconChip}>
              <Ionicons name="scan-outline" size={30} color={COLORS.primary} />
            </View>
            <Text style={styles.dashedTitle}>Candle an egg</Text>
            <Text style={styles.dashedSubtitle}>
              Hold a bright light behind the egg in a dark room, then capture the shell.
            </Text>
            <View style={styles.buttonRow}>
              <Pressable style={styles.primaryButton} onPress={pickFromCamera}>
                <Ionicons name="camera" size={18} color={COLORS.white} />
                <Text style={styles.primaryButtonText}>Camera</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton} onPress={pickFromGallery}>
                <Ionicons name="image-outline" size={18} color={COLORS.text} />
                <Text style={styles.secondaryButtonText}>Gallery</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {/* 1. Pure Image Panel: Contains ABSOLUTELY NO buttons or overlays */}
            <View style={styles.pureImageCard}>
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
            </View>

            {/* 2. Completely separated action controls underneath the panel */}
            <View style={styles.externalActionRow}>
              <Pressable style={styles.outlineButton} onPress={clearImage}>
                <Ionicons name="trash-outline" size={16} color={COLORS.infertile} />
                <Text style={[styles.outlineButtonText, { color: COLORS.infertile }]}>Remove</Text>
              </Pressable>
              <Pressable style={styles.outlineButton} onPress={pickFromCamera}>
                <Ionicons name="refresh" size={16} color={COLORS.text} />
                <Text style={styles.outlineButtonText}>Retake</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, styles.flex1, busy && styles.disabled]}
                onPress={() => runAnalysis(imageUri)}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Ionicons name="scan" size={16} color={COLORS.white} />
                )}
                <Text style={styles.primaryButtonText}>{busy ? "Analyzing" : "Re-analyze"}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {result ? <ResultCard result={result} /> : null}

        {result ? (
          <View style={styles.tagCard}>
            <Text style={styles.tagTitle}>Tag this scan</Text>
            <View style={styles.row2}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Batch</Text>
                <BatchCombobox
                  placeholder="B-2026-04"
                  value={meta.batch}
                  onChange={(v) => setMeta({ ...meta, batch: v })}
                />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.label}>Tray / rack</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tray 3 / R2"
                  placeholderTextColor={COLORS.textMuted}
                  value={meta.tray}
                  onChangeText={(t) => setMeta({ ...meta, tray: t })}
                />
              </View>
            </View>
            <View>
              <Text style={styles.label}>Flock / farm source</Text>
              <TextInput
                style={styles.input}
                placeholder="Breeder flock A"
                placeholderTextColor={COLORS.textMuted}
                value={meta.flock}
                onChangeText={(t) => setMeta({ ...meta, flock: t })}
              />
            </View>
            <View>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Breed, day of incubation, candling observations…"
                placeholderTextColor={COLORS.textMuted}
                value={meta.notes}
                onChangeText={(t) => setMeta({ ...meta, notes: t })}
                multiline
                numberOfLines={3}
              />
            </View>
            <Pressable style={styles.saveButton} onPress={save}>
              <Ionicons name="save-outline" size={18} color={COLORS.white} />
              <Text style={styles.primaryButtonText}>Save to logbook</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  flex1: { flex: 1 },
  disabled: { opacity: 0.6 },

  dashedCard: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.divider,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 12,
  },
  iconChip: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: COLORS.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  dashedTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text, textAlign: "center" },
  dashedSubtitle: { fontSize: 13, color: COLORS.textMuted, textAlign: "center" },
  buttonRow: { flexDirection: "row", gap: 8, width: "100%", marginTop: 4 },

  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 48,
    flex: 1,
  },
  primaryButtonText: { color: COLORS.white, fontWeight: "700", fontSize: 14 },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: 12,
    height: 48,
    flex: 1,
  },
  secondaryButtonText: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  outlineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: 12,
    height: 44,
    flex: 1,
  },
  outlineButtonText: { color: COLORS.text, fontWeight: "600", fontSize: 14 },

  imageCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: "hidden",
    gap: 0,
  },
  image: { width: "100%", height: 260, backgroundColor: COLORS.divider },
  removeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(28,27,31,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageActions: { flexDirection: "row", gap: 8, padding: 12 },

  tagCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, gap: 12 },
  tagTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  row2: { flexDirection: "row", gap: 12 },
  label: { fontSize: 12, color: COLORS.textMuted, marginBottom: 6, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  textarea: { height: 80, textAlignVertical: "top" },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 48,
    marginTop: 4,
  },

  pureImageCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  externalActionRow: {
    flexDirection: "row",
    gap: 8,
  },
});