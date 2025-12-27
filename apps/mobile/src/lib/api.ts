import { API_BASE } from "./env";
import { auth } from "./firebase";

console.log("[api] API_BASE =", API_BASE);

export async function api(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  const token = await auth.currentUser?.getIdToken?.();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");

  return fetch(`${API_BASE}${path}`, { ...init, headers });
}
