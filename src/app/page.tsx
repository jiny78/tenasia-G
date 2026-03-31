import HomeLanding from "@/components/HomeLanding";
import { buildHomeData } from "@/lib/homeData";
import { getAllPhotos } from "@/lib/r2";

export const revalidate = 3600;

function makeInitialSeed(): number {
  const now = new Date();
  return Number(
    `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}${String(now.getUTCHours()).padStart(2, "0")}`,
  );
}

export default async function HomePage() {
  const photos = await getAllPhotos();
  const initialSeed = makeInitialSeed();
  const initialData = buildHomeData(photos, initialSeed);

  return <HomeLanding initialData={initialData} initialSeed={initialSeed} />;
}
