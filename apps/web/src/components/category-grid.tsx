"use client";

import Link from "next/link";
import { Scissors, Sparkles, Hand, Shirt, Star, Home, HandMetal } from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  scissors: <Scissors className="w-6 h-6" />,
  sparkles: <Sparkles className="w-6 h-6" />,
  hand: <Hand className="w-6 h-6" />,
  shirt: <Shirt className="w-6 h-6" />,
  "hand-raised": <HandMetal className="w-6 h-6" />,
  star: <Star className="w-6 h-6" />,
  home: <Home className="w-6 h-6" />,
};

interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
}

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/search?category=${cat.slug}`}
          className="flex flex-col items-center gap-2 p-3 rounded-card hover:bg-musso-pink-light transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-musso-pink-light flex items-center justify-center text-musso-pink group-hover:bg-musso-pink group-hover:text-white transition-colors">
            {iconMap[cat.iconName] || <Star className="w-6 h-6" />}
          </div>
          <span className="text-xs font-medium text-center">{cat.name}</span>
        </Link>
      ))}
    </div>
  );
}
