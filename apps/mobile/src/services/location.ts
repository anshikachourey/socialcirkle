// src/services/location.ts
import { db, firestore } from "../lib/firebase";

// Stored on users/{uid}
export type VisibilitySettings = {
  enabled: boolean;          // show my dot or hide
  radiusMeters: number;      // how far others can see me
};

export type UserLocationDoc = {
  uid: string;
  displayName?: string | null;
  photoURL?: string | null;
  email?: string | null;

  location?: {
    lat: number;
    lng: number;
    updatedAt: any; // server timestamp
  };

  visibility?: VisibilitySettings;
};

export async function ensureUserDoc(uid: string, profile?: { displayName?: string | null; email?: string | null; photoURL?: string | null }) {
  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (snap?.exists) return;

  await ref.set(
    {
      uid,
      displayName: profile?.displayName ?? null,
      email: profile?.email ?? null,
      photoURL: profile?.photoURL ?? null,
      visibility: { enabled: true, radiusMeters: 50 * 1609.344 },
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function setVisibility(uid: string, visibility: VisibilitySettings) {
  await db.collection("users").doc(uid).set(
    {
      visibility,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function updateMyLocation(uid: string, lat: number, lng: number) {
  await db.collection("users").doc(uid).set(
    {
      location: {
        lat,
        lng,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export function subscribeAllUsers(cb: (rows: UserLocationDoc[]) => void) {
  // For MVP we subscribe to all and filter client-side.
  // Later: add geo indexing (geohash / geofire / server query)
  return db.collection("users").onSnapshot((qs: any) => {
    const rows: UserLocationDoc[] = (qs?.docs ?? []).map((d: any) => ({ uid: d.id, ...d.data() }));
    cb(rows);
  });
}
