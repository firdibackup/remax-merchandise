import { type NextRequest, NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/auth";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Customer account routes that must stay reachable while logged out — the
 * email/password auth entry points. Everything else under `/account/*` requires
 * a session (incl. `/account/reset-password`, which relies on the temporary
 * recovery session set by `/auth/confirm`).
 */
const PUBLIC_ACCOUNT_PATHS: ReadonlySet<string> = new Set([
  "/account/login",
  "/account/register",
  "/account/forgot-password",
]);

/**
 * Keeps the Supabase session fresh on every request and guards the admin panel
 * plus the customer account area. The admin panel (`/admin/*`, except the
 * `/admin` login page) is restricted to allowlisted admin emails; authenticated
 * admins are bounced off the login page. The customer area (`/account/*`, except
 * the {@link PUBLIC_ACCOUNT_PATHS} auth pages) requires any logged-in user.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { user, response } = await updateSession(request);
  const { pathname } = request.nextUrl;
  const isAdmin = isAdminEmail(user?.email);

  if (pathname.startsWith("/admin/") && !isAdmin) {
    return redirectTo(request, "/admin", response);
  }
  if (pathname === "/admin" && isAdmin) {
    return redirectTo(request, "/admin/dashboard", response);
  }

  if (
    pathname.startsWith("/account") &&
    !PUBLIC_ACCOUNT_PATHS.has(pathname) &&
    !user
  ) {
    return redirectTo(request, "/account/login", response, { next: pathname });
  }

  return response;
}

/** Redirect while preserving the refreshed auth cookies from `base`. */
function redirectTo(
  request: NextRequest,
  path: string,
  base: NextResponse,
  query?: Record<string, string>,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = "";
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }
  const redirect = NextResponse.redirect(url);
  base.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
