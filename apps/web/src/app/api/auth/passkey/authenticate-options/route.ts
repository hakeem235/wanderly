import { prisma } from "@wanderly/db";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { NextResponse } from "next/server";

const RP_ID = process.env.PASSKEY_RP_ID ?? "localhost";

export async function POST(req: Request) {
  const { email } = (await req.json()) as { email?: string };

  let allowCredentials: { id: Buffer }[] = [];

  if (email) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { passkeys: true },
    });
    if (user) {
      allowCredentials = user.passkeys.map((p) => ({ id: p.credentialId }));
    }
  }

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: "required",
    allowCredentials,
  });

  return NextResponse.json({ ...options, _challenge: options.challenge });
}
