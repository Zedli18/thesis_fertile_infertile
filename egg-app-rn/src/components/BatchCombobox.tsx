import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBatchNames, useScans } from "@/lib/egg-storage";
import { COLORS } from "@/theme/colors";

interface BatchComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function BatchCombobox({ value, onChange, placeholder }: BatchComboboxProps) {
  const { batchNames, rememberBatch } = useBatchNames();
  const { scans } = useScans();
  const [open, setOpen] = useState(false);

  const options = useMemo(() => {
    const fromScans = scans.map((s) => s.batch).filter(Boolean);
    const all = [...batchNames];
    for (const b of fromScans) {
      if (!all.some((x) => x.toLowerCase() === b.toLowerCase())) all.push(b);
    }
    const q = value.trim().toLowerCase();
    const filtered = q ? all.filter((b) => b.toLowerCase().includes(q)) : all;
    return filtered.sort((a, b) => a.localeCompare(b));
  }, [batchNames, scans, value]);

  const exactMatch = options.some((b) => b.toLowerCase() === value.trim().toLowerCase());
  const showCreate = value.trim().length > 0 && !exactMatch;

  function pick(name: string) {
    onChange(name);
    rememberBatch(name);
    setOpen(false);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setOpen(true)}
          onChangeText={(t) => {
            onChange(t);
            setOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => setOpen(false), 150);
            if (value.trim()) rememberBatch(value);
          }}
        />
        <Ionicons name="chevron-down" size={16} color={COLORS.textMuted} style={styles.chevron} />
      </View>

          {open && (options.length > 0 || showCreate) ? (
      <ScrollView 
        style={[styles.dropdown, styles.dropdownList]}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        {options.map((item) => (
          <Pressable key={item} style={styles.option} onPress={() => pick(item)}>
            <Text style={styles.optionText} numberOfLines={1}>
              {item}
            </Text>
            {item === value ? (
              <Ionicons name="checkmark" size={16} color={COLORS.primary} />
            ) : null}
          </Pressable>
        ))}

        {showCreate ? (
          <Pressable style={styles.option} onPress={() => pick(value.trim())}>
            <Ionicons name="add" size={16} color={COLORS.primary} />
            <Text style={styles.createText} numberOfLines={1}>
              {" "}
              Save "{value.trim()}" as a new batch
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    ) : null}
        </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative" },
  inputRow: { position: "relative", justifyContent: "center" },
  input: {
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingRight: 32,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
  },
  chevron: { position: "absolute", right: 10 },
  dropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: 4,
    maxHeight: 180,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.divider,
    zIndex: 50,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  dropdownList: { padding: 4 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 8,
  },
  optionText: { fontSize: 14, color: COLORS.text, flexShrink: 1 },
  createText: { fontSize: 14, color: COLORS.primary, fontWeight: "600", flexShrink: 1 },
});
