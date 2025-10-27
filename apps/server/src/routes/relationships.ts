import { Router } from "express";
import { prisma } from "../db.js";
const r = Router();

// POST /api/relationships/:otherId/request
r.post("/:otherId/request", async (req, res) => {
  const uid = (req as any).uid as string;
  const otherId = req.params.otherId;
  if (!otherId || otherId === uid) return res.status(400).json({ error: "bad otherId" });

  await prisma.relationship.upsert({
    where: { ownerId_otherId: { ownerId: uid, otherId } },
    update: { state: "PENDING", direction: "OUTGOING" },
    create: { ownerId: uid, otherId, state: "PENDING", direction: "OUTGOING" }
  });

  await prisma.relationship.upsert({
    where: { ownerId_otherId: { ownerId: otherId, otherId: uid } },
    update: { state: "PENDING", direction: "INCOMING" },
    create: { ownerId: otherId, otherId: uid, state: "PENDING", direction: "INCOMING" }
  });

  res.json({ ok: true });
});

// POST /api/relationships/:otherId/accept
r.post("/:otherId/accept", async (req, res) => {
  const uid = (req as any).uid as string;
  const otherId = req.params.otherId;

  await prisma.$transaction([
    prisma.relationship.upsert({
      where: { ownerId_otherId: { ownerId: uid, otherId } },
      update: { state: "ACCEPTED", direction: null },
      create: { ownerId: uid, otherId, state: "ACCEPTED", direction: null }
    }),
    prisma.relationship.upsert({
      where: { ownerId_otherId: { ownerId: otherId, otherId: uid } },
      update: { state: "ACCEPTED", direction: null },
      create: { ownerId: otherId, otherId: uid, state: "ACCEPTED", direction: null }
    }),
  ]);

  res.json({ ok: true });
});

// POST /api/relationships/:otherId/decline
r.post("/:otherId/decline", async (req, res) => {
  const uid = (req as any).uid as string;
  const otherId = req.params.otherId;
  await prisma.$transaction([
    prisma.relationship.deleteMany({ where: { ownerId: uid, otherId } }),
    prisma.relationship.deleteMany({ where: { ownerId: otherId, otherId: uid } }),
  ]);
  res.json({ ok: true });
});

// POST /api/relationships/:otherId/block
r.post("/:otherId/block", async (req, res) => {
  const uid = (req as any).uid as string;
  const otherId = req.params.otherId;

  await prisma.$transaction([
    prisma.relationship.upsert({
      where: { ownerId_otherId: { ownerId: uid, otherId } },
      update: { state: "BLOCKED", direction: null },
      create: { ownerId: uid, otherId, state: "BLOCKED", direction: null }
    }),
    prisma.relationship.deleteMany({ where: { ownerId: otherId, otherId: uid } }),
  ]);

  res.json({ ok: true });
});

// POST /api/relationships/:otherId/unblock
r.post("/:otherId/unblock", async (req, res) => {
  const uid = (req as any).uid as string;
  const otherId = req.params.otherId;
  await prisma.relationship.deleteMany({ where: { ownerId: uid, otherId, state: "BLOCKED" } });
  res.json({ ok: true });
});

export default r;
