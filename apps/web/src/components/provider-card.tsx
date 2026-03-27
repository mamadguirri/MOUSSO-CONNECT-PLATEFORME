"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface ProviderCardProps {
  id: string;
  name: string;
  avatarUrl: string | null;
  quartierName: string | null;
  categories: { name: string; slug: string; iconName: string }[];
  bio: string | null;
}

export function ProviderCard({ id, name, avatarUrl, quartierName, categories, bio }: ProviderCardProps) {
  return (
    <Link href={`/providers/${id}`}>
      <div className="bg-white rounded-card shadow-sm hover:shadow-md transition-shadow p-4 h-full flex flex-col">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-14 h-14 rounded-full bg-musso-pink-light flex items-center justify-center overflow-hidden flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-musso-pink text-xl font-bold">{name[0]}</span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-heading font-semibold text-lg truncate">{name}</h3>
            {quartierName && (
              <p className="text-sm text-gray-500">{quartierName}, Bamako</p>
            )}
          </div>
        </div>
        {bio && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{bio}</p>
        )}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {categories.map((cat) => (
            <Badge key={cat.slug} variant="secondary" className="bg-musso-pink-light text-musso-pink text-xs">
              {cat.name}
            </Badge>
          ))}
        </div>
      </div>
    </Link>
  );
}
