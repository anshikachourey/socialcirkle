// app/(tabs)/map.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import * as Location from "expo-location";
import MapView from "../../src/features/map/MapView";
import { auth } from "../../src/lib/firebase";
import { onUserVisibility, saveSelfLocation } from "../../src/services/userSettings";
import { onAuthStateChanged, User } from "firebase/auth"; // if you're using compat, import from 'firebase/auth' via your wrapper

type Center = { lat: number; lng: number };
const MILES = (m: number) => m * 1609.344;

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

  // write-once guard for saving location
  const wroteOnceRef = useRef(false);

  // 0) watch auth state (fixes the "10 miles after refresh" issue)
  useEffect(() => {
    const off = onAuthStateChanged(auth as any, (user: User | null) => {
      setUid(user?.uid ?? null);
      setAuthReady(true);
    });
    return off;
  }, []);

  // 1) subscribe to user's visibility when we have a uid
  useEffect(() => {
    setVisLoaded(false);
    if (!uid) return;

    const off = onUserVisibility(uid, (v) => {
      setVisible(!!v.visible);
      setRadiusMeters(v.radiusMeters ?? null);
      setVisLoaded(true);
    });

    return () => off?.();
  }, [uid]);

  // 2) get device location once; save for the user if logged in (once)
  useEffect(() => {
    (async () => {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setCenter({ lat: 30.2672, lng: -97.7431 }); // Austin fallback
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

  // show a single loading state until we know auth + location (+ visibility if logged in)
  const stillLoading =
    !authReady ||
    locLoading ||
    (uid ? !visLoaded : false); // if logged out, no need to wait for vis

  if (stillLoading || !center) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading map…</Text>
      </View>
    );
  }

  // compute what to show
  const isLoggedIn = !!uid;

  // If logged in, use Firestore values. If logged out, choose what you prefer:
  // here we show visibility OFF (no confusing 10mi fallback)
  const effectiveVisible = isLoggedIn ? visible : false;
  const effectiveRadius = isLoggedIn ? radiusMeters : null;
  const showCircle = effectiveVisible && effectiveRadius != null;

  const selfVisible = !!effectiveVisible;

  return (
    <View style={{ flex: 1 }}>
      <MapView
        center={center}
        zoom={13}
        showCircle={showCircle}
        radiusMeters={effectiveRadius ?? undefined}
        markers={[]}
        selfVisible={selfVisible}
      />
      <Text style={{ textAlign: "center", padding: 8, color: "#6b7280" }}>
        {effectiveVisible
          ? effectiveRadius
            ? `Visible within ~${Math.round((effectiveRadius || 0) / 1609)} miles`
            : "Visible worldwide"
          : "Visibility off"}
      </Text>
    </View>
  );
}



