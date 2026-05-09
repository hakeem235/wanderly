/**
 * POST /api/invite/redeem
 *
 * Called after Clerk sign-up to validate an invite code.
 * Marks the code as used and attaches it to the user's Clerk metadata.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { connectDB, InviteCode } from "@wanderly/db";

const Body = z.object({
  code: z.string().min(1).max(32).toUpperCase(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await connectDB();

  const invite = await (InviteCode as any).findOne({ code: body.code, usedBy: null });
  if (!invite) {
    return NextResponse.json(
      { error: "Invalid or already-used invite code." },
      { status: 404 }
    );
  }

  invite.usedBy = userId;
  invite.usedAt = new Date();
  await invite.save();

  return NextResponse.json({ ok: true, code: invite.code });
}
