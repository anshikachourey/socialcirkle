import express from "express";
import cors from "cors";
import morgan from "morgan";
import { verifyFirebaseToken } from "./middleware.auth";
import { env } from "./env";
import userRoutes from "./routes/user";

const app = express();

// allow only whitelisted web origins from .env (curl/native aren’t blocked by CORS)
app.use(cors({ origin: env.CORS_ORIGINS }));

app.use(express.json());
app.use(morgan("dev"));

app.use("/api", userRoutes);

app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now(), service: "socialcirkle-api" });
});

app.get("/protected", verifyFirebaseToken, (req, res) => {
  res.json({ ok: true, uid: (req as any).user.uid });
});
app.get("/", (_req, res) => {
  res.send("SocialCirkle API up 🚀");
});

app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});



