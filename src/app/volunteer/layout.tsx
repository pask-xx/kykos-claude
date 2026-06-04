import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Volontariato - KYKOS",
};

export default function VolunteerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
