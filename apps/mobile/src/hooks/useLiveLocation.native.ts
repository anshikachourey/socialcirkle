import { useEffect, useState } from "react";
import * as Location from "expo-location";

export default function useLiveLocation(enabled: boolean) {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let alive = true;

    (async () => {
      if (!enabled) return;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!alive) return;

      if (status !== "granted") {
        setError("Location permission denied");
        return;
      }

      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 5,
        },
        (loc) => {
          setPos({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          setError(null);
        }
      );
    })().catch((e) => setError(e?.message ?? String(e)));

    return () => {
      alive = false;
      sub?.remove();
    };
  }, [enabled]);

  return { pos, error };
}
