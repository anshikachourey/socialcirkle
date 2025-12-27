import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from "react-native";
import { signInWithCustomToken, getAuth } from "firebase/auth";
import { auth } from "../src/lib/firebase";
import { api } from "../src/lib/api";
import { ensureChat, createGroup } from "../src/services/chats";

type Props = { visible?: boolean };

export default function DemoPanel({ visible = true }: Props) {
  const [users, setUsers] = useState<string[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [target, setTarget] = useState<string>("");
  const [place, setPlace] = useState("McDonalds @ University Dr");
  const [radius, setRadius] = useState("300");

  useEffect(() => {
    setMe(auth.currentUser?.uid ?? null);
    const unsub = getAuth().onAuthStateChanged(u => setMe(u?.uid ?? null));
    return () => unsub();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api("/api/dev/demo-users?n=8");
        const data = await res.json();
        setUsers(data.items);
      } catch {
        setUsers([]);
      }
    })();
  }, []);

  if (!visible) return null;

  async function switchTo(uid: string) {
    try {
      const res = await api("/api/dev/impersonate", { method: "POST", body: JSON.stringify({ uid }) });
      const data = await res.json();
      await signInWithCustomToken(auth, data.customToken);
    } catch (e: any) {
      Alert.alert("Switch failed", e?.message ?? "Could not impersonate");
    }
  }

  async function openOrStartChat(otherUid: string) {
    if (!otherUid.trim()) return;
    const { id } = await ensureChat(otherUid.trim());
    (globalThis as any)?.router?.push?.(`/chat/${id}`);
  }
  async function broadcastInvite() {
    const res = await api(`/api/dev/nearby?lat=30.6279&lng=-96.3344&radiusMeters=${encodeURIComponent(radius)}&n=8`);
    const data = await res.json();
    const uids: string[] = data.items;
    const chatId = await createGroup(`Invite: ${place}`, uids);
    (globalThis as any)?.router?.push?.(`/chat/${chatId}`);
  }
  async function createGroupByRadius() {
    const res = await api(`/api/dev/nearby?lat=30.6279&lng=-96.3344&radiusMeters=${encodeURIComponent(radius)}&n=6`);
    const data = await res.json();
    const uids: string[] = data.items;
    const chatId = await createGroup(`Group ${radius}m`, uids);
    (globalThis as any)?.router?.push?.(`/chat/${chatId}`);
  }

  return (
    <View
      pointerEvents="box-none"
      style={{ position: "absolute", left: 12, right: 12, bottom: 80 }}
    >
      <View
        style={{
          backgroundColor: "rgba(17,24,39,0.95)",
          padding: 12,
          borderRadius: 14,
        }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {/* Column 1 */}
          <View style={{ minWidth: 260, marginRight: 16 }}>
            <Text style={{ color: "#fff", fontWeight: "800", marginBottom: 6 }}>DEMO MODE</Text>
            <Text style={{ color: "#9ca3af", marginBottom: 8 }}>Current: {me ?? "—"}</Text>

            <Text style={{ color: "#d1d5db", marginBottom: 6 }}>Switch identity</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {users.map(uid => (
                <TouchableOpacity
                  key={uid}
                  onPress={() => switchTo(uid)}
                  style={{ backgroundColor: "#2563eb", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, margin: 4 }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>{uid.replace("demo_", "")}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Column 2 */}
          <View style={{ width: 260, marginRight: 16 }}>
            <Text style={{ color: "#d1d5db", marginBottom: 6 }}>1) View profile / friend / chat</Text>
            <TextInput
              placeholder="target uid e.g., demo_aria"
              placeholderTextColor="#9ca3af"
              value={target}
              onChangeText={setTarget}
              style={{ backgroundColor: "#111827", color: "#fff", borderColor: "#374151", borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 }}
            />
            <View style={{ flexDirection: "row", columnGap: 8, marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  if (!target.trim()) return;
                  (globalThis as any)?.router?.push?.(`/u/${target.trim()}`);
                }}
                style={{ backgroundColor: "#10b981", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Open Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => openOrStartChat(target)}
                style={{ backgroundColor: "#f59e0b", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 }}
              >
                <Text style={{ color: "#111827", fontWeight: "700" }}>Chat / Continue</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Column 3 */}
          <View style={{ width: 300, marginRight: 16 }}>
            <Text style={{ color: "#d1d5db", marginBottom: 6 }}>3) Invite everyone at a place</Text>
            <TextInput
              placeholder="Place (for label only)"
              placeholderTextColor="#9ca3af"
              value={place}
              onChangeText={setPlace}
              style={{ backgroundColor: "#111827", color: "#fff", borderColor: "#374151", borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 }}
            />
            <TextInput
              placeholder="Radius meters"
              placeholderTextColor="#9ca3af"
              value={radius}
              onChangeText={setRadius}
              keyboardType="numeric"
              style={{ backgroundColor: "#111827", color: "#fff", borderColor: "#374151", borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginTop: 8 }}
            />
            <TouchableOpacity
              onPress={broadcastInvite}
              style={{ backgroundColor: "#e11d48", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginTop: 8 }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>Broadcast Invite @ Place</Text>
            </TouchableOpacity>
          </View>

          {/* Column 4 */}
          <View style={{ width: 260 }}>
            <Text style={{ color: "#d1d5db", marginBottom: 6 }}>4) Create group by radius</Text>
            <TouchableOpacity
              onPress={createGroupByRadius}
              style={{ backgroundColor: "#8b5cf6", paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10 }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>Create Group (radius)</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
