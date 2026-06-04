import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Password Dimenticata - KYKOS",
  description: "Reimposta la password del tuo account KYKOS per continuare a donare o ricevere oggetti in modo anonimo.",
  alternates: {
    canonical: "https://kykos.it/auth/forgot-password",
  },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Password Dimenticata - KYKOS",
    description: "Reimposta la password del tuo account KYKOS.",
    type: "website",
    url: "https://kykos.it/auth/forgot-password",
  },
};

export default function AuthForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
