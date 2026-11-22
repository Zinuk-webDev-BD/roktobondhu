import { db } from "./db";
import type { Prisma } from "@prisma/client";

type AuditInput = {
  actorId?: string | null;
  action: string;
  resource?: string;
  resourceId?: string;
  success?: boolean;
  ip?: string | null;
  meta?: Prisma.InputJsonValue;
};

/** অডিট লগ ব্যর্থ হলেও মূল কাজ যেন না থামে */
export async function audit(e: AuditInput) {
  try {
    await db.auditLog.create({
      data: {
        actorId: e.actorId ?? null,
        action: e.action,
        resource: e.resource,
        resourceId: e.resourceId,
        success: e.success ?? true,
        ip: e.ip ?? null,
        meta: e.meta,
      },
    });
  } catch (err) {
    console.error("audit log failed", err);
  }
}