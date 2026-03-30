import type { Metadata } from "next";
import PolicyLayout from "@/components/policies/PolicyLayout";
import PolicySection from "@/components/policies/PolicySection";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | Tenasia Gallery",
  description:
    "Refund eligibility, credit refund terms, and the request process for Tenasia Gallery purchases.",
};

const TOC = [
  { id: "general",    title: "General Terms" },
  { id: "eligible",   title: "Eligible Refund Scenarios" },
  { id: "ineligible", title: "Non-Refundable Situations" },
  { id: "credits",    title: "Credit Refunds" },
  { id: "process",    title: "Request Process" },
  { id: "upgrade",    title: "License Upgrades" },
  { id: "chargeback", title: "Chargebacks" },
];

export default function RefundPage() {
  return (
    <PolicyLayout title="Refund & Cancellation Policy" tocItems={TOC} currentPath="/policies/refund">
      <PolicySection id="general" title="General Terms">
        <p>
          Tenasia Gallery provides digital goods — specifically, high-resolution photograph
          licenses and download credits. Due to the instantaneous and irreversible nature of
          digital delivery, all sales are considered final upon delivery of the licensed file
          or upon credit redemption.
        </p>
        <p>
          We recognize that exceptional circumstances may warrant a refund. The scenarios
          below describe when a refund may or may not be granted. We evaluate each request
          individually and aim to resolve all matters fairly and promptly.
        </p>
      </PolicySection>

      <PolicySection id="eligible" title="Eligible Refund Scenarios">
        <p>Refunds may be issued in the following circumstances:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Technical Defect:</strong> The delivered file is corrupted, incomplete,
            or materially different from what was described or previewed
          </li>
          <li>
            <strong>Duplicate Purchase:</strong> You were charged more than once for the
            same transaction due to a system error (verified against our transaction records)
          </li>
          <li>
            <strong>Unauthorized Transaction:</strong> The purchase was made without your
            authorization and you report it promptly — please also contact your card issuer
          </li>
          <li>
            <strong>Delivery Failure:</strong> Credits were deducted but the download link
            was never generated and the issue cannot be resolved within a reasonable time
          </li>
        </ul>
        <p className="mt-3">
          Approved refunds are processed to the original payment method and may take up to
          ten (10) business days to appear on your statement.
        </p>
      </PolicySection>

      <PolicySection id="ineligible" title="Non-Refundable Situations">
        <p>Refunds will not be granted in the following situations:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Change of Mind After Download:</strong> You have already downloaded
            the file and simply no longer need it or changed your intended use
          </li>
          <li>
            <strong>Incorrect License Type Selected:</strong> You purchased an Editorial
            license but require a Commercial license. In this case, we can assist with an
            upgrade — see Section 6 for details
          </li>
          <li>
            <strong>Aesthetic Dissatisfaction:</strong> You dislike the photo&apos;s composition,
            lighting, or style. High-resolution previews with watermarks are provided
            before purchase to allow evaluation
          </li>
          <li>
            <strong>Unused Credits Within Non-Refundable Period:</strong> Credits purchased
            more than fourteen (14) days ago that have not been used
          </li>
          <li>
            <strong>Violation of License Terms:</strong> Refunds will not be issued if
            the account is under review for or found to have violated our Copyright &
            Licensing Policy
          </li>
        </ul>
      </PolicySection>

      <PolicySection id="credits" title="Credit Refunds">
        <p>
          Unused download credits are eligible for a refund under the following conditions:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>The refund request is submitted within fourteen (14) days of the credit purchase date</li>
          <li>The credits being refunded have not been redeemed for any downloads</li>
        </ul>
        <p className="mt-3">
          <strong>Partial credit refunds</strong> are available for credit packs where only
          a portion of credits remain unused, provided the conditions above are met. Only
          the unused portion is eligible; credits already redeemed for downloads are
          non-refundable under any circumstances.
        </p>
        <p className="mt-3">
          Credits are non-transferable and may not be converted to cash outside of this
          refund policy. If you have questions about your remaining credit balance, log
          in to your account or contact support.
        </p>
      </PolicySection>

      <PolicySection id="process" title="Request Process">
        <p>To request a refund, follow these steps:</p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            Email{" "}
            <a href="mailto:tenasia.trend@gmail.com" className="underline underline-offset-2">
              tenasia.trend@gmail.com
            </a>{" "}
            within fourteen (14) days of the purchase date
          </li>
          <li>Include your order number, the email address used at checkout, and a clear description of the issue</li>
          <li>
            Attach any supporting evidence (e.g., screenshots of a corrupted file or a
            duplicate charge on your bank statement)
          </li>
        </ol>
        <p className="mt-3">
          Our support team will review your request within five (5) business days and notify
          you of the decision. Approved refunds are processed within ten (10) business days
          to the original payment method.
        </p>
      </PolicySection>

      <PolicySection id="upgrade" title="License Upgrades">
        <p>
          If you purchased an Editorial License but subsequently need a Commercial License
          for the same image, we offer a license upgrade rather than a refund and repurchase:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Contact{" "}
            <a href="mailto:tenasia.trend@gmail.com" className="underline underline-offset-2">
              tenasia.trend@gmail.com
            </a>{" "}
            with your order number and the intended commercial use
          </li>
          <li>
            You will be charged only the difference between the Editorial and Commercial
            license fee for the applicable image
          </li>
          <li>A revised license agreement will be issued for your records</li>
        </ul>
        <p className="mt-3">
          Upgrades from Commercial to Extended License are handled similarly — contact our
          sales team for a custom quote.
        </p>
      </PolicySection>

      <PolicySection id="chargeback" title="Chargebacks">
        <p>
          We strongly encourage you to contact us before initiating a chargeback with your
          bank or card issuer. Most legitimate concerns can be resolved directly and more
          quickly through our support channel.
        </p>
        <p>
          If a chargeback is filed without prior contact with TenAsia:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Your account will be immediately suspended pending investigation</li>
          <li>
            All licenses associated with the disputed transaction will be revoked; any
            continued use of the downloaded images may constitute copyright infringement
          </li>
          <li>
            We reserve the right to provide evidence of the completed transaction and
            agreed terms to the payment processor and card network
          </li>
        </ul>
        <p className="mt-3">
          To resolve a payment concern, contact{" "}
          <a href="mailto:tenasia.trend@gmail.com" className="underline underline-offset-2">
            tenasia.trend@gmail.com
          </a>{" "}
          before contacting your bank.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
