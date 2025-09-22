cat > src/middleware.auth.ts <<'EOF'
import { Request, Response, NextFunction } from "express";
import { adminAuth } from "./firebase";

export async function verifyToken(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  const token = header.slice(7);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    (req as any).uid = decoded.uid;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
EOF
