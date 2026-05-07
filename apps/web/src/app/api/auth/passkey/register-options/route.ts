import { auth } from "@/auth";
import { prisma } from "@wanderly/db";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { NextResponse } from "next/server";

const RP_NAME = "Wanderly";
const RP_ID = process.env.PASSKEY_RP_ID ?? "localhost";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    include: { passkeys: true },
  });

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: user.email,
    userDisplayName: user.name ?? user.email,
    excludeCredentials: user.passkeys.map((p) => ({
      id: p.credentialId,
      transports: [],
    })),
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { metadata: { passkeyChallenge: options.challenge } } as never,
  });

  return NextResponse.json(options);
}
