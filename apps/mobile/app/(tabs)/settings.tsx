// app/(tabs)/settings.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, Switch, Pressable, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { auth, db, firestore } from "../../src/lib/firebase";

const milesToMeters = (m: number) => m * 1609.344;
const PRESETS = [
  { label: "1 mi", m: milesToMeters(1) },
  { label: "10 mi", m: milesToMeters(10) },
  { label: "50 mi", m: milesToMeters(50) },
  { label: "100 mi", m: milesToMeters(100) },
  { label: "Worldwide", m: null as number | null },
];

type UserDoc = {
  displayName?: string | null;
  username?: string | null;
  bio?: string | null;
  photoURL?: string | null;
  visibility?: { visible: boolean; radiusMeters: number | null };
};

export default function Settings() {
  const uid = auth.currentUser?.uid;
  const [loading, setLoading] = useState(true);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [photoURL, setPhotoURL] = useState("");

  const [visible, setVisible] = useState(false);
  const [radius, setRadius] = useState<number | null>(milesToMeters(10));
  const [custom, setCustom] = useState("");

  useEffect(() => {
    if (!uid) { router.replace("/(tabs)/login"); return; }
  
    const offUser = db.collection("users").doc(uid).onSnapshot((snap:any) => {
      const d = snap?.data?.() as UserDoc | undefined;
      if (d) {
        setDisplayName(d.displayName ?? "");
        setUsername(d.username ?? "");
        setBio(d.bio ?? "");
        setPhotoURL(d.photoURL ?? "");
      }
    });
  
    const offSettings = db.collection("userSettings").doc(uid).onSnapshot((snap:any) => {
      const s = snap?.data?.() ?? {};
      setVisible(!!s.visible);
      setRadius(s.radiusMeters ?? null);
    });
  
    setLoading(false);
    return () => { offUser?.(); offSettings?.(); };
  }, [uid]);
  

  async function save() {
    if (!uid) return;
    let r = radius;
    if (visible && custom.trim()) {
      const n = Number(custom);
      if (!Number.isFinite(n) || n <= 0) {
        Alert.alert("Invalid radius", "Enter a positive number of miles.");
        return;
      }
      r = milesToMeters(n);
    }
    await db.collection("users").doc(uid).set({
      displayName: displayName.trim() || null,
      username: username.trim() || null,
      bio: bio.trim() || null,
      photoURL: photoURL.trim() || null,
      profileComplete: true,
      updatedAt: firestore.FieldValue?.serverTimestamp?.() ?? new Date(),
    }, { merge: true });
    
    await db.collection("userSettings").doc(uid).set({
      visible,
      radiusMeters: visible ? r : null,
      updatedAt: firestore.FieldValue?.serverTimestamp?.() ?? new Date(),
    }, { merge: true });
    
    Alert.alert("Saved!");
    router.replace("/(tabs)/profile");
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator /><Text style={styles.hint}>Loading settings…</Text></View>;
  }

  return (
    <View style={styles.c}>
      <Text style={styles.h}>Settings</Text>

      {/* Profile fields */}
      <Text style={styles.l}>Display name</Text>
      <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Your name" style={styles.in} />

      <Text style={styles.l}>Username</Text>
      <TextInput value={username} onChangeText={setUsername} autoCapitalize="none" placeholder="yourhandle" style={styles.in} />

      <Text style={styles.l}>Bio</Text>
      <TextInput value={bio} onChangeText={setBio} placeholder="Short intro" style={[styles.in, { height: 80 }]} multiline />

      <Text style={styles.l}>Profile photo URL</Text>
      <TextInput value={photoURL} onChangeText={setPhotoURL} placeholder="https://…" style={styles.in} />

      {/* Visibility */}
      <View style={styles.row}>
        <Text style={styles.rowT}>Show my location</Text>
        <Switch value={visible} onValueChange={setVisible} />
      </View>

      {visible && (
        <>
          <Text style={[styles.l,{marginTop:8}]}>Visibility radius</Text>
          <View style={styles.pills}>
            {PRESETS.map(p => {
              const active = radius === p.m;
              return (
                <Pressable key={p.label} onPress={() => setRadius(p.m)} style={[styles.pill, active && styles.pillA]}>
                  <Text style={[styles.pillT, active && styles.pillTA]}>{p.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            placeholder="Custom miles (optional)"
            keyboardType="numeric"
            value={custom}
            onChangeText={setCustom}
            style={styles.in}
          />
        </>
      )}

      <Pressable style={styles.btn} onPress={save}>
        <Text style={styles.btnT}>Save</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center:{
    flex:1,alignItems:"center",justifyContent:"center"
    },
  hint:{
    marginTop:8,color:"#6b7280"
    },
  c: {
    flex: 1, padding: 20, gap: 12 
    },
  h: {
    fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 8 
    },
  l: { 
    fontSize: 14, color: "#374151" 
    },
  in: { 
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 
    },
  row: { 
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 
    },
  rowT: { 
    fontSize: 16, fontWeight: "600" 
    },
  pills: { 
    flexDirection: "row", flexWrap: "wrap", gap: 8 
    },
  pill: { 
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: "#d1d5db" 
    },
  pillA: { 
    backgroundColor: "#111827", borderColor: "#111827" 
    },
  pillT: { 
    color: "#111827", fontWeight: "600" 
    },
  pillTA: { 
    color: "#fff" 
    },
  btn: { 
    backgroundColor: "#111827", borderRadius: 12, paddingVertical: 12, alignItems: "center", marginTop: 12 
    },
  btnT: { 
    color: "#fff", fontWeight: "700" 
    },
});
