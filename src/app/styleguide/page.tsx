import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Styleguide } from "./Styleguide";

export const metadata: Metadata = { title: "Styleguide" };

/**
 * Every shared component in one place. Dev only.
 * Before building a new component, check here first. If it exists, reuse it.
 * When you add a shared component, add it here too.
 */
export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Styleguide />;
}
