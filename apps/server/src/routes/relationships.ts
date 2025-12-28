import { Router } from "express";
import { prisma } from "../db.js";

const r = Router();

/** 
 * Expected minimal Prisma models:
 * model ChatRequest { id String @id @default(cuid()) fromUid String toUid String status String @default("pending") createdAt DateTime @default(now()) }
 * model Chat        { id String @id @default(cuid()) isGroup Boolean title String? createdById String participantIds String[] updatedAt DateTime @updatedAt lastMessageText String? members ChatMember[] }
 * model ChatMember  { id String @id @default(cuid()) chatId String userId String }
 */

// List my incoming requests
r.get("/requests", async (req, res) => {
  const uid = (req as any).uid as string;
  const status = (req.query.status as string) ?? "pending";
  const items = await prisma.chatRequest.findMany({
    where: { toUid: uid, status },
    orderBy: { createdAt: "desc" },
  });
  res.json({ items });
});

// Accept -> create or get a 1:1 chat; return chatId
r.post("/requests/:id/accept", async (req, res) => {
  const uid = (req as any).uid as string;
  const id = req.params.id;
  const cr = await prisma.chatRequest.findUnique({ where: { id } });
  if (!cr || cr.toUid !== uid) return res.status(404).json({ error: "not found" });

  const pairName = [cr.fromUid, cr.toUid].sort().join("__");
  let chat = await prisma.chat.findFirst({ where: { isGroup: false, title: pairName } });
  if (!chat) {
    chat = await prisma.chat.create({
      data: {
        isGroup: false,
        title: pairName,
        createdById: uid,
        participantIds: [cr.fromUid, cr.toUid],
        members: { create: [{ userId: cr.fromUid }, { userId: cr.toUid }] },
      },
      select: { id: true },
    });
  }

  await prisma.chatRequest.update({ where: { id }, data: { status: "accepted" } });
  res.json({ ok: true, chatId: chat.id });
});

// Decline
r.post("/requests/:id/decline", async (req, res) => {
  const uid = (req as any).uid as string;
  const id = req.params.id;
  const cr = await prisma.chatRequest.findUnique({ where: { id } });
  if (!cr || cr.toUid !== uid) return res.status(404).json({ error: "not found" });

  await prisma.chatRequest.update({ where: { id }, data: { status: "declined" } });
  res.json({ ok: true });
});

export default r;


