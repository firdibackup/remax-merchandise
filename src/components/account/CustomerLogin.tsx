"use client";

import { ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { GoogleIcon } from "@/components/ui/GoogleIcon";
import { authCallbackUrl, withBasePath } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

export function CustomerLogin({ next }: { next: string }): React.JSX.Element {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [googlePending, setGooglePending] = React.useState(false);

  const registerHref = `/account/register?next=${encodeURIComponent(next)}`;
  const forgotHref = `/account/forgot-password?next=${encodeURIComponent(next)}`;

  async function handleEmailLogin(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setPending(false);
      toast.error(
        error.message.toLowerCase().includes("not confirmed")
          ? "Email belum diverifikasi. Cek kotak masuk Anda."
          : "Email atau password salah.",
      );
      return;
    }
    router.push(next);
    router.refresh();
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

        <form
          onSubmit={(e) => void handleEmailLogin(e)}
          className="space-y-3.5"
        >
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
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-[13px] font-semibold text-gray-600"
              >
                Password
              </label>
              <Link
                href={forgotHref}
                className="text-[12.5px] font-semibold text-gray-500 hover:text-brand"
              >
                Lupa password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="h-12 rounded-input border border-gray-200 bg-white px-3.5 text-[14.5px] text-ink outline-none focus:border-brand"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-13 w-full items-center justify-center rounded-btn bg-brand text-[15.5px] font-medium text-white shadow-cta transition-colors hover:bg-brand-hover disabled:opacity-60"
          >
            {pending ? "Memproses…" : "Masuk"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-[12.5px] text-gray-400">
          <span className="h-px flex-1 bg-gray-200" />
          atau
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <button
          type="button"
          onClick={() => void handleGoogleLogin()}
          disabled={googlePending}
          className="inline-flex h-13 w-full items-center justify-center gap-2.5 rounded-btn border border-gray-200 bg-white text-[15.5px] font-medium text-ink transition-colors hover:bg-gray-50 disabled:opacity-60"
        >
          <GoogleIcon className="h-[19px] w-[19px]" />
          {googlePending ? "Mengalihkan…" : "Login dengan Google"}
        </button>

        <p className="mt-6 text-center text-[13.5px] text-gray-500">
          Belum punya akun?{" "}
          <Link
            href={registerHref}
            className="font-semibold text-brand hover:underline"
          >
            Daftar sekarang
          </Link>
        </p>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-gray-400">
          <ShieldCheck className="h-[14px] w-[14px] text-gray-300" />
          Data Anda aman dan hanya dipakai untuk pemesanan
        </div>
      </div>
    </div>
  );
}
