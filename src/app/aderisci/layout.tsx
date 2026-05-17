import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ADERISCI - KYKOS",
  description: "Scopri come aderire a KYKOS per donare oggetti a persone bisognose in modo anonimo.",
  keywords: ["aderisci KYKOS", "donare oggetti", "donazione anonima", "solidarietà"],
};

export default function AderisciLayout({ children }: { children: React.ReactNode }) {
  return children;
}