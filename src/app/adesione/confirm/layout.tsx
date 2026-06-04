import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conferma Adesione - KYKOS",
  robots: { index: false, follow: false },
};

export default function AdesioneConfirmLayout({ children }: { children: React.ReactNode }) {
  return children;
}
