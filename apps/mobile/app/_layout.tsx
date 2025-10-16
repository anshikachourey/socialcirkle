import React from "react";
// import { Stack } from "expo-router";
// import "../src/firebaseConfig"; // init Firebase once

// export default function RootLayout() {
//   return <Stack screenOptions={{ headerShown: false }} />;
// }

import { Slot, usePathname } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { AuthProvider } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { auth, db } from "../src/lib/firebase";

export function useOnboardingGuard() {
  const [ready, setReady] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      console.log("[guard] auth changed. user?", !!u, "path:", pathname);

      if (!u) {
        if (pathname !== "/login") router.replace("/login");
        setReady(true);
        return;
      }

      const offDoc = db.collection("users").doc(u.uid).onSnapshot((snap: any) => {
        const d = snap?.data?.();
        const complete = !!d?.profileComplete;
        console.log("[guard] user doc:", d, "complete?", complete);

        if (!complete) {
          if (pathname !== "/setup") router.replace("/setup");
        } else {
          if (pathname === "/login" || pathname === "/setup" || pathname === "/") {
            router.replace("/(tabs)/map");
          }
        }

        setReady(true);
        offDoc?.(); // stop after first snapshot
      }, (err: any) => {
        console.warn("[guard] user doc error:", err?.message ?? err);
        setReady(true);
      });
    });
    return unsub;
  }, [pathname]);

  return ready;
}

export default function RootLayout() {
  const ready = useOnboardingGuard();
  if (!ready) {
    return (
      <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',fontFamily:'system-ui'}}>
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


