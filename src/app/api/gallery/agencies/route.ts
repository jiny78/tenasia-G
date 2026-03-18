import { NextResponse } from "next/server";
import { getAgencies } from "@/lib/r2";

export async function GET() {
  try {
    const agencies = await getAgencies();
    return NextResponse.json({ agencies });
  } catch (e) {
    console.error("agencies error:", e);
    return NextResponse.json({ agencies: [] }, { status: 500 });
  }
}
