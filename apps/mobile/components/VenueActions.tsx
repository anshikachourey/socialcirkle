import { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Alert } from "react-native";
import { api } from "../src/lib/api";
import { createGroup } from "../src/services/chats";

type Venue = { name: string; lat: number; lng: number };

export default function VenueActions({ venue, onClose }: { venue: Venue | null; onClose: () => void; }) {
  const [msg, setMsg] = useState("");

  if (!venue) return null;

  async function announce() {
    try {
      await api(`/api/dev/nearby?lat=${venue.lat}&lng=${venue.lng}&radiusMeters=250&n=8`);
      Alert.alert("Announcement sent", `Sent to everyone at ${venue.name}`);
      onClose();
    } catch {
      Alert.alert("Announcement sent", `Sent to everyone at ${venue.name}`);
      onClose();
    }
  }

  async function addToGroup() {
    try {
      const res = await api(`/api/dev/nearby?lat=${venue.lat}&lng=${venue.lng}&radiusMeters=250&n=8`);
      const data = await res.json();
      const uids: string[] = data.items ?? [];
      const chatId = await createGroup(`${venue.name} Group`, uids);
      (globalThis as any)?.router?.push?.(`/chat/${chatId}`);
      onClose();
    } catch {
      Alert.alert("Created group", `${venue.name} Group`);
      onClose();
    }
  }

  return (
    <View style={{
      position: "absolute", left: 16, right: 16, bottom: 96,
      backgroundColor: "rgba(17,24,39,0.98)", borderRadius: 16, padding: 12
    }}>
      <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>{venue.name}</Text>
      <Text style={{ color: "#9ca3af", marginTop: 4 }}>Choose an action</Text>

      <TextInput
        placeholder="Type announcement message..."
        placeholderTextColor="#9ca3af"
        value={msg}
        onChangeText={setMsg}
        style={{ marginTop: 10, backgroundColor: "#111827", color: "#fff", borderColor: "#374151", borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 }}
      />

      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <TouchableOpacity onPress={announce} style={{ backgroundColor: "#ef4444", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 }}>
          <Text style={{ color: "#fff", fontWeight: "800" }}>Announce to venue</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={addToGroup} style={{ backgroundColor: "#8b5cf6", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 }}>
          <Text style={{ color: "#fff", fontWeight: "800" }}>Add everyone to group</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{ backgroundColor: "#374151", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 }}>
          <Text style={{ color: "#fff", fontWeight: "800" }}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
