import { API_BASE } from "./env";
import { auth } from "./firebase";

export async function api(path: string, init?: RequestInit) {
  const token = await auth.currentUser?.getIdToken?.();
  const headers = new Headers(init?.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");
  return fetch(`${API_BASE}${path}`, { ...init, headers });
}
