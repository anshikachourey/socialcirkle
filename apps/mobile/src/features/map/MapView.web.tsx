// src/features/map/MapView.web.tsx
import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { STYLE_URL, assertMapKey } from "./config";
import { makeCircleGeoJSON } from "./geo";

type Marker = { id: string; lat: number; lng: number; title?: string };
type Props = {
  center: { lat: number; lng: number };
  zoom?: number;
  radiusMeters?: number | null;
  showCircle?: boolean;
  markers?: Marker[];
  onMarkerPress?: (id: string) => void;
  selfVisible?: boolean; // color your marker
};

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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const map = new maplibregl.Map({
      container: ref.current,
      style: STYLE_URL,
      center: [center.lng, center.lat],
      zoom,
    });

    // Self marker colored by visibility
    const meEl = document.createElement("div");
    meEl.style.width = "12px";
    meEl.style.height = "12px";
    meEl.style.borderRadius = "50%";
    meEl.style.border = "2px solid white";
    meEl.style.background = selfVisible ? "#ef4444" /* red */ : "#9ca3af" /* gray */;
    new maplibregl.Marker({ element: meEl }).setLngLat([center.lng, center.lat]).addTo(map);

    // Other markers
    markers.forEach((m) => {
      const el = document.createElement("div");
      el.style.width = "10px";
      el.style.height = "10px";
      el.style.borderRadius = "50%";
      el.style.background = "#111827";
      el.style.cursor = "pointer";
      el.addEventListener("click", () => onMarkerPress?.(m.id));
      new maplibregl.Marker({ element: el }).setLngLat([m.lng, m.lat]).addTo(map);
    });

    // Visibility circle
    if (showCircle && radiusMeters != null) {
      const srcId = "radius";
      map.on("load", () => {
        map.addSource(srcId, { type: "geojson", data: makeCircleGeoJSON(center, radiusMeters) as any });
        map.addLayer({ id: "radius-fill", type: "fill", source: srcId, paint: { "fill-opacity": 0.15 } });
        map.addLayer({ id: "radius-line", type: "line", source: srcId, paint: { "line-width": 1 } });
      });
    }

    return () => map.remove();
  }, [center.lat, center.lng, zoom, showCircle, radiusMeters, markers, onMarkerPress, selfVisible]);

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
}
