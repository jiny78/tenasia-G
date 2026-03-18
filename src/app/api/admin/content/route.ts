import { NextResponse } from "next/server";
import { checkAdmin } from "../_check";
import { getAllPhotos } from "@/lib/r2";
import agencyData from "@/data/artist-agency.json";

export async function GET() {
  const auth = await checkAdmin();
  if (!auth.ok) return auth.res;

  const photos = await getAllPhotos();
  const total  = photos.length;

  // 최근 업로드 (날짜 있는 항목 최신 20)
  const recent = photos.filter((p) => p.date).slice(0, 20).map((p) => ({
    id: p.id, person: p.person, role: p.role, date: p.date,
  }));

  // 아티스트-소속사 매핑 현황
  const personMap = new Map<string, number>();
  for (const p of photos) {
    if (!p.person) continue;
    for (const name of p.person.split(",").map((s) => s.trim())) {
      if (name) personMap.set(name, (personMap.get(name) ?? 0) + 1);
    }
  }

  const artists = agencyData.artists as Record<string, { group: string | null; agency: string }>;
  const mapped: string[] = [];
  const unmapped: { name: string; count: number }[] = [];

  for (const [name, count] of personMap) {
    if (artists[name]) mapped.push(name);
    else if (count >= 10) unmapped.push({ name, count });
  }
  unmapped.sort((a, b) => b.count - a.count);

  return NextResponse.json({
    total,
    mappedCount: mapped.length,
    unmappedTop: unmapped.slice(0, 30),
    recent,
    artistMappings: Object.entries(artists).map(([name, info]) => ({ name, ...info })),
  });
}
