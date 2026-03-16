import { NextResponse } from "next/server";
import { getDates } from "@/lib/r2";

export async function GET() {
  try {
    const dates = await getDates();
    return NextResponse.json({ dates });
  } catch (e) {
    console.error("dates error:", e);
    return NextResponse.json({ dates: [] }, { status: 500 });
  }
}
