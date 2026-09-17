"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { withBasePath } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

const MIN_PASSWORD = 8;

export function ResetPassword(): React.JSX.Element {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [ready, setReady] = React.useState<boolean | null>(null);

  // The recovery link (via /auth/confirm) establishes a session before landing
  // here. If there is none the link was invalid or expired.
  React.useEffect(() => {
    const supabase = createClient();
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setReady(Boolean(data.user));
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
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
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setPending(false);
      toast.error(error.message || "Gagal mengubah password. Coba lagi.");
      return;
    }
    toast.success("Password berhasil diperbarui.");
    router.push("/account/profile");
    router.refresh();
  }

  if (ready === false) {
    return (
      <div className="mx-auto flex min-h-[68vh] max-w-[440px] flex-col items-center justify-center px-6 py-16">
        <div className="w-full rounded-card border border-gray-200 bg-white p-8 text-center shadow-card">
          <h1 className="text-[22px] font-semibold tracking-tight text-ink">
            Tautan tidak valid
          </h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
            Tautan reset password sudah kedaluwarsa atau tidak berlaku. Silakan
            minta tautan baru.
          </p>
          <Link
            href="/account/forgot-password"
            className="mt-6 inline-flex h-13 w-full items-center justify-center rounded-btn bg-brand text-[15.5px] font-medium text-white shadow-cta transition-colors hover:bg-brand-hover"
          >
            Minta tautan baru
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
            Atur Ulang Password
          </h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
            Masukkan password baru untuk akun Anda.
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3.5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-[13px] font-semibold text-gray-600"
            >
              Password baru
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
              Konfirmasi password baru
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ulangi password baru"
              className="h-12 rounded-input border border-gray-200 bg-white px-3.5 text-[14.5px] text-ink outline-none focus:border-brand"
            />
          </div>

          <button
            type="submit"
            disabled={pending || ready === null}
            className="inline-flex h-13 w-full items-center justify-center rounded-btn bg-brand text-[15.5px] font-medium text-white shadow-cta transition-colors hover:bg-brand-hover disabled:opacity-60"
          >
            {pending ? "Menyimpan…" : "Simpan password baru"}
          </button>
        </form>
      </div>
    </div>
  );
}
