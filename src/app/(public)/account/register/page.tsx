import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactElement } from "react";

import { CustomerRegister } from "@/components/account/CustomerRegister";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Daftar",
  description:
    "Buat akun REMAX Gifts untuk checkout lebih cepat dan menyimpan riwayat pesanan.",
  robots: { index: false, follow: false },
};

interface RegisterPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps): Promise<ReactElement> {
  const { next } = await searchParams;
  // Only allow same-site relative paths to avoid open-redirects.
  const safeNext = next && next.startsWith("/") ? next : "/";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(safeNext);

  return <CustomerRegister next={safeNext} />;
}
