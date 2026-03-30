import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Legacy Stripe session verification has been retired." },
    { status: 410 },
  );
}
