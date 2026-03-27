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

export interface PropertyDTO {
  id: string;
  estateId: string;
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
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  estate?: EstateDTO;
  assetType?: AssetTypeDTO;
  module?: ModuleDTO;
  propertyType?: PropertyTypeDTO;
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
  isActive: boolean;
  createdAt: string;
}

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
