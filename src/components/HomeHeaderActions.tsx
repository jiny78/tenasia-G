"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

interface Props {
  className?: string;
}

export default function HomeHeaderActions({ className = "" }: Props) {
  const { data: session } = useSession();

  return (
    <Link
      href={session?.user ? "/account" : "/auth/signin"}
      className={className || "rounded-full border border-white/12 px-3 py-1.5 text-xs font-medium text-white/75 hover:border-white/30 hover:text-white"}
    >
      {session?.user ? "Account" : "Sign In"}
    </Link>
  );
}
