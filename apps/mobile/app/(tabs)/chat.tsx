// app/(tabs)/chat.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, Pressable, StyleSheet } from "react-native";
import { auth } from "../../src/lib/firebase";                 // This is the relative path
import { onMyChats, ChatDoc } from "../../src/services/chats"; // new service for chats

export default function ChatTab() {
  const uid = auth.currentUser?.uid ?? null;
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatDoc[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If user not logged in, show message, not loading spinner
    if (!uid) { setLoading(false); return; }
    // Safety timeout to avoid hangs
    const t = setTimeout(() => setLoading(false), 4000);
    const off = onMyChats(
      uid,
      (rows) => {
        clearTimeout(t);
        setChats(rows);
        setLoading(false);
      },
      (e) => {
        clearTimeout(t);
        console.warn("[chat] snapshot error:", e?.message ?? e);
        setError(e?.message ?? "Failed to load chats");
        setLoading(false);
      }
    );
    return () => { clearTimeout(t); off?.(); };
  }, [uid]);

  if (!uid) {
    return (
      <View style={S.center}>
        <Text style={S.h}>Please sign in to view chats.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={S.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading chats…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={S.center}>
        <Text style={S.err}>{error}</Text>
      </View>
    );
  }

  if (chats.length === 0) {
    return (
      <View style={S.center}>
        <Text style={S.h}>No chats yet</Text>
        <Text style={S.sub}>Looks like you haven’t started chatting yet.</Text>
        <Text style={S.sub}>Go to the Map and find people!</Text>
      </View>
    );
  }
  return (
    <FlatList
      data={chats}
      keyExtractor={(it) => it.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <Pressable style={S.row} onPress={() => console.log("open chat", item.id)}>
          <Text style={S.title}>
            {item.members.filter(m => m !== uid)[0] ?? "Chat"}
          </Text>
          <Text style={S.meta}>
            {item.lastMessage?.text ?? "No messages yet"}
          </Text>
        </Pressable>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
    />
  );
}
const S = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  h: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 6 },
  sub: { color: "#6b7280" },
  err: { color: "#b91c1c" },
  row: { backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e5e7eb" },
  title: { fontSize: 16, fontWeight: "700", color: "#111827" },
  meta: { color: "#6b7280", marginTop: 2 },
});
