// src/services/relationships.ts
import { api } from "../lib/api";
import { db, auth } from "../lib/firebase";

export type RelState = "pending" | "accepted" | "blocked";

export type Relationship = {
  users: [string, string];
  status: RelState;
  requestedBy?: string | null;
  updatedAt?: any;
};

// --- Write actions: go through backend API ---

export async function requestChat(otherId: string) {
  // POST /api/relationships/:id/request
  await api(`/api/relationships/${otherId}/request`, { method: "POST" });
}

export async function acceptRequest(otherId: string) {
  // POST /api/relationships/:id/accept
  await api(`/api/relationships/${otherId}/accept`, { method: "POST" });
}

export async function declineRequest(otherId: string) {
  // POST /api/relationships/:id/decline
  await api(`/api/relationships/${otherId}/decline`, { method: "POST" });
}

export async function blockUser(otherId: string) {
  await api(`/api/relationships/${otherId}/block`, { method: "POST" });
}

export async function unblockUser(otherId: string) {
  await api(`/api/relationships/${otherId}/unblock`, { method: "POST" });
}

// --- Read/subscription: keep using Firestore for now ---

/**
 * Subscribe to my relationships and return a map of { [otherUid]: "pending" | "accepted" | "blocked" }.
 * Assumes a `relationships` collection with docs that have `users: [uidA, uidB]` (sorted) and `status`.
 */
export function onMyRelationships(
  cb: (rels: Record<string, RelState>) => void
) {
  const me = auth.currentUser?.uid;
  if (!me) return () => {};

  return db
    .collection("relationships")
    .where("users", "array-contains", me)
    .onSnapshot((qs: any) => {
      const map: Record<string, RelState> = {};
      qs.forEach((d: any) => {
        const r = d.data?.() as Relationship;
        if (!r?.users?.length) return;
        const other = r.users[0] === me ? r.users[1] : r.users[0];
        map[other] = r.status;
      });
      cb(map);
    });
}
