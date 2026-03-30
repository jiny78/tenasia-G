import { Polar } from "@polar-sh/sdk";
import { requireEnv } from "@/lib/env";

export function getPolar() {
  return new Polar({
    accessToken: requireEnv("POLAR_ACCESS_TOKEN"),
    server: "production",
  });
}
