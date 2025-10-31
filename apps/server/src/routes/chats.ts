import { Router } from "express";
import { prisma } from "../db.js";
const r = Router();

// ensure a 1:1 chat and return chatId
// POST /api/chats/ensure?otherId=abc
r.post("/ensure", async (req, res) => {
  const uid = (req as any).uid as string;
  const otherId = String(req.query.otherId ?? "");
  if (!otherId || otherId === uid) return res.status(400).json({ error: "bad otherId" });

  // find existing (participants contain both users)
  const existing = await prisma.chat.findFirst({
    where: { isGroup: false, participantIds: { hasEvery: [uid, otherId] } },
    select: { id: true }
  });
  if (existing) return res.json(existing);

  const chat = await prisma.chat.create({
    data: {
      isGroup: false,
      title: null,
      createdById: uid,
      participantIds: [uid, otherId],
      members: { create: [{ userId: uid }, { userId: otherId }] }
    },
    select: { id: true }
  });

  res.json(chat);
});

// list my chats
// GET /api/chats
r.get("/", async (req, res) => {
  const uid = (req as any).uid as string;
  const chats = await prisma.chat.findMany({
    where: { participantIds: { has: uid } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, isGroup: true, updatedAt: true }
  });
  res.json(chats);
});

// get messages
// GET /api/chats/:id/messages
r.get("/:id/messages", async (req, res) => {
  const uid = (req as any).uid as string;
  const id = req.params.id;
  const chat = await prisma.chat.findFirst({ where: { id, participantIds: { has: uid } } });
  if (!chat) return res.status(404).json({ error: "not found" });

  const msgs = await prisma.message.findMany({
    where: { chatId: id },
    orderBy: { createdAt: "asc" }
  });
  res.json(msgs);
});

// send message
// POST /api/chats/:id/messages 
r.post("/:id/messages", async (req, res) => {
  const uid = (req as any).uid as string;
  const id = req.params.id;
  const { text } = req.body as { text: string };
  if (!text?.trim()) return res.status(400).json({ error: "empty" });

  const chat = await prisma.chat.findFirst({ where: { id, participantIds: { has: uid } } });
  if (!chat) return res.status(404).json({ error: "not found" });

  const msg = await prisma.message.create({
    data: { chatId: id, senderId: uid, text: text.trim() }
  });
  await prisma.chat.update({ where: { id }, data: { updatedAt: new Date() } });

  res.json(msg);
});

export default r;
