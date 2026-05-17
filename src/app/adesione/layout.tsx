import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adesione - KYKOS",
  description: "Richiedi l'adesione a KYKOS come intermediario. Dona con amore, ricevi con dignità.",
  keywords: ["adesione KYKOS", "diventa intermediario", "donazione anonima", "Caritas", "parrocchia"],
};

export default function AdesioneLayout({ children }: { children: React.ReactNode }) {
  return children;
}