// app/_layout.tsx
import React, { useEffect, useState } from "react";
import { Slot, usePathname, useRouter } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { AuthProvider } from "@/lib/auth-context";
import { auth, db } from "../src/lib/firebase";

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      // Not logged in → only allow /login
      if (!u) {
        if (pathname !== "/login") router.replace("/login");
        setReady(true);
        return;
      }

      // Logged in → check profileComplete once
      // Logged in → check profileComplete once (via onSnapshot then immediately unsubscribe)
      const docRef = db.collection("users").doc(u.uid);

      const offDoc = docRef.onSnapshot(
        (snap: any) => {
          const d = snap?.data?.();
          const complete = !!d?.profileComplete;

          if (!complete) {
            if (pathname !== "/setup") router.replace("/setup");
          } else {
            if (pathname === "/login" || pathname === "/setup" || pathname === "/") {
              router.replace("/(tabs)/map");
            }
          }

          setReady(true);
          offDoc(); // ✅ unsubscribe immediately (one-time)
        },
        (err: any) => {
          console.warn("[guard] user doc error:", err?.message ?? err);
          setReady(true);
        }
      );

          });

    return () => unsub();
    // IMPORTANT: do not depend on pathname or you'll keep re-running this guard
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui",
        }}
      >
        Loading…
      </div>
    );
  }

  return (
    <PaperProvider>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </PaperProvider>
  );
}
