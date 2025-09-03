import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { auth } from "../src/firebaseConfig";
import { signOut } from "firebase/auth";

export default function Home() {
  async function out() {
    await signOut(auth);
    router.replace("/login");
  }
  return (
    <View style={s.c}>
      <Text style={s.t}>Home</Text>
      <Pressable style={s.btn} onPress={() => router.push("/map")}><Text style={s.btnT}>Open Map</Text></Pressable>
      <Pressable style={s.btnO} onPress={() => router.push("/profile")}><Text style={s.btnOT}>Profile</Text></Pressable>
      <Pressable style={[s.btn,{backgroundColor:"#ef4444"}]} onPress={out}><Text style={s.btnT}>Sign out</Text></Pressable>
    </View>
  );
}
const s=StyleSheet.create({
  c:{flex:1,padding:24,gap:12},t:{fontSize:28,fontWeight:"700",marginBottom:12},
  btn:{backgroundColor:"#111827",padding:14,borderRadius:10,alignItems:"center"},btnT:{color:"#fff",fontWeight:"600"},
  btnO:{borderWidth:1,borderColor:"#111827",padding:14,borderRadius:10,alignItems:"center"},btnOT:{color:"#111827",fontWeight:"600"},
});
