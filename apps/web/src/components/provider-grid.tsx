"use client";

import { ProviderCard } from "./provider-card";
import { Skeleton } from "@/components/ui/skeleton";

interface Provider {
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

interface ProviderGridProps {
  providers: Provider[];
  loading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-card shadow-sm p-4">
      <div className="flex items-start gap-3 mb-3">
        <Skeleton className="w-14 h-14 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-3" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function ProviderGrid({ providers, loading }: ProviderGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="font-heading font-semibold text-lg mb-2">Aucune prestataire trouvée</h3>
        <p className="text-gray-500">Essayez de modifier vos critères de recherche</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {providers.map((provider) => (
        <ProviderCard key={provider.id} {...provider} />
      ))}
    </div>
  );
}
