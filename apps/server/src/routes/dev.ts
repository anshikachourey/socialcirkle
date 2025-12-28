import { Router } from "express";
import type { Request, Response } from "express";
import { getAuth } from "firebase-admin/auth";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { prisma } from "../db.js";

// Ensure admin app is initialized (safe if already done)
if (!getApps().length) {
  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
  } = process.env;
  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
    initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
}

/** dev-only router */
const r = Router();

r.get("/health", (_req, res) => res.json({ ok: true, env: process.env.NODE_ENV || "development" }));

async function ensureFirebaseUser(uid: string, displayName?: string) {
  const auth = getAuth();
  try { await auth.getUser(uid); }
  catch { await auth.createUser({ uid, displayName: displayName || uid }); }
}

r.post("/impersonate", async (req: Request, res: Response) => {
  try {
    const { uid, displayName } = req.body as { uid: string; displayName?: string };
    if (!uid || !uid.startsWith("demo_")) return res.status(400).json({ error: "uid must start with demo_" });

    await ensureFirebaseUser(uid, displayName);

    // Optional: mirror in your DB if you have a user table (ignore if not)
    try {
      // @ts-ignore
      await prisma.user?.upsert?.({
        where: { id: uid },
        update: { displayName: displayName || uid },
        create: { id: uid, displayName: displayName || uid },
      });
    } catch {}

    const customToken = await getAuth().createCustomToken(uid);
    res.json({ customToken });
  } catch (e: any) {
    res.status(500).json({ error: "impersonate_failed", detail: e?.message });
  }
});

r.get("/demo-users", async (req, res) => {
  const n = Math.min(parseInt(String(req.query.n ?? "8"), 10) || 8, 20);
  const pool = [
    "demo_aria","demo_ben","demo_cara","demo_dan","demo_emi","demo_finn",
    "demo_gia","demo_hank","demo_ivy","demo_jai","demo_kai","demo_lee"
  ];
  const chosen = pool.slice(0, n);
  await Promise.all(chosen.map(uid => ensureFirebaseUser(uid, uid.replace("demo_",""))));
  res.json({ items: chosen });
});

// Synthetic "nearby" users for a lat/lng — used for group-by-venue/radius demo
r.get("/nearby", async (req, res) => {
  const n = Math.min(parseInt(String(req.query.n ?? "8"), 10) || 8, 50);
  const pool = [
    "demo_aria","demo_ben","demo_cara","demo_dan","demo_emi","demo_finn",
    "demo_gia","demo_hank","demo_ivy","demo_jai","demo_kai","demo_lee"
  ];
  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, n);
  await Promise.all(shuffled.map(uid => ensureFirebaseUser(uid, uid.replace("demo_",""))));
  res.json({ items: shuffled, radiusMeters: parseInt(String(req.query.radiusMeters ?? "300"), 10) || 300 });
});

export default r;
