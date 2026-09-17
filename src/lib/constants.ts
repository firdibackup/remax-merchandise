/**
 * Site-wide constants. In production these company/contact values move to the
 * Supabase `Setting` model; WhatsApp number and site URL come from env.
 */

export const WA_NUMBER: string =
  process.env.NEXT_PUBLIC_WA_NUMBER ?? "6287716289585";

export const SITE_URL: string =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://remax.co.id/gifts";

/**
 * Deployment sub-path. The app is served under this prefix (remax.co.id/gifts),
 * configured as `basePath` in next.config.ts — keep the two in sync.
 */
export const BASE_PATH = "/gifts";

/**
 * Prefix a public/ asset path (e.g. "/assets/logo.png") with {@link BASE_PATH}.
 * Next.js does NOT auto-add basePath to string `src`/`href` written by hand, so
 * static files in public/ must be wrapped or they 404 under the sub-path.
 */
export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}

/**
 * Canonical public origin — scheme + host only, WITHOUT {@link BASE_PATH} —
 * derived from {@link SITE_URL} (e.g. "https://remax.co.id").
 *
 * Server-side post-login redirects are built from this instead of the request
 * host. The app is served at remax.co.id/gifts via a reverse proxy to Vercel, so
 * the request host / `x-forwarded-host` seen by the callback can be the raw
 * Vercel domain — redirecting there would bounce the user off remax.co.id, where
 * the session cookie (set for remax.co.id) is not even valid.
 */
export function siteOrigin(): string {
  try {
    return new URL(SITE_URL).origin;
  } catch {
    return SITE_URL.replace(/\/+$/, "");
  }
}

/**
 * Absolute OAuth redirect target for Supabase `signInWithOAuth`.
 *
 * Supabase redirects the browser to this URL verbatim — it never learns about
 * {@link BASE_PATH}, so the prefix must be baked in here or Google lands the
 * user on `/auth/callback`, which does not exist under the sub-path (404).
 * Whatever origin the user logged in from (remax.co.id or the Vercel domain) is
 * the one we come back to, so it is passed in rather than hardcoded.
 *
 * The resulting URL must also be listed verbatim in Supabase → Authentication →
 * URL Configuration → Redirect URLs.
 */
export function authCallbackUrl(origin: string, next: string): string {
  const safeNext = next.startsWith("/") ? next : "/";
  return `${origin}${withBasePath("/auth/callback")}?next=${encodeURIComponent(safeNext)}`;
}

/**
 * Absolute redirect target for email-link flows: signup confirmation
 * (`signUp` → `emailRedirectTo`) and password recovery
 * (`resetPasswordForEmail` → `redirectTo`).
 *
 * Points at `/auth/confirm`, which establishes the session (via either the
 * `token_hash` OTP or the PKCE `code`) before forwarding to `next`. As with
 * {@link authCallbackUrl} the {@link BASE_PATH} prefix must be baked in — Supabase
 * uses this URL verbatim and knows nothing about the sub-path — and the resulting
 * URL must be listed under Supabase → Authentication → URL Configuration →
 * Redirect URLs.
 */
export function authConfirmUrl(origin: string, next: string): string {
  const safeNext = next.startsWith("/") ? next : "/";
  return `${origin}${withBasePath("/auth/confirm")}?next=${encodeURIComponent(safeNext)}`;
}

export const SITE_NAME = "REMAX Gifts";

export const SITE_DESCRIPTION =
  "Katalog gifts REMAX Indonesia premium - polo, jaket, hoodie, payung, tumbler, tote bag, dll";

export interface CompanyInfo {
  name: string;
  shortName: string;
  tagline: string;
  phoneDisplay: string;
  whatsappDisplay: string;
  email: string;
  address: string;
  addressShort: string;
  hours: string;
  hoursShort: string;
  /** Google Maps place link for the office ("Buka Maps"). */
  mapsUrl: string;
  /** Keyless Google Maps embed of {@link mapsUrl} — no API key required. */
  mapsEmbedUrl: string;
}

/**
 * Office coordinates, read off the Google Maps place link for RE/MAX Indonesia.
 * Reverse-geocoding puts them in kelurahan Senayan, Kebayoran Baru (3174071006)
 * — the same village as `SHIP_ORIGIN_VILLAGE_CODE`, which is what every ongkir
 * quote ships from. Keep the two in step if the office moves.
 */
const OFFICE_LAT_LNG = "-6.2262628,106.8084354";

export const COMPANY: CompanyInfo = {
  name: "REMAX Gifts",
  shortName: SITE_NAME,
  tagline: "Official gifts untuk jaringan REMAX Indonesia",
  phoneDisplay: "087716289585",
  whatsappDisplay: "087716289585",
  email: "support@remax.co.id",
  address:
    "Sudirman Central Business District (SCBD), Senayan, Kebayoran Baru, Jakarta Selatan 12190",
  addressShort: "Kebayoran Baru, Jakarta Selatan",
  hours: "Senin - Jumat, 09:00 - 18:00 WIB",
  hoursShort: "Sen-Jum, 09:00-18:00",
  mapsUrl: "https://maps.app.goo.gl/Rr7qyzTc1a6V19nWA",
  mapsEmbedUrl: `https://maps.google.com/maps?q=${OFFICE_LAT_LNG}&z=16&output=embed`,
};

export interface SocialLink {
  label: string;
  /** Key into the SocialIcon registry (see components/ui/SocialIcon.tsx). */
  icon: string;
  href: string;
}

export const SOCIALS: SocialLink[] = [
  {
    label: "Instagram",
    icon: "instagram",
    href: "https://www.instagram.com/remaxindonesia",
  },
  {
    label: "YouTube",
    icon: "youtube",
    href: "https://www.youtube.com/@remaxindo",
  },
  {
    label: "Facebook",
    icon: "facebook",
    href: "https://www.facebook.com/remaxindo",
  },
];

/** RE/MAX Indonesia main site — property listings, linked from the navbar. */
export const PROPERTY_SEARCH_URL = "https://remax.co.id/properties";
