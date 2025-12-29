// apps/mobile/src/features/map/MapView.web.tsx
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

const SRC_RADIUS = "radius";
const LYR_RADIUS_FILL = "radius-fill";
const LYR_RADIUS_LINE = "radius-line";

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
  const didInitialCenterRef = useRef(false);
  const loadedRef = useRef(false);

  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);
  const clickPopupRef = useRef<maplibregl.Popup | null>(null);

  const meMarkerRef = useRef<maplibregl.Marker | null>(null);
  const meElRef = useRef<HTMLDivElement | null>(null);

  const otherMarkersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLDivElement }>>(
    new Map()
  );

  const latestHandlers = useRef({ onMarkerPress, onMarkerAction });
  useEffect(() => {
    latestHandlers.current.onMarkerPress = onMarkerPress;
    latestHandlers.current.onMarkerAction = onMarkerAction;
  }, [onMarkerPress, onMarkerAction]);

  const latestState = useRef({
    center,
    zoom,
    radiusMeters,
    showCircle: !!showCircle,
    markers,
    selfVisible,
  });
  useEffect(() => {
    latestState.current = {
      center,
      zoom,
      radiusMeters,
      showCircle: !!showCircle,
      markers,
      selfVisible,
    };
  }, [center, zoom, radiusMeters, showCircle, markers, selfVisible]);

  // ---------- HTML builders ----------
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
      if (action && userId) latestHandlers.current.onMarkerAction?.(action, userId);
    });

    return div;
  };

  const openClickPopup = (map: maplibregl.Map, popup: maplibregl.Popup) => {
    if (clickPopupRef.current) clickPopupRef.current.remove();
    clickPopupRef.current = popup.addTo(map);
  };

  // ---------- INIT MAP ONCE ----------
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

    // Single hover popup instance
    hoverPopupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12,
    });

    map.on("load", () => {
      loadedRef.current = true;

      // Create radius source/layers once (hidden by default)
      if (!map.getSource(SRC_RADIUS)) {
        map.addSource(SRC_RADIUS, {
          type: "geojson",
          data: makeCircleGeoJSON(center, Math.max(1, radiusMeters ?? 1)) as any,
        });

        map.addLayer({
          id: LYR_RADIUS_FILL,
          type: "fill",
          source: SRC_RADIUS,
          paint: { "fill-color": "#9ca3af", "fill-opacity": 0.0 },
        });

        map.addLayer({
          id: LYR_RADIUS_LINE,
          type: "line",
          source: SRC_RADIUS,
          paint: { "line-color": "#9ca3af", "line-width": 1, "line-opacity": 0.0 },
        });
      }

      // Create self marker once
      if (!meMarkerRef.current) {
        const meEl = document.createElement("div");
        meEl.style.width = "14px";
        meEl.style.height = "14px";
        meEl.style.borderRadius = "50%";
        meEl.style.border = "2px solid white";
        meEl.style.background = selfVisible ? "#ef4444" : "#9ca3af";
        meEl.style.cursor = "pointer";
        meElRef.current = meEl;

        const selfTitle = "You";
        const selfStatus = selfVisible ? "Visible" : "Hidden";

        meEl.addEventListener("mouseenter", () => {
          const hover = hoverPopupRef.current;
          if (!hover) return;
          hover
            .setDOMContent(makeHoverHTML(selfTitle, selfStatus))
            .setLngLat([latestState.current.center.lng, latestState.current.center.lat])
            .addTo(map);
        });
        meEl.addEventListener("mouseleave", () => hoverPopupRef.current?.remove());

        meEl.addEventListener("click", (e) => {
          e.stopPropagation();
          const st = latestState.current;
          const p = new maplibregl.Popup({ offset: 14, closeButton: true, closeOnClick: false })
            .setDOMContent(makeActionHTML("me", "You", st.selfVisible ? "Visible" : "Hidden", true))
            .setLngLat([st.center.lng, st.center.lat]);
          openClickPopup(map, p);
        });

        meMarkerRef.current = new maplibregl.Marker({ element: meEl })
          .setLngLat([center.lng, center.lat])
          .addTo(map);
      }

      // Close popups when clicking map background
      map.on("click", () => {
        hoverPopupRef.current?.remove();
        if (clickPopupRef.current) {
          clickPopupRef.current.remove();
          clickPopupRef.current = null;
        }
      });

      // Initial center ONLY ONCE
      if (!didInitialCenterRef.current) {
        didInitialCenterRef.current = true;
        map.setCenter([center.lng, center.lat]);
        map.setZoom(zoom);
      }
    });

    return () => {
      hoverPopupRef.current?.remove();
      hoverPopupRef.current = null;

      if (clickPopupRef.current) {
        clickPopupRef.current.remove();
        clickPopupRef.current = null;
      }

      // remove other markers
      otherMarkersRef.current.forEach((v) => v.marker.remove());
      otherMarkersRef.current.clear();

      // remove self marker
      meMarkerRef.current?.remove();
      meMarkerRef.current = null;
      meElRef.current = null;

      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
      didInitialCenterRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- UPDATE SELF MARKER (position + color) ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !meMarkerRef.current) return;

    // position always follows center (your device)
    meMarkerRef.current.setLngLat([center.lng, center.lat]);

    // color follows visibility
    if (meElRef.current) {
      meElRef.current.style.background = selfVisible ? "#ef4444" : "#9ca3af";
    }

    // if hover popup is open on self, keep it pinned
    // (simple approach: just re-anchor if it exists)
    // not strictly necessary, but helps polish
  }, [center.lng, center.lat, selfVisible]);

  // ---------- UPDATE RADIUS CIRCLE (data + visibility + color) ----------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    const src = map.getSource(SRC_RADIUS) as maplibregl.GeoJSONSource | undefined;
    if (!src) return;

    const shouldShow = !!showCircle && selfVisible && radiusMeters != null && radiusMeters > 0;

    // update circle geometry (even if hidden, so it’s correct when turned on)
    const safeR = Math.max(1, radiusMeters ?? 1);
    src.setData(makeCircleGeoJSON(center, safeR) as any);

    const fillOpacity = shouldShow ? 0.15 : 0.0;
    const lineOpacity = shouldShow ? 1.0 : 0.0;
    const color = selfVisible ? "#ef4444" : "#9ca3af";

    if (map.getLayer(LYR_RADIUS_FILL)) {
      map.setPaintProperty(LYR_RADIUS_FILL, "fill-color", color);
      map.setPaintProperty(LYR_RADIUS_FILL, "fill-opacity", fillOpacity);
    }
    if (map.getLayer(LYR_RADIUS_LINE)) {
      map.setPaintProperty(LYR_RADIUS_LINE, "line-color", color);
      map.setPaintProperty(LYR_RADIUS_LINE, "line-opacity", lineOpacity);
    }
  }, [center.lat, center.lng, radiusMeters, showCircle, selfVisible]);

  // ---------- UPDATE OTHER MARKERS (diff add/remove/update) ----------
  const markersKey = useMemo(() => {
    // stable-ish signature to trigger updates when markers truly change
    // (prevents useless work if array identity changes but content doesn’t)
    return markers
      .map((m) => `${m.id}:${m.lat.toFixed(6)}:${m.lng.toFixed(6)}:${m.relationship ?? ""}:${m.status ?? ""}`)
      .join("|");
  }, [markers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const existing = otherMarkersRef.current;
    const nextIds = new Set(markers.map((m) => m.id));

    // remove old
    existing.forEach((v, id) => {
      if (!nextIds.has(id)) {
        v.marker.remove();
        existing.delete(id);
      }
    });

    // add/update
    for (const m of markers) {
      const found = existing.get(m.id);
      if (!found) {
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

        // hover
        el.addEventListener("mouseenter", () => {
          const hover = hoverPopupRef.current;
          if (!hover) return;
          hover
            .setDOMContent(makeHoverHTML(m.title, m.status))
            .setLngLat([m.lng, m.lat])
            .addTo(map);
        });
        el.addEventListener("mouseleave", () => hoverPopupRef.current?.remove());

        // click
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          latestHandlers.current.onMarkerPress?.(m.id);

          const p = new maplibregl.Popup({ offset: 14, closeButton: true, closeOnClick: false })
            .setDOMContent(makeActionHTML(m.id, m.title, m.status, false, m.relationship))
            .setLngLat([m.lng, m.lat]);
          openClickPopup(map, p);
        });

        existing.set(m.id, { marker, el });
      } else {
        // update position
        found.marker.setLngLat([m.lng, m.lat]);
        // (We don’t rebuild events; popups use latest state via closures enough for MVP)
      }
    }
  }, [markersKey]);

  // IMPORTANT: do NOT recenter map on center changes.
  // If you want a "recenter" button later, we’ll add it intentionally.

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
