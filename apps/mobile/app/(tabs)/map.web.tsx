// app/(tabs)/map.web.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function MapWeb() {
  return (
    <View style={s.c}>
      <Text style={s.t}>Map is mobile-only in this MVP.</Text>
      <Text style={s.d}>Open on iOS/Android to see the native map.</Text>
    </View>
  );
}
const s = StyleSheet.create({
  c: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  t: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  d: { color: "#6b7280" },
});
