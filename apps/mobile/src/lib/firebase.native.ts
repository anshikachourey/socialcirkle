// src/lib/firebase.native.ts
import rnAuth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import rnFirestore from "@react-native-firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

// Instances
export const auth = rnAuth();
export const db = rnFirestore();

// Export firestore *module* too, so we can use FieldValue like firestore.FieldValue.serverTimestamp()
export const firestore = rnFirestore;

export type { FirebaseAuthTypes };

// Cross-platform helpers (same names used on web)
export function onAuthChanged(cb: (u: FirebaseAuthTypes.User | null) => void) {
  return auth.onAuthStateChanged(cb);
}
export async function signUpEmail(email: string, password: string, displayName?: string) {
  const cred = await auth.createUserWithEmailAndPassword(email.trim(), password);
  if (displayName) await cred.user.updateProfile({ displayName });
  return cred.user;
}
export async function signInEmail(email: string, password: string) {
  const cred = await auth.signInWithEmailAndPassword(email.trim(), password);
  return cred.user;
}
export function signOutUser() {
  return auth.signOut();
}

