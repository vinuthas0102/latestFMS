import { PropertyStatus, RoomStatus, AssetCategory } from './common.types';

export interface RegionDTO {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EstateDTO {
  id: string;
  regionId: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  images: string[];
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  region?: RegionDTO;
}

export interface ModuleDTO {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyTypeDTO {
  id: string;
  moduleId: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  module?: ModuleDTO;
}

export interface AssetTypeDTO {
  id: string;
  name: string;
  subtype: string;
  category: AssetCategory;
  description: string;
  moduleId?: string;
  isActive: boolean;
  createdAt: string;
  module?: ModuleDTO;
}

// ── Hall / Community Hall specific types ───────────────────────────

export interface HallCapacity {
  mainHallSeating: number;
  diningCapacity: number;
  guestRooms: number;
  twoWheelerParking: number;
  fourWheelerParking: number;
  kitchenSizeSqft: number;
}

export interface HallBillingItem {
  label: string;
  amount: string;
  unit: string;
}

export interface HallFacilities {
  musicSystem: boolean;
  waterSupply: boolean;
  electricityDG: boolean;
  bathroomFacility: boolean;
  kitchenAccess: boolean;
  centralAC: boolean;
  cctvMonitoring: boolean;
  fireSafetySystem: boolean;
  physicalSecurity: boolean;
  fans: boolean;
}

export interface HallTerms {
  cancellationRules: string;
  bookingRules: string;
  termsAndConditions: string;
}

export interface HallDetails {
  contactDetails: string;
  capacity: HallCapacity;
  billing: HallBillingItem[];
  facilities: HallFacilities;
  terms: HallTerms;
}

export const DEFAULT_HALL_BILLING_ITEMS: HallBillingItem[] = [
  { label: 'Base Hall Rent', amount: '', unit: 'per day' },
  { label: 'Music System Charge', amount: '', unit: 'per day' },
  { label: 'Room (Per Unit)', amount: '', unit: 'per unit' },
  { label: 'Water Utility Fee', amount: '', unit: 'flat per day' },
  { label: 'Electricity Charge', amount: '', unit: 'per day' },
  { label: 'Security Deposit', amount: '', unit: 'flat' },
  { label: 'Lighting Charges', amount: '', unit: 'per day' },
  { label: 'Gas Charges', amount: '', unit: 'per day' },
  { label: 'Damage Recovery Policy', amount: '', unit: 'as applicable' },
  { label: 'Operating Time & Noise', amount: '', unit: 'as per policy' },
];

export const DEFAULT_HALL_DETAILS: HallDetails = {
  contactDetails: '',
  capacity: {
    mainHallSeating: 0,
    diningCapacity: 0,
    guestRooms: 0,
    twoWheelerParking: 0,
    fourWheelerParking: 0,
    kitchenSizeSqft: 0,
  },
  billing: DEFAULT_HALL_BILLING_ITEMS,
  facilities: {
    musicSystem: false,
    waterSupply: false,
    electricityDG: false,
    bathroomFacility: false,
    kitchenAccess: false,
    centralAC: false,
    cctvMonitoring: false,
    fireSafetySystem: false,
    physicalSecurity: false,
    fans: false,
  },
  terms: {
    cancellationRules: '',
    bookingRules: '',
    termsAndConditions: '',
  },
};

// ── Property DTO ──────────────────────────────────────────────────

export interface PropertyDTO {
  id: string;
  estateId: string | null;
  assetTypeId: string;
  moduleId?: string;
  propertyTypeId?: string;
  name: string;
  code: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  isExempt: boolean;
  status: PropertyStatus;
  images: string[];
  amenities: string[];
  metadata: Record<string, any>;
  hallDetails?: HallDetails | null;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  estate?: EstateDTO;
  assetType?: AssetTypeDTO;
  module?: ModuleDTO;
  propertyType?: PropertyTypeDTO;
  minPrice?: number | null;
  maxPrice?: number | null;
  totalRooms?: number;
}

export interface BlockDTO {
  id: string;
  propertyId: string;
  name: string;
  code: string;
  floors: number;
  isActive: boolean;
  createdAt: string;
}

export interface FloorDTO {
  id: string;
  blockId: string;
  floorNumber: number;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface RoomTypeDTO {
  id: string;
  name: string;
  description: string;
  defaultCapacity: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface RoomDTO {
  id: string;
  floorId: string;
  roomTypeId: string;
  roomNumber: string;
  capacity: number;
  basePrice: number;
  amenities: string[];
  isSmokingAllowed: boolean;
  features: RoomFeatures;
  viewType: string;
  bedCount: number;
  bedType: string;
  metadata: Record<string, any>;
  status: RoomStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roomType?: RoomTypeDTO;
  floor?: FloorDTO;
}

export interface AmenityDTO {
  id: string;
  name: string;
  icon: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface RoomFeatures {
  hasBalcony: boolean;
  hasAC: boolean;
  hasKitchen: boolean;
  hasLivingRoom: boolean;
  hasFridge: boolean;
  isKidsFriendly: boolean;
  isPetFriendly: boolean;
  isWheelchairAccessible: boolean;
}

export const DEFAULT_ROOM_FEATURES: RoomFeatures = {
  hasBalcony: false,
  hasAC: false,
  hasKitchen: false,
  hasLivingRoom: false,
  hasFridge: false,
  isKidsFriendly: false,
  isPetFriendly: false,
  isWheelchairAccessible: false,
};

export interface CreatePropertyDTO {
  estateId: string | null;
  assetTypeId: string | null;
  moduleId: string | null;
  propertyTypeId: string | null;
  name: string;
  code: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  isExempt: boolean;
  status: PropertyStatus;
  images: string[];
  amenities: string[];
  metadata?: Record<string, any>;
  hallDetails?: HallDetails | null;
}

export interface UpdatePropertyDTO extends Partial<CreatePropertyDTO> {
  updatedBy?: string;
}

export interface CreateRoomDTO {
  floorId: string | null;
  roomTypeId: string | null;
  roomNumber: string;
  capacity: number;
  basePrice: number;
  amenities: string[];
  isSmokingAllowed: boolean;
  features?: RoomFeatures;
  viewType?: string;
  bedCount?: number;
  bedType?: string;
  metadata?: Record<string, any>;
}

export interface PropertyHierarchy {
  region: RegionDTO;
  estate: EstateDTO;
  property: PropertyDTO;
  blocks: BlockDTO[];
  floors: FloorDTO[];
  rooms: RoomDTO[];
}
