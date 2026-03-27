import { Checkout } from "@polar-sh/nextjs";

export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN ?? "",
  server: "production",
  successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/confirmation?checkout_id={CHECKOUT_ID}`,
  includeCheckoutId: false,
});
