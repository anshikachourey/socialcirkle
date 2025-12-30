// apps/mobile/src/services/settings.ts
import { db, firestore } from "../lib/firebase";

export type UserSettings = {
  visible: boolean;
  radiusMeters: number | null;
  status?: string | null;
};

export function onUserSettings(uid: string, cb: (s: UserSettings) => void) {
  return db.collection("userSettings").doc(uid).onSnapshot((snap: any) => {
    const d = snap?.data?.() ?? {};
    cb({
      visible: !!d.visible,
      radiusMeters: d.radiusMeters ?? null,
      status: d.status ?? null,
    });
  });
}

export async function saveUserSettings(uid: string, patch: Partial<UserSettings>) {
  await db.collection("userSettings").doc(uid).set(
    { ...patch, updatedAt: firestore.FieldValue.serverTimestamp() },
    { merge: true }
  );
}
