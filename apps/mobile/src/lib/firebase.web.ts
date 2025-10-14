// src/lib/firebase.web.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth, onAuthStateChanged as webOnAuthChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile
} from "firebase/auth";
import {
    getFirestore, serverTimestamp,
    collection as fsCollection, doc as fsDoc,
    setDoc, addDoc, onSnapshot, query as fsQuery, where as fsWhere,
  } from "firebase/firestore";
  

// ⬇️ Put your Web App config here
const firebaseConfig = {
    apiKey: "AIzaSyAAXZw8dSnhAh4OTrC1hpGssvkddn0QDfU",
    authDomain: "socialcirkle-42d8b.firebaseapp.com",
    projectId: "socialcirkle-42d8b",
    storageBucket: "socialcirkle-42d8b.firebasestorage.app",
    messagingSenderId: "896069729535",
    appId: "1:896069729535:web:f88b8e547ab7b8dc9a60ca",
    measurementId: "G-ZRTC4QYDJ0"
  };

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
const _db = getFirestore(app);

// --- Adapter so web code can call RNFirebase-style APIs like db.collection(...).doc(...).set(...)
// Supported: .collection(name).add(data), .doc(id).set(data, options), .onSnapshot(cb), .where(...).onSnapshot(cb)
function adaptQuerySnapshot(qs: any) {
  return {
    docs: qs.docs.map((d: any) => ({
      id: d.id,
      data: () => d.data(),
    })),
  };
}
function adaptDocSnapshot(ds: any) {
  return {
    id: ds.id,
    data: () => ds.data(),
  };
}

export const db: any = {
  collection: (name: string) => {
    const cref = fsCollection(_db, name);
    return {
      add: (data: any) => addDoc(cref, data),
      doc: (id: string) => {
        const dref = fsDoc(_db, name, id);
        return {
          set: (data: any, options?: any) => setDoc(dref, data, options),
          onSnapshot: (cb: any) => onSnapshot(dref, (snap) => cb(adaptDocSnapshot(snap))),
        };
      },
      where: (field: string, op: any, value: any) => {
        const qref = fsQuery(cref, fsWhere(field as any, op as any, value));
        return {
          onSnapshot: (cb: any) => onSnapshot(qref, (qs) => cb(adaptQuerySnapshot(qs))),
        };
      },
      onSnapshot: (cb: any) => onSnapshot(cref, (qs) => cb(adaptQuerySnapshot(qs))),
    };
  },
};

// Shim to match native FieldValue usage
export const firestore = { FieldValue: { serverTimestamp } };

// Type parity so the rest of your code compiles on web
export type FirebaseAuthTypes = { User: import("firebase/auth").User };

// Cross-platform helpers (same signatures as native)
export function onAuthChanged(cb: (u: FirebaseAuthTypes["User"] | null) => void) {
  return webOnAuthChanged(auth, cb);
}
export async function signUpEmail(email: string, password: string, displayName?: string) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName) await updateProfile(cred.user, { displayName });
  return cred.user;
}
export async function signInEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  return cred.user;
}
export function signOutUser() {
  return signOut(auth);
}
