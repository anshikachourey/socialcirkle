import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

type AudienceType = "cirkle";

type AnnouncementDoc = {
  text?: string;
  createdAt?: FirebaseFirestore.Timestamp;
  audience?: {
    type?: AudienceType;
    cirkleId?: string;
  };
};

/**
 * Fan-out announcements into per-user feeds.
 *
 * Trigger: announcements/{announcementId} created
 * Writes: feeds/{uid}/items/{announcementId}
 *
 * @param {functions.firestore.QueryDocumentSnapshot} snap Firestore snapshot.
 * @param {functions.EventContext} context Event context.
 * @return {Promise<null>} Resolves when complete.
 */
export const fanOutAnnouncement = functions.firestore
  .document("announcements/{announcementId}")
  .onCreate(
    async (
      snap: functions.firestore.QueryDocumentSnapshot,
      context: functions.EventContext
    ): Promise<null> => {
      const announcementId = String(context.params.announcementId || "");
      const data = snap.data() as AnnouncementDoc;

      const text = String(data?.text ?? "").trim();
      if (!text) return null;

      const createdAt = data?.createdAt ?? admin.firestore.Timestamp.now();
      const audienceType: AudienceType = data?.audience?.type ?? "cirkle";
      const cirkleId = String(data?.audience?.cirkleId ?? "").trim();

      const recipients = await getRecipientsForAudience(audienceType, cirkleId);
      if (recipients.length === 0) return null;

      const chunks = chunk(recipients, 450);

      for (const uids of chunks) {
        const batch = db.batch();
        for (const uid of uids) {
          const ref = db
            .collection("feeds")
            .doc(uid)
            .collection("items")
            .doc(announcementId);

          batch.set(ref, {announcementId, text, createdAt}, {merge: true});
        }
        await batch.commit();
      }

      return null;
    }
  );

/**
 * Resolves recipient UIDs based on audience.
 *
 * @param {AudienceType} audienceType Audience type ("cirkle").
 * @param {string} cirkleId Cirkle document id.
 * @return {Promise<string[]>} Recipient uids.
 */
async function getRecipientsForAudience(
  audienceType: AudienceType,
  cirkleId: string
): Promise<string[]> {
  if (audienceType !== "cirkle") return [];
  if (!cirkleId) return [];

  const snap = await db.collection("cirkles").doc(cirkleId).get();
  const d = snap.data() ?? {};
  const membersRaw = (d as any).members;

  if (!Array.isArray(membersRaw)) return [];

  const members = membersRaw
    .map((x: any) => String(x))
    .filter((x: string) => x.length > 0);

  return uniq(members);
}

/**
 * Deduplicates strings.
 *
 * @param {string[]} arr Input list.
 * @return {string[]} Unique list.
 */
function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

/**
 * Splits list into chunks.
 *
 * @param {string[]} arr Input list.
 * @param {number} size Chunk size.
 * @return {Array<string[]>} Chunked list.
 */
function chunk(arr: string[], size: number): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}
