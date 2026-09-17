import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactElement } from "react";

import { ForgotPassword } from "@/components/account/ForgotPassword";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Lupa Password",
  description: "Atur ulang password akun REMAX Gifts Anda.",
  robots: { index: false, follow: false },
};

interface ForgotPasswordPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps): Promise<ReactElement> {
  const { next } = await searchParams;
  // Only allow same-site relative paths to avoid open-redirects.
  const safeNext = next && next.startsWith("/") ? next : "/";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(safeNext);

  return <ForgotPassword next={safeNext} />;
}
