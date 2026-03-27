// Types partagés entre le frontend et le backend

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface UserDTO {
  id: string;
  phone: string;
  name: string;
  role: 'CLIENT' | 'PROVIDER' | 'ADMIN';
  quartierId: string | null;
  quartierName: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface ProviderCardDTO {
  id: string;
  userId: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  quartierName: string | null;
  categories: { name: string; slug: string; iconName: string }[];
  isVerified: boolean;
}

export interface ProviderDetailDTO extends ProviderCardDTO {
  whatsappNumber: string;
  categories: { name: string; slug: string; iconName: string; priceRange: string | null }[];
  photos: { id: string; url: string; order: number }[];
  createdAt: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  iconName: string;
}

export interface QuartierDTO {
  id: string;
  name: string;
  ville: string;
  region: string;
}

export interface PaginatedResponse<T> {
  providers: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: UserDTO;
  isNewUser: boolean;
}

export interface AdminStats {
  totalUsers: number;
  totalProviders: number;
  verifiedProviders: number;
  pendingProviders: number;
}
