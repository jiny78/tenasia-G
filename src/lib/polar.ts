import { Polar } from "@polar-sh/sdk";
import { requireEnv } from "@/lib/env";

const polar = new Polar({
  accessToken: requireEnv("POLAR_ACCESS_TOKEN"),
  server: "production",
});

export default polar;
