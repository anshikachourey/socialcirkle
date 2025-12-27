// apps/mobile/app/(tabs)/map.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text } from "react-native";
import MapView from "../../src/features/map/MapView.web";
import { onMyRelationships, type RelationshipRow } from "../../src/services/relationships";

type Marker = {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  status?: string;
  relationship?: "pending" | "accepted" | "blocked" | null;
};

function milesFromMeters(m: number) {
  return m / 1609.344;
}

// Deterministic “random” per id (so markers don’t jump every render)
function hash01(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // 0..1
  return (h >>> 0) / 4294967295;
}

export default function MapTab() {
  const [rels, setRels] = useState<RelationshipRow[]>([]);

  // Your “current location” center (hardcoded demo center for now)
  const center = useMemo(() => ({ lat: 30.6279, lng: -96.3344 }), []);

  // For now: assume “visible ON” + 50 miles (until backend wired)
  const selfVisible = true;
  const radiusMeters = 50 * 1609.344; // 50 miles

  useEffect(() => {
    const off = onMyRelationships(setRels);
    return off;
  }, []);

  const markers: Marker[] = useMemo(() => {
    const spread = 0.01; // degrees-ish (~1km)
    return (rels ?? []).map((r) => {
      const a = hash01(r.uid + "_a") - 0.5;
      const b = hash01(r.uid + "_b") - 0.5;
      return {
        id: r.uid,
        lat: center.lat + a * spread,
        lng: center.lng + b * spread,
        title: r.displayName ?? r.uid.replace("demo_", ""),
        status: "Nearby",
        relationship: r.status as any,
      };
    });
  }, [rels, center]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 12, backgroundColor: "#faf9f6" }}>
        <Text style={{ fontWeight: "700", fontSize: 18, color: "#111827" }}>Map</Text>
        <Text style={{ color: "#6b7280" }}>
          Visible within ~{Math.round(milesFromMeters(radiusMeters))} miles
        </Text>
      </View>

      <MapView
        center={center}
        zoom={13}
        showCircle
        radiusMeters={radiusMeters}
        markers={markers}
        selfVisible={selfVisible}
        // keep these optional; MapView will show hover/click popups itself
        onMarkerPress={() => {}}
        onMarkerAction={() => {}}
      />
    </View>
  );
}





