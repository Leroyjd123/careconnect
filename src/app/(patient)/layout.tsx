import { requireProfile } from "@/lib/auth";
import { PatientTabBar } from "@/components/layout/PatientTabBar";

// Patient app: phone-first single column with the floating tab bar.
export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  await requireProfile("patient");
  return (
    <>
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">{children}</div>
      <PatientTabBar />
    </>
  );
}
