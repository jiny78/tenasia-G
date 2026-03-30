import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AccountSidebar from "@/components/AccountSidebar";

export const metadata = { title: "Account — Tenasia Gallery" };

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin?callbackUrl=/account");

  return (
    <div className="min-h-screen bg-[#111] text-white">
      {/* 상단 바 */}
      <header className="sticky top-0 z-30 bg-[#111]/95 backdrop-blur border-b border-white/8">
        <div className="max-w-screen-lg mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-baseline gap-2 hover:opacity-80 transition-opacity">
            <span className="text-sm font-bold tracking-[0.15em] uppercase">Tenasia</span>
            <span className="text-white/30 text-[10px] tracking-[0.4em] uppercase">Gallery</span>
          </Link>
          <span className="text-white/40 text-xs truncate max-w-[200px]">
            {session.user?.email}
          </span>
        </div>
      </header>

      <div className="max-w-screen-lg mx-auto px-6 py-8">
        <div className="flex gap-8">
          <AccountSidebar />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
