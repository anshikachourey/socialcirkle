import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { auth, db, firestore, signInEmail, signUpEmail } from "@/lib/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function go() {
    const emailTrim = email.trim();

    try {
      // Try sign in
      await signInEmail(emailTrim, password);
    } catch (e: any) {
      // If user doesn't exist, create then continue
      if (e?.code === "auth/user-not-found") {
        try {
          await signUpEmail(emailTrim, password);
        } catch (e2: any) {
          Alert.alert("Sign up failed", e2?.message ?? "Unknown error");
          return;
        }
      } else {
        Alert.alert("Login failed", e?.message ?? "Unknown error");
        return;
      }
    }

    // Upsert user doc
    const uid = auth.currentUser?.uid;
    if (uid) {
      await db.collection("users").doc(uid).set(
        {
          email: auth.currentUser?.email ?? email.trim(),
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    router.replace("/home");
  }

  return (
    <View style={s.c}>
      <Text style={s.title}>SocialCirkle</Text>
      <TextInput
        style={s.in}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={s.in}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={s.btn} onPress={go}>
        <Text style={s.btnT}>Continue</Text>
      </Pressable>
      <Text style={s.hint}>Enable Email/Password in Firebase Console → Authentication.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 24 },
  in: { width: "100%", borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 12 },
  btn: { backgroundColor: "#111827", padding: 14, borderRadius: 10, width: "100%", alignItems: "center" },
  btnT: { color: "#fff", fontWeight: "600" },
  hint: { marginTop: 12, color: "#6b7280", fontSize: 12, textAlign: "center" },
});
