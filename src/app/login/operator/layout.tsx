import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accesso Operatore - KYKOS",
  robots: { index: false, follow: false },
};

export default function LoginOperatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
