import React from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { auth, db, firestore, signOutUser } from "@/lib/firebase";

export default function Home() {
  async function out() {
    await signOutUser();                                   // ✅ RNFirebase
    router.replace("/login");
  }

  async function createCirkle() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    await db.collection("cirkles").add({                     // ✅ RNFirebase Firestore
      ownerId: uid,
      title: "Pop-up Cirkle",
      status: "open",
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
    Alert.alert("Cirkle created (check Firestore)");
  }

  return (
    <View style={s.c}>
      <Text style={s.t}>Home</Text>
      <Pressable style={s.btn} onPress={() => router.push("/map")}><Text style={s.btnT}>Open Map</Text></Pressable>
      <Pressable style={s.btnO} onPress={() => router.push("/profile")}><Text style={s.btnOT}>Profile</Text></Pressable>
      <Pressable style={s.btnO} onPress={createCirkle}><Text style={s.btnOT}>Create Cirkle (demo)</Text></Pressable>
      <Pressable style={[s.btn,{backgroundColor:"#ef4444"}]} onPress={out}><Text style={s.btnT}>Sign out</Text></Pressable>
    </View>
  );
}
const s=StyleSheet.create({
  c:{flex:1,padding:24,gap:12}, t:{fontSize:28,fontWeight:"700",marginBottom:12},
  btn:{backgroundColor:"#111827",padding:14,borderRadius:10,alignItems:"center"}, btnT:{color:"#fff",fontWeight:"600"},
  btnO:{borderWidth:1,borderColor:"#111827",padding:14,borderRadius:10,alignItems:"center"}, btnOT:{color:"#111827",fontWeight:"600"},
});
