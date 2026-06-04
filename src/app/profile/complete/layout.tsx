import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Completa Profilo - KYKOS",
  robots: { index: false, follow: false },
};

export default function ProfileCompleteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
