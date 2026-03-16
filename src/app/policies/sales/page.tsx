import type { Metadata } from "next";
import PolicyLayout from "@/components/policies/PolicyLayout";
import PolicySection from "@/components/policies/PolicySection";

export const metadata: Metadata = {
  title: "Sales & Licensing Terms | Tenasia Gallery",
  description:
    "Purchasing process, pricing, payment methods, credit system, and license delivery terms for Tenasia Gallery.",
};

const TOC = [
  { id: "process",   title: "Purchasing Process" },
  { id: "pricing",   title: "Pricing" },
  { id: "payment",   title: "Payment Methods" },
  { id: "credits",   title: "Credit System" },
  { id: "delivery",  title: "License Delivery" },
  { id: "bulk",      title: "Bulk and Enterprise Licensing" },
  { id: "taxes",     title: "Taxes" },
  { id: "invoice",   title: "Invoice and Records" },
];

export default function SalesPage() {
  return (
    <PolicyLayout title="Sales & Licensing Terms" tocItems={TOC} currentPath="/policies/sales">
      <PolicySection id="process" title="Purchasing Process">
        <p>Acquiring a license through Tenasia Gallery follows these steps:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Browse the gallery and identify the photograph(s) you wish to license</li>
          <li>Select the appropriate license type (Editorial, Commercial, or Extended) in the download panel</li>
          <li>Purchase a download credit pack via our secure checkout</li>
          <li>
            Receive an order confirmation and download access via email; high-resolution
            files are also available immediately from your account
          </li>
        </ol>
        <p className="mt-3">
          By completing a purchase, you agree to these Sales Terms and the applicable license
          agreement. Each license is issued per image per intended use; a new license is
          required for each substantially different use.
        </p>
      </PolicySection>

      <PolicySection id="pricing" title="Pricing">
        <p>
          License fees vary based on the following factors:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>License type (Editorial, Commercial, or Extended)</li>
          <li>Image resolution and file format selected</li>
          <li>Intended use, distribution scope, and geographic territory</li>
          <li>Print run size or digital impression volume (for commercial licenses)</li>
        </ul>
        <p className="mt-3">
          All prices are displayed in United States Dollars (USD). TenAsia reserves the right
          to change pricing at any time without prior notice. Price changes do not affect
          purchases already completed.
        </p>
      </PolicySection>

      <PolicySection id="payment" title="Payment Methods">
        <p>We accept the following payment methods:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Credit / Debit Cards:</strong> Visa, Mastercard, American Express,
            and other major cards via Stripe
          </li>
          <li><strong>Digital Wallets:</strong> Apple Pay, Google Pay</li>
          <li>
            <strong>Bank Transfer:</strong> Available for bulk or enterprise orders
            exceeding a minimum threshold; contact{" "}
            <a href="mailto:sales@tenasia.co.kr" className="underline underline-offset-2">
              sales@tenasia.co.kr
            </a>
          </li>
        </ul>
        <p className="mt-3">
          Payment processing is handled by Stripe, a PCI DSS Level 1 certified payment
          processor. Tenasia Gallery does not store, transmit, or have access to your full
          card number. All transactions are encrypted via TLS.
        </p>
      </PolicySection>

      <PolicySection id="credits" title="Credit System">
        <p>
          Tenasia Gallery operates on a prepaid download credit system:
        </p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            Purchase a credit pack — credits are added to your account immediately upon
            successful payment confirmation via Stripe
          </li>
          <li>
            Use credits to download photos — each image download deducts the designated
            number of credits based on resolution and license type
          </li>
          <li>
            Monitor your balance — your remaining credit balance is displayed in the site
            header and on your account page
          </li>
        </ol>
        <p className="mt-3">
          Credits are non-transferable and may not be exchanged for cash except as described
          in the Refund Policy. Credits do not expire for active accounts.
        </p>
      </PolicySection>

      <PolicySection id="delivery" title="License Delivery">
        <p>
          Upon successful credit redemption for a download, the licensed image is delivered
          digitally in the following manner:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            An order confirmation email is sent to the address on file, containing a secure
            download link
          </li>
          <li>
            The high-resolution, watermark-free original file is available for download
            directly from your account page
          </li>
          <li>
            Download links remain active for ninety (90) days from the date of purchase;
            we recommend saving your files promptly
          </li>
        </ul>
        <p className="mt-3">
          If you experience difficulty accessing your download, contact{" "}
          <a href="mailto:support@tenasia.co.kr" className="underline underline-offset-2">
            support@tenasia.co.kr
          </a>{" "}
          within 90 days of purchase.
        </p>
      </PolicySection>

      <PolicySection id="bulk" title="Bulk and Enterprise Licensing">
        <p>
          Organizations requiring high-volume licenses, subscription access, or custom
          licensing arrangements are invited to contact our enterprise sales team for
          a tailored proposal. Enterprise agreements may include:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Volume discounts on credit packs</li>
          <li>Dedicated account management</li>
          <li>Custom license terms for specific territories or use cases</li>
          <li>Invoice-based payment and NET-30 terms for verified media organizations</li>
        </ul>
        <p className="mt-3">
          Contact:{" "}
          <a href="mailto:sales@tenasia.co.kr" className="underline underline-offset-2">
            sales@tenasia.co.kr
          </a>
        </p>
      </PolicySection>

      <PolicySection id="taxes" title="Taxes">
        <p>
          Listed prices do not include applicable sales tax, VAT, GST, or other taxes.
          Tax obligations vary by jurisdiction and are the sole responsibility of the
          purchaser. Where required by law, TenAsia may collect and remit applicable taxes
          on your behalf, which will be reflected at checkout.
        </p>
      </PolicySection>

      <PolicySection id="invoice" title="Invoice and Records">
        <p>
          A digital invoice is automatically generated and sent to your registered email
          address upon each completed transaction. Invoices are also accessible through
          your account page for your records.
        </p>
        <p>
          If you require a modified invoice format for your organization's accounting
          requirements, contact{" "}
          <a href="mailto:support@tenasia.co.kr" className="underline underline-offset-2">
            support@tenasia.co.kr
          </a>
          .
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
