import express from "express";
import cors from "cors";
import morgan from "morgan";
const app = express();
app.use(cors()); 
pp.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now(), service: "socialcirkle-api" });
});

app.get("/", (_req, res) => {
  res.send("SocialCirkle API up 🚀");
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 8080;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
