import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      company?: string | null;
      pressVerified: boolean;
      pressDiscount: number;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    company?: string | null;
    pressVerified: boolean;
    pressDiscount: number;
    password?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    company?: string | null;
    pressVerified: boolean;
    pressDiscount: number;
    isAdmin: boolean;
  }
}
