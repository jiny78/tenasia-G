import { NextRequest, NextResponse } from "next/server";
import { getFilteredPhotos } from "@/lib/r2";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  try {
    const result = await getFilteredPhotos({
      person:      p.get("person")      ?? undefined,
      event:       p.get("event")       ?? undefined,
      role:        p.get("role")        ?? undefined, // backward compat
      year:        p.get("year")        ?? undefined,
      keyword:     p.get("q")          ?? undefined,
      dateFrom:    p.get("dateFrom")    ?? undefined,
      dateTo:      p.get("dateTo")      ?? undefined,
      orientation: p.get("orientation") ?? undefined,
      agency:      p.get("agency")      ?? undefined,
      page:        parseInt(p.get("page")  ?? "1"),
      limit:       parseInt(p.get("limit") ?? "60"),
    });
    return NextResponse.json(result);
  } catch (e) {
    console.error("gallery error:", e);
    return NextResponse.json({ photos: [], total: 0 }, { status: 500 });
  }
}
