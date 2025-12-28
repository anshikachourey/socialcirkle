// src/middleware.auth.ts
import { Request, Response, NextFunction } from "express";
import { adminAuth } from "./firebase";

export async function verifyFirebaseToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const idToken = header.slice(7);
    const decoded = await adminAuth.verifyIdToken(idToken);
    (req as any).user = decoded; // includes uid, email, etc.
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

