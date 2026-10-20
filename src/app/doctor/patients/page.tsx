import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "Patients" };

// TODO(phase 5): replace with the real screen. See docs/PROMPTS.md.
export default function Page() {
  return (
    <main className="px-5 pt-6 pb-32">
      <ComingSoon screen="Patients" phase={5} />
    </main>
  );
}
