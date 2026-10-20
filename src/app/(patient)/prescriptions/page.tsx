import type { Metadata } from "next";
import { ComingSoon } from "@/components/layout/ComingSoon";

export const metadata: Metadata = { title: "My prescriptions" };

// TODO(phase 4): replace with the real screen. See docs/PROMPTS.md.
export default function Page() {
  return (
    <main className="px-5 pt-6 pb-32">
      <ComingSoon screen="My prescriptions" phase={4} />
    </main>
  );
}
