import { getAllPhotos } from "@/lib/r2";
import agencyData from "@/data/artist-agency.json";

export default async function ContentPage() {
  const photos = await getAllPhotos();
  const total  = photos.length;

  const recent = photos.filter((p) => p.date).slice(0, 20);

  const personMap = new Map<string, number>();
  for (const p of photos) {
    if (!p.person) continue;
    for (const name of p.person.split(",").map((s) => s.trim())) {
      if (name) personMap.set(name, (personMap.get(name) ?? 0) + 1);
    }
  }

  const artists = agencyData.artists as Record<string, { group: string | null; agency: string }>;
  const unmapped: { name: string; count: number }[] = [];
  let mapped = 0;
  for (const [name, count] of personMap) {
    if (artists[name]) mapped++;
    else if (count >= 10) unmapped.push({ name, count });
  }
  unmapped.sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">콘텐츠 관리</h1>

      {/* R2 현황 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          ["총 사진 수", total.toLocaleString() + "장", "text-blue-400"],
          ["매핑된 아티스트", mapped + "명", "text-green-400"],
          ["미매핑 (10장↑)", unmapped.length + "명", "text-yellow-400"],
        ].map(([t, v, c]) => (
          <div key={String(t)} className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500 mb-1">{t}</p>
            <p className={`text-2xl font-bold ${c}`}>{v}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 최근 업로드 */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5">
          <h2 className="text-sm font-medium text-zinc-400 mb-3">최근 업로드</h2>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {recent.map((p) => (
              <div key={p.id} className="text-xs flex gap-2">
                <span className="text-zinc-600 shrink-0">{p.date?.slice(0, 10)}</span>
                <span className="text-zinc-400 truncate">{p.person ?? "—"}</span>
                <span className="text-zinc-600 truncate">{p.role ?? "—"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 소속사 미매핑 아티스트 */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-5">
          <h2 className="text-sm font-medium text-zinc-400 mb-2">소속사 미매핑 아티스트 (10장↑)</h2>
          <p className="text-xs text-zinc-600 mb-3">
            아래 아티스트를 <code className="bg-zinc-800 px-1 rounded">src/data/artist-agency.json</code>에 추가하세요.
          </p>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {unmapped.slice(0, 30).map((u) => (
              <div key={u.name} className="flex justify-between text-xs">
                <span className="text-zinc-300">{u.name}</span>
                <span className="text-zinc-600">{u.count}장</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
