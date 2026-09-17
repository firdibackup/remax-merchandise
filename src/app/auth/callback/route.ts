import { NextResponse } from "next/server";

import { siteOrigin, withBasePath } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth (Google) redirect target. Exchanges the auth code for a session cookie
 * and forwards the user to `next` (defaults to home). Used by the customer
 * "Login dengan Google" flow before checkout.
 *
 * `next` is an app-relative path (e.g. "/cart"). Redirects built here are
 * absolute URLs, which Next does NOT prefix with `basePath` — so the prefix is
 * added explicitly or the user lands on a 404 right after a successful login.
 * Only same-site relative paths are honoured, to avoid an open redirect.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  // Served at remax.co.id/gifts via a reverse proxy to Vercel: the request host
  // (and x-forwarded-host) can be the raw Vercel domain, which would bounce the
  // user off remax.co.id after login — and the session cookie, set for
  // remax.co.id, is not valid there. Redirect to the canonical public origin in
  // production; use the request origin only in local dev.
  const isLocal = process.env.NODE_ENV === "development";
  const base = isLocal ? origin : siteOrigin();

  // "/" would render as a trailing-slash "/gifts/", costing an extra 308 hop.
  const home = withBasePath("");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(
        `${base}${next === "/" ? home : withBasePath(next)}`,
      );
    }
  }

  return NextResponse.redirect(`${base}${home}?auth_error=1`);
}
