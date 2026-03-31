import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: { strategy: "jwt" },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: { params: { prompt: "select_account" } },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || !user.password) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!valid) return null;
        return user;
      },
    }),
  ],

  pages: {
    signIn: "/auth/signin",
  },

  callbacks: {
    async signIn({ user }) {
      try {
        const { logActivity } = await import("@/lib/activity-log");
        await logActivity({ userId: user.id, action: "login", detail: user.email ?? undefined });
      } catch {}
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id            = user.id;
        token.company       = (user as { company?: string | null }).company ?? null;
        token.pressVerified = (user as { pressVerified?: boolean }).pressVerified ?? false;
        token.pressDiscount = (user as { pressDiscount?: number }).pressDiscount ?? 0;
        const { isAdmin }   = await import("@/lib/admin");
        token.isAdmin       = isAdmin(user.email);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id            = (token.id as string | undefined) ?? (token.sub as string);
        session.user.company       = token.company as string | null | undefined;
        session.user.pressVerified = (token.pressVerified as boolean | undefined) ?? false;
        session.user.pressDiscount = (token.pressDiscount as number | undefined) ?? 0;
        session.user.isAdmin       = (token.isAdmin as boolean | undefined) ?? false;
      }
      return session;
    },
  },
};
