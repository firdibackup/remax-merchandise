"use client";

import { ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { authCallbackUrl, withBasePath } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export function CustomerLogin({ next }: { next: string }): React.JSX.Element {
  const [pending, setPending] = React.useState(false);

  async function handleGoogleLogin(): Promise<void> {
    setPending(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: authCallbackUrl(window.location.origin, next),
      },
    });
  }

  return (
    <div className="mx-auto flex min-h-[68vh] max-w-[440px] flex-col items-center justify-center px-6 py-16">
      <div className="w-full rounded-card border border-gray-200 bg-white p-8 shadow-card">
        <div className="mb-7 flex flex-col items-center text-center">
          <Image
            src={withBasePath("/assets/logo-mark.png")}
            alt="REMAX"
            width={182}
            height={207}
            className="mb-4 h-12 w-auto"
          />
          <h1 className="text-[26px] font-semibold tracking-tight text-ink">
            Masuk ke Akun
          </h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
            Login untuk checkout, menyimpan riwayat pesanan, dan mengelola
            profil Anda.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleGoogleLogin()}
          disabled={pending}
          className="inline-flex h-13 w-full items-center justify-center gap-2.5 rounded-btn bg-brand text-[15.5px] font-medium text-white shadow-cta transition-colors hover:bg-brand-hover disabled:opacity-60"
        >
          <GoogleIcon className="h-[19px] w-[19px]" />
          {pending ? "Mengalihkan…" : "Login dengan Google"}
        </button>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-gray-400">
          <ShieldCheck className="h-[14px] w-[14px] text-gray-300" />
          Data Anda aman dan hanya dipakai untuk pemesanan
        </div>

        <Link
          href="/"
          className="mt-6 flex items-center justify-center text-[13.5px] font-semibold text-gray-500 hover:text-brand"
        >
          ← Kembali ke beranda
        </Link>
      </div>
    </div>
  );
}
