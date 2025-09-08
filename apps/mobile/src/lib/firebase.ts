import rnAuth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

// Export instances so other files can do: import { auth, db } from "@/lib/firebase"
export const auth = rnAuth();
export const db = firestore();

export type { FirebaseAuthTypes };

// Optional helpers (nice to use in UI code)
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
