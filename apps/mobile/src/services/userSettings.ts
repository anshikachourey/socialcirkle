// src/services/userSettings.ts
import { auth, db, firestore } from "../lib/firebase"; // adjust if your path differs

export type Visibility = { visible: boolean; radiusMeters: number | null };

export function onUserVisibility(
  uid: string,
  cb: (v: Visibility) => void
) {
  return db.collection("users").doc(uid).onSnapshot((snap: any) => {
    const d = snap?.data?.();
    const v: Visibility = d?.visibility ?? { visible: false, radiusMeters: null };
    cb(v);
  });
}

export async function saveSelfLocation(uid: string, lat: number, lng: number) {
  await db.collection("users").doc(uid).set(
    {
      location: { lat, lng, updatedAt: Date.now() },
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}
