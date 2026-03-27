export type UserRole = 'public' | 'govt_official' | 'manager' | 'dept_user' | 'admin';

export type BookingStatus =
  | 'REQUESTED'
  | 'PROVISIONED'
  | 'ALLOCATED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'REJECTED';

export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';

export type PropertyStatus = 'DRAFT' | 'PUBLISHED';

export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'REFUNDED';

export type AssetCategory = 'A' | 'B' | 'C';

export type ViewMode = 'cards' | 'table' | 'list';

export interface GuestDetails {
  fullName: string;
  email: string;
  phone: string;
  idProofType?: string;
  idProofNumber?: string;
  address?: string;
  numberOfGuests?: number;
}

export interface AuditoriumRequirements {
  soundAndLight: boolean;
  additionalSeating: boolean;
  generatorBackup: boolean;
  garbageClearance: boolean;
  otherRequirements?: string;
}

export interface SearchFilters {
  location?: string;
  checkInDate?: string;
  checkOutDate?: string;
  moduleId?: string;
  propertyTypeId?: string;
  roomTypeId?: string;
  capacity?: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  assetTypeId?: string;
  radius?: number;
  latitude?: number;
  longitude?: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
