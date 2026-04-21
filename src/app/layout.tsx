import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KYKOS - Dona con dignità",
  description: "Platform for anonymous donation of objects to people in need",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
