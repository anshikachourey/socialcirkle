import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";

export default function HomeScreen({ navigation }: any) {
  async function handleLogout() {
    await signOut(auth);
    navigation.replace("Login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate("Map")}>
        <Text style={styles.btnText}>Open Map</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.navigate("Profile")}>
        <Text style={styles.btnOutlineText}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleLogout} style={[styles.btn, { backgroundColor: "#ef4444" }]}>
        <Text style={styles.btnText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
  btn: { backgroundColor: "#111827", padding: 14, borderRadius: 10, alignItems: "center" },
  btnText: { color: "white", fontWeight: "600" },
  btnOutline: { borderWidth: 1, borderColor: "#111827", padding: 14, borderRadius: 10, alignItems: "center" },
  btnOutlineText: { color: "#111827", fontWeight: "600" },
});
