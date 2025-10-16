// app/login.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import {
  auth, db, firestore,
  signInEmail, signUpEmail, onAuthChanged
} from "@/lib/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Optional: show “already signed in” hint, but don't navigate.
  useEffect(() => {
    const unsub = onAuthChanged(() => {});
    return unsub;
  }, []);

  function validate(): string | null {
    const e = email.trim();
    if (!e || !password) return "Please fill in all the fields!";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return null;
  }

  async function upsertUserDoc(upsertEmail: string) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await db.collection("users").doc(uid).set(
      {
        email: auth.currentUser?.email ?? upsertEmail,
        // don't mark profileComplete here; Setup will do that
        updatedAt: firestore.FieldValue.serverTimestamp(),
        createdAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  async function handleAuth() {
    setError(null);
    const v = validate();
    if (v) return setError(v);

    try {
      setSubmitting(true);
      const e = email.trim();
      if (isSignUp) {
        await signUpEmail(e, password);
      } else {
        await signInEmail(e, password);
      }
      await upsertUserDoc(e);
      // 🚫 Don't navigate here. The global guard in _layout will:
      // - send new users to /setup
      // - send returning users to /(tabs)/map
    } catch (err: any) {
      setError(err?.message ?? (isSignUp ? "Sign up failed" : "Sign in failed"));
    } finally {
      setSubmitting(false);
    }
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

      {!!error && <Text style={s.err}>{error}</Text>}

      <Pressable style={[s.btn, submitting && s.btnDisabled]} onPress={handleAuth} disabled={submitting}>
        {submitting ? <ActivityIndicator /> : <Text style={s.btnT}>{isSignUp ? "Create Account" : "Continue"}</Text>}
      </Pressable>

      <Pressable style={s.linkBtn} onPress={() => setIsSignUp((p) => !p)} disabled={submitting}>
        <Text style={s.linkT}>
          {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign Up"}
        </Text>
      </Pressable>

      <Text style={s.hint}>Enable Email/Password in Firebase Console → Authentication.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 24 },
  in: { width: "100%", borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 12 },
  err: { color: "#b91c1c", marginBottom: 12, alignSelf: "flex-start" },
  btn: { backgroundColor: "#111827", padding: 14, borderRadius: 10, width: "100%", alignItems: "center" },
  btnDisabled: { opacity: 0.6 },
  btnT: { color: "#fff", fontWeight: "600" },
  linkBtn: { paddingVertical: 12 },
  linkT: { color: "#111827" },
  hint: { marginTop: 12, color: "#6b7280", fontSize: 12, textAlign: "center" },
});


