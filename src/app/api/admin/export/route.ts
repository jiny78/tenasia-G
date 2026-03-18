import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "../_check";

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape  = (v: unknown) => {
    const s = v == null ? "" : String(v).replace(/"/g, '""');
    return /[,"\n]/.test(s) ? `"${s}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

export async function GET(req: NextRequest) {
  const auth = await checkAdmin();
  if (!auth.ok) return auth.res;

  const sp     = req.nextUrl.searchParams;
  const type   = sp.get("type")   ?? "users";
  const format = sp.get("format") ?? "csv";
  const from   = sp.get("from")   ? new Date(sp.get("from")!) : undefined;
  const to     = sp.get("to")     ? new Date(sp.get("to")!)   : undefined;
  const dateFilter = (from || to) ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {};

  let rows: Record<string, unknown>[] = [];

  if (type === "users") {
    const data = await prisma.user.findMany({
      where: from || to ? { createdAt: dateFilter.createdAt } : {},
      select: { id: true, name: true, email: true, company: true, country: true, pressVerified: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    rows = data.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));
  } else if (type === "purchases") {
    const data = await prisma.purchase.findMany({
      where: dateFilter, orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true } } },
    });
    rows = data.map((p) => ({ id: p.id, email: p.user.email, amount: p.amount, credits: p.creditsAdded, status: p.status, stripeId: p.stripeSessionId, createdAt: p.createdAt.toISOString() }));
  } else if (type === "downloads") {
    const data = await prisma.download.findMany({
      where: dateFilter, orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true } } },
    });
    rows = data.map((d) => ({ id: d.id, email: d.user.email, photoId: d.photoId, licenseType: d.licenseType, creditsUsed: d.creditsUsed, createdAt: d.createdAt.toISOString() }));
  } else if (type === "pageviews") {
    const data = await prisma.pageView.findMany({
      where: dateFilter, orderBy: { createdAt: "desc" }, take: 50000,
    });
    rows = data.map((v) => ({ ...v, createdAt: v.createdAt.toISOString() }));
  } else if (type === "activity") {
    const data = await prisma.activityLog.findMany({
      where: dateFilter, orderBy: { createdAt: "desc" }, take: 50000,
    });
    rows = data.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }));
  }

  const filename = `tenasia-${type}-${new Date().toISOString().slice(0, 10)}`;

  if (format === "json") {
    return new NextResponse(JSON.stringify(rows, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}.json"`,
      },
    });
  }

  return new NextResponse(toCSV(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}
