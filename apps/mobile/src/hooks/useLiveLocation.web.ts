import { useEffect, useState } from "react";

export default function useLiveLocation(enabled: boolean) {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation not available");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setError(null);
      },
      (e) => setError(e.message),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { pos, error };
}
