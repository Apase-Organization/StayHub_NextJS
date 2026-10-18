import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { prisma } from "@/lib/prisma";
import type { Role } from "@/types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  secret:
    process.env.AUTH_SECRET ??
    process.env.APP_SECRET ??
    process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId:
        process.env.AUTH_GOOGLE_ID?.trim() ||
        process.env.GOOGLE_CLIENT_ID?.trim(),
      clientSecret:
        process.env.AUTH_GOOGLE_SECRET?.trim() ||
        process.env.GOOGLE_CLIENT_SECRET?.trim(),
    }),
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash || user.status !== "ACTIVE") return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user?.email) {
        const email = user.email.toLowerCase();
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });
        if (existingUser && existingUser.status === "LOCKED") {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      // Profile updates are persisted by our APIs. Never trust session.update
      // payloads for identity or authorization claims.
      if (trigger === "update" && typeof token.id === "string") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { fullName: true, email: true, avatarUrl: true },
        });
        if (dbUser) {
          token.name = dbUser.fullName;
          token.email = dbUser.email;
          token.image = dbUser.avatarUrl;
        }
      }
      if (account?.provider === "google") {
        const email = (user?.email ?? token.email)?.toLowerCase();
        if (email) {
          const dbUser = await prisma.user.upsert({
            where: { email },
            update: {
              provider: "GOOGLE",
              emailVerified: new Date(),
              ...(user?.image ? { avatarUrl: user.image } : {}),
            },
            create: {
              email,
              fullName: user?.name ?? token.name ?? email,
              provider: "GOOGLE",
              emailVerified: new Date(),
              avatarUrl: user?.image ?? null,
            },
          });
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.image = dbUser.avatarUrl;
        }
      } else if (user) {
        token.id = user.id;
        token.role = user.role ?? token.role;
        token.image = user.image ?? token.image;
      }

      return token;
    },
    session({ session, token }) {
      session.user.id = String(token.id);
      session.user.role = token.role as Role;
      if (typeof token.image === "string" || token.image === null) {
        session.user.image = token.image;
      }
      return session;
    },
  },
});
