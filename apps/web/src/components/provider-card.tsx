"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle, Star } from "lucide-react";

interface ProviderCardProps {
  id: string;
  name: string;
  avatarUrl: string | null;
  quartierName: string | null;
  categories: { name: string; slug: string; iconName: string }[];
  bio: string | null;
  isVerified?: boolean;
  distance?: number | null;
  averageRating?: number | null;
  totalReviews?: number;
}

export function ProviderCard({ id, name, avatarUrl, quartierName, categories, bio, isVerified, distance, averageRating, totalReviews }: ProviderCardProps) {
  return (
    <Link href={`/providers/${id}`}>
      <div className="bg-white rounded-card shadow-sm hover:shadow-md transition-all p-4 h-full flex flex-col border border-transparent hover:border-musso-pink/20">
        <div className="flex items-start gap-3 mb-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-musso-pink-light flex items-center justify-center overflow-hidden flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-musso-pink text-xl font-bold">{name[0]}</span>
              )}
            </div>
            {isVerified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h3 className="font-heading font-semibold text-lg truncate">{name}</h3>
            </div>
            {quartierName && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {quartierName}
                {distance != null && (
                  <span className="text-musso-pink font-semibold ml-1">
                    {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance} km`}
                  </span>
                )}
              </p>
            )}
            {/* Note moyenne */}
            {averageRating != null && averageRating > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-sm font-semibold text-gray-700">{averageRating}</span>
                <span className="text-xs text-gray-400">({totalReviews})</span>
              </div>
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
          {categories.length > 1 && (
            <span className="text-xs text-gray-400 self-center">{categories.length} services</span>
          )}
        </div>
      </div>
    </Link>
  );
}
