import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mussoconnect.com"),
  title: {
    default: "Musso Connect - Chaque femme mérite le succès",
    template: "%s | Musso Connect",
  },
  description:
    "Musso Connect est la plateforme de référence pour trouver des prestataires de services artisanaux à Bamako, Mali. Coiffure, maquillage, couture, henné, manucure, cuisine et bien plus. Réservez facilement en ligne et soutenez les femmes entrepreneures.",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://mussoconnect.com",
    siteName: "Musso Connect",
    title: "Musso Connect - Chaque femme mérite le succès",
    description:
      "Musso Connect est la plateforme de référence pour trouver des prestataires de services artisanaux à Bamako, Mali. Coiffure, maquillage, couture, henné, manucure, cuisine et bien plus. Réservez facilement en ligne et soutenez les femmes entrepreneures.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Musso Connect - Chaque femme mérite le succès",
    description:
      "Musso Connect est la plateforme de référence pour trouver des prestataires de services artisanaux à Bamako, Mali. Coiffure, maquillage, couture, henné, manucure, cuisine et bien plus.",
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#D14B7A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={cn(inter.variable, poppins.variable)}>
      <body className="font-sans antialiased bg-white text-musso-dark">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-white focus:text-musso-pink">Aller au contenu principal</a>
        <Providers>
          <main id="main-content">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
