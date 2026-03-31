import HomeLanding from "@/components/HomeLanding";
import { getAllPhotos } from "@/lib/r2";

export const revalidate = 3600;

export default async function HomePage() {
  const photos = await getAllPhotos();

  return <HomeLanding photos={photos} />;
}
