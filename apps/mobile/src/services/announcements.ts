// apps/mobile/src/services/announcements.ts
import { db, firestore } from "@/lib/firebase";

type AnnouncementInput = {
  text: string;
  audience: { type: "cirkle"; cirkleId: string };
};

export async function createAnnouncement(input: AnnouncementInput): Promise<string> {
  const ref = await db.collection("announcements").add({
    text: input.text,
    audience: input.audience,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}
