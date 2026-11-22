import { Prisma } from "@prisma/client";
import { db } from "./db";
import { donorGroupsFor, type BG } from "./blood";
import { bn } from "./format";
import { statusLabel } from "./labels";
import { expireOldBags } from "./stock";

export type AllocCode = "NOT_FOUND" | "BAD_STATE" | "CONFLICT" | "EXPIRED" | "INSUFFICIENT";

export class AllocError extends Error {
  code: AllocCode;
  extra?: Record<string, number>;
  constructor(code: AllocCode, message: string, extra?: Record<string, number>) {
    super(message);
    this.code = code;
    this.extra = extra;
  }
}

export type AllocatedBag = { bagId: string; bloodGroup: BG; expiryDate: string };
export type AllocResult = { replayed: boolean; bags: AllocatedBag[] };

// Neon-এর নেটওয়ার্ক দেরির জন্য সময়সীমা একটু বেশি রাখা হয়েছে
const TX_OPTS = { maxWait: 10000, timeout: 20000 };

const keyPrefix = (requestId: string, key: string) => `${requestId}.${key}:`;

async function findPrior(requestId: string, key: string): Promise<AllocResult | null> {
  const prior = await db.allocation.findMany({
    where: { idempotencyKey: { startsWith: keyPrefix(requestId, key) } },
    include: { bag: { select: { id: true, bloodGroup: true, expiryDate: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (prior.length === 0) return null;
  return {
    replayed: true,
    bags: prior.map((p) => ({ bagId: p.bag.id, bloodGroup: p.bag.bloodGroup, expiryDate: p.bag.expiryDate.toISOString() })),
  };
}

/**
 * অনুরোধের জন্য ব্যাগ বরাদ্দ।
 * - একই key দিয়ে আবার ডাকলে আগের ফলই ফেরত আসে (idempotency)
 * - ব্যাগ দখল হয় "status = AVAILABLE এবং version মেলে" শর্তে, তাই দুজন একই ব্যাগ পায় না
 * - পর্যাপ্ত ব্যাগ না মিললে exception, ফলে transaction rollback হয়, কিছুই বদলায় না
 */
export async function allocateForRequest(opts: { requestId: string; key: string; restrictToBagIds?: string[] }): Promise<AllocResult> {
  const { requestId, key, restrictToBagIds } = opts;

  const already = await findPrior(requestId, key);
  if (already) return already;

  await expireOldBags();

  try {
    const got = await db.$transaction(async (tx) => {
      const req = await tx.bloodRequest.findUnique({ where: { id: requestId } });
      if (!req) throw new AllocError("NOT_FOUND", "অনুরোধটি পাওয়া যায়নি");
      if (req.status !== "PENDING") {
        throw new AllocError("BAD_STATE", `'${statusLabel[req.status]}' অবস্থার অনুরোধে ব্যাগ বরাদ্দ করা যায় না`);
      }
      if (req.expiresAt.getTime() <= Date.now()) throw new AllocError("EXPIRED", "অনুরোধের মেয়াদ শেষ হয়ে গেছে");

      // অনুরোধ দখল: PENDING থেকে MATCHED। একই সময়ে দ্বিতীয়জন এলে count = 0 পাবে
      const claim = await tx.bloodRequest.updateMany({ where: { id: requestId, status: "PENDING" }, data: { status: "MATCHED" } });
      if (claim.count === 0) throw new AllocError("CONFLICT", "অনুরোধের অবস্থা এইমাত্র বদলে গেছে");

      const candidates = await tx.bloodBag.findMany({
        where: {
          status: "AVAILABLE",
          expiryDate: { gt: new Date() },
          bloodGroup: { in: donorGroupsFor(req.bloodGroup) },
          ...(restrictToBagIds ? { id: { in: restrictToBagIds } } : {}),
        },
        orderBy: { expiryDate: "asc" },
        take: 200,
      });
      // হুবহু একই গ্রুপ আগে, তারপর মেয়াদ আগে শেষ হবে এমন ব্যাগ আগে
      candidates.sort(
        (a, b) =>
          (a.bloodGroup === req.bloodGroup ? 0 : 1) - (b.bloodGroup === req.bloodGroup ? 0 : 1) ||
          a.expiryDate.getTime() - b.expiryDate.getTime()
      );

      const picked: typeof candidates = [];
      let i = 0;
      for (const bag of candidates) {
        if (picked.length >= req.units) break;
        // ব্যাগ দখল: অবস্থা ও version দুটোই মিলতে হবে
        const taken = await tx.bloodBag.updateMany({
          where: { id: bag.id, status: "AVAILABLE", version: bag.version },
          data: { status: "RESERVED", version: { increment: 1 } },
        });
        if (taken.count === 0) continue; // অন্য কেউ আগে নিয়ে গেছে
        await tx.allocation.create({ data: { requestId, bagId: bag.id, idempotencyKey: `${keyPrefix(requestId, key)}${i++}` } });
        picked.push(bag);
      }

      if (picked.length < req.units) {
        throw new AllocError(
          "INSUFFICIENT",
          `${bn(req.units)}টি ব্যাগ লাগবে, মিলেছে ${bn(picked.length)}টি। কিছুই বরাদ্দ হয়নি`,
          { needed: req.units, found: picked.length }
        );
      }
      return picked;
    }, TX_OPTS);

    return {
      replayed: false,
      bags: got.map((b) => ({ bagId: b.id, bloodGroup: b.bloodGroup, expiryDate: b.expiryDate.toISOString() })),
    };
  } catch (e) {
    const sameKeyRace =
      (e instanceof AllocError && (e.code === "BAD_STATE" || e.code === "CONFLICT")) ||
      (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002");
    if (sameKeyRace) {
      const again = await findPrior(requestId, key);
      if (again) return again;
    }
    throw e;
  }
}

/** বরাদ্দ হওয়া অনুরোধ সম্পন্ন: ব্যাগ RESERVED থেকে USED */
export async function fulfillRequest(requestId: string) {
  return db.$transaction(async (tx) => {
    const flip = await tx.bloodRequest.updateMany({ where: { id: requestId, status: "MATCHED" }, data: { status: "FULFILLED" } });
    if (flip.count === 0) throw new AllocError("BAD_STATE", "শুধু 'ব্যাগ বরাদ্দ হয়েছে' অবস্থার অনুরোধ সম্পন্ন করা যায়");
    const allocs = await tx.allocation.findMany({ where: { requestId }, select: { bagId: true } });
    const used = await tx.bloodBag.updateMany({
      where: { id: { in: allocs.map((a) => a.bagId) }, status: "RESERVED" },
      data: { status: "USED", version: { increment: 1 } },
    });
    return { bags: used.count };
  }, TX_OPTS);
}

/** অনুরোধ বাতিল। বরাদ্দ থাকলে ব্যাগগুলো আবার স্টকে ফেরে */
export async function cancelWithRelease(requestId: string) {
  return db.$transaction(async (tx) => {
    const cur = await tx.bloodRequest.findUnique({ where: { id: requestId }, select: { status: true } });
    if (!cur) throw new AllocError("NOT_FOUND", "অনুরোধটি পাওয়া যায়নি");
    if (cur.status !== "PENDING" && cur.status !== "MATCHED") {
      throw new AllocError("BAD_STATE", `'${statusLabel[cur.status]}' অবস্থার অনুরোধ বাতিল করা যায় না`);
    }
    const flip = await tx.bloodRequest.updateMany({ where: { id: requestId, status: cur.status }, data: { status: "CANCELLED" } });
    if (flip.count === 0) throw new AllocError("CONFLICT", "অনুরোধের অবস্থা এইমাত্র বদলে গেছে। পেজ রিফ্রেশ করুন");

    let released = 0;
    const allocs = await tx.allocation.findMany({ where: { requestId }, select: { bagId: true } });
    if (allocs.length > 0) {
      const r = await tx.bloodBag.updateMany({
        where: { id: { in: allocs.map((a) => a.bagId) }, status: "RESERVED" },
        data: { status: "AVAILABLE", version: { increment: 1 } },
      });
      released = r.count;
      await tx.allocation.deleteMany({ where: { requestId } });
    }
    return { released };
  }, TX_OPTS);
}