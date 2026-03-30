import type { Metadata } from "next";
import PolicyLayout from "@/components/policies/PolicyLayout";
import PolicySection from "@/components/policies/PolicySection";

export const metadata: Metadata = {
  title: "Security Policy | Tenasia Gallery",
  description:
    "Technical and organizational security measures protecting user data and content on Tenasia Gallery.",
};

const TOC = [
  { id: "commitment", title: "Our Commitment" },
  { id: "technical", title: "Technical Safeguards" },
  { id: "organizational", title: "Organizational Safeguards" },
  { id: "content", title: "Content Protection" },
  { id: "incident", title: "Incident Response" },
  { id: "reporting", title: "Reporting a Security Vulnerability" },
];

export default function SecurityPage() {
  return (
    <PolicyLayout title="Security Policy" tocItems={TOC} currentPath="/policies/security">
      <PolicySection id="commitment" title="Our Commitment">
        <p>
          The Korea Entertainment Media is committed to maintaining the security of our
          platform, protecting the personal information of our users, and safeguarding the
          intellectual property of our photographers.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Confidentiality:</strong> Information is accessible only to authorized individuals</li>
          <li><strong>Integrity:</strong> Information is protected from unauthorized modification or destruction</li>
          <li><strong>Availability:</strong> Legitimate users can access the Service reliably</li>
        </ul>
      </PolicySection>

      <PolicySection id="technical" title="Technical Safeguards">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Encryption in Transit:</strong> All browser-to-server traffic uses TLS 1.2 or higher</li>
          <li><strong>Encryption at Rest:</strong> Sensitive stored data is protected with strong encryption controls</li>
          <li><strong>Payment Security:</strong> Payment processing is handled by Polar and other authorized processors; TenAsia does not store card numbers or sensitive authentication data</li>
          <li><strong>Access Controls:</strong> Role-based access and least-privilege rules restrict production access</li>
          <li><strong>Vulnerability Management:</strong> Regular assessments and dependency audits are performed</li>
          <li><strong>Multi-Factor Authentication:</strong> MFA is required for internal administrative access</li>
          <li><strong>Secure Storage:</strong> Image files are stored on Cloudflare R2 behind server-side proxy access</li>
        </ul>
      </PolicySection>

      <PolicySection id="organizational" title="Organizational Safeguards">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Least Privilege:</strong> Team members receive only the access required for their work</li>
          <li><strong>Security Training:</strong> Personnel receive recurring training on phishing, social engineering, and data handling</li>
          <li><strong>Vendor Assessment:</strong> Service providers are evaluated for security fit before integration</li>
          <li><strong>Incident Response Plan:</strong> A formal response process is maintained and tested periodically</li>
        </ul>
      </PolicySection>

      <PolicySection id="content" title="Content Protection">
        <p>
          We employ multiple layers of technical protection to prevent unauthorized reproduction
          and distribution of our photography:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Visible Watermark:</strong> Preview images carry a &quot;TENASIA&quot; watermark</li>
          <li><strong>Metadata Embedding:</strong> Images contain EXIF and IPTC copyright metadata</li>
          <li><strong>Forensic Tracking:</strong> Downloaded originals may include forensic markers</li>
          <li><strong>Server-Side Proxying:</strong> High-resolution files are served through authenticated server routes</li>
          <li><strong>Browser Protections:</strong> Common save shortcuts and right-click actions are restricted on previews</li>
          <li><strong>Automated Monitoring:</strong> We monitor for unauthorized reuse of our imagery</li>
        </ul>
      </PolicySection>

      <PolicySection id="incident" title="Incident Response">
        <p>
          In the event of a security incident that affects the confidentiality or integrity of
          personal data, TenAsia will:
        </p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Contain the incident and assess its scope as quickly as possible</li>
          <li>Notify affected users and, where required, supervisory authorities within applicable deadlines</li>
          <li>Investigate the root cause and implement corrective measures</li>
          <li>Provide ongoing updates to affected parties as the investigation progresses</li>
        </ol>
        <p className="mt-3">
          This process is designed to align with applicable laws including Korea&apos;s Personal
          Information Protection Act (PIPA) and relevant international privacy frameworks.
        </p>
      </PolicySection>

      <PolicySection id="reporting" title="Reporting a Security Vulnerability">
        <p>
          We welcome responsible disclosure of security vulnerabilities. If you discover a
          potential security issue in our platform, please report it to us before disclosing
          it publicly so we can investigate and address it promptly.
        </p>
        <p>
          Please include a clear description of the vulnerability, steps to reproduce, and the
          potential impact. We will acknowledge your report within 48 hours and keep you informed
          of our progress.
        </p>
        <p>
          Security reports:{" "}
          <a href="mailto:tenasia.trend@gmail.com" className="underline underline-offset-2">
            tenasia.trend@gmail.com
          </a>
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
