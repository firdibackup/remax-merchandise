import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { withBasePath } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

/**
 * Email-link confirmation target for the customer email/password flows:
 *   - signup confirmation ("Confirm signup" template, `type=email`/`signup`)
 *   - password recovery ("Reset password" template, `type=recovery`)
 *
 * It accepts either shape of link, so it works whether the Supabase email
 * templates use the recommended `token_hash` form or the default
 * `{{ .ConfirmationURL }}` (which lands here with a PKCE `code`):
 *   - `?token_hash=...&type=...` → {@link verifyOtp} (cross-device safe)
 *   - `?code=...`                → {@link exchangeCodeForSession}
 *
 * On success the session cookie is set and the user is forwarded to `next`
 * (an app-relative path). Redirects are absolute URLs, which Next does NOT
 * prefix with `basePath`, so the prefix is added explicitly. Only same-site
 * relative paths are honoured, to avoid an open redirect.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  // Behind a proxy the public host is the one the user actually sees; `origin`
  // here is the internal one, so prefer the forwarded host in production.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";
  const base = !isLocal && forwardedHost ? `https://${forwardedHost}` : origin;

  // "/" would render as a trailing-slash "/gifts/", costing an extra 308 hop.
  const home = withBasePath("");
  const dest = `${base}${next === "/" ? home : withBasePath(next)}`;

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(dest);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(dest);
  }

  return NextResponse.redirect(`${base}${home}?auth_error=1`);
}
