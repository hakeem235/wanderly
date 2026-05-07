import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "@wanderly/db";
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },
  providers: [
    Nodemailer({
      server: process.env.EMAIL_SERVER ?? "console://",
      from: process.env.EMAIL_FROM ?? "Wanderly <noreply@wanderly.co>",
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        // Log to console in dev; swap for Resend in production
        if (process.env.NODE_ENV !== "production") {
          console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log("✉  Magic Link for:", identifier);
          console.log("🔗 ", url);
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
          return;
        }
        // Production: use Resend (wired in Phase 3)
        throw new Error("Production email not configured yet");
      },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
