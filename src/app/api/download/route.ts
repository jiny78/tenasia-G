import { NextResponse } from "next/server";

// 다운로드 서비스 준비 중 — 결제 시스템 연동 후 활성화 예정
export async function GET() {
  return NextResponse.json(
    { error: "다운로드 서비스를 준비 중입니다." },
    { status: 503 }
  );
}
