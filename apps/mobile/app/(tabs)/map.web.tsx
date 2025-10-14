// app/(tabs)/map.web.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function MapWebStub() {
  return (
    <View style={s.c}>
      <Text style={s.t}>Map is native-only for now</Text>
      <Text>Open the app on iOS/Android to see the live map.</Text>
    </View>
  );
}
const s = StyleSheet.create({
  c: { flex: 1, padding: 24, justifyContent: "center", alignItems: "center" },
  t: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
});
