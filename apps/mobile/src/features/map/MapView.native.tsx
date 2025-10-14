// src/features/map/MapView.native.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import MapLibreGL from "react-native-maplibre-gl";
import { STYLE_URL, assertMapKey } from "./config";
import { makeCircleGeoJSON } from "./geo";

type Marker = { id: string; lat: number; lng: number; title?: string };
type Props = {
  center: { lat: number; lng: number };
  zoom?: number;
  radiusMeters?: number | null; // null => worldwide (no circle)
  showCircle?: boolean;
  markers?: Marker[];
  onMarkerPress?: (id: string) => void;
  selfVisible?: boolean; // color your marker
};

MapLibreGL.setAccessToken(null as any); // MapTiler key is embedded in style URL

export default function MapView({
  center,
  zoom = 13,
  radiusMeters,
  showCircle,
  markers = [],
  onMarkerPress,
  selfVisible = false,
}: Props) {
  assertMapKey();

  const circleData =
    showCircle && radiusMeters != null ? makeCircleGeoJSON(center, radiusMeters) : null;

  // Build a point feature for "me"
  const me = {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [center.lng, center.lat] },
        properties: {},
      },
    ],
  };

  const meFill = selfVisible ? "#ef4444" /* red */ : "#9ca3af" /* gray */;

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView style={StyleSheet.absoluteFill} styleURL={STYLE_URL}>
        <MapLibreGL.Camera zoomLevel={zoom} centerCoordinate={[center.lng, center.lat]} />

        {/* Self marker colored by visibility */}
        <MapLibreGL.ShapeSource id="me-src" shape={me as any}>
          <MapLibreGL.CircleLayer
            id="me-dot"
            style={{
              circleRadius: 6,
              circleColor: meFill,
              circleStrokeWidth: 2,
              circleStrokeColor: "#ffffff",
            }}
          />
        </MapLibreGL.ShapeSource>

        {/* Other markers */}
        {markers.map((m) => (
          <MapLibreGL.PointAnnotation
            key={m.id}
            id={m.id}
            coordinate={[m.lng, m.lat]}
            title={m.title}
            onSelected={() => onMarkerPress?.(m.id)}
          />
        ))}

        {/* Visibility circle */}
        {circleData && (
          <MapLibreGL.ShapeSource id="radius" shape={circleData}>
            <MapLibreGL.FillLayer id="radius-fill" style={{ fillOpacity: 0.15 }} />
            <MapLibreGL.LineLayer id="radius-line" style={{ lineWidth: 1 }} />
          </MapLibreGL.ShapeSource>
        )}
      </MapLibreGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});

