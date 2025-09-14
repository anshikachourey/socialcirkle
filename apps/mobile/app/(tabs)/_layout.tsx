// app/(tabs)/_layout.tsx
import React, { useEffect } from "react";
import { Tabs, useRouter, useSegments } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Entypo from "@expo/vector-icons/Entypo";
import { useAuth } from "@/lib/auth-context";

function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments(); // inside (tabs): ["(tabs)","login"] | ["(tabs)","home"] | ...

  useEffect(() => {
    if (loading) return;

    const first = segments[0];          // "(tabs)"
    const second = segments[1];         // "login" | "home" | "map" | "profile" | undefined
    const inTabs = first === "(tabs)";
    const inAuth = inTabs && second === "login";

    if (!user && inTabs && !inAuth) {
      router.replace("/(tabs)/login");
    } else if (user && inAuth) {
      router.replace("/(tabs)/home");
    }
  }, [user, loading, segments, router]);

  return <>{children}</>;
}

export default function TabsLayout() {
  return (
    <RouteGuard>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: "#faf9f6" },
          headerShadowVisible: false,
          tabBarStyle: {
            backgroundColor: "#faf9f6",
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarActiveTintColor: "#258DE8",
          tabBarInactiveTintColor: "#666666",
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <FontAwesome name="home" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="login"
          options={{
            title: "Login",
            tabBarIcon: ({ color }) => (
              <Entypo name="login" size={24} color={color} />
            ),
            // Optional: hide Login from the tab bar while keeping the route
            // href: null,           // uncomment to remove from tab bar
            // tabBarButton: () => null,
          }}
        />
        {/* Add map/profile later */}
        {/* <Tabs.Screen name="map" /> */}
        {/* <Tabs.Screen name="profile" /> */}
      </Tabs>
    </RouteGuard>
  );
}

