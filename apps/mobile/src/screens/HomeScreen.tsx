import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { auth } from "@/lib/firebase";
import { createAnnouncement } from "../../src/services/announcements";

export default function HomeScreen({ navigation }: any) {
  async function testAnnouncement() {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return Alert.alert("Not signed in");

      // IMPORTANT: put a REAL cirkleId here (see step B below)
      await createAnnouncement({
        text: "Hello from SocialCirkle 👋",
        audience: { type: "cirkle", cirkleId: "U99N8g8TJUSlH1wjDpOO" },
      });

      Alert.alert("Announcement created!");
    } catch (e: any) {
      Alert.alert("Failed", e?.message ?? String(e));
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>

      <TouchableOpacity style={styles.btn} onPress={testAnnouncement}>
        <Text style={styles.btnText}>Test Announcement</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate("Map")}>
        <Text style={styles.btnText}>Open Map</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
  btn: { backgroundColor: "#111827", padding: 14, borderRadius: 10, alignItems: "center" },
  btnText: { color: "white", fontWeight: "600" },
});
