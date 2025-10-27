// app/u/[id].tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { db } from "../../src/lib/firebase";

type UserDoc = {
  displayName?: string | null;
  username?: string | null;
  bio?: string | null;
  photoURL?: string | null;
};

export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const off = db.collection("users").doc(String(id)).onSnapshot((snap: any) => {
      setData(snap?.data?.() ?? {});
      setLoading(false);
    }, () => setLoading(false));
    return () => off?.();
  }, [id]);

  if (loading) {
    return <View style={s.center}><ActivityIndicator /><Text style={s.hint}>Loading…</Text></View>;
  }

  return (
    <View style={s.c}>
      <Image
        source={data?.photoURL ? { uri: data.photoURL } : require("../../assets/profile-placeholder.png")}
        style={s.avatar}
      />
      <Text style={s.name}>{data?.displayName ?? "User"}</Text>
      {!!data?.username && <Text style={s.username}>@{data.username}</Text>}
      <Text style={s.bio}>{data?.bio ?? ""}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  center:{flex:1,alignItems:"center",justifyContent:"center"},
  hint:{marginTop:8,color:"#6b7280"},
  c: { flex: 1, alignItems: "center", padding: 24, gap: 8 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 8, backgroundColor:"#e5e7eb" },
  name: { fontSize: 22, fontWeight: "700", color: "#111827" },
  username: { fontSize: 14, color: "#6b7280", marginBottom: 6 },
  bio: { fontSize: 14, color: "#374151", textAlign: "center", marginHorizontal: 24, marginTop: 4 },
});
