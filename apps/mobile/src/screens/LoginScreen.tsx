import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { auth, signInEmail, signUpEmail } from "@/lib/firebase";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  async function handleLogin() {
    const e = email.trim();
    try {
      await signInEmail(e, password);           
      navigation.replace("Home");
    } catch (err: any) {
      if (err?.code === "auth/user-not-found") {
        try {
          await signUpEmail(e, password);     
          navigation.replace("Home");
        } catch (e2: any) {
          Alert.alert("Sign up failed", e2?.message ?? "Unknown error");
        }
      } else {
        Alert.alert("Login failed", err?.message ?? "Unknown error");
      }
    }
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SocialCirkle</Text>
      <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}/>
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword}/>
      <TouchableOpacity style={styles.btn} onPress={handleLogin}>
        <Text style={styles.btnText}>Continue</Text>
      </TouchableOpacity>
      <Text style={styles.hint}>Tip: Enable Email/Password in Firebase Console → Authentication.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 24 },
  input: { width: "100%", borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 12 },
  btn: { backgroundColor: "#111827", padding: 14, borderRadius: 10, width: "100%", alignItems: "center" },
  btnText: { color: "white", fontWeight: "600" },
  hint: { marginTop: 12, color: "#6b7280", fontSize: 12, textAlign: "center" },
});




