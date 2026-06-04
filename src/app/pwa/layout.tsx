import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KYKOS",
  robots: { index: false, follow: false },
};

export default function PwaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
