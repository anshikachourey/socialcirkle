// app/(tabs)/_layout.tsx
import React, { useEffect, useState } from "react";
import { Tabs, useRouter, useSegments } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Entypo from "@expo/vector-icons/Entypo";
import { useAuth } from "@/lib/auth-context";
import { Pressable } from "react-native";
import { Menu } from "react-native-paper";

function RouteGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const first = segments[0];  // "(tabs)"
    const second = segments[1]; // "login" | "home" | "map" | "profile" | ...

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

function ProfileHeaderMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <Menu
      visible={open}
      onDismiss={() => setOpen(false)}
      anchor={
        <Pressable
          onPress={() => setOpen(true)}
          style={{ paddingHorizontal: 12, paddingVertical: 8 }}
          accessibilityLabel="Profile menu"
        >
          <Entypo name="dots-three-vertical" size={18} color="#111827" />
        </Pressable>
      }
    >
      <Menu.Item title="Settings" onPress={() => { setOpen(false); router.push("/(tabs)/settings"); }} />
      <Menu.Item title="My friends" onPress={() => { setOpen(false); router.push("/(tabs)/friends"); }} />
      <Menu.Item title="Blocked users" onPress={() => { setOpen(false); router.push("/(tabs)/blocked"); }} />
      <Menu.Item title="Change dot design" onPress={() => { setOpen(false); router.push("/(tabs)/circle-style"); }} />
    </Menu>
  );
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
            tabBarIcon: ({ color }) => <FontAwesome name="home" size={24} color={color} />,
          }}
        />

        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color }) => <FontAwesome name="comments" size={22} color={color} />,
          }}
        />

        <Tabs.Screen
          name="map"
          options={{
            title: "map",
            tabBarIcon: ({ color }) => <Entypo name="location-pin" size={26} color={color} />,
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: "profile",
            tabBarIcon: ({ color }) => <FontAwesome name="user" size={22} color={color} />,
            headerRight: () => <ProfileHeaderMenu />,
          }}
        />

        {/* Keep login route but hide it from the bar */}
        <Tabs.Screen
          name="login"
          options={{
            title: "Login",
            tabBarIcon: ({ color }) => <Entypo name="login" size={24} color={color} />,
            href: null, // hide from tab bar
          }}
        />

        {/* Hidden routes used by the profile menu */}
        <Tabs.Screen name="settings" options={{ title: "Settings", href: null }} />
        <Tabs.Screen name="friends" options={{ title: "My friends", href: null }} />
        <Tabs.Screen name="blocked" options={{ title: "Blocked users", href: null }} />
        <Tabs.Screen name="circle-style" options={{ title: "Dot design", href: null }} />
      </Tabs>
    </RouteGuard>
  );
}


