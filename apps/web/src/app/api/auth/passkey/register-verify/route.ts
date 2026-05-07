import { auth } from "@/auth";
import { prisma } from "@wanderly/db";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/types";

const RP_ID = process.env.PASSKEY_RP_ID ?? "localhost";
const ORIGIN = process.env.PASSKEY_ORIGIN ?? "https://localhost:3000";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as RegistrationResponseJSON;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { id: true, metadata: true },
  });

  const metadata = user.metadata as Record<string, unknown>;
  const challenge = metadata.passkeyChallenge as string | undefined;
  if (!challenge) {
    return NextResponse.json({ error: "No challenge found" }, { status: 400 });
  }

  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge: challenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    requireUserVerification: true,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  const { credential } = verification.registrationInfo;

  await prisma.passkey.create({
    data: {
      userId: user.id,
      credentialId: Buffer.from(credential.id, "base64url"),
      publicKey: Buffer.from(credential.publicKey),
      counter: BigInt(credential.counter),
      deviceType: verification.registrationInfo.credentialDeviceType,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { metadata: { passkeyChallenge: null } } as never,
  });

  return NextResponse.json({ verified: true });
}
