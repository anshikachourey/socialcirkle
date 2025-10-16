// src/services/visibleUsers.ts
import { db } from "../lib/firebase";

export type PublicUser = {
  id: string;
  displayName?: string | null;
  location?: { lat:number; lng:number; updatedAt?: number };
  visibility?: { visible:boolean; radiusMeters: number | null };
};

export function onVisibleUsers(cb: (users: PublicUser[]) => void) {
  // MVP: everyone with visibility.visible==true and a location
  // (Firestore allows querying nested fields with dotted path)
  return db
    .collection("users")
    .where("visibility.visible", "==", true)
    .onSnapshot((snap: any) => {
      const arr: PublicUser[] = [];
      snap?.forEach?.((doc: any) => {
        const d = doc.data?.();
        if (d?.location?.lat != null && d?.location?.lng != null) {
          arr.push({ id: doc.id, ...d });
        }
      });
      cb(arr);
    });
}
