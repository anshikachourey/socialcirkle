import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Map() {
  return (
    <View style={[s.c, { justifyContent: "center", alignItems: "center" }]}>
      <Text style={s.cap}>Map preview not available on web. Open iOS or Android.</Text>
    </View>
  );
}
const s = StyleSheet.create({ c: { flex: 1 }, cap: { textAlign: "center", padding: 8, color: "#6b7280" } });
