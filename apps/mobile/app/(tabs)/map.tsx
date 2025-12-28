// apps/mobile/app/(tabs)/map.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text } from "react-native";
import MapView from "../../src/features/map/MapView.web"; // keep for now since you're on web
import { useAuth } from "../../src/lib/auth-context";
import { ensureUserDoc, subscribeAllUsers, updateMyLocation, type UserLocationDoc } from "../../src/services/location";
import { haversineMeters } from "../../src/features/map/distance";
import useLiveLocation from "../../src/hooks/useLiveLocation";

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

export default function MapTab() {
  const { user } = useAuth();

  const { pos, error } = useLiveLocation(true);

  const [meDoc, setMeDoc] = useState<UserLocationDoc | null>(null);
  const [allUsers, setAllUsers] = useState<UserLocationDoc[]>([]);

  const myCenter = useMemo(() => {
    // Fallback to College Station if location not available yet
    return pos ?? { lat: 30.6279, lng: -96.3344 };
  }, [pos]);

  useEffect(() => {
    if (!user?.uid) return;

    // Ensure user doc exists (professional app behavior)
    ensureUserDoc(user.uid, {
      displayName: user.displayName ?? null,
      email: user.email ?? null,
      photoURL: (user as any)?.photoURL ?? null,
    }).catch(console.warn);

    // Subscribe to users
    const off = subscribeAllUsers((rows) => setAllUsers(rows));
    return off;
  }, [user?.uid]);

  // Keep Firestore updated with my location (every 10s once we have it)
  useEffect(() => {
    if (!user?.uid) return;
    if (!pos) return;

    let alive = true;

    const push = async () => {
      if (!alive) return;
      try {
        await updateMyLocation(user.uid, pos.lat, pos.lng);
      } catch (e: any) {
        console.warn("updateMyLocation failed:", e?.message ?? e);
      }
    };

    push();
    const t = setInterval(push, 10000);

    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [user?.uid, pos?.lat, pos?.lng]);

  // Derive my settings from Firestore
  useEffect(() => {
    if (!user?.uid) return;
    const mine = allUsers.find((u) => u.uid === user.uid) ?? null;
    setMeDoc(mine);
  }, [allUsers, user?.uid]);

  const selfVisible = !!meDoc?.visibility?.enabled;
  const radiusMeters = meDoc?.visibility?.radiusMeters ?? 50 * 1609.344;

  // Filter users who should appear:
  // - must have location
  // - must be visible
  // - you must be within THEIR radius (their rule)
  // (Later: friends-only etc.)
  const markers: Marker[] = useMemo(() => {
    if (!user?.uid) return [];

    const me = myCenter;

    return allUsers
      .filter((u) => u.uid !== user.uid)
      .filter((u) => u.location?.lat != null && u.location?.lng != null)
      .filter((u) => u.visibility?.enabled)
      .filter((u) => {
        const otherCenter = { lat: u.location!.lat, lng: u.location!.lng };
        const d = haversineMeters(me, otherCenter);
        const otherRadius = u.visibility?.radiusMeters ?? 0;
        return d <= otherRadius;
      })
      .map((u) => ({
        id: u.uid,
        lat: u.location!.lat,
        lng: u.location!.lng,
        title: u.displayName ?? u.uid,
        status: "Nearby",
        relationship: null,
      }));
  }, [allUsers, user?.uid, myCenter.lat, myCenter.lng]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 12, backgroundColor: "#faf9f6" }}>
        <Text style={{ fontWeight: "700", fontSize: 18, color: "#111827" }}>Map</Text>
        <Text style={{ color: "#6b7280" }}>
          {selfVisible ? "Visible" : "Hidden"} • Radius ~{Math.round(milesFromMeters(radiusMeters))} miles
          {error ? ` • Location error: ${error}` : ""}
        </Text>
      </View>

      <MapView
        center={myCenter}
        zoom={13}
        showCircle
        radiusMeters={radiusMeters}
        markers={markers}
        selfVisible={selfVisible}
        onMarkerPress={() => {}}
        onMarkerAction={() => {}}
      />
    </View>
  );
}




