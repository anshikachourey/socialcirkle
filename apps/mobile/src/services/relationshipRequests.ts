import { auth, db, firestore } from "../lib/firebase";
import { ensureDirectChat } from "./chats";

export type RelationshipRequest = {
  id: string;
  fromUid: string;
  toUid: string;
  kind: "chat";
  status: "pending" | "accepted" | "declined";
  createdAt?: any;
};

function meUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  return uid;
}

export async function requestChat(toUid: string) {
  const fromUid = meUid();
  if (fromUid === toUid) return;

  // prevent duplicates: deterministic request id
  const requestId = `chat_${fromUid}_${toUid}`;
  await db.collection("relationshipRequests").doc(requestId).set(
    {
      fromUid,
      toUid,
      kind: "chat",
      status: "pending",
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export function onIncomingChatRequests(cb: (items: RelationshipRequest[]) => void) {
  const me = meUid();
  return db
    .collection("relationshipRequests")
    .where("toUid", "==", me)
    .where("kind", "==", "chat")
    .where("status", "==", "pending")
    .onSnapshot((snap: any) => {
      const arr: RelationshipRequest[] = [];
      snap?.forEach?.((doc: any) => {
        const d = doc.data?.() ?? {};
        arr.push({ id: doc.id, fromUid: d.fromUid, toUid: d.toUid, kind: "chat", status: d.status });
      });
      cb(arr);
    });
}

export async function acceptChatRequest(requestId: string) {
  const me = meUid();
  const ref = db.collection("relationshipRequests").doc(requestId);
  const snap = await ref.get?.();
  const d = snap?.data?.() ?? {};
  if (d.toUid !== me) throw new Error("Not allowed");

  await ref.set({ status: "accepted", updatedAt: firestore.FieldValue.serverTimestamp() }, { merge: true });

  const fromUid = d.fromUid as string;
  const { id: chatId } = await ensureDirectChat(fromUid);
  return chatId;
}

export async function declineChatRequest(requestId: string) {
  const me = meUid();
  const ref = db.collection("relationshipRequests").doc(requestId);
  const snap = await ref.get?.();
  const d = snap?.data?.() ?? {};
  if (d.toUid !== me) throw new Error("Not allowed");

  await ref.set({ status: "declined", updatedAt: firestore.FieldValue.serverTimestamp() }, { merge: true });
}
