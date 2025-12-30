import { auth, db } from "../lib/firebase";

export type FeedItem = {
  id: string;
  announcementId?: string;
  text?: string;
  createdAt?: any;
};

function meUid() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not signed in");
  return uid;
}

export function onMyFeed(cb: (items: FeedItem[]) => void) {
  const uid = meUid();

  // ✅ correct chaining: collection("feeds").doc(uid).collection("items")
  return db
    .collection("feeds")
    .doc(uid)
    .collection("items")
    .orderBy("createdAt", "desc")
    .limit(50)
    .onSnapshot((snap: any) => {
      const arr: FeedItem[] = [];
      snap?.forEach?.((doc: any) => {
        arr.push({ id: doc.id, ...(doc.data?.() ?? {}) });
      });
      cb(arr);
    });
}
