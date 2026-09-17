"use client";

import { MailCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { authConfirmUrl, withBasePath } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export function ForgotPassword({ next }: { next: string }): React.JSX.Element {
  const [email, setEmail] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const loginHref = `/account/login?next=${encodeURIComponent(next)}`;

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: authConfirmUrl(
        window.location.origin,
        "/account/reset-password",
      ),
    });
    setPending(false);
    if (error) {
      toast.error("Gagal mengirim email. Coba lagi sebentar.");
      return;
    }
    // Always show success — do not reveal whether the email is registered.
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mx-auto flex min-h-[68vh] max-w-[440px] flex-col items-center justify-center px-6 py-16">
        <div className="w-full rounded-card border border-gray-200 bg-white p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <MailCheck className="h-7 w-7 text-green-600" />
          </div>
          <h1 className="text-[22px] font-semibold tracking-tight text-ink">
            Cek email Anda
          </h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
            Jika email tersebut terdaftar, kami mengirim tautan untuk mengatur
            ulang password Anda. Tautan berlaku sementara.
          </p>
          <Link
            href={loginHref}
            className="mt-6 inline-flex h-13 w-full items-center justify-center rounded-btn bg-brand text-[15.5px] font-medium text-white shadow-cta transition-colors hover:bg-brand-hover"
          >
            Kembali ke halaman masuk
          </Link>
        </div>
      </div>
    );
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
            Lupa Password
          </h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
            Masukkan email akun Anda. Kami akan mengirim tautan untuk mengatur
            ulang password.
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3.5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-[13px] font-semibold text-gray-600"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="h-12 rounded-input border border-gray-200 bg-white px-3.5 text-[14.5px] text-ink outline-none focus:border-brand"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-13 w-full items-center justify-center rounded-btn bg-brand text-[15.5px] font-medium text-white shadow-cta transition-colors hover:bg-brand-hover disabled:opacity-60"
          >
            {pending ? "Mengirim…" : "Kirim tautan reset"}
          </button>
        </form>

        <Link
          href={loginHref}
          className="mt-6 flex items-center justify-center text-[13.5px] font-semibold text-gray-500 hover:text-brand"
        >
          ← Kembali ke halaman masuk
        </Link>
      </div>
    </div>
  );
}
