import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

/** Signed-in user's profile, or null. Cached per request, so call it freely. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile | null) ?? null;
});

/** Use at the top of every layout/page that needs a user. Sends people to the right home. */
export async function requireProfile(role?: Role): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (role && profile.role !== role) redirect(homeFor(profile.role));
  return profile;
}

export function homeFor(role: Role) {
  return role === "doctor" ? "/doctor" : "/home";
}
