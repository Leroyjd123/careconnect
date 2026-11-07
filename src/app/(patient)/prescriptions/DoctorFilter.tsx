"use client";

import { useRouter } from "next/navigation";
import { ChipGroup } from "@/components/ui/ChipGroup";

type DoctorFilterProps = {
  /** The doctor ids and names, in the order the chips appear. */
  doctors: { id: string; name: string }[];
  /** The doctor the list is filtered by, or null for "All". */
  selected: string | null;
};

/**
 * Filter the patient's prescriptions by doctor (PLAN §7 Phase C, decision 25).
 * The choice lives in the query string, so it survives a reload and can be shared.
 */
export function DoctorFilter({ doctors, selected }: DoctorFilterProps) {
  const router = useRouter();

  function choose(value: string) {
    const query = value ? `?doctor=${encodeURIComponent(value)}` : "";
    router.push(`/prescriptions${query}`);
  }

  return (
    <ChipGroup
      label="Filter by doctor"
      options={["All", ...doctors.map((d) => d.name)]}
      optionValues={["", ...doctors.map((d) => d.id)]}
      value={selected ?? ""}
      onChange={choose}
      size="md"
    />
  );
}
