import express from "express";
import cors from "cors";
import { requireAuth } from "./middleware/auth.js";
import chatsRouter from "./routes/chats.js";
import relationshipsRouter from "./routes/relationships.js";

// Optional dev-only routes (mounted only in non-prod)
let devRouter: any = null;
try {
  devRouter = (await import("./routes/dev.js")).default;
} catch {}

const app = express();

// CORS: allow any localhost:* (Expo can vary ports like 8081, 19006)
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl/postman
    if (/^http:\/\/localhost:\d+$/.test(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json());

// Public health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Require Firebase auth after health
app.use(requireAuth);

// API routes
app.use("/api/chats", chatsRouter);
app.use("/api/relationships", relationshipsRouter);

// Dev-only helper routes
if (process.env.NODE_ENV !== "production" && devRouter) {
  app.use("/api/dev", devRouter);
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`server on :${PORT}`));
