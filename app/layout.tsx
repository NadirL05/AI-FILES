import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoiceInvoice - Facturation vocale",
  description: "Créez et modifiez vos factures via une interface conversationnelle",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
