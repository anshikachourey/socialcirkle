import { db, firestore } from "../lib/firebase";
import { geohashForLocation } from "geofire-common";

export type LatLng = { lat: number; lng: number };

export async function saveMyLocation(uid: string, pos: LatLng) {
  const geohash = geohashForLocation([pos.lat, pos.lng]);
  await db.collection("userLocations").doc(uid).set(
    {
      lat: pos.lat,
      lng: pos.lng,
      geohash,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}
