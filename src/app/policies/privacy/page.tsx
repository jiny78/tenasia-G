import type { Metadata } from "next";
import PolicyLayout from "@/components/policies/PolicyLayout";
import PolicySection from "@/components/policies/PolicySection";

export const metadata: Metadata = {
  title: "Privacy Policy | Tenasia Gallery",
  description:
    "Learn how The Korea Entertainment Media collects, uses, and protects your personal information on Tenasia Gallery.",
};

const TOC = [
  { id: "introduction", title: "Introduction" },
  { id: "information", title: "Information We Collect" },
  { id: "use", title: "How We Use Your Information" },
  { id: "sharing", title: "Sharing of Information" },
  { id: "transfers", title: "International Data Transfers" },
  { id: "retention", title: "Data Retention" },
  { id: "rights", title: "Your Rights" },
  { id: "cookies", title: "Cookies and Tracking" },
  { id: "children", title: "Children's Privacy" },
  { id: "contact", title: "Contact" },
];

export default function PrivacyPage() {
  return (
    <PolicyLayout title="Privacy Policy" tocItems={TOC} currentPath="/policies/privacy">
      <PolicySection id="introduction" title="Introduction">
        <p>
          The Korea Entertainment Media (&quot;Tenasia,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the
          Tenasia Gallery platform at `tenasia-g.vercel.app` (the &quot;Service&quot;), a professional
          photo licensing service dedicated to K-pop and Korean entertainment photography.
        </p>
        <p>
          This Privacy Policy describes how we collect, use, disclose, and safeguard your
          personal information when you access or use our Service. By using Tenasia Gallery,
          you acknowledge that you have read and understood this Privacy Policy and consent
          to the collection and use of your information as described herein.
        </p>
        <p>
          We may update this Privacy Policy periodically. Continued use of the Service after
          any changes constitutes acceptance of the revised policy.
        </p>
      </PolicySection>

      <PolicySection id="information" title="Information We Collect">
        <p className="font-medium opacity-100">Information You Provide Directly</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Full name and professional title</li>
          <li>Email address and phone number</li>
          <li>Company name, publication name, and billing address</li>
          <li>Payment information processed securely by authorized payment providers such as Polar</li>
          <li>Media credentials and press affiliation for editorial license verification</li>
          <li>Communications you send us via email or support channels</li>
        </ul>

        <p className="font-medium opacity-100 mt-4">Information Collected Automatically</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>IP address, browser type, and operating system</li>
          <li>Pages viewed, search queries, and time spent on the Service</li>
          <li>Download history and license activity</li>
          <li>Device identifiers, referrer URLs, and session timestamps</li>
          <li>Cookies and similar tracking technologies (see Section 8 for details)</li>
        </ul>
      </PolicySection>

      <PolicySection id="use" title="How We Use Your Information">
        <p>We use the information we collect to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Process license purchases and deliver digital content</li>
          <li>Verify identity and media credentials for editorial licensing</li>
          <li>Send order confirmations, download links, and support communications</li>
          <li>Enforce license terms and investigate unauthorized use of our content</li>
          <li>Improve the Service, including personalization and analytics</li>
          <li>Comply with applicable legal obligations and respond to legal process</li>
          <li>Prevent fraud, abuse, and security threats</li>
        </ul>
      </PolicySection>

      <PolicySection id="sharing" title="Sharing of Information">
        <p>
          We do not sell, rent, or trade your personal information to third parties for
          marketing purposes. We may share your information only in the following circumstances:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Payment Processors:</strong> Polar and other authorized payment providers
            receive payment data necessary to complete transactions. Their use is governed by
            their respective privacy policies.
          </li>
          <li>
            <strong>Cloud Infrastructure:</strong> Vercel (hosting) and AWS / Cloudflare R2
            (storage) process data to operate the Service under data processing agreements.
          </li>
          <li>
            <strong>Legal Authorities:</strong> We may disclose information when required by law,
            court order, or to protect the rights and safety of TenAsia, our users, or the public.
          </li>
          <li>
            <strong>Professional Advisors:</strong> Lawyers and auditors under confidentiality
            obligations may access information as necessary.
          </li>
        </ul>
      </PolicySection>

      <PolicySection id="transfers" title="International Data Transfers">
        <p>
          The Korea Entertainment Media is based in Seoul, Republic of Korea. If you access the
          Service from outside Korea, your information may be transferred to and processed in Korea
          or other countries where our service providers operate.
        </p>
        <p>
          For transfers involving personal data from the European Economic Area (EEA) or United
          Kingdom, we rely on Standard Contractual Clauses (SCCs) approved by the European
          Commission to ensure adequate protection of your data.
        </p>
      </PolicySection>

      <PolicySection id="retention" title="Data Retention">
        <p>
          We retain your personal information for as long as your account is active or as needed
          to provide the Service. Upon account closure or upon your request for deletion, we will
          delete or anonymize your data within 30 days, subject to the following exceptions:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Transaction records and license documentation are retained for five (5) years to comply
            with Korean tax law and international accounting standards.
          </li>
          <li>Information subject to a legal hold or ongoing dispute will be retained until resolved.</li>
        </ul>
      </PolicySection>

      <PolicySection id="rights" title="Your Rights">
        <p>
          Depending on your jurisdiction, you may have the following rights regarding your personal
          information:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
          <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
          <li><strong>Erasure:</strong> Request deletion of your data (&quot;right to be forgotten&quot;)</li>
          <li><strong>Restriction:</strong> Request that we limit the processing of your data</li>
          <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
          <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
          <li><strong>Withdrawal of Consent:</strong> Withdraw consent at any time where processing is consent-based</li>
        </ul>
        <p className="mt-3">
          To exercise any of these rights, contact us at{" "}
          <a href="mailto:tenasia.trend@gmail.com" className="underline underline-offset-2">
            tenasia.trend@gmail.com
          </a>
          . We will respond within 30 days of receiving your request.
        </p>
      </PolicySection>

      <PolicySection id="cookies" title="Cookies and Tracking">
        <p>
          We use cookies and similar technologies to maintain session state, remember your language
          and theme preferences, and analyze how the Service is used. Categories include:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Essential Cookies:</strong> Required for the Service to function</li>
          <li><strong>Preference Cookies:</strong> Remember your settings such as language and theme</li>
          <li><strong>Analytics Cookies:</strong> Help us understand usage patterns to improve the Service</li>
        </ul>
        <p className="mt-3">
          You can disable cookies through your browser settings; however, some features of the
          Service may not function correctly without them.
        </p>
      </PolicySection>

      <PolicySection id="children" title="Children's Privacy">
        <p>
          The Service is intended solely for use by individuals who are 18 years of age or older,
          particularly media professionals, journalists, and licensed content purchasers. We do not
          knowingly collect personal information from children under the age of 18.
        </p>
        <p>
          If we become aware that we have inadvertently collected such information, we will delete
          it promptly. If you believe we have collected information from a minor, please contact us at{" "}
          <a href="mailto:tenasia.trend@gmail.com" className="underline underline-offset-2">
            tenasia.trend@gmail.com
          </a>
          .
        </p>
      </PolicySection>

      <PolicySection id="contact" title="Contact">
        <p>
          For privacy-related inquiries, data subject requests, or to report a potential privacy
          concern, please contact our Privacy Officer:
        </p>
        <ul className="list-none space-y-1 mt-2">
          <li>
            <strong>Email:</strong>{" "}
            <a href="mailto:tenasia.trend@gmail.com" className="underline underline-offset-2">
              tenasia.trend@gmail.com
            </a>
          </li>
          <li><strong>Company:</strong> The Korea Entertainment Media</li>
          <li><strong>Address:</strong> Seoul, Republic of Korea</li>
        </ul>
      </PolicySection>
    </PolicyLayout>
  );
}
