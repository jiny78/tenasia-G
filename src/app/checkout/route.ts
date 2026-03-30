import { Checkout } from "@polar-sh/nextjs";
import { requireEnv } from "@/lib/env";

export const GET = Checkout({
  accessToken: requireEnv("POLAR_ACCESS_TOKEN"),
  server: "production",
  successUrl: `${requireEnv("NEXT_PUBLIC_SITE_URL")}/confirmation?checkout_id={CHECKOUT_ID}`,
  includeCheckoutId: false,
});
