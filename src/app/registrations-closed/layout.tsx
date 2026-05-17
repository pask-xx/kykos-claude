import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iscrizioni Chiuse - KYKOS",
  description: "Al momento le iscrizioni a KYKOS sono chiuse. Lascia la tua email per essere notificato quando riapriranno.",
  keywords: ["KYKOS", "iscrizioni chiuse", "notifiche"],
};

export default function RegistrationsClosedLayout({ children }: { children: React.ReactNode }) {
  return children;
}