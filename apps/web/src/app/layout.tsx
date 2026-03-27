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
  title: "Musso Connect - Chaque femme mérite le succès",
  description:
    "Trouvez des prestataires de services artisanaux à Bamako : coiffure, maquillage, couture, henné, manucure et plus.",
  manifest: "/manifest.json",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
