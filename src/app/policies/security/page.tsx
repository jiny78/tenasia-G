import type { Metadata } from "next";
import PolicyLayout from "@/components/policies/PolicyLayout";
import PolicySection from "@/components/policies/PolicySection";

export const metadata: Metadata = {
  title: "Security Policy | Tenasia Gallery",
  description:
    "Technical and organizational security measures protecting user data and content on Tenasia Gallery.",
};

const TOC = [
  { id: "commitment",     title: "Our Commitment" },
  { id: "technical",      title: "Technical Safeguards" },
  { id: "organizational", title: "Organizational Safeguards" },
  { id: "content",        title: "Content Protection" },
  { id: "incident",       title: "Incident Response" },
  { id: "reporting",      title: "Reporting a Security Vulnerability" },
];

export default function SecurityPage() {
  return (
    <PolicyLayout title="Security Policy" tocItems={TOC} currentPath="/policies/security">
      <PolicySection id="commitment" title="Our Commitment">
        <p>
          TenAsia Media Corp. is committed to maintaining the security of our platform,
          protecting the personal information of our users, and safeguarding the intellectual
          property of our photographers. Our security program is built on three core principles:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Confidentiality:</strong> Ensuring that information is accessible only
            to authorized individuals
          </li>
          <li>
            <strong>Integrity:</strong> Protecting information from unauthorized modification
            or destruction
          </li>
          <li>
            <strong>Availability:</strong> Ensuring reliable access to the Service for
            legitimate users
          </li>
        </ul>
      </PolicySection>

      <PolicySection id="technical" title="Technical Safeguards">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Encryption in Transit:</strong> All data exchanged between your browser
            and our servers is encrypted using TLS 1.2 or higher (HTTPS)
          </li>
          <li>
            <strong>Encryption at Rest:</strong> Sensitive stored data is protected with
            AES-256 encryption
          </li>
          <li>
            <strong>Payment Security:</strong> Payment processing is handled exclusively
            by Stripe (PCI DSS Level 1 certified); TenAsia does not store card numbers
            or sensitive authentication data
          </li>
          <li>
            <strong>Access Controls:</strong> Role-based access controls and the principle
            of least privilege restrict internal access to production systems and user data
          </li>
          <li>
            <strong>Vulnerability Management:</strong> Regular security assessments and
            dependency audits are conducted to identify and remediate vulnerabilities
          </li>
          <li>
            <strong>Multi-Factor Authentication:</strong> MFA is required for all internal
            administrative access to production systems
          </li>
          <li>
            <strong>Secure Storage:</strong> Image files are stored on Cloudflare R2 with
            server-side proxy access; direct bucket URLs are never exposed to end users
          </li>
        </ul>
      </PolicySection>

      <PolicySection id="organizational" title="Organizational Safeguards">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Least Privilege:</strong> Employees and contractors are granted only
            the minimum level of access required to perform their duties
          </li>
          <li>
            <strong>Security Training:</strong> Team members receive regular security
            awareness training covering phishing, social engineering, and data handling
          </li>
          <li>
            <strong>Vendor Assessment:</strong> Third-party service providers are evaluated
            for security compliance before integration; data processing agreements (DPAs)
            are executed where required
          </li>
          <li>
            <strong>Incident Response Plan:</strong> A formal incident response plan is
            maintained and tested periodically to ensure rapid containment and recovery
          </li>
        </ul>
      </PolicySection>

      <PolicySection id="content" title="Content Protection">
        <p>
          We employ multiple layers of technical protection to prevent unauthorized
          reproduction and distribution of our photography:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Visible Watermark:</strong> Preview images displayed in the gallery
            carry a "TENASIA" watermark; watermark-free originals are only available to
            verified purchasers
          </li>
          <li>
            <strong>Metadata Embedding:</strong> All images contain EXIF and IPTC copyright
            metadata identifying TenAsia Media Corp. as the rights holder
          </li>
          <li>
            <strong>Forensic Tracking:</strong> Downloaded originals may contain imperceptible
            forensic watermarks to trace the source of unauthorized distribution
          </li>
          <li>
            <strong>Server-Side Proxying:</strong> High-resolution files are served via
            authenticated server-side proxy routes; R2 storage URLs are never disclosed
            to the client
          </li>
          <li>
            <strong>Browser Protections:</strong> Right-click context menus, drag-and-drop
            image saving, and keyboard shortcuts (Ctrl+S, Ctrl+U) are disabled on gallery
            preview images
          </li>
          <li>
            <strong>Automated Monitoring:</strong> We use automated services to scan
            the web for unauthorized use of our imagery
          </li>
        </ul>
      </PolicySection>

      <PolicySection id="incident" title="Incident Response">
        <p>
          In the event of a security incident that affects the confidentiality or integrity
          of personal data, TenAsia will:
        </p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Contain the incident and assess its scope as quickly as possible</li>
          <li>
            Notify affected users and, where required, supervisory authorities within
            seventy-two (72) hours of becoming aware of the breach, in accordance with
            Korea's Personal Information Protection Act (PIPA) and the EU General Data
            Protection Regulation (GDPR)
          </li>
          <li>Investigate the root cause and implement corrective measures</li>
          <li>Provide ongoing updates to affected parties as the investigation progresses</li>
        </ol>
      </PolicySection>

      <PolicySection id="reporting" title="Reporting a Security Vulnerability">
        <p>
          We welcome responsible disclosure of security vulnerabilities. If you discover
          a potential security issue in our platform, please report it to us before
          disclosing it publicly so we can investigate and address it promptly.
        </p>
        <p>
          Please include a clear description of the vulnerability, steps to reproduce,
          and the potential impact. We will acknowledge your report within 48 hours and
          keep you informed of our progress.
        </p>
        <p>
          Security reports:{" "}
          <a href="mailto:security@tenasia.co.kr" className="underline underline-offset-2">
            security@tenasia.co.kr
          </a>
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
