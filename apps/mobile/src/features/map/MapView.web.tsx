// apps/mobile/src/features/map/MapView.web.tsx
import React, { useEffect, useRef } from "react";
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

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);
  const openClickPopupRef = useRef<maplibregl.Popup | null>(null);

  const meMarkerRef = useRef<maplibregl.Marker | null>(null);
  const otherMarkersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  // ---------- helpers ----------
  const closeClickPopup = () => {
    if (openClickPopupRef.current) {
      openClickPopupRef.current.remove();
      openClickPopupRef.current = null;
    }
  };

  const makeHoverHTML = (title?: string, status?: string) => {
    const div = document.createElement("div");
    div.style.padding = "6px 8px";
    div.style.background = "white";
    div.style.border = "1px solid #e5e7eb";
    div.style.borderRadius = "8px";
    div.style.boxShadow = "0 4px 10px rgba(0,0,0,0.08)";
    div.style.fontFamily =
      "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial";
    div.innerHTML = `
      <div style="font-weight:600;font-size:13px;color:#111827;">${title ?? "User"}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:2px;">${status ?? "Available"}</div>
    `;
    return div;
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
    div.style.fontFamily =
      "system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial";

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
      const action = t.getAttribute("data-action") as
        | "view"
        | "chat"
        | "edit"
        | "request"
        | null;
      const userId = t.getAttribute("data-id");
      if (action && userId) onMarkerAction?.(action, userId);
    });

    return div;
  };

  // ---------- init map ONCE ----------
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [center.lng, center.lat],
      zoom,
    });

    mapRef.current = map;

    const hoverPopup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
    });

    hoverPopupRef.current = hoverPopup;

    map.on("click", () => {
      hoverPopup.remove();
      closeClickPopup();
    });

    map.on("load", () => {
      // create radius source/layers once (data updated in another effect)
      if (!map.getSource("radius")) {
        map.addSource("radius", {
          type: "geojson",
          data: makeCircleGeoJSON(center, radiusMeters ?? 0) as any,
        });
        map.addLayer({
          id: "radius-fill",
          type: "fill",
          source: "radius",
          paint: {
            "fill-color": selfVisible ? "#ef4444" : "#9ca3af",
            "fill-opacity": 0.15,
          },
        });
        map.addLayer({
          id: "radius-line",
          type: "line",
          source: "radius",
          paint: {
            "line-color": selfVisible ? "#ef4444" : "#9ca3af",
            "line-width": 1,
          },
        });
      }
    });

    return () => {
      hoverPopup.remove();
      closeClickPopup();
      otherMarkersRef.current.forEach((m) => m.remove());
      otherMarkersRef.current.clear();
      meMarkerRef.current?.remove();
      meMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- keep camera in sync without rebuilding ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.jumpTo({ center: [center.lng, center.lat], zoom });
  }, [center.lat, center.lng, zoom]);

  // ---------- update SELF marker ----------
  useEffect(() => {
    const map = mapRef.current;
    const hoverPopup = hoverPopupRef.current;
    if (!map || !hoverPopup) return;

    const selfTitle = "You";
    const selfStatus = selfVisible ? "Visible" : "Hidden";

    if (!meMarkerRef.current) {
      const meEl = document.createElement("div");
      meEl.style.width = "14px";
      meEl.style.height = "14px";
      meEl.style.borderRadius = "50%";
      meEl.style.border = "2px solid white";
      meEl.style.cursor = "pointer";

      const marker = new maplibregl.Marker({ element: meEl })
        .setLngLat([center.lng, center.lat])
        .addTo(map);

      meMarkerRef.current = marker;

      meEl.addEventListener("mouseenter", () => {
        hoverPopup
          .setDOMContent(makeHoverHTML(selfTitle, selfStatus))
          .setLngLat([center.lng, center.lat])
          .addTo(map);
      });
      meEl.addEventListener("mouseleave", () => hoverPopup.remove());

      meEl.addEventListener("click", (e) => {
        e.stopPropagation();
        const p = new maplibregl.Popup({ offset: 14, closeButton: true, closeOnClick: false })
          .setDOMContent(makeActionHTML("me", selfTitle, selfStatus, true))
          .setLngLat([center.lng, center.lat]);
        closeClickPopup();
        openClickPopupRef.current = p.addTo(map);
      });
    }

    // update position + color
    const el = meMarkerRef.current.getElement() as HTMLDivElement;
    el.style.background = selfVisible ? "#ef4444" : "#9ca3af";
    meMarkerRef.current.setLngLat([center.lng, center.lat]);
  }, [center.lat, center.lng, selfVisible]);

  // ---------- update radius circle ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // If circle is off, hide layers
    const fillId = "radius-fill";
    const lineId = "radius-line";

    const setLayerVisibility = (visible: boolean) => {
      if (map.getLayer(fillId)) map.setLayoutProperty(fillId, "visibility", visible ? "visible" : "none");
      if (map.getLayer(lineId)) map.setLayoutProperty(lineId, "visibility", visible ? "visible" : "none");
    };

    if (!showCircle || radiusMeters == null) {
      setLayerVisibility(false);
      return;
    }

    setLayerVisibility(true);

    const src = map.getSource("radius") as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData(makeCircleGeoJSON(center, radiusMeters) as any);
    }

    // recolor based on visibility
    if (map.getLayer(fillId)) map.setPaintProperty(fillId, "fill-color", selfVisible ? "#ef4444" : "#9ca3af");
    if (map.getLayer(lineId)) map.setPaintProperty(lineId, "line-color", selfVisible ? "#ef4444" : "#9ca3af");
  }, [center.lat, center.lng, showCircle, radiusMeters, selfVisible]);

  // ---------- update OTHER markers without rebuilding ----------
  useEffect(() => {
    const map = mapRef.current;
    const hoverPopup = hoverPopupRef.current;
    if (!map || !hoverPopup) return;

    const existing = otherMarkersRef.current;

    // remove markers that no longer exist
    const incomingIds = new Set(markers.map((m) => m.id));
    for (const [id, mk] of existing.entries()) {
      if (!incomingIds.has(id)) {
        mk.remove();
        existing.delete(id);
      }
    }

    // add/update markers
    markers.forEach((m) => {
      const already = existing.get(m.id);
      if (already) {
        already.setLngLat([m.lng, m.lat]);
        return;
      }

      const el = document.createElement("div");
      el.style.width = "12px";
      el.style.height = "12px";
      el.style.borderRadius = "50%";
      el.style.background = "#111827";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 0 0 1px rgba(0,0,0,0.1)";
      el.style.cursor = "pointer";

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([m.lng, m.lat])
        .addTo(map);

      existing.set(m.id, marker);

      el.addEventListener("mouseenter", () => {
        hoverPopup
          .setDOMContent(makeHoverHTML(m.title, m.status))
          .setLngLat([m.lng, m.lat])
          .addTo(map);
      });
      el.addEventListener("mouseleave", () => hoverPopup.remove());

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onMarkerPress?.(m.id);
        const p = new maplibregl.Popup({ offset: 14, closeButton: true, closeOnClick: false })
          .setDOMContent(makeActionHTML(m.id, m.title, m.status, false, m.relationship))
          .setLngLat([m.lng, m.lat]);

        closeClickPopup();
        openClickPopupRef.current = p.addTo(map);
      });
    });
  }, [markers, onMarkerPress, onMarkerAction]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
