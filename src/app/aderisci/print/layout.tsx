import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stampa Volantino KYKOS",
  robots: { index: false, follow: false },
};

export default function AderisciPrintLayout({ children }: { children: React.ReactNode }) {
  return children;
}
