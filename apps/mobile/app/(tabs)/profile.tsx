// app/(tabs)/profile.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, Pressable, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { auth, db } from "../../src/lib/firebase";
type UserDoc = {
  displayName?: string | null;
  username?: string | null;
  bio?: string | null;
  photoURL?: string | null;
};
export default function Profile() {
  const uid = auth.currentUser?.uid;
  const [data, setData] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let off: any;
    (async () => {
      if (!uid) {
        Alert.alert("Please log in");
        router.replace("/(tabs)/login");
        return;
      }
      off = db.collection("users").doc(uid).onSnapshot((snap: any) => {
        setData(snap?.data?.() ?? {});
        setLoading(false);
      }, () => setLoading(false));
    })();
    return () => off?.();
  }, [uid]);
  if (loading) {
    return (
      <View style={s.center}><ActivityIndicator /><Text style={s.hint}>Loading profile…</Text></View>
    );
  }
  const name = data?.displayName || "Your name";
  const username = data?.username ? `@${data.username}` : "";
  const bio = data?.bio || "Add a short bio that others will see.";
  return (
    <View style={s.c}>
      <Image
        source={data?.photoURL ? { uri: data.photoURL } : require("../../assets/profile-placeholder.png")}
        style={s.avatar}
      />
      <Text style={s.name}>{name}</Text>
      {!!username && <Text style={s.username}>{username}</Text>}
      <Text style={s.bio}>{bio}</Text>
      <Pressable style={s.btn} onPress={() => router.push("/(tabs)/settings")}>
        <Text style={s.btnT}>Edit Profile</Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  c: { flex: 1, alignItems: "center", padding: 24, gap: 8, justifyContent: "center" },
  center: { flex:1, alignItems:"center", justifyContent:"center" },
  hint: { marginTop:8, color:"#6b7280" },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 8, backgroundColor:"#e5e7eb" },
  name: { fontSize: 22, fontWeight: "700", color: "#111827" },
  username: { fontSize: 14, color: "#6b7280", marginBottom: 6 },
  bio: { fontSize: 14, color: "#374151", textAlign: "center", marginHorizontal: 24, marginBottom: 16 },
  btn: { backgroundColor:"#111827", paddingVertical:12, paddingHorizontal:18, borderRadius:12 },
  btnT: { color:"#fff", fontWeight:"700" },
});

// // app/(tabs)/profile.tsx
// import React, { useEffect, useState } from "react";
// import { View, Text, StyleSheet, Switch, Pressable, TextInput, Alert } from "react-native";
// import { auth, db, firestore } from "../../src/lib/firebase"; // adjust if your path differs

// type Visibility = { visible: boolean; radiusMeters: number | null };
// const milesToMeters = (m: number) => m * 1609.344;
// const metersToMiles = (m: number) => m / 1609.344;

// const PRESETS: Array<{ label: string; meters: number | null }> = [
//   { label: "1 mi", meters: milesToMeters(1) },
//   { label: "10 mi", meters: milesToMeters(10) },
//   { label: "50 mi", meters: milesToMeters(50) },
//   { label: "100 mi", meters: milesToMeters(100) },
//   { label: "Worldwide", meters: null }, // null => visible worldwide (no circle)
// ];

// export default function ProfileTab() {
//   const uid = auth.currentUser?.uid;
//   const [loading, setLoading] = useState(true);
//   const [displayName, setDisplayName] = useState<string>("");
//   const [visible, setVisible] = useState<boolean>(false);
//   const [radiusMeters, setRadiusMeters] = useState<number | null>(milesToMeters(10));
//   const [customMiles, setCustomMiles] = useState<string>("");

//   // Load user doc (and create minimal doc if missing)
//   useEffect(() => {
//     if (!uid) return;
//     const ref = db.collection("users").doc(uid);
//     const unsub = ref.onSnapshot(async (snap: any) => {
//       const d = snap?.data?.();
//       if (!d) {
//         await ref.set({
//           profileComplete: false,
//           visibility: { visible: false, radiusMeters: null },
//           createdAt: firestore.FieldValue?.serverTimestamp?.() ?? new Date(),
//           updatedAt: firestore.FieldValue?.serverTimestamp?.() ?? new Date(),
//         }, { merge: true });
//         setLoading(false);
//         return;
//       }
//       setDisplayName(d.displayName ?? "");
//       const v: Visibility = d.visibility ?? { visible: false, radiusMeters: null };
//       setVisible(!!v.visible);
//       setRadiusMeters(v.radiusMeters ?? null);
//       setLoading(false);
//     });
//     return unsub;
//   }, [uid]);

//   async function saveVisibility(next: Partial<Visibility>) {
//     if (!uid) return;
//     const nextVisible = next.visible ?? visible;
//     const nextRadius = next.radiusMeters !== undefined ? next.radiusMeters : radiusMeters;
  
//     const patch: any = {
//       visibility: { visible: nextVisible, radiusMeters: nextVisible ? nextRadius : null },
//       updatedAt: firestore.FieldValue?.serverTimestamp?.() ?? new Date(),
//     };
  
//     if (!nextVisible) {
//       patch.location = null; // wipe last known location when user goes invisible
//     }
  
//     await db.collection("users").doc(uid).set(patch, { merge: true });
//   }
  

//   async function saveProfileName() {
//     if (!uid) return;
//     await db.collection("users").doc(uid).set({
//       displayName: displayName.trim() || null,
//       updatedAt: firestore.FieldValue?.serverTimestamp?.() ?? new Date(),
//     }, { merge: true });
//   }

//   function setCustomRadiusFromMiles() {
//     const n = Number(customMiles);
//     if (Number.isNaN(n)||n<= 0) {
//       Alert.alert("Invalid radius", "Enter a positive number of miles.");
//       return;
//     }
//     const m = milesToMeters(n);
//     setRadiusMeters(m);
//     saveVisibility({ radiusMeters: m });
//     setCustomMiles("");
//   }

//   if (!uid) {
//     return (
//       <View style={s.center}>
//         <Text>You need to be logged in to edit your profile.</Text>
//       </View>
//     );
//   }
//   if (loading) {
//     return (
//       <View style={s.center}>
//         <Text>Loading profile…</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={s.container}>
//       <Text style={s.header}>Profile</Text>

//       <Text style={s.label}>Display name</Text>
//       <TextInput
//         value={displayName}
//         onChangeText={setDisplayName}
//         onBlur={saveProfileName}
//         placeholder="Your name"
//         style={s.input}
//       />

//       <View style={s.row}>
//         <Text style={s.rowText}>Show my location</Text>
//         <Switch
//           value={visible}
//           onValueChange={(v) => { setVisible(v); saveVisibility({ visible: v, radiusMeters: v ? radiusMeters : null }); }}
//         />
//       </View>

//       {visible && (
//         <>
//           <Text style={[s.label, { marginTop: 8 }]}>Visibility radius</Text>
//           <View style={s.pills}>
//             {PRESETS.map((p) => {
//               const active = radiusMeters === p.meters;
//               return (
//                 <Pressable
//                   key={p.label}
//                   onPress={() => { setRadiusMeters(p.meters); saveVisibility({ radiusMeters: p.meters }); }}
//                   style={[s.pill, active && s.pillActive]}
//                 >
//                   <Text style={[s.pillText, active && s.pillTextActive]}>{p.label}</Text>
//                 </Pressable>
//               );
//             })}
//           </View>

//           <View style={s.customRow}>
//             <TextInput
//               value={customMiles}
//               onChangeText={setCustomMiles}
//               placeholder="Custom miles"
//               keyboardType="numeric"
//               style={[s.input, { flex: 1, marginRight: 8 }]}
//             />
//             <Pressable onPress={setCustomRadiusFromMiles} style={[s.pill, s.applyBtn]}>
//               <Text style={[s.pillText, s.applyBtnText]}>Apply</Text>
//             </Pressable>
//           </View>

//           <Text style={s.helper}>
//             Current: {radiusMeters == null ? "Worldwide" : `~${Math.round(metersToMiles(radiusMeters))} miles`}
//           </Text>
//         </>
//       )}
//     </View>
//   );
// }

// const s = StyleSheet.create({
//   container: { flex: 1, padding: 20 },
//   center: { flex: 1, alignItems: "center", justifyContent: "center" },
//   header: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
//   label: { fontSize: 14, color: "#374151", marginBottom: 6 },
//   row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginVertical: 8 },
//   rowText: { fontSize: 16, fontWeight: "500" },
//   pills: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
//   pill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: "#d1d5db" },
//   pillActive: { backgroundColor: "#111827", borderColor: "#111827" },
//   pillText: { color: "#111827", fontWeight: "600" },
//   pillTextActive: { color: "#fff" },
//   input: { borderColor: "#d1d5db", borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
//   customRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
//   applyBtn: { backgroundColor: "#111827", borderColor: "#111827" },
//   applyBtnText: { color: "#fff", fontWeight: "700" },
//   helper: { color: "#6b7280", marginTop: 8 },
// });

