import { NextRequest, NextResponse } from "next/server";
import { getEvents } from "@/lib/r2";

export async function GET(req: NextRequest) {
  const year = req.nextUrl.searchParams.get("year") ?? undefined;
  try {
    const events = await getEvents(year);
    return NextResponse.json({ events });
  } catch (e) {
    console.error("events error:", e);
    return NextResponse.json({ events: [] }, { status: 500 });
  }
}
