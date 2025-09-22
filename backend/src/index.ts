import express from "express";
import cors from "cors";
import morgan from "morgan";
import { verifyToken } from "./middleware.auth";   // ⬅️ add this line

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now(), service: "socialcirkle-api" });
});

// ⬇️ new protected route
app.get("/protected", verifyToken, (req, res) => {
  res.json({ ok: true, uid: (req as any).uid });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

