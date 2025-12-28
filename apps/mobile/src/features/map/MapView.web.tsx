// src/features/map/MapView.web.tsx
import React, { useEffect, useMemo, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { STYLE_URL, assertMapKey } from "./config";
import { makeCircleGeoJSON } from "./geo";

type WMarker = {
  id: string;
  lat: number;
  lng: number;
  title?: string;
  status?: string;
  relationship?: "pending" | "accepted" | "blocked" | null;
};

type Props = {
  center: { lat: number; lng: number };
  zoom?: number;
  radiusMeters?: number | null;
  showCircle?: boolean;
  markers?: WMarker[];
  onMarkerPress?: (id: string) => void;
  onMarkerAction?: (action: "view" | "chat" | "edit" | "request", id: string) => void;
  selfVisible?: boolean;
};

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
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);
  const clickPopupRef = useRef<maplibregl.Popup | null>(null);

  // Keep marker instances in a map so we can update/remove without re-init map
  const markerMapRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  const circleGeo = useMemo(() => {
    if (!showCircle || radiusMeters == null) return null;
    return makeCircleGeoJSON(center, radiusMeters) as any;
  }, [showCircle, radiusMeters, center.lat, center.lng]);

  // ---------- INIT MAP ONCE ----------
  useEffect(() => {
    if (!ref.current) return;
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: ref.current,
      style: STYLE_URL,
      center: [center.lng, center.lat],
      zoom,
    });

    mapRef.current = map;

    hoverPopupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
    });

    map.on("click", () => {
      hoverPopupRef.current?.remove();
      if (clickPopupRef.current) {
        clickPopupRef.current.remove();
        clickPopupRef.current = null;
      }
    });

    return () => {
      hoverPopupRef.current?.remove();
      if (clickPopupRef.current) clickPopupRef.current.remove();
      markerMapRef.current.forEach((m) => m.remove());
      markerMapRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- UPDATE CAMERA (DO NOT RECREATE MAP) ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.jumpTo({ center: [center.lng, center.lat], zoom });
  }, [center.lat, center.lng, zoom]);

  // ---------- UPDATE/UPSERT CIRCLE SOURCE ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const srcId = "radius-src";
    const fillId = "radius-fill";
    const lineId = "radius-line";

    const ensureLayers = () => {
      const src = map.getSource(srcId) as any;
      if (!circleGeo) {
        // remove if exists
        if (map.getLayer(fillId)) map.removeLayer(fillId);
        if (map.getLayer(lineId)) map.removeLayer(lineId);
        if (map.getSource(srcId)) map.removeSource(srcId);
        return;
      }

      if (!src) {
        map.addSource(srcId, { type: "geojson", data: circleGeo });
        map.addLayer({
          id: fillId,
          type: "fill",
          source: srcId,
          paint: { "fill-color": selfVisible ? "#ef4444" : "#9ca3af", "fill-opacity": 0.15 },
        });
        map.addLayer({
          id: lineId,
          type: "line",
          source: srcId,
          paint: { "line-color": selfVisible ? "#ef4444" : "#9ca3af", "line-width": 1 },
        });
      } else {
        src.setData(circleGeo);
        if (map.getLayer(fillId)) map.setPaintProperty(fillId, "fill-color", selfVisible ? "#ef4444" : "#9ca3af");
        if (map.getLayer(lineId)) map.setPaintProperty(lineId, "line-color", selfVisible ? "#ef4444" : "#9ca3af");
      }
    };

    if (map.loaded()) ensureLayers();
    else map.once("load", ensureLayers);
  }, [circleGeo, selfVisible]);

  // ---------- HELPERS ----------
  const makeHoverHTML = (title?: string, status?: string) => {
    const div = document.createElement("div");
    div.style.padding = "6px 8px";
    div.style.background = "white";
    div.style.border = "1px solid #e5e7eb";
    div.style.borderRadius = "8px";
    div.style.boxShadow = "0 4px 10px rgba(0,0,0,0.08)";
    div.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial";
    div.innerHTML = `
      <div style="font-weight:600;font-size:13px;color:#111827;">${title ?? "User"}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:2px;">${status ?? "Available"}</div>
    `;
    return div;
  };

  const openClickPopup = (lng: number, lat: number, node: HTMLElement) => {
    const map = mapRef.current;
    if (!map) return;

    if (clickPopupRef.current) clickPopupRef.current.remove();

    const p = new maplibregl.Popup({ offset: 14, closeButton: true, closeOnClick: false })
      .setDOMContent(node)
      .setLngLat([lng, lat])
      .addTo(map);

    clickPopupRef.current = p;
  };

  const makeActionHTML = (
    id: string,
    title?: string,
    status?: string,
    isSelf: boolean = false,
    relationship?: "pending" | "accepted" | "blocked" | null
  ) => {
    const div = document.createElement("div");
    div.style.padding = "10px 12px";
    div.style.background = "white";
    div.style.border = "1px solid #e5e7eb";
    div.style.borderRadius = "10px";
    div.style.boxShadow = "0 8px 16px rgba(0,0,0,0.12)";
    div.style.fontFamily = "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial";

    let buttons = "";
    if (isSelf) {
      buttons = `
        <div style="display:flex;gap:8px;">
          <button data-action="edit" data-id="${id}"
            style="padding:6px 10px;border-radius:8px;border:1px solid #111827;background:#111827;color:white;font-weight:600;cursor:pointer;">
            Edit profile
          </button>
        </div>`;
    } else if (relationship === "accepted") {
      buttons = `
        <div style="display:flex;gap:8px;">
          <button data-action="view" data-id="${id}"
            style="padding:6px 10px;border-radius:8px;border:1px solid #111827;background:#111827;color:white;font-weight:600;cursor:pointer;">
            View profile
          </button>
          <button data-action="chat" data-id="${id}"
            style="padding:6px 10px;border-radius:8px;border:1px solid #e5e7eb;background:white;color:#111827;font-weight:600;cursor:pointer;">
            Chat
          </button>
        </div>`;
    } else if (relationship === "pending") {
      buttons = `
        <div style="display:flex;gap:8px;align-items:center;">
          <button disabled
            style="padding:6px 10px;border-radius:8px;border:1px solid #e5e7eb;background:#f9fafb;color:#6b7280;font-weight:600;">
            Requested
          </button>
          <button data-action="view" data-id="${id}"
            style="padding:6px 10px;border-radius:8px;border:1px solid #111827;background:#111827;color:white;font-weight:600;cursor:pointer;">
            View profile
          </button>
        </div>`;
    } else {
      buttons = `
        <div style="display:flex;gap:8px;">
          <button data-action="view" data-id="${id}"
            style="padding:6px 10px;border-radius:8px;border:1px solid #111827;background:#111827;color:white;font-weight:600;cursor:pointer;">
            View profile
          </button>
          <button data-action="request" data-id="${id}"
            style="padding:6px 10px;border-radius:8px;border:1px solid #e5e7eb;background:white;color:#111827;font-weight:600;cursor:pointer;">
            Request chat
          </button>
        </div>`;
    }

    div.innerHTML = `
      <div style="font-weight:700;font-size:14px;color:#111827;">${title ?? "User"}</div>
      <div style="font-size:12px;color:#6b7280;margin:4px 0 10px;">${status ?? "Available"}</div>
      ${buttons}
    `;

    div.addEventListener("click", (e) => {
      const t = e.target as HTMLElement;
      const action = t.getAttribute("data-action") as "view" | "chat" | "edit" | "request" | null;
      const userId = t.getAttribute("data-id");
      if (action && userId) onMarkerAction?.(action, userId);
    });

    return div;
  };

  // ---------- UPSERT MARKERS WITHOUT RECREATING MAP ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const hoverPopup = hoverPopupRef.current;

    // Build desired marker set (including "me")
    const desiredIds = new Set<string>(["me", ...markers.map((m) => m.id)]);

    // Remove markers that no longer exist
    markerMapRef.current.forEach((mk, id) => {
      if (!desiredIds.has(id)) {
        mk.remove();
        markerMapRef.current.delete(id);
      }
    });

    // Upsert self marker
    if (!markerMapRef.current.has("me")) {
      const meEl = document.createElement("div");
      meEl.style.width = "14px";
      meEl.style.height = "14px";
      meEl.style.borderRadius = "50%";
      meEl.style.border = "2px solid white";
      meEl.style.cursor = "pointer";

      const meMarker = new maplibregl.Marker({ element: meEl }).setLngLat([center.lng, center.lat]).addTo(map);
      markerMapRef.current.set("me", meMarker);

      meEl.addEventListener("mouseenter", () => {
        hoverPopup
          ?.setDOMContent(makeHoverHTML("You", selfVisible ? "Visible" : "Hidden"))
          .setLngLat([center.lng, center.lat])
          .addTo(map);
      });
      meEl.addEventListener("mouseleave", () => hoverPopup?.remove());

      meEl.addEventListener("click", (e) => {
        e.stopPropagation();
        onMarkerPress?.("me");
        openClickPopup(center.lng, center.lat, makeActionHTML("me", "You", selfVisible ? "Visible" : "Hidden", true));
      });
    } else {
      markerMapRef.current.get("me")!.setLngLat([center.lng, center.lat]);
    }

    // Update self marker color
    const meEl = markerMapRef.current.get("me")?.getElement();
    if (meEl) (meEl as HTMLElement).style.background = selfVisible ? "#ef4444" : "#9ca3af";

    // Upsert other markers
    for (const m of markers) {
      if (!markerMapRef.current.has(m.id)) {
        const el = document.createElement("div");
        el.style.width = "12px";
        el.style.height = "12px";
        el.style.borderRadius = "50%";
        el.style.background = "#111827";
        el.style.border = "2px solid white";
        el.style.boxShadow = "0 0 0 1px rgba(0,0,0,0.1)";
        el.style.cursor = "pointer";

        const mk = new maplibregl.Marker({ element: el }).setLngLat([m.lng, m.lat]).addTo(map);
        markerMapRef.current.set(m.id, mk);

        el.addEventListener("mouseenter", () => {
          hoverPopup?.setDOMContent(makeHoverHTML(m.title, m.status)).setLngLat([m.lng, m.lat]).addTo(map);
        });
        el.addEventListener("mouseleave", () => hoverPopup?.remove());

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onMarkerPress?.(m.id);
          openClickPopup(m.lng, m.lat, makeActionHTML(m.id, m.title, m.status, false, m.relationship));
        });
      } else {
        markerMapRef.current.get(m.id)!.setLngLat([m.lng, m.lat]);
      }
    }
  }, [markers, center.lat, center.lng, selfVisible, onMarkerPress, onMarkerAction]);

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
}

