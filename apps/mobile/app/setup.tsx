import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Switch, Pressable, TextInput, Alert } from "react-native";
import { router } from "expo-router";
import { auth, db, firestore } from "../src/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const milesToMeters = (m: number) => m * 1609.344;
const PRESETS = [
  { label: "1 mi", m: milesToMeters(1) },
  { label: "10 mi", m: milesToMeters(10) },
  { label: "50 mi", m: milesToMeters(50) },
  { label: "100 mi", m: milesToMeters(100) },
  { label: "Worldwide", m: null as number | null },
];

export default function Setup() {
  const [name, setName] = useState("");
  const [visible, setVisible] = useState(false);
  const [radius, setRadius] = useState<number | null>(milesToMeters(10));
  const [custom, setCustom] = useState("");

  // If a completed user lands here, bounce to tabs
  useEffect(() => {
    const off = onAuthStateChanged(auth as any, async (u) => {
      if (!u) return;
      const snap = await db.collection("users").doc(u.uid).get?.();
      const d = typeof snap?.data === "function" ? snap.data() : snap?.data;
      if (d?.profileComplete) router.replace("/(tabs)/map");
    });
    return off;
  }, []);

  const canSave =
    name.trim().length > 0 &&
    (!visible || radius != null || custom.trim().length > 0);

  async function save() {
    const u = auth.currentUser;
    if (!u) {
      Alert.alert("Please wait", "We’re finishing sign-in. Try again in a moment.");
      return;
    }
    const uid = u.uid;

    let r = radius;
    if (visible && custom.trim()) {
      const n = Number(custom);
      if (!Number.isFinite(n) || n <= 0) {
        Alert.alert("Invalid radius", "Enter a positive number of miles.");
        return;
      }
      r = milesToMeters(n);
    }

    await db.collection("users").doc(uid).set(
      {
        displayName: name.trim() || null,
        visibility: { visible, radiusMeters: visible ? r : null },
        profileComplete: true,
        updatedAt: firestore.FieldValue?.serverTimestamp?.() ?? new Date(),
      },
      { merge: true }
    );

    router.replace("/(tabs)/map");
  }

  return (
    <View style={s.c}>
      <Text style={s.h}>Finish setup</Text>

      <Text style={s.l}>Name</Text>
      <TextInput
        placeholder="Your name"
        value={name}
        onChangeText={setName}
        style={s.input}
      />

      <View style={s.row}>
        <Text style={s.rowT}>Show my location</Text>
        <Switch value={visible} onValueChange={setVisible} />
      </View>

      {visible && (
        <>
          <Text style={[s.l, { marginTop: 8 }]}>Visibility radius</Text>
          <View style={s.pills}>
            {PRESETS.map((p) => {
              const active = radius === p.m;
              return (
                <Pressable
                  key={p.label}
                  onPress={() => setRadius(p.m)}
                  style={[s.pill, active && s.pillA]}
                >
                  <Text style={[s.pillT, active && s.pillTA]}>{p.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={s.custom}>
            <TextInput
              placeholder="Custom miles (optional)"
              keyboardType="numeric"
              value={custom}
              onChangeText={setCustom}
              style={[s.input, { flex: 1 }]}
            />
          </View>
        </>
      )}

      <Pressable style={[s.btn, !canSave && { opacity: 0.5 }]} onPress={save} disabled={!canSave}>
        <Text style={s.btnT}>Continue</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, padding: 20, gap: 12, justifyContent: "center" },
  h: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  l: { fontSize: 14, color: "#374151" },
  input: { borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  rowT: { fontSize: 16, fontWeight: "600" },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: "#d1d5db" },
  pillA: { backgroundColor: "#111827", borderColor: "#111827" },
  pillT: { color: "#111827", fontWeight: "600" },
  pillTA: { color: "#fff" },
  custom: { flexDirection: "row", alignItems: "center", gap: 8 },
  btn: { backgroundColor: "#111827", borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 12 },
  btnT: { color: "#fff", fontWeight: "700" },
});
