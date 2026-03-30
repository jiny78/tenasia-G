import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { checkAdmin } from "@/app/api/admin/_check";
import { requireEnv } from "@/lib/env";

const s3 = new S3Client({
  region: "auto",
  endpoint: requireEnv("R2_ENDPOINT"),
  credentials: {
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
  },
});
const BUCKET = requireEnv("R2_BUCKET");
const THUMB_WIDTH = 480;

async function countKeys(prefix: string): Promise<number> {
  let count = 0;
  let token: string | undefined;
  do {
    const r = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      ContinuationToken: token,
      MaxKeys: 1000,
    }));
    count += (r.Contents ?? []).filter((o) => /\.(jpg|jpeg|png|webp)$/i.test(o.Key ?? "")).length;
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return count;
}

export async function GET() {
  const auth = await checkAdmin();
  if (!auth.ok) return auth.res;

  const [photos, thumbs] = await Promise.all([
    countKeys("photos/"),
    countKeys(`thumbs/${THUMB_WIDTH}/photos/`),
  ]);

  return NextResponse.json({ photos, thumbs, missing: photos - thumbs });
}
