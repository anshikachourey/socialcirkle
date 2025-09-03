import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";

export default function Map() {
  const [region, setRegion] = useState<Region | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setMsg("Location permission denied. Showing default map.");
        setRegion({ latitude:37.7749, longitude:-122.4194, latitudeDelta:0.05, longitudeDelta:0.05 });
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setRegion({ latitude:loc.coords.latitude, longitude:loc.coords.longitude, latitudeDelta:0.01, longitudeDelta:0.01 });
    })();
  }, []);

  if (!region) return (
    <View style={[s.c,{justifyContent:"center",alignItems:"center"}]}>
      <ActivityIndicator/><Text style={{marginTop:8}}>{msg ?? "Getting your location..."}</Text>
    </View>
  );

  return (
    <View style={s.c}>
      <MapView style={s.map} initialRegion={region}>
        <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} title="You"/>
      </MapView>
      <Text style={s.cap}>Map MVP — user pin + region</Text>
    </View>
  );
}
const s=StyleSheet.create({c:{flex:1},map:{flex:1},cap:{textAlign:"center",padding:8,color:"#6b7280"}});
