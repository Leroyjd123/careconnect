import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing route for links in Supabase emails (patient invite, resent invite).
 * The link signs the user in; they then choose a password.
 * Email templates must point here: {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}/set-password`);
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
