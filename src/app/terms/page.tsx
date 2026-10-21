import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { CLINIC } from "@/lib/constants";

export const metadata: Metadata = { title: "Terms of use" };

// Plain-language terms. Have them reviewed before real patients join.
export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      updated="2026-10-21"
      intro={<p>By using CareConnect you agree to these terms. They&apos;re short, and we&apos;ve tried to keep them plain.</p>}
      sections={[
        {
          heading: "What CareConnect is",
          body: <p>A private way to message {CLINIC.doctor}, send reports and receive prescriptions. You can only join when your doctor invites you.</p>,
        },
        {
          heading: "Not for emergencies",
          body: (
            <p>
              <strong>If you have a medical emergency, call 112 or go to the nearest hospital.</strong> Messages are answered during the
              clinic&apos;s working hours and may take time. Don&apos;t wait for a reply here when you need urgent care.
            </p>
          ),
        },
        {
          heading: "Medical advice",
          body: (
            <p>
              Advice and prescriptions come from your doctor, based on what you share. Give accurate information, follow the prescription
              as written, and ask your doctor if anything is unclear. CareConnect itself doesn&apos;t give medical advice.
            </p>
          ),
        },
        {
          heading: "Your account",
          body: (
            <ul>
              <li>Use your own account and keep your password private.</li>
              <li>An invite link is for one person. Don&apos;t share it.</li>
              <li>Tell your doctor straight away if you think someone else has used your account.</li>
            </ul>
          ),
        },
        {
          heading: "Using it fairly",
          body: <p>Only send information and files about your own health. Don&apos;t send anything unlawful, abusive or unrelated. Your doctor may close an account that is misused.</p>,
        },
        {
          heading: "Availability",
          body: <p>We work to keep CareConnect running, but it may sometimes be unavailable, for example during maintenance. Keep your own copies of important prescriptions (use Download).</p>,
        },
        {
          heading: "Changes",
          body: <p>We may update these terms. We&apos;ll show the new date at the top, and tell you in the app if anything important changes.</p>,
        },
        {
          heading: "Contact",
          body: <p>Questions: message {CLINIC.doctor} in the app, or contact {CLINIC.contact}.</p>,
        },
      ]}
    />
  );
}
