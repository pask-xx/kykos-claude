import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "KYKOS - Dona con dignità, ricevi con gratitudine",
    template: "%s | KYKOS",
  },
  description: "Piattaforma di donazione anonima di oggetti a persone bisognose. Chi dona non sa chi riceve, chi riceve non sa chi dona. Gestito da enti fidati come Caritas e parrocchie.",
  keywords: ["donazione anonima", "caritas", "donare oggetti", "aiuto sociale", "solidarietà", "economia circolare", "beneficenza", "intermediari fidati", "KYKOS"],
  authors: [{ name: "KYKOS" }],
  creator: "KYKOS",
  publisher: "KYKOS",
  metadataBase: new URL("https://kykos.app"),
  alternates: {
    canonical: "/",
    languages: {
      "it-IT": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: "https://kykos.app",
    siteName: "KYKOS",
    title: "KYKOS - Dona con dignità, ricevi con gratitudine",
    description: "Piattaforma di donazione anonima. Chi dona non sa chi riceve, chi riceve non sa chi dona.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "KYKOS - Dona con dignità",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KYKOS - Dona con dignità, ricevi con gratitudine",
    description: "Piattaforma di donazione anonima. Chi dona non sa chi riceve, chi riceve non sa chi dona.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "KYKOS",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={sora.variable}>
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
