import "dotenv/config";
import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import { authMiddleware } from "./middleware/auth.js";
import relationships from "./routes/relationships.js";
import chats from "./routes/chats.js";

const app = express();

app.use(helmet());
app.use(express.json());
app.use(morgan("dev"));

const allowed = (process.env.ALLOWED_ORIGINS ?? "").split(",").filter(Boolean);
app.use(cors({ origin: allowed.length ? allowed : true }));

app.get("/health", (_req, res) => res.json({ ok: true }));

//requires Firebase ID token for API routes
app.use("/api", authMiddleware);
app.use("/api/relationships", relationships);
app.use("/api/chats", chats);

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => console.log(`server on :${port}`));
