import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { requireUser, clientIp } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { allocateForRequest, AllocError } from "@/lib/allocation";

const DEMO = "[ডেমো]";
// ডেমোর ব্যাগ চেনার চিহ্ন: আসল ব্যাগের version কখনো এত বড় হয় না
const DEMO_VERSION = 1000000;
const DAY_MS = 86400000;

async function cleanup() {
  await db.allocation.deleteMany({
    where: { OR: [{ request: { patientName: { startsWith: DEMO } } }, { bag: { version: { gte: DEMO_VERSION } } }] },
  });
  await db.bloodRequest.deleteMany({ where: { patientName: { startsWith: DEMO } } });
  await db.bloodBag.deleteMany({ where: { version: { gte: DEMO_VERSION } } });
}

async function setup(adminId: string, count: number) {
  const bag = await db.bloodBag.create({
    data: { bloodGroup: "O_NEG", expiryDate: new Date(Date.now() + 30 * DAY_MS), version: DEMO_VERSION },
  });
  const reqs = await Promise.all(
    Array.from({ length: count }, (_, i) =>
      db.bloodRequest.create({
        data: {
          requesterId: adminId,
          patientName: `${DEMO} অনুরোধ ${i + 1}`,
          bloodGroup: "O_NEG",
          units: 1,
          urgency: "URGENT",
          hospital: `ডেমো হাসপাতাল ${i + 1}`,
          district: "ঢাকা",
          expiresAt: new Date(Date.now() + 3 * DAY_MS),
        },
        select: { id: true },
      })
    )
  );
  return { bag, reqs };
}

async function runRace(adminId: string) {
  const { bag, reqs } = await setup(adminId, 10);
  const t0 = Date.now();
  const items = await Promise.all(
    reqs.map(async (rq, i) => {
      try {
        await allocateForRequest({ requestId: rq.id, key: randomUUID(), restrictToBagIds: [bag.id] });
        return { n: i + 1, ok: true as const, ms: Date.now() - t0 };
      } catch (e) {
        if (e instanceof AllocError) return { n: i + 1, ok: false as const, code: e.code, reason: e.message, ms: Date.now() - t0 };
        throw e;
      }
    })
  );
  const allocationsForBag = await db.allocation.count({ where: { bagId: bag.id } });
  const success = items.filter((x) => x.ok).length;
  return {
    mode: "race" as const,
    total: items.length,
    success,
    failed: items.length - success,
    allocationsForBag,
    ms: Date.now() - t0,
    items: items.sort((a, b) => a.n - b.n),
  };
}

async function runIdempotency(adminId: string) {
  const { bag, reqs } = await setup(adminId, 1);
  const key = randomUUID();
  // একই key দিয়ে তিনটি অনুরোধ একসঙ্গে, যেন ডাবল ক্লিক বা retry
  const calls = await Promise.all(
    [0, 1, 2].map(async () => {
      try {
        const res = await allocateForRequest({ requestId: reqs[0].id, key, restrictToBagIds: [bag.id] });
        return { ok: true as const, replayed: res.replayed };
      } catch (e) {
        if (e instanceof AllocError) return { ok: false as const, replayed: false, reason: e.message };
        throw e;
      }
    })
  );
  const allocationsForRequest = await db.allocation.count({ where: { requestId: reqs[0].id } });
  return { mode: "idempotency" as const, calls, allocationsForRequest };
}

export async function POST(req: Request) {
  const r = await requireUser(["ADMIN"]);
  if ("error" in r) return r.error;

  let body: { mode?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* খালি body হলে নিচে 400 */
  }
  const mode = body.mode === "race" || body.mode === "idempotency" ? body.mode : null;
  if (!mode) return NextResponse.json({ error: "mode ঠিক নয়" }, { status: 400 });

  try {
    await cleanup();
    const result = mode === "race" ? await runRace(r.user.id) : await runIdempotency(r.user.id);
    await audit({
      actorId: r.user.id,
      action: "RACE_DEMO",
      resource: "BloodBag",
      ip: clientIp(req),
      meta: mode === "race" ? { mode, success: result.mode === "race" ? result.success : 0 } : { mode },
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error("race demo failed", e);
    return NextResponse.json({ error: "ডেমো চালানো যায়নি। আবার চেষ্টা করুন" }, { status: 500 });
  } finally {
    await cleanup().catch(() => {});
  }
}