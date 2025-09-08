import React, { useEffect } from "react";
import { Tabs, useRouter, useSegments } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Entypo from "@expo/vector-icons/Entypo";
import { useAuth } from "@/lib/auth-context";

function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const first = segments[0];               // typed as: "_sitemap" | "(tabs)" | "home" | "login" | "map" | "profile" | undefined
    const inAuth = first === "login";        // ✅ match your actual auth route

    if (!user && !inAuth) {
      router.replace("/login");
    } else if (user && inAuth) {
      router.replace("/home");
    }
  }, [user, loading, segments, router]);

  return <>{children}</>;
}

export default function TabsLayout() {
  return (
    <RouteGuard>
      <Tabs screenOptions={{ tabBarInactiveTintColor: "coral" }}>
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="login"
          options={{
            title: "Login",
            tabBarIcon: ({ color }) => <Entypo name="login" size={24} color={color} />,
          }}
        />
        {/* add map/profile tabs here if you like */}
      </Tabs>
    </RouteGuard>
  );
}
