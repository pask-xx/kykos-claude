import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Oggetti Disponibili - KYKOS",
  description: "Sfoglia gli oggetti disponibili per la donazione. Dona con amore, ricevi con dignità.",
  keywords: ["oggetti donazione", "donazioni KYKOS", "economia circolare", "solidarietà"],
  openGraph: {
    title: "Oggetti Disponibili - KYKOS",
    description: "Sfoglia gli oggetti disponibili per la donazione.",
    type: "website",
  },
};

export default function ObjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}