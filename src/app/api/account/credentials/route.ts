import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT ?? "",
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID     ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

// GET /api/account/credentials — 상태 조회
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cred = await prisma.mediaCredential.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({ credential: cred ?? null });
}

// POST /api/account/credentials — 파일 업로드 (multipart/form-data)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData  = await req.formData();
    const file      = formData.get("file") as File | null;
    const type      = formData.get("type") as string | null;

    if (!file || !type) {
      return NextResponse.json({ error: "file and type required" }, { status: 400 });
    }

    const ext      = file.name.split(".").pop() ?? "bin";
    const key      = `credentials/${session.user.id}/${Date.now()}.${ext}`;
    const buffer   = Buffer.from(await file.arrayBuffer());

    await s3.send(new PutObjectCommand({
      Bucket:      process.env.R2_BUCKET ?? "",
      Key:         key,
      Body:        buffer,
      ContentType: file.type || "application/octet-stream",
    }));

    const fileUrl = `${process.env.R2_BASE}/${key}`;

    const cred = await prisma.mediaCredential.upsert({
      where:  { userId: session.user.id },
      create: { userId: session.user.id, type, fileUrl, status: "pending" },
      update: { type, fileUrl, status: "pending", reviewNote: null, reviewedAt: null },
    });

    return NextResponse.json({ credential: cred });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
