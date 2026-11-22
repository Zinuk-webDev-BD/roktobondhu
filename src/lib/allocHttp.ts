import { NextResponse } from "next/server";
import { AllocError } from "./allocation";

const httpStatus = { NOT_FOUND: 404, BAD_STATE: 409, CONFLICT: 409, EXPIRED: 409, INSUFFICIENT: 409 } as const;

export function allocErrorResponse(e: unknown) {
  if (!(e instanceof AllocError)) return null;
  return NextResponse.json({ error: e.message, code: e.code, ...(e.extra ?? {}) }, { status: httpStatus[e.code] });
}