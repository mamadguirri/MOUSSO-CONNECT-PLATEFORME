import { Navbar } from "@/components/navbar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <footer className="bg-musso-dark text-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="font-heading font-bold text-lg mb-1">Musso Connect</p>
          <p className="text-sm text-gray-400">Chaque femme mérite le succès</p>
          <p className="text-xs text-gray-500 mt-4">&copy; 2024 Musso Connect. Tous droits réservés.</p>
        </div>
      </footer>
    </>
  );
}
