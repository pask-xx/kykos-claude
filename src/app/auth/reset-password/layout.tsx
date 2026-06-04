import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password - KYKOS",
  robots: { index: false, follow: false },
};

export default function AuthResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
