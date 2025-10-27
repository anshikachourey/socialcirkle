// src/features/map/MapView.native.tsx
import React, { useMemo, useState } from "react";
import { View, StyleSheet, Text, Pressable } from "react-native";
import MapLibreGL from "react-native-maplibre-gl";
import { STYLE_URL, assertMapKey } from "./config";
import { makeCircleGeoJSON } from "./geo";

type NMarker = { id: string; lat: number; lng: number; title?: string; status?: string; relationship?: "pending" | "accepted" | "blocked" | null; };

type Props = {
  center: { lat: number; lng: number };
  zoom?: number;
  radiusMeters?: number | null;
  showCircle?: boolean;
  markers?: NMarker[];
  onMarkerPress?: (id: string) => void;
  onMarkerAction?: (action: "view" | "chat" | "edit" | "request", id: string) => void;
  selfVisible?: boolean;
};

MapLibreGL.setAccessToken(null as any);

export default function MapView({
  center,
  zoom = 13,
  radiusMeters,
  showCircle,
  markers = [],
  onMarkerPress,
  onMarkerAction,
  selfVisible = false,
}: Props) {
  assertMapKey();

  const circleData = useMemo(
    () => (showCircle && radiusMeters != null ? makeCircleGeoJSON(center, radiusMeters) : null),
    [center.lat, center.lng, showCircle, radiusMeters]
  );

  const [selected, setSelected] = useState<NMarker | null>(null);

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView style={StyleSheet.absoluteFill} styleURL={STYLE_URL}>
        <MapLibreGL.Camera zoomLevel={zoom} centerCoordinate={[center.lng, center.lat]} />

        {/* SELF marker as colored dot with tap */}
        <MapLibreGL.PointAnnotation
          id="me"
          coordinate={[center.lng, center.lat]}
          onSelected={() => {
            setSelected({
              id: "me",
              lat: center.lat,
              lng: center.lng,
              title: "You",
              status: selfVisible ? "Visible" : "Hidden",
            });
            onMarkerPress?.("me");
          }}
        >
          <View
            style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: selfVisible ? "#ef4444" : "#9ca3af",
              borderWidth: 2,
              borderColor: "#fff",
            }}
          />
        </MapLibreGL.PointAnnotation>

        {/* Other users */}
        {markers.map((m) => (
          <MapLibreGL.PointAnnotation
            key={m.id}
            id={m.id}
            coordinate={[m.lng, m.lat]}
            title={m.title}
            onSelected={() => {
              setSelected(m);
              onMarkerPress?.(m.id);
            }}
          />
        ))}

        {/* Visibility circle (tinted) */}
        {circleData && (
          <MapLibreGL.ShapeSource id="radius" shape={circleData}>
            <MapLibreGL.FillLayer
              id="radius-fill"
              style={{ fillOpacity: 0.15, fillColor: selfVisible ? "#ef4444" : "#9ca3af" }}
            />
            <MapLibreGL.LineLayer
              id="radius-line"
              style={{ lineWidth: 1, lineColor: selfVisible ? "#ef4444" : "#9ca3af" }}
            />
          </MapLibreGL.ShapeSource>
        )}
      </MapLibreGL.MapView>

      {/* Bottom action sheet */}
      {selected && (
  <View style={styles.sheet}>
    <Text style={styles.name}>{selected.title ?? "User"}</Text>
    <Text style={styles.status}>{selected.status ?? "Available"}</Text>
    <View style={{ height: 8 }} />

    {selected.id === "me" ? (
      // Self: only “Edit profile”
      <View style={styles.row}>
        <Pressable
          onPress={() => onMarkerAction?.("edit", selected.id)}
          style={[styles.btn, { backgroundColor: "#111827" }]}
        >
          <Text style={[styles.btnT, { color: "white" }]}>Edit profile</Text>
        </Pressable>
      </View>
    ) : selected.relationship === "accepted" ? (
      // Friends: View + Chat
      <View style={styles.row}>
        <Pressable
          onPress={() => onMarkerAction?.("view", selected.id)}
          style={[styles.btn, { backgroundColor: "#111827" }]}
        >
          <Text style={[styles.btnT, { color: "white" }]}>View profile</Text>
        </Pressable>
        <Pressable
          onPress={() => onMarkerAction?.("chat", selected.id)}
          style={[styles.btn, { borderWidth: 1, borderColor: "#e5e7eb" }]}
        >
          <Text style={[styles.btnT, { color: "#111827" }]}>Chat</Text>
        </Pressable>
      </View>
    ) : selected.relationship === "pending" ? (
      // Pending: Requested (disabled) + View
        <View style={styles.row}>
          <Pressable
            disabled
            style={[styles.btn, { borderWidth: 1, borderColor: "#e5e7eb", opacity: 0.6 }]}
          >
            <Text style={[styles.btnT, { color: "#6b7280" }]}>Requested</Text>
          </Pressable>
          <Pressable
            onPress={() => onMarkerAction?.("view", selected.id)}
            style={[styles.btn, { backgroundColor: "#111827" }]}
          >
            <Text style={[styles.btnT, { color: "white" }]}>View profile</Text>
          </Pressable>
        </View>
      ) : (
        // Not related: View + Request chat
        <View style={styles.row}>
          <Pressable
            onPress={() => onMarkerAction?.("view", selected.id)}
            style={[styles.btn, { backgroundColor: "#111827" }]}
          >
            <Text style={[styles.btnT, { color: "white" }]}>View profile</Text>
          </Pressable>
          <Pressable
            onPress={() => onMarkerAction?.("request", selected.id)}
            style={[styles.btn, { borderWidth: 1, borderColor: "#e5e7eb" }]}
          >
            <Text style={[styles.btnT, { color: "#111827" }]}>Request chat</Text>
          </Pressable>
        </View>
      )}

      <Pressable style={styles.close} onPress={() => setSelected(null)}>
        <Text style={{ color: "#6b7280" }}>Close</Text>
      </Pressable>
    </View>
  )}


    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sheet: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    padding: 14,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  name: { fontSize: 16, fontWeight: "700", color: "#111827" },
  status: { marginTop: 2, fontSize: 13, color: "#6b7280" },
  row: { flexDirection: "row", gap: 10, marginTop: 10 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  btnT: { fontWeight: "700" },
  close: { alignSelf: "center", marginTop: 8 },
});


