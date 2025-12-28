import { Router } from "express";
import { prisma } from "../db.js";
const r = Router();

// helper
function isDemoUid(uid: string) { return uid.startsWith("demo_"); }

// ensure a 1:1 chat and return chatId
// POST /api/chats/ensure?otherId=abc
r.post("/ensure", async (req, res) => {
  const uid = (req as any).uid as string;
  const otherId = String(req.query.otherId ?? "");
  if (!otherId || otherId === uid) return res.status(400).json({ error: "bad otherId" });

  // find existing (both participants present)
  const existing = await prisma.chat.findFirst({
    where: { isGroup: false, participantIds: { hasEvery: [uid, otherId] } },
    select: { id: true }
  });
  if (existing) return res.json(existing);

  const chat = await prisma.chat.create({
    data: {
      isGroup: false,
      title: [uid, otherId].sort().join("__"), // idempotent pairing title
      createdById: uid,
      participantIds: [uid, otherId],
      members: { create: [{ userId: uid }, { userId: otherId }] }
    },
    select: { id: true }
  });

  res.json(chat);
});

// list my chats (for Chats tab)
r.get("/", async (req, res) => {
  const uid = (req as any).uid as string;
  const chats = await prisma.chat.findMany({
    where: { participantIds: { has: uid } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, isGroup: true, updatedAt: true, lastMessageText: true, participantIds: true }
  });
  // shape to minimal client format
  res.json(chats.map(c => ({
    id: c.id,
    type: c.isGroup ? "group" : "direct",
    name: c.isGroup ? (c.title ?? "Group") : undefined,
    lastMessageText: c.lastMessageText ?? null,
    members: c.participantIds,
    updatedAt: c.updatedAt,
  })));
});

// get messages
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
  await prisma.chat.update({ where: { id }, data: { updatedAt: new Date(), lastMessageText: text.trim() } });

  // simple demo auto-reply if other participant is demo_* (dev only)
  if (process.env.NODE_ENV !== "production") {
    try {
      const members = await prisma.chatMember.findMany({ where: { chatId: id }, select: { userId: true } });
      const otherDemo = members.map(m => m.userId).find(u => isDemoUid(u) && u !== uid);
      if (otherDemo) {
        setTimeout(async () => {
          await prisma.message.create({
            data: { chatId: id, senderId: otherDemo, text: "Got it! 👋 (demo auto-reply)" }
          });
          await prisma.chat.update({ where: { id }, data: { updatedAt: new Date(), lastMessageText: "Got it! 👋 (demo auto-reply)" } });
        }, 400);
      }
    } catch {}
  }

  res.json(msg);
});

// create group
// POST /api/chats/group  body: { name: string, memberUids: string[] }
r.post("/group", async (req, res) => {
  const uid = (req as any).uid as string;
  const { name, memberUids } = req.body as { name: string; memberUids: string[] };
  const unique = Array.from(new Set([uid, ...(memberUids ?? [])]));
  if (unique.length < 2) return res.status(400).json({ error: "need at least 2 members" });

  const chat = await prisma.chat.create({
    data: {
      isGroup: true,
      title: name?.trim() || "Group",
      createdById: uid,
      participantIds: unique,
      members: { create: unique.map(u => ({ userId: u })) }
    },
    select: { id: true }
  });
  res.json({ id: chat.id });
});

export default r;

