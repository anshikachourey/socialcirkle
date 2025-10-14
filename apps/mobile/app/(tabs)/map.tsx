// app/(tabs)/map.tsx — fallback (no native imports)
import React from "react";
import { View } from "react-native";

export default function MapFallback() {
  // This file exists only to satisfy Expo Router's fallback requirement.
  // Platform-specific files will override this:
  //   - map.web.tsx on web
  //   - map.native.tsx on iOS/Android
  return <View style={{ flex: 1 }} />;
}