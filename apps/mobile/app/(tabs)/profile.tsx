import React from "react";
import { View, Text, StyleSheet } from "react-native";
export default function Profile(){
  return (
    <View style={s.c}>
      <Text style={s.t}>Your Profile</Text>
      <Text>• Name, bio, interests</Text>
      <Text>• Toggle location sharing</Text>
    </View>
  );
}
const s=StyleSheet.create({c:{flex:1,padding:24},t:{fontSize:22,fontWeight:"700",marginBottom:8}});
