import { api } from '../lib/api';

export type RelationshipRequest = {
  id: string;
  fromUid: string;
  toUid: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
};

export type RelationshipRow = {
  uid: string;
  status: 'friend' | 'requested' | 'incoming' | 'blocked';
  displayName?: string | null;
};

export async function listIncomingRequests(
  status: 'pending' | 'accepted' | 'declined' = 'pending'
) {
  const res = await api(`/api/relationships/requests?status=${status}`);
  if (!res.ok) throw new Error('Failed to load requests');
  const data = await res.json();
  return data.items as RelationshipRequest[];
}

export async function acceptRequest(requestId: string) {
  const res = await api(`/api/relationships/requests/${requestId}/accept`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to accept request');
  const data = await res.json();
  return data.chatId as string;
}

export async function declineRequest(requestId: string) {
  const res = await api(`/api/relationships/requests/${requestId}/decline`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to decline request');
}

export function onMyRelationships(cb: (rows: RelationshipRow[]) => void) {
  let stopped = false;

  async function loadDev() {
    try {
      const res = await api('/api/dev/demo-users?n=8');
      if (!res.ok) throw new Error('dev users failed');
      const data = await res.json() as { items: string[] };
      const items = (data.items ?? []).slice(0, 8);
      const rows: RelationshipRow[] = items.map((uid, i) => {
        let status: RelationshipRow['status'] = 'friend';
        if (i >= 4 && i < 6) status = 'requested';
        if (i >= 6) status = 'incoming';
        return { uid, status, displayName: uid.replace('demo_', '') };
      });
      if (!stopped) cb(rows);
    } catch {
      if (!stopped) cb([]);
    }
  }

  async function loadProd() { cb([]); }

  if (__DEV__) {
    loadDev();
    const t = setInterval(loadDev, 5000);
    return () => { stopped = true; clearInterval(t); };
  } else {
    loadProd();
    return () => { stopped = true; };
  }
}

