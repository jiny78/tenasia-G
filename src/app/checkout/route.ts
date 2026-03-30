import { Checkout } from "@polar-sh/nextjs";
import { requireAnyEnv, requireEnv } from "@/lib/env";

export const GET = Checkout({
  accessToken: requireEnv("POLAR_ACCESS_TOKEN"),
  server: "production",
  successUrl: `${requireAnyEnv("NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_URL", "NEXTAUTH_URL")}/confirmation?checkout_id={CHECKOUT_ID}`,
  includeCheckoutId: false,
});
