import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aggiorna Consensi - KYKOS",
  robots: { index: false, follow: false },
};

export default function AuthCheckLegalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
