import { NextResponse } from "next/server";
import { getPersons } from "@/lib/r2";

export async function GET() {
  try {
    const persons = await getPersons();
    return NextResponse.json({ persons });
  } catch (e) {
    console.error("persons error:", e);
    return NextResponse.json({ persons: [] }, { status: 500 });
  }
}
