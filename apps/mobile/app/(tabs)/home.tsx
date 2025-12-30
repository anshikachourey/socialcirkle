// apps/mobile/app/(tabs)/home.tsx
import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { auth, db, firestore, signOutUser } from "@/lib/firebase";
import { createAnnouncement } from "@/services/announcements"; // adjust path if needed

export default function Home() {
  const [status, setStatus] = useState<string>("");

  async function out() {
    await signOutUser();
    router.replace("/login");
  }

  async function createCirkle() {
    try {
      setStatus("Creating cirkle...");
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setStatus("Not signed in");
        return;
      }

      const ref = await db.collection("cirkles").add({
        ownerId: uid,
        title: "Pop-up Cirkle",
        status: "open",
        members: [uid], // IMPORTANT for fan-out
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      setStatus(`Cirkle created: ${ref.id}`);
      console.log("Created cirkle:", ref.id);
    } catch (e: any) {
      console.error("createCirkle failed:", e);
      setStatus(`Create cirkle failed: ${e?.message ?? String(e)}`);
    }
  }

  async function testAnnouncement() {
    try {
      setStatus("Creating announcement...");
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setStatus("Not signed in");
        return;
      }

      // use the cirkle you JUST created (or paste an existing one)
      const cirkleId = "U99N8g8TJUSlH1wjDpOO";

      const id = await createAnnouncement({
        text: "Hello from SocialCirkle 👋",
        audience: { type: "cirkle", cirkleId },
      });

      setStatus(`Announcement created: ${id}`);
      console.log("Announcement created:", id);
    } catch (e: any) {
      console.error("testAnnouncement failed:", e);
      setStatus(`Announcement failed: ${e?.message ?? String(e)}`);
    }
  }

  return (
    <View style={s.c}>
      <Text style={s.t}>Home</Text>

      <Text style={s.status}>{status}</Text>

      <Pressable style={s.btnO} onPress={createCirkle}>
        <Text style={s.btnOT}>Create Cirkle (demo)</Text>
      </Pressable>

      <Pressable style={s.btnO} onPress={testAnnouncement}>
        <Text style={s.btnOT}>Test Announcement</Text>
      </Pressable>

      <Pressable style={s.btn} onPress={() => router.push("/map")}>
        <Text style={s.btnT}>Open Map</Text>
      </Pressable>

      <Pressable style={s.btnO} onPress={() => router.push("/profile")}>
        <Text style={s.btnOT}>Profile</Text>
      </Pressable>

      <Pressable style={[s.btn, { backgroundColor: "#ef4444" }]} onPress={out}>
        <Text style={s.btnT}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, padding: 24, gap: 12 },
  t: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
  status: { color: "#111827" },
  btn: { backgroundColor: "#111827", padding: 14, borderRadius: 10, alignItems: "center" },
  btnT: { color: "#fff", fontWeight: "600" },
  btnO: { borderWidth: 1, borderColor: "#111827", padding: 14, borderRadius: 10, alignItems: "center" },
  btnOT: { color: "#111827", fontWeight: "600" },
});
