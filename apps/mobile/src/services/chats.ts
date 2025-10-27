// src/services/chats.ts
import { db, firestore } from "../lib/firebase";
import { api } from "../lib/api";
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
export async function ensureChat(uidA: string, uidB: string) {
    const members = [uidA, uidB].sort() as [string, string];
    const chatId = `${members[0]}__${members[1]}`;
    const ref = db.collection("chats").doc(chatId);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        members,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    }
    return chatId;
  }

