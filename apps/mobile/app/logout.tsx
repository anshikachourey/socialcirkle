import { useEffect } from "react";
import { router } from "expo-router";
import { auth } from "../src/lib/firebase";

export default function Logout() {
  useEffect(() => {
    auth.signOut().finally(() => router.replace("/login"));
  }, []);
  return null;
}
