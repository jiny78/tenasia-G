import { NextRequest, NextResponse } from "next/server";
import { getPersons, getDates, getEvents, getAgencies } from "@/lib/r2";

export async function GET(req: NextRequest) {
  const year = req.nextUrl.searchParams.get("year") ?? "";
  try {
    const [persons, dates, events, agencies] = await Promise.all([
      getPersons(),
      getDates(),
      getEvents(year || undefined),
      getAgencies(),
    ]);
    return NextResponse.json(
      { persons, dates, events, agencies },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        },
      }
    );
  } catch (e) {
    console.error("meta error:", e);
    return NextResponse.json({ persons: [], dates: [], events: [], agencies: [] }, { status: 500 });
  }
}
