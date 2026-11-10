import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile, homeFor } from "@/lib/auth";
import { APP_NAME, CONTACT_EMAIL } from "@/lib/constants";
import { DOCTOR_GETS, FACTS, FAQ, LANDING_IMAGES, MARQUEE_CHIPS, PATIENT_CAN, ROTATING_WORDS, STEPS } from "@/lib/landing";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { DisplayHeading } from "@/components/marketing/DisplayHeading";
import { RotatingWord } from "@/components/marketing/RotatingWord";
import { ChipMarquee } from "@/components/marketing/ChipMarquee";
import { FeatureChecklist } from "@/components/marketing/FeatureChecklist";
import { PhoneFrame } from "@/components/marketing/PhoneFrame";
import { BrowserFrame } from "@/components/marketing/BrowserFrame";
import { StepList } from "@/components/marketing/StepList";
import { FactBand } from "@/components/marketing/FactBand";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FaqList } from "./_landing/FaqList";
import { FeatureTiles } from "./_landing/FeatureTiles";
import { PrivacyStrip } from "./_landing/PrivacyStrip";
import { LandingFooter } from "./_landing/LandingFooter";

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
  { href: "#how", label: "How it works" },
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
            <PhoneFrame image={LANDING_IMAGES["hero-chat"]} priority />
          </div>
        </section>

        {/* The showcase: the doctor's real screen. */}
        <section id="desk" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-16 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 pb-8 lg:flex-row lg:items-end">
            <DisplayHeading as="h2" size="md" eyebrow="Your desk" accent="Your patient on the right.">
              Your inbox on the left. The chat in the middle.
            </DisplayHeading>
            <p className="max-w-md text-[17px] leading-relaxed text-ink-2">
              Everything about a patient sits beside their chat: their next check-in, their latest prescription and
              their reports. No more scrolling back through a messaging app to find a photo from last month.
            </p>
          </div>
          <BrowserFrame image={LANDING_IMAGES["doctor-panel"]} address="careconnect · Inbox" />
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

        {/* How it works. */}
        <section id="how" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-16 sm:px-6">
          <DisplayHeading as="h2" size="md" eyebrow="How it works" accent="Three steps.">
            From your first message to your first patient.
          </DisplayHeading>
          <StepList steps={STEPS} className="mt-8" />
        </section>

        {/* The feature tiles. */}
        <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-16 sm:px-6">
          <DisplayHeading as="h2" size="md" eyebrow="What CareConnect does">
            Everything a patient needs, in one place
          </DisplayHeading>
          <FeatureTiles images={LANDING_IMAGES} className="mt-8" />
        </section>

        {/* "Built for the doctor", beside the patient list. */}
        <section id="doctors" className="mx-auto flex w-full max-w-6xl scroll-mt-24 flex-col items-center gap-10 px-4 pb-16 sm:px-6 lg:flex-row-reverse lg:gap-16">
          <div className="w-full flex-1">
            <BrowserFrame image={LANDING_IMAGES["doctor-patients"]} address="careconnect · Patients" />
          </div>
          <FeatureChecklist
            className="flex-1"
            title="Built for the doctor"
            subtitle="Made with doctors who answer their patients between appointments."
            items={DOCTOR_GETS}
            columns={1}
          />
        </section>

        {/* "Your patients can", beside a phone. */}
        <section id="patients" className="mx-auto flex w-full max-w-6xl scroll-mt-24 flex-col items-center gap-10 px-4 pb-16 sm:px-6 lg:flex-row lg:gap-16">
          <div className="flex flex-1 items-start justify-center gap-4 lg:justify-start">
            <PhoneFrame image={LANDING_IMAGES["patient-home"]} className="max-w-[260px]" />
            <PhoneFrame image={LANDING_IMAGES["patient-rx"]} className="mt-12 hidden max-w-[260px] sm:block" />
          </div>
          <FeatureChecklist
            className="flex-1"
            title="Your patients can"
            subtitle="Everything happens in the app, so nothing is lost in a phone call."
            items={PATIENT_CAN.map((label) => ({ label }))}
          />
        </section>

        {/* The facts. */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
          <FactBand facts={FACTS} />
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
