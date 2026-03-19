import type { Metadata } from "next";
import PolicyLayout from "@/components/policies/PolicyLayout";
import PolicySection from "@/components/policies/PolicySection";

export const metadata: Metadata = {
  title: "Copyright & Licensing Policy | Tenasia Gallery",
  description:
    "Understand content ownership, license types, prohibited uses, and enforcement for photos licensed through Tenasia Gallery.",
};

const TOC = [
  { id: "ownership",    title: "Ownership of Content" },
  { id: "types",        title: "License Types" },
  { id: "prohibited",   title: "Prohibited Uses" },
  { id: "personality",  title: "Personality Rights & Subject Consent" },
  { id: "drm",          title: "Digital Rights Management" },
  { id: "enforcement",  title: "Infringement and Enforcement" },
];

export default function CopyrightPage() {
  return (
    <PolicyLayout title="Copyright & Licensing Policy" tocItems={TOC} currentPath="/policies/copyright">
      <PolicySection id="ownership" title="Ownership of Content">
        <p>
          All photographs, images, and associated metadata available on Tenasia Gallery are
          the exclusive intellectual property of The Korea Entertainment Media or its contracted
          photographers. All rights are reserved.
        </p>
        <p>
          Our content is protected under the Copyright Act of the Republic of Korea and
          international copyright treaties, including the Berne Convention, the TRIPS
          Agreement, and bilateral agreements between Korea and other jurisdictions.
        </p>
        <p>
          A license to download or use content does not constitute a transfer of ownership.
          TenAsia retains full copyright in all content at all times.
        </p>
      </PolicySection>

      <PolicySection id="types" title="License Types">
        <p className="font-medium opacity-100">Editorial License</p>
        <p>
          Grants a non-exclusive, non-transferable right to use licensed images for
          editorial, non-commercial purposes only — including news reporting, commentary,
          criticism, education, and documentary work. Commercial exploitation of any kind
          is expressly prohibited under this license type.
        </p>
        <p>
          All editorial uses must include the following credit line in immediate proximity
          to the image: <em className="not-italic font-medium">"Photo: TenAsia"</em>
        </p>

        <p className="font-medium opacity-100 mt-4">Commercial License</p>
        <p>
          Grants rights for commercial applications including advertising, marketing
          campaigns, branded content, and merchandise. Commercial licenses are subject
          to a separate agreement specifying permitted use scope, geographic territory,
          license duration, and distribution channels. Additional fees may apply based
          on the nature and scale of commercial use. Contact{" "}
          <a href="mailto:tenasia.trend@gmail.com" className="underline underline-offset-2">
            tenasia.trend@gmail.com
          </a>{" "}
          for commercial license inquiries.
        </p>

        <p className="font-medium opacity-100 mt-4">Extended License</p>
        <p>
          Required for any use involving the resale or distribution of products incorporating
          licensed images (e.g., posters, calendars, merchandise, print-on-demand goods).
          Extended licenses are negotiated on a per-project basis and require a signed
          licensing agreement before use. Contact{" "}
          <a href="mailto:tenasia.trend@gmail.com" className="underline underline-offset-2">
            tenasia.trend@gmail.com
          </a>{" "}
          to initiate an extended license request.
        </p>
      </PolicySection>

      <PolicySection id="prohibited" title="Prohibited Uses">
        <p>The following uses are expressly prohibited under all license types:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Reselling, sub-licensing, or redistributing images to third parties</li>
          <li>Using images in a defamatory, obscene, or illegal context</li>
          <li>Removing, altering, or obscuring watermarks, metadata, or copyright notices</li>
          <li>
            Using images to train, fine-tune, or develop artificial intelligence or
            machine learning models of any kind
          </li>
          <li>Impersonating TenAsia, its photographers, or the depicted subjects</li>
          <li>
            Using images in connection with products or services in a way that implies
            endorsement by the depicted artist or TenAsia without explicit written consent
          </li>
          <li>
            Any use that infringes upon the personality rights, right of publicity, or
            right of privacy of the depicted individuals
          </li>
        </ul>
      </PolicySection>

      <PolicySection id="personality" title="Personality Rights & Subject Consent">
        <p>
          Images on Tenasia Gallery depict professional K-pop artists, actors, directors,
          and public figures. The availability of a photograph for licensing does not imply
          endorsement of any product, service, or message by the depicted individual.
        </p>
        <p>
          <strong>Editorial Use:</strong> Images may be used in good-faith editorial
          contexts (news, commentary, biography) without a separate model release, provided
          the use is truthful and not misleading.
        </p>
        <p>
          <strong>Commercial Use:</strong> Any commercial application that associates a
          depicted individual with a brand, product, or service requires a separate model
          release and may require direct consent from the artist's management. TenAsia
          cannot grant personality rights on behalf of depicted individuals.
        </p>
        <p>
          Licensees are solely responsible for obtaining all necessary consents, releases,
          and clearances for their specific intended use.
        </p>
      </PolicySection>

      <PolicySection id="drm" title="Digital Rights Management">
        <p>
          All images distributed through Tenasia Gallery are embedded with EXIF and IPTC
          copyright metadata identifying The Korea Entertainment Media as the rights holder. High-
          resolution downloads may also include visible or forensic digital watermarks.
        </p>
        <p>
          The removal, alteration, or circumvention of any digital rights management
          information — including metadata and watermarks — constitutes a material breach
          of the license agreement and may constitute a violation of applicable law,
          including the Digital Millennium Copyright Act (DMCA) and its international
          equivalents.
        </p>
      </PolicySection>

      <PolicySection id="enforcement" title="Infringement and Enforcement">
        <p>
          TenAsia employs automated monitoring services to detect unauthorized use of our
          content across the internet, social media platforms, and digital publications.
        </p>
        <p>
          Upon discovery of unauthorized use, TenAsia reserves the right to:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Immediately terminate the offending party's license and account</li>
          <li>Issue formal takedown notices under the DMCA and equivalent laws</li>
          <li>
            Seek compensation equal to the applicable license fee plus a retroactive
            unauthorized-use premium
          </li>
          <li>Pursue civil and/or criminal legal action where warranted</li>
        </ul>
        <p className="mt-3">
          To report copyright infringement or for licensing inquiries, contact:{" "}
          <a href="mailto:tenasia.trend@gmail.com" className="underline underline-offset-2">
            tenasia.trend@gmail.com
          </a>
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
