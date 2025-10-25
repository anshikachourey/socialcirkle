// src/services/chats.ts
import { db, firestore } from "../lib/firebase";

export type ChatDoc = {
  id: string;
  members: string[];
  lastMessage?: { text?: string; at?: any; from?: string };
  updatedAt?: any;
  createdAt?: any;
};

export function onMyChats(uid: string, cb: (rows: ChatDoc[]) => void, onError?: (e:any)=>void) {
  return db
    .collection("chats")
    .where("members", "array-contains", uid)
    // NOTE: no orderBy to avoid index requirement
    .onSnapshot(
      (snap: any) => {
        const rows: ChatDoc[] = [];
        snap?.forEach?.((doc: any) => rows.push({ id: doc.id, ...(doc.data?.() || {}) }));
        cb(rows);
      },
      (e: any) => onError?.(e)
    );
}

// used when you tap “Start chat” on the map
export async function ensureChat(a: string, b: string) {
  if (a === b) return; // don't create self-chat
  const ids = [a, b].sort(); // normalized two-member room
  const key = ids.join("_");
  const ref = db.collection("chats").doc(key);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      members: ids,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
      lastMessage: null,
    });
  } else {
    await ref.set(
      { updatedAt: firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
  }
  return key;
}

