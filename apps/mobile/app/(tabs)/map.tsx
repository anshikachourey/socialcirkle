// apps/mobile/app/(tabs)/map.tsx
import React from "react";
import { View } from "react-native";

export default function Map() {
  // Base fallback so Expo Router is happy.
  // Platform-specific files override this at build time.
  return <View style={{ flex: 1 }} />;
}
