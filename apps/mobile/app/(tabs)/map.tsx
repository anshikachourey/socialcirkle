// apps/mobile/app/(tabs)/map.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import MapView from "../../src/features/map/MapView";
import { auth } from "../../src/lib/firebase";
import { onUserVisibility, saveSelfLocation } from "../../src/services/userSettings";
import { onAuthStateChanged, User } from "firebase/auth";
import { onVisibleUsers, PublicUser } from "../../src/services/visibleUsers";
import { haversineMeters } from "../../src/features/map/distance";
import { ensureChat } from "../../src/services/chats";
import { onMyRelationships, requestChat } from "../../src/services/relationships";
import { router } from "expo-router";

type Center = { lat: number; lng: number };

function milesFromMeters(m: number) {
  return m / 1609.344;
}

export default function MapTab() {
  // auth state
  const [authReady, setAuthReady] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  // device location
  const [center, setCenter] = useState<Center | null>(null);
  const [locLoading, setLocLoading] = useState(true);

  // visibility settings
  const [visLoaded, setVisLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [radiusMeters, setRadiusMeters] = useState<number | null>(null);

  // other users
  const [others, setOthers] = useState<PublicUser[]>([]);
  const [rels, setRels] = useState<Record<string, "pending" | "accepted" | "blocked">>({});

  const wroteOnceRef = useRef(false);

  // auth
  useEffect(() => {
    const off = onAuthStateChanged(auth as any, (user: User | null) => {
      setUid(user?.uid ?? null);
      setAuthReady(true);
    });
    return off;
  }, []);

  useEffect(() => {
    if (!uid) return;
    const off = onMyRelationships(setRels);
    return off;
  }, [uid]);

  // subscribe to my visibility
  useEffect(() => {
    setVisLoaded(false);
    if (!uid) return;

    const off = onUserVisibility(uid, (v) => {
      // IMPORTANT: keep this in sync with whatever you store in Firestore
      // If you switch to visibility.enabled, change this to !!v.enabled
      setVisible(!!v.visible);
      setRadiusMeters(v.radiusMeters ?? null);
      setVisLoaded(true);
    });

    return () => off?.();
  }, [uid]);

  // device location once
  useEffect(() => {
    (async () => {
      setLocLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setCenter({ lat: 30.2672, lng: -97.7431 });
        setLocLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const c = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setCenter(c);
      setLocLoading(false);

      if (uid && !wroteOnceRef.current) {
        wroteOnceRef.current = true;
        saveSelfLocation(uid, c.lat, c.lng).catch(() => {});
      }
    })();
  }, [uid]);

  // subscribe to other visible users
  useEffect(() => {
    if (!uid) return;
    const off = onVisibleUsers((list) => {
      setOthers(list.filter((u) => u.id !== uid)); // exclude self
    });
    return () => off?.();
  }, [uid]);

  const stillLoading = !authReady || locLoading || (uid ? !visLoaded : false) || !center;
  if (stillLoading || !center) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading map…</Text>
      </View>
    );
  }

  const isLoggedIn = !!uid;
  const effectiveVisible = isLoggedIn ? visible : false;
  const effectiveRadius = isLoggedIn ? radiusMeters : null;

  // ✅ Circle should render ONLY when visible AND radius is a number
  const showCircle = effectiveVisible && typeof effectiveRadius === "number";
  const selfVisible = effectiveVisible;

  // Build markers and filter other users by *my* visibility radius
  const markers = (others || [])
    .filter((u) => {
      if (!u.location?.lat || !u.location?.lng) return false;
      if (!effectiveVisible) return false;
      if (effectiveRadius == null) return true; // worldwide shows all
      const d = haversineMeters(center, { lat: u.location.lat, lng: u.location.lng });
      return d <= effectiveRadius;
    })
    .map((u) => ({
      id: u.id,
      lat: u.location!.lat,
      lng: u.location!.lng,
      title: u.displayName ?? "User",
      status: u.status ?? "Available",
      relationship: rels[u.id] ?? null,
    }));

  function handleAction(action: "view" | "chat" | "edit" | "request", userId: string) {
    if (action === "edit" && userId === "me") {
      router.push("/profile");
      return;
    }

    if (action === "view") {
      console.log("view profile:", userId);
      return;
    }

    if (action === "request") {
      requestChat(userId).catch((e) => console.warn("requestChat failed:", e?.message ?? e));
      return;
    }

    if (action === "chat") {
      const me = auth.currentUser?.uid;
      if (!me) return router.replace("/login");
      ensureChat(me, userId)
        .then(() => router.replace("/(tabs)/chat"))
        .catch((e) => console.warn("ensureChat failed:", e?.message ?? e));
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Header overlay */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: 12,
          backgroundColor: "#faf9f6",
          zIndex: 10,
        }}
      >
        <Text style={{ fontWeight: "700", fontSize: 18, color: "#111827" }}>Map</Text>

        <Text style={{ color: "#6b7280" }}>
          {selfVisible
            ? effectiveRadius == null
              ? "Visible • Radius: Worldwide"
              : `Visible • Radius ~${Math.round(milesFromMeters(effectiveRadius))} miles`
            : "Hidden • Location sharing is off"}
        </Text>
      </View>

      {/* Map area */}
      <View style={{ flex: 1, paddingTop: 72 }}>
        <MapView
          center={center}
          zoom={13}
          showCircle={showCircle}
          radiusMeters={showCircle ? effectiveRadius : null}
          markers={markers}
          selfVisible={selfVisible}
          onMarkerAction={handleAction}
        />
      </View>
    </View>
  );
}
