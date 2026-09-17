import type { Metadata } from "next";
import type { ReactElement } from "react";

import { ResetPassword } from "@/components/account/ResetPassword";

export const metadata: Metadata = {
  title: "Atur Ulang Password",
  description: "Buat password baru untuk akun REMAX Gifts Anda.",
  robots: { index: false, follow: false },
};

/**
 * Reached from the password-recovery email link, which passes through
 * `/auth/confirm` and establishes a temporary session first. The session is
 * what authorises the `updateUser({ password })` call in {@link ResetPassword}.
 */
export default function ResetPasswordPage(): ReactElement {
  return <ResetPassword />;
}
