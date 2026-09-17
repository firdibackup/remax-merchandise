"use client";

import { MailCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { authCallbackUrl, authConfirmUrl, withBasePath } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

const MIN_PASSWORD = 8;

export function CustomerRegister({
  next,
}: {
  next: string;
}): React.JSX.Element {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [googlePending, setGooglePending] = React.useState(false);
  const [sentTo, setSentTo] = React.useState<string | null>(null);

  const loginHref = `/account/login?next=${encodeURIComponent(next)}`;

  async function handleRegister(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (pending) return;

    if (password.length < MIN_PASSWORD) {
      toast.error(`Password minimal ${MIN_PASSWORD} karakter.`);
      return;
    }
    if (password !== confirm) {
      toast.error("Konfirmasi password tidak cocok.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const cleanEmail = email.trim();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        emailRedirectTo: authConfirmUrl(window.location.origin, next),
        data: { full_name: fullName.trim() },
      },
    });

    if (error) {
      setPending(false);
      toast.error(
        error.message.toLowerCase().includes("already")
          ? "Email sudah terdaftar. Silakan masuk."
          : error.message || "Gagal mendaftar. Coba lagi.",
      );
      return;
    }

    // If email confirmation is disabled a session is returned immediately;
    // otherwise the user must confirm via the emailed link first.
    if (data.session) {
      window.location.assign(withBasePath(next));
      return;
    }
    setSentTo(cleanEmail);
    setPending(false);
  }

  async function handleGoogleLogin(): Promise<void> {
    setGooglePending(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: authCallbackUrl(window.location.origin, next),
      },
    });
  }

  if (sentTo) {
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
            Kami mengirim tautan verifikasi ke{" "}
            <span className="font-semibold text-ink">{sentTo}</span>. Klik
            tautan itu untuk mengaktifkan akun, lalu masuk.
          </p>
          <Link
            href={loginHref}
            className="mt-6 inline-flex h-13 w-full items-center justify-center rounded-btn bg-brand text-[15.5px] font-medium text-white shadow-cta transition-colors hover:bg-brand-hover"
          >
            Ke halaman masuk
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
            Buat Akun
          </h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
            Daftar untuk checkout lebih cepat dan menyimpan riwayat pesanan
            Anda.
          </p>
        </div>

        <form onSubmit={(e) => void handleRegister(e)} className="space-y-3.5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="fullName"
              className="text-[13px] font-semibold text-gray-600"
            >
              Nama lengkap
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama Anda"
              className="h-12 rounded-input border border-gray-200 bg-white px-3.5 text-[14.5px] text-ink outline-none focus:border-brand"
            />
          </div>

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

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-[13px] font-semibold text-gray-600"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={`Minimal ${MIN_PASSWORD} karakter`}
              className="h-12 rounded-input border border-gray-200 bg-white px-3.5 text-[14.5px] text-ink outline-none focus:border-brand"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirm"
              className="text-[13px] font-semibold text-gray-600"
            >
              Konfirmasi password
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ulangi password"
              className="h-12 rounded-input border border-gray-200 bg-white px-3.5 text-[14.5px] text-ink outline-none focus:border-brand"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-13 w-full items-center justify-center rounded-btn bg-brand text-[15.5px] font-medium text-white shadow-cta transition-colors hover:bg-brand-hover disabled:opacity-60"
          >
            {pending ? "Memproses…" : "Daftar"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-[12.5px] text-gray-400">
          <span className="h-px flex-1 bg-gray-200" />
          atau
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        {/* <button
          type="button"
          onClick={() => void handleGoogleLogin()}
          disabled={googlePending}
          className="inline-flex h-13 w-full items-center justify-center gap-2.5 rounded-btn border border-gray-200 bg-white text-[15.5px] font-medium text-ink transition-colors hover:bg-gray-50 disabled:opacity-60"
        >
          <GoogleIcon className="h-[19px] w-[19px]" />
          {googlePending ? "Mengalihkan…" : "Daftar dengan Google"}
        </button> */}

        <p className="mt-6 text-center text-[13.5px] text-gray-500">
          Sudah punya akun?{" "}
          <Link
            href={loginHref}
            className="font-semibold text-brand hover:underline"
          >
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
