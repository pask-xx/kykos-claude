import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iscrizioni Chiuse - KYKOS",
  description: "Al momento le iscrizioni a KYKOS sono chiuse. Lascia la tua email per essere notificato quando riapriranno.",
  keywords: ["KYKOS", "iscrizioni chiuse", "notifiche"],
  alternates: {
    canonical: "https://kykos.it/registrations-closed",
  },
  openGraph: {
    title: "Iscrizioni Chiuse - KYKOS",
    description: "Al momento le iscrizioni a KYKOS sono chiuse. Lascia la tua email per essere notificato quando riapriranno.",
    type: "website",
    url: "https://kykos.it/registrations-closed",
    siteName: "KYKOS",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "KYKOS - Iscrizioni Chiuse",
      },
    ],
  },
};

export default function RegistrationsClosedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
