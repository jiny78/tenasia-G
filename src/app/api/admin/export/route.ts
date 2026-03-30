import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "../_check";

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const stringValue = value == null ? "" : String(value).replace(/"/g, '""');
    return /[,"\n]/.test(stringValue) ? `"${stringValue}"` : stringValue;
  };
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}

function isTrustedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  return origin === req.nextUrl.origin;
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST(req: NextRequest) {
  const auth = await checkAdmin();
  if (!auth.ok) return auth.res;

  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { type = "users", format = "csv", from, to } = await req.json();
  const fromDate = typeof from === "string" && from ? new Date(from) : undefined;
  const toDate = typeof to === "string" && to ? new Date(to) : undefined;
  const dateFilter = (fromDate || toDate)
    ? { createdAt: { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) } }
    : {};

  let rows: Record<string, unknown>[] = [];

  if (type === "users") {
    const data = await prisma.user.findMany({
      where: fromDate || toDate ? { createdAt: dateFilter.createdAt } : {},
      select: { id: true, name: true, email: true, company: true, country: true, pressVerified: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    rows = data.map((user) => ({ ...user, createdAt: user.createdAt.toISOString() }));
  } else if (type === "purchases") {
    const data = await prisma.purchase.findMany({
      where: dateFilter,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true } } },
    });
    rows = data.map((purchase) => ({
      id: purchase.id,
      email: purchase.user.email,
      amount: purchase.amount,
      credits: purchase.creditsAdded,
      status: purchase.status,
      stripeId: purchase.stripeSessionId,
      createdAt: purchase.createdAt.toISOString(),
    }));
  } else if (type === "downloads") {
    const data = await prisma.download.findMany({
      where: dateFilter,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { email: true } } },
    });
    rows = data.map((download) => ({
      id: download.id,
      email: download.user.email,
      photoId: download.photoId,
      licenseType: download.licenseType,
      creditsUsed: download.creditsUsed,
      createdAt: download.createdAt.toISOString(),
    }));
  } else if (type === "pageviews") {
    const data = await prisma.pageView.findMany({
      where: dateFilter,
      orderBy: { createdAt: "desc" },
      take: 50000,
    });
    rows = data.map((view) => ({ ...view, createdAt: view.createdAt.toISOString() }));
  } else if (type === "activity") {
    const data = await prisma.activityLog.findMany({
      where: dateFilter,
      orderBy: { createdAt: "desc" },
      take: 50000,
    });
    rows = data.map((activity) => ({ ...activity, createdAt: activity.createdAt.toISOString() }));
  } else {
    return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
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

  if (format !== "csv") {
    return NextResponse.json({ error: "Invalid export format" }, { status: 400 });
  }

  return new NextResponse(toCSV(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}
