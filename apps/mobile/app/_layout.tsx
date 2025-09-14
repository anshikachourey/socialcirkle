import React from "react";
// import { Stack } from "expo-router";
// import "../src/firebaseConfig"; // init Firebase once

// export default function RootLayout() {
//   return <Stack screenOptions={{ headerShown: false }} />;
// }

import { Slot } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { AuthProvider } from "@/lib/auth-context";

export default function RootLayout(){
  return (
    <PaperProvider>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </PaperProvider>
  );
}
