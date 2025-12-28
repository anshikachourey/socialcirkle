import type { Request, Response, NextFunction } from "express";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin once (ESM-safe, modular API)
(function initAdmin() {
  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY,
  } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    // You can console.warn here if running locally without auth
    return;
  }

  // Handle escaped \n in env var keys
  const privateKey = FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
})();

/**
 * Require Firebase Auth middleware:
 *  - Reads Authorization: Bearer <ID_TOKEN>
 *  - Verifies and sets req.uid
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Missing token" });
    }

    const decoded = await getAuth().verifyIdToken(token);
    (req as any).uid = decoded.uid;
    return next();
  } catch (e: any) {
    return res.status(401).json({ error: "Unauthorized", detail: e?.message });
  }
}

export default requireAuth;
