import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Legacy Stripe checkout has been retired. Use /checkout for Polar checkout." },
    { status: 410 },
  );
}
