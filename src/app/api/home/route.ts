import { NextRequest, NextResponse } from "next/server";
import { buildHomeData } from "@/lib/homeData";
import { getAllPhotos } from "@/lib/r2";

export async function GET(req: NextRequest) {
  try {
    const seedParam = req.nextUrl.searchParams.get("seed");
    const parsedSeed = Number(seedParam);
    const seed = Number.isFinite(parsedSeed) ? parsedSeed : Date.now();
    const photos = await getAllPhotos();
    const data = buildHomeData(photos, seed);

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    console.error("home data error:", error);
    return NextResponse.json({ error: "Failed to load home data" }, { status: 500 });
  }
}
