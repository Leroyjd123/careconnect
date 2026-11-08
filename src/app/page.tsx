import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile, homeFor } from "@/lib/auth";
import { APP_NAME, CONTACT_EMAIL } from "@/lib/constants";
import { FAQ, LANDING_IMAGES, MARQUEE_CHIPS, PATIENT_CAN, ROTATING_WORDS } from "@/lib/landing";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { DisplayHeading } from "@/components/marketing/DisplayHeading";
import { RotatingWord } from "@/components/marketing/RotatingWord";
import { ChipMarquee } from "@/components/marketing/ChipMarquee";
import { FeatureChecklist } from "@/components/marketing/FeatureChecklist";
import { PhoneFrame } from "@/components/marketing/PhoneFrame";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FaqList } from "./FaqList";
import { FeatureTiles } from "./FeatureTiles";
import { PrivacyStrip } from "./PrivacyStrip";
import { LandingFooter } from "./LandingFooter";

export const metadata: Metadata = {
  title: "CareConnect: stay in touch with your patients",
  description:
    "CareConnect lets doctors and clinics message their patients, take reports, issue prescriptions and arrange video meetings, in one private place. No charges.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: "CareConnect: stay in touch with your patients",
    description:
      "Message your patients, take their reports, issue prescriptions and arrange video meetings, in one private place. No charges.",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "CareConnect: stay in touch with your patients",
    description:
      "Message your patients, take their reports, issue prescriptions and arrange video meetings, in one private place. No charges.",
  },
};

/** The contact address, everywhere on the page (decision 61). */
const CONTACT = `mailto:${CONTACT_EMAIL}`;

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#patients", label: "Your patients" },
  { href: "#privacy", label: "Privacy" },
  { href: "#faq", label: "Questions" },
];

// "/" shows the landing to signed-out visitors. A signed-in user goes to their own home.
export default async function Index() {
  const profile = await getProfile();
  if (profile) redirect(homeFor(profile.role));

  return (
    <div id="top" className="flex min-h-dvh flex-col">
      <MarketingHeader links={NAV_LINKS} signInHref="/login" contactHref={CONTACT} />

      <main className="flex flex-1 flex-col">
        {/* Hero: the headline on the left, the phone on the right. */}
        <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-4 pt-10 pb-16 sm:px-6 lg:flex-row lg:gap-16 lg:pt-20 lg:pb-24">
          <div className="flex flex-1 flex-col items-start gap-6">
            <DisplayHeading as="h1" size="lg" eyebrow="For doctors and clinics">
              Stay in touch with your patients, anywhere, anytime.
            </DisplayHeading>
            <p className="max-w-xl text-[17px] leading-relaxed text-ink-2 sm:text-[18px]">
              CareConnect gives local practices a private place to message their patients, take their reports, issue
              prescriptions and arrange video meetings.
            </p>
            <div className="flex flex-col gap-3">
              <ButtonLink href={CONTACT} variant="primary" size="lg">
                Get in touch
              </ButtonLink>
              <p className="text-[15px] text-ink-2">No charges. Set up in a day.</p>
            </div>
          </div>
          <div className="flex flex-1 justify-center lg:justify-end">
            <PhoneFrame image={LANDING_IMAGES["hero-chat"]} />
          </div>
        </section>

        {/* The rotating line. */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6">
          <DisplayHeading as="h2" size="md">
            Get in touch with your patients for
          </DisplayHeading>
          <p className="mt-2 text-[26px] font-bold tracking-tight text-forest sm:text-[34px]">
            <RotatingWord words={ROTATING_WORDS} />
          </p>
        </section>

        {/* The feature tiles. */}
        <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-16 sm:px-6">
          <DisplayHeading as="h2" size="md" eyebrow="What CareConnect does">
            Everything a patient needs, in one place
          </DisplayHeading>
          <FeatureTiles images={LANDING_IMAGES} className="mt-8" />
        </section>

        {/* "Your patients can", beside a phone. */}
        <section id="patients" className="mx-auto flex w-full max-w-6xl scroll-mt-24 flex-col items-center gap-10 px-4 pb-16 sm:px-6 lg:flex-row lg:gap-16">
          <div className="flex flex-1 justify-center lg:justify-start">
            <PhoneFrame image={LANDING_IMAGES["patient-home"]} />
          </div>
          <FeatureChecklist
            className="flex-1"
            title="Your patients can"
            subtitle="Everything happens in the app, so nothing is lost in a phone call."
            items={PATIENT_CAN.map((label) => ({ label }))}
          />
        </section>

        {/* The chips. */}
        <section className="w-full pb-16">
          <div className="mx-auto w-full max-w-6xl px-4 pb-6 sm:px-6">
            <DisplayHeading as="h2" size="md" eyebrow="What you can handle">
              A lot of small things, every day
            </DisplayHeading>
          </div>
          <ChipMarquee chips={MARQUEE_CHIPS} label="What you can handle" />
        </section>

        {/* Privacy. Only what the app really does. */}
        <section id="privacy" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-16 sm:px-6">
          <PrivacyStrip />
        </section>

        {/* The questions. */}
        <section id="faq" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-16 sm:px-6">
          <DisplayHeading as="h2" size="md" eyebrow="Questions">
            Things doctors ask us
          </DisplayHeading>
          <FaqList items={FAQ} className="mt-8" />
        </section>

        {/* The closing call to action. */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
          <Card tone="solid" className="flex flex-col items-center gap-5 p-8 text-center sm:p-12">
            <DisplayHeading as="h2" size="md">
              Let your patients reach you more easily
            </DisplayHeading>
            <p className="max-w-xl text-[17px] leading-relaxed text-ink-2">
              Tell us how your practice works. We will set it up and walk you through it. No charges.
            </p>
            <ButtonLink href={CONTACT} variant="primary" size="lg">
              Get in touch
            </ButtonLink>
          </Card>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
