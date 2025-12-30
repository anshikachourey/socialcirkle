import { auth, db, firestore } from "../lib/firebase";

export type Chat = {
  id: string;
  type: "group" | "direct";
  name?: string | null;
  lastMessageText?: string | null;
  members?: string[];
  updatedAt?: any;
};

export type Message = {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: any;
};

function ensureUser() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  return uid;
}

// list chats where I am a member
export function onMyChats(cb: (chats: Chat[]) => void) {
  const me = ensureUser();
  return db
    .collection("chats")
    .where("members", "array-contains", me)
    .onSnapshot((snap: any) => {
      const items: Chat[] = [];
      snap?.forEach?.((doc: any) => {
        const d = doc.data?.() ?? {};
        items.push({
          id: doc.id,
          type: d.type ?? "direct",
          name: d.name ?? null,
          lastMessageText: d.lastMessageText ?? null,
          members: d.members ?? [],
          updatedAt: d.lastMessageAt ?? d.updatedAt,
        });
      });
      // optional: sort by updatedAt desc
      items.sort((a, b) => {
        const ta = a.updatedAt?.toMillis?.() ?? 0;
        const tb = b.updatedAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      cb(items);
    });
}

// subscribe messages realtime
export function onMessages(chatId: string, cb: (msgs: Message[]) => void) {
  return db
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .onSnapshot((snap: any) => {
      const arr: Message[] = [];
      snap?.forEach?.((doc: any) => {
        const d = doc.data?.() ?? {};
        arr.push({
          id: doc.id,
          chatId,
          senderId: d.senderId,
          text: d.text,
          createdAt: d.createdAt,
        });
      });
      cb(arr);
    });
}

export async function sendMessage(chatId: string, text: string) {
  const me = ensureUser();
  const msgRef = db.collection("chats").doc(chatId).collection("messages");
  await msgRef.add({
    senderId: me,
    text,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  await db.collection("chats").doc(chatId).set(
    {
      lastMessageText: text,
      lastMessageAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

// Direct-message chat creation (client-side version)
export async function ensureDirectChat(otherUid: string): Promise<{ id: string }> {
  const me = ensureUser();
  if (otherUid === me) throw new Error("Cannot DM yourself");

  // deterministic chat id so you don't create duplicates
  const a = me < otherUid ? me : otherUid;
  const b = me < otherUid ? otherUid : me;
  const chatId = `dm_${a}_${b}`;

  const ref = db.collection("chats").doc(chatId);
  const snap = await ref.get?.();

  const exists = typeof snap?.exists === "boolean" ? snap.exists : !!snap;
  if (!exists) {
    await ref.set({
      type: "direct",
      members: [a, b],
      createdAt: firestore.FieldValue.serverTimestamp(),
      lastMessageText: null,
      lastMessageAt: firestore.FieldValue.serverTimestamp(),
    });
  }
  return { id: chatId };
}
