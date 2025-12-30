// src/lib/firebase.web.ts
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";

import {
  getFirestore,
  collection as fsCollection,
  doc as fsDoc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where as fsWhere,
  orderBy as fsOrderBy,
  limit as fsLimit,
  serverTimestamp,
  QueryConstraint,
  CollectionReference,
  DocumentReference,
  Query,
} from "firebase/firestore";

// ---- Firebase config ----
const firebaseConfig = {
  apiKey: "AIzaSyAAXZw8dSnhAh4OTrC1hpGssvkddn0QDfU",
  authDomain: "socialcirkle-42d8b.firebaseapp.com",
  projectId: "socialcirkle-42d8b",
  storageBucket: "socialcirkle-42d8b.firebasestorage.app",
  messagingSenderId: "896069729535",
  appId: "1:896069729535:web:f88b8e547ab7b8dc9a60ca",
  measurementId: "G-ZRTC4QYDJ0",
};


const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
// best effort persistence on web
setPersistence(auth, browserLocalPersistence).catch(() => {});

const _db = getFirestore(app);

export const firestore = {
  FieldValue: {
    serverTimestamp,
  },
};

// ---------- Helpers ----------
function isOdd(n: number) {
  return n % 2 === 1;
}

/**
 * Converts a path like "feeds/UID/items" into a CollectionReference or DocumentReference.
 * We need this because your code sometimes passes slash paths.
 */
function refFromPath(path: string): { type: "col"; ref: CollectionReference } | { type: "doc"; ref: DocumentReference } {
  const parts = path.split("/").filter(Boolean);

  // Even parts => doc path, odd parts => collection path
  if (parts.length === 0) {
    throw new Error("Empty path");
  }

  if (isOdd(parts.length)) {
    // collection path: col/doc/col/doc/col
    let colRef: any = fsCollection(_db, parts[0]);
    for (let i = 1; i < parts.length; i++) {
      if (isOdd(i)) {
        // doc id
        colRef = fsDoc(colRef, parts[i]);
      } else {
        // subcollection name
        colRef = fsCollection(colRef, parts[i]);
      }
    }
    return { type: "col", ref: colRef as CollectionReference };
  } else {
    // doc path: col/doc/col/doc
    let docRef: any = fsDoc(_db, parts[0], parts[1]);
    for (let i = 2; i < parts.length; i += 2) {
      docRef = fsDoc(fsCollection(docRef, parts[i]), parts[i + 1]);
    }
    return { type: "doc", ref: docRef as DocumentReference };
  }
}

// ---------- V8-like wrappers ----------
type SnapCb = (snap: any) => void;

function wrapQuery(q: Query) {
  return {
    where: (field: string, op: any, value: any) => wrapQuery(query(q, fsWhere(field as any, op, value))),
    orderBy: (field: string, dir: "asc" | "desc" = "asc") => wrapQuery(query(q, fsOrderBy(field as any, dir))),
    limit: (n: number) => wrapQuery(query(q, fsLimit(n))),
    onSnapshot: (cb: SnapCb) =>
      onSnapshot(q, (snap) => {
        cb({
          forEach: (fn: any) => snap.forEach((d) => fn({ id: d.id, data: () => d.data() })),
        });
      }),
    get: async () => {
      const snap = await getDocs(q);
      return {
        forEach: (fn: any) => snap.forEach((d) => fn({ id: d.id, data: () => d.data() })),
      };
    },
  };
}

function wrapCollection(cref: CollectionReference, constraints: QueryConstraint[] = []) {
  const q = constraints.length ? query(cref, ...constraints) : (cref as any);

  return {
    add: (data: any) => addDoc(cref, data),
    doc: (id: string) => wrapDoc(fsDoc(cref, id)),
    where: (field: string, op: any, value: any) => wrapCollection(cref, [...constraints, fsWhere(field as any, op, value)]),
    orderBy: (field: string, dir: "asc" | "desc" = "asc") => wrapCollection(cref, [...constraints, fsOrderBy(field as any, dir)]),
    limit: (n: number) => wrapCollection(cref, [...constraints, fsLimit(n)]),
    onSnapshot: (cb: SnapCb) => wrapQuery(query(cref, ...constraints)).onSnapshot(cb),
    get: async () => wrapQuery(query(cref, ...constraints)).get(),
  };
}

function wrapDoc(dref: DocumentReference) {
  return {
    set: (data: any, options?: any) => setDoc(dref, data, options),
    get: async () => {
      const snap = await getDoc(dref);
      return { exists: () => snap.exists(), data: () => snap.data() };
    },
    onSnapshot: (cb: SnapCb) =>
      onSnapshot(dref, (snap) => cb({ exists: () => snap.exists(), data: () => snap.data() })),
    collection: (name: string) => wrapCollection(fsCollection(dref, name)),
  };
}

// Main db with support for BOTH:
// db.collection("feeds").doc(uid).collection("items")
// AND db.collection("feeds/uid/items")  (if you accidentally do that)
export const db = {
  collection: (path: string) => {
    const r = refFromPath(path);
    if (r.type !== "col") {
      throw new Error(`Path "${path}" is a document path, not a collection path`);
    }
    return wrapCollection(r.ref);
  },
  doc: (path: string) => {
    const r = refFromPath(path);
    if (r.type !== "doc") {
      throw new Error(`Path "${path}" is a collection path, not a document path`);
    }
    return wrapDoc(r.ref);
  },
};
