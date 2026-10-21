import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { CLINIC } from "@/lib/constants";

export const metadata: Metadata = { title: "Privacy notice" };

// Plain-language notice. Have it reviewed (India's DPDP Act 2023, medical-records rules) before real patients join.
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy notice"
      updated="2026-10-21"
      intro={
        <p>
          CareConnect lets you message {CLINIC.doctor}, send your reports and see your prescriptions. This notice explains, in plain
          words, what we keep, who can see it and what you can ask us to do.
        </p>
      }
      sections={[
        {
          heading: "What we keep",
          body: (
            <ul>
              <li>Your name, and the email and/or mobile number you joined with.</li>
              <li>Your messages, and the reports and photos you send.</li>
              <li>Prescriptions your doctor issues to you.</li>
              <li>Basic technical details needed to keep you signed in and, if you turn them on, to send you notifications.</li>
            </ul>
          ),
        },
        {
          heading: "Why we keep it",
          body: <p>Only to let you and your doctor talk, share reports and manage your prescriptions. We don&apos;t sell your data, show you ads or use it for marketing.</p>,
        },
        {
          heading: "Who can see it",
          body: (
            <>
              <p>Only you and your doctor. Every message, report and prescription is private to your conversation.</p>
              <p>
                Your data is stored securely with our service providers (Supabase for the database and files, Vercel for the website).
                They store it for us and can&apos;t use it for anything else.
              </p>
            </>
          ),
        },
        {
          heading: "Notifications",
          body: <p>If you turn notifications on, they only say who sent something, never what it says, so nothing private shows on your lock screen.</p>,
        },
        {
          heading: "How long we keep it",
          body: (
            <p>
              For as long as you use CareConnect, and afterwards for as long as the law requires medical records to be kept. Your doctor
              can remove reports; prescriptions are never edited after they&apos;re issued, so your record stays accurate.
            </p>
          ),
        },
        {
          heading: "Your choices",
          body: (
            <ul>
              <li>Ask to see the information we hold about you.</li>
              <li>Ask us to correct something that&apos;s wrong.</li>
              <li>Ask us to delete your account. Some medical records may need to be kept by law; we&apos;ll tell you if so.</li>
              <li>Turn notifications off at any time in Profile.</li>
            </ul>
          ),
        },
        {
          heading: "Contact",
          body: (
            <p>
              Questions or requests: message {CLINIC.doctor} in the app, or contact {CLINIC.contact}. We&apos;ll reply within 30 days.
            </p>
          ),
        },
      ]}
    />
  );
}
