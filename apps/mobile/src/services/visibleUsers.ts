// apps/mobile/src/services/visibleUsers.ts
import { auth, db } from "../lib/firebase";
import { geohashQueryBounds, distanceBetween } from "geofire-common";

export type PublicUser = {
  id: string;
  displayName?: string | null;
  photoURL?: string | null;
  status?: string | null;
  location?: { lat: number; lng: number };
};

type Unsub = () => void;

export function onVisibleUsers(cb: (users: PublicUser[]) => void): Unsub {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    cb([]);
    return () => {};
  }

  let settingsUnsub: any = null;
  let myLocUnsub: any = null;
  let locUnsubs: any[] = [];

  let myRadiusMeters: number | null = null;
  let myVisible = false;
  let myCenter: { lat: number; lng: number } | null = null;

  function clearLocSubs() {
    for (const u of locUnsubs) u?.();
    locUnsubs = [];
  }

  async function emitFromLocations(locationDocs: Array<{ id: string; lat: number; lng: number }>) {
    const ids = locationDocs.map((d) => d.id).filter((id) => id !== uid);

    // Join profile info from users/{uid}
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

    const profiles: Record<string, any> = {};
    for (const chunk of chunks) {
      const snap = await db.collection("users").where("__name__", "in", chunk).get();
      snap.forEach((doc: any) => (profiles[doc.id] = doc.data?.() ?? {}));
    }

    const out: PublicUser[] = locationDocs
      .filter((d) => d.id !== uid)
      .map((d) => ({
        id: d.id,
        displayName: profiles[d.id]?.displayName ?? null,
        photoURL: profiles[d.id]?.photoURL ?? null,
        status: profiles[d.id]?.status ?? null, // optional if you store it in users
        location: { lat: d.lat, lng: d.lng },
      }));

    cb(out);
  }

  function resubscribeLocations() {
    clearLocSubs();

    // If not visible, show nobody.
    if (!myVisible) {
      cb([]);
      return;
    }

    // If worldwide, simplest fallback: (not scalable) — you can later optimize with paging
    if (myRadiusMeters == null) {
      const unsub = db.collection("userLocations").onSnapshot(async (snap: any) => {
        const docs: Array<{ id: string; lat: number; lng: number }> = [];
        snap.forEach((doc: any) => {
          const d = doc.data?.() ?? {};
          if (typeof d.lat === "number" && typeof d.lng === "number") {
            docs.push({ id: doc.id, lat: d.lat, lng: d.lng });
          }
        });
        await emitFromLocations(docs);
      });
      locUnsubs.push(unsub);
      return;
    }

    // Need center to query radius
    if (!myCenter) {
      cb([]);
      return;
    }

    const center: [number, number] = [myCenter.lat, myCenter.lng];
    const radiusInM = myRadiusMeters;

    const bounds = geohashQueryBounds(center, radiusInM);

    // We'll merge results from multiple bound queries
    const candidates = new Map<string, { id: string; lat: number; lng: number }>();
    let pending = 0;

    const flush = async () => {
      // filter precise distance
      const filtered = Array.from(candidates.values()).filter((p) => {
        const km = distanceBetween([p.lat, p.lng], center);
        return km * 1000 <= radiusInM;
      });
      await emitFromLocations(filtered);
    };

    for (const b of bounds) {
      pending++;
      const q = db
        .collection("userLocations")
        .orderBy("geohash")
        .startAt(b[0])
        .endAt(b[1]);

      const unsub = q.onSnapshot(async (snap: any) => {
        snap.forEach((doc: any) => {
          const d = doc.data?.() ?? {};
          if (typeof d.lat === "number" && typeof d.lng === "number") {
            candidates.set(doc.id, { id: doc.id, lat: d.lat, lng: d.lng });
          }
        });
        await flush();
      });

      locUnsubs.push(() => {
        unsub?.();
        pending--;
      });
    }
  }

  // Listen to my settings
  settingsUnsub = db.collection("userSettings").doc(uid).onSnapshot((snap: any) => {
    const d = snap?.data?.() ?? {};
    myVisible = !!d.visible;
    myRadiusMeters = d.radiusMeters ?? null;
    resubscribeLocations();
  });

  // Listen to my location as the query center
  myLocUnsub = db.collection("userLocations").doc(uid).onSnapshot((snap: any) => {
    const d = snap?.data?.() ?? {};
    if (typeof d.lat === "number" && typeof d.lng === "number") {
      myCenter = { lat: d.lat, lng: d.lng };
      resubscribeLocations();
    }
  });

  return () => {
    settingsUnsub?.();
    myLocUnsub?.();
    clearLocSubs();
  };
}
