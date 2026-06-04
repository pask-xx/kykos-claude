import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Oggetti Disponibili - KYKOS",
  description: "Sfoglia gli oggetti disponibili per la donazione. Dona con amore, ricevi con dignità.",
  alternates: {
    canonical: "https://kykos.it/objects",
  },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Oggetti Disponibili - KYKOS",
    description: "Sfoglia gli oggetti disponibili per la donazione.",
    type: "website",
    url: "https://kykos.it/objects",
  },
};

export default function ObjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
