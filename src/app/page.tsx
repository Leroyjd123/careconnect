import { redirect } from "next/navigation";
import { getProfile, homeFor } from "@/lib/auth";

// "/" just routes people to the right home.
export default async function Index() {
  const profile = await getProfile();
  redirect(profile ? homeFor(profile.role) : "/login");
}
