import { supabase } from '../lib/supabase';
import {
  PropertyDTO,
  RegionDTO,
  EstateDTO,
  AssetTypeDTO,
  ModuleDTO,
  PropertyTypeDTO,
  RoomDTO,
  RoomTypeDTO,
  AmenityDTO,
  BlockDTO,
  FloorDTO,
  CreatePropertyDTO,
  UpdatePropertyDTO,
  CreateRoomDTO,
} from '../types';
import { sanitizeUUID } from '../utils/uuidHelpers';

export const propertyService = {
  getRegions: async (): Promise<RegionDTO[]> => {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    if (!data) return [];
    return data.map(mapRegionFromDb);
  },

  getEstates: async (regionId?: string): Promise<EstateDTO[]> => {
    let query = supabase.from('estates').select('*, region:regions(*)').eq('is_active', true);

    if (regionId) {
      query = query.eq('region_id', regionId);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;
    if (!data) return [];
    return data.map(mapEstateFromDb);
  },

  getModules: async (): Promise<ModuleDTO[]> => {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    if (!data) return [];
    return data.map(mapModuleFromDb);
  },

  getPropertyTypes: async (moduleId?: string): Promise<PropertyTypeDTO[]> => {
    let query = supabase
      .from('property_types')
      .select('*, module:modules(*)')
      .eq('is_active', true);

    if (moduleId) {
      query = query.eq('module_id', moduleId);
    }

    const { data, error } = await query.order('sort_order');

    if (error) throw error;
    if (!data) return [];
    return data.map(mapPropertyTypeFromDb);
  },

  getAssetTypes: async (): Promise<AssetTypeDTO[]> => {
    const { data, error } = await supabase
      .from('asset_types')
      .select('*, module:modules(*)')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    if (!data) return [];
    return data.map(mapAssetTypeFromDb);
  },

  getProperties: async (filters?: {
    estateId?: string;
    assetTypeId?: string;
    moduleId?: string;
    propertyTypeId?: string;
    status?: string;
    isExempt?: boolean;
  }): Promise<PropertyDTO[]> => {
    let query = supabase
      .from('properties')
      .select('*, estate:estates(*), assetType:asset_types(*), module:modules(*), propertyType:property_types(*, module:modules(*))');

    if (filters?.estateId) query = query.eq('estate_id', filters.estateId);
    if (filters?.assetTypeId) query = query.eq('asset_type_id', filters.assetTypeId);
    if (filters?.moduleId) query = query.eq('module_id', filters.moduleId);
    if (filters?.propertyTypeId) query = query.eq('property_type_id', filters.propertyTypeId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.isExempt !== undefined) query = query.eq('is_exempt', filters.isExempt);

    const { data, error } = await query.order('name');

    if (error) throw error;
    if (!data) return [];
    return data.map(mapPropertyFromDb);
  },

  getPropertyById: async (id: string): Promise<PropertyDTO | null> => {
    const { data, error } = await supabase
      .from('properties')
      .select('*, estate:estates(*), assetType:asset_types(*), module:modules(*), propertyType:property_types(*, module:modules(*))')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapPropertyFromDb(data);
  },

  checkPropertyCodeExists: async (code: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('properties')
      .select('id')
      .eq('code', code)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  createProperty: async (property: CreatePropertyDTO): Promise<PropertyDTO> => {
    const { data, error } = await supabase
      .from('properties')
      .insert([
        {
          estate_id: sanitizeUUID(property.estateId),
          asset_type_id: sanitizeUUID(property.assetTypeId),
          module_id: sanitizeUUID(property.moduleId),
          property_type_id: sanitizeUUID(property.propertyTypeId),
          name: property.name,
          code: property.code,
          description: property.description,
          address: property.address,
          latitude: property.latitude,
          longitude: property.longitude,
          is_exempt: property.isExempt,
          status: property.status,
          images: property.images,
          amenities: property.amenities,
          metadata: property.metadata || {},
        },
      ])
      .select('*, estate:estates(*), assetType:asset_types(*), module:modules(*), propertyType:property_types(*, module:modules(*))')
      .single();

    if (error) throw error;
    return mapPropertyFromDb(data);
  },

  updateProperty: async (id: string, updates: UpdatePropertyDTO): Promise<PropertyDTO> => {
    const updateData: any = { updated_at: new Date().toISOString() };

    if (updates.estateId !== undefined) updateData.estate_id = sanitizeUUID(updates.estateId);
    if (updates.assetTypeId !== undefined) updateData.asset_type_id = sanitizeUUID(updates.assetTypeId);
    if (updates.moduleId !== undefined) updateData.module_id = sanitizeUUID(updates.moduleId);
    if (updates.propertyTypeId !== undefined) updateData.property_type_id = sanitizeUUID(updates.propertyTypeId);
    if (updates.name) updateData.name = updates.name;
    if (updates.code) updateData.code = updates.code;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.latitude !== undefined) updateData.latitude = updates.latitude;
    if (updates.longitude !== undefined) updateData.longitude = updates.longitude;
    if (updates.isExempt !== undefined) updateData.is_exempt = updates.isExempt;
    if (updates.status) updateData.status = updates.status;
    if (updates.images) updateData.images = updates.images;
    if (updates.amenities) updateData.amenities = updates.amenities;
    if (updates.metadata) updateData.metadata = updates.metadata;
    if (updates.updatedBy) updateData.updated_by = sanitizeUUID(updates.updatedBy);

    const { data, error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', id)
      .select('*, estate:estates(*), assetType:asset_types(*), module:modules(*), propertyType:property_types(*, module:modules(*))')
      .single();

    if (error) throw error;
    return mapPropertyFromDb(data);
  },

  getRoomTypes: async (): Promise<RoomTypeDTO[]> => {
    const { data, error } = await supabase
      .from('room_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;
    if (!data) return [];
    return data.map(mapRoomTypeFromDb);
  },

  getRooms: async (floorId?: string): Promise<RoomDTO[]> => {
    let query = supabase
      .from('rooms')
      .select('*, roomType:room_types(*), floor:floors(*)');

    if (floorId) query = query.eq('floor_id', floorId);

    const { data, error } = await query.order('room_number');

    if (error) throw error;
    if (!data) return [];
    return data.map(mapRoomFromDb);
  },

  createRoom: async (room: CreateRoomDTO): Promise<RoomDTO> => {
    const { data, error } = await supabase
      .from('rooms')
      .insert([
        {
          floor_id: sanitizeUUID(room.floorId),
          room_type_id: sanitizeUUID(room.roomTypeId),
          room_number: room.roomNumber,
          capacity: room.capacity,
          base_price: room.basePrice,
          amenities: room.amenities,
          is_smoking_allowed: room.isSmokingAllowed,
          metadata: room.metadata || {},
        },
      ])
      .select('*, roomType:room_types(*), floor:floors(*)')
      .single();

    if (error) throw error;
    return mapRoomFromDb(data);
  },

  getAmenities: async (): Promise<AmenityDTO[]> => {
    const { data, error } = await supabase
      .from('amenities')
      .select('*')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    if (!data) return [];
    return data.map(mapAmenityFromDb);
  },

  getBlocks: async (propertyId: string): Promise<BlockDTO[]> => {
    const { data, error } = await supabase
      .from('blocks')
      .select('*')
      .eq('property_id', propertyId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    if (!data) return [];
    return data.map(mapBlockFromDb);
  },

  getFloors: async (blockId: string): Promise<FloorDTO[]> => {
    const { data, error } = await supabase
      .from('floors')
      .select('*')
      .eq('block_id', blockId)
      .eq('is_active', true)
      .order('floor_number');

    if (error) throw error;
    if (!data) return [];
    return data.map(mapFloorFromDb);
  },

  createBlock: async (block: { propertyId: string; name: string; code: string; floors: number }): Promise<BlockDTO> => {
    const { data, error } = await supabase
      .from('blocks')
      .insert([
        {
          property_id: block.propertyId,
          name: block.name,
          code: block.code,
          floors: block.floors,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return mapBlockFromDb(data);
  },

  createFloor: async (floor: { blockId: string; floorNumber: number; name: string }): Promise<FloorDTO> => {
    const { data, error } = await supabase
      .from('floors')
      .insert([
        {
          block_id: floor.blockId,
          floor_number: floor.floorNumber,
          name: floor.name,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return mapFloorFromDb(data);
  },

  updateBlock: async (id: string, updates: { name?: string; code?: string; floors?: number }): Promise<BlockDTO> => {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.code !== undefined) updateData.code = updates.code;
    if (updates.floors !== undefined) updateData.floors = updates.floors;

    const { data, error } = await supabase
      .from('blocks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapBlockFromDb(data);
  },

  updateFloor: async (id: string, updates: { floorNumber?: number; name?: string }): Promise<FloorDTO> => {
    const updateData: any = {};
    if (updates.floorNumber !== undefined) updateData.floor_number = updates.floorNumber;
    if (updates.name !== undefined) updateData.name = updates.name;

    const { data, error } = await supabase
      .from('floors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapFloorFromDb(data);
  },

  updateRoom: async (id: string, updates: Partial<CreateRoomDTO>): Promise<RoomDTO> => {
    const updateData: any = {};
    if (updates.floorId !== undefined) updateData.floor_id = sanitizeUUID(updates.floorId);
    if (updates.roomTypeId !== undefined) updateData.room_type_id = sanitizeUUID(updates.roomTypeId);
    if (updates.roomNumber !== undefined) updateData.room_number = updates.roomNumber;
    if (updates.capacity !== undefined) updateData.capacity = updates.capacity;
    if (updates.basePrice !== undefined) updateData.base_price = updates.basePrice;
    if (updates.amenities !== undefined) updateData.amenities = updates.amenities;
    if (updates.isSmokingAllowed !== undefined) updateData.is_smoking_allowed = updates.isSmokingAllowed;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

    const { data, error } = await supabase
      .from('rooms')
      .update(updateData)
      .eq('id', id)
      .select('*, roomType:room_types(*), floor:floors(*)')
      .single();

    if (error) throw error;
    return mapRoomFromDb(data);
  },

  deleteBlock: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('blocks')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  deleteFloor: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('floors')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  deleteRoom: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('rooms')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  getPropertyHierarchy: async (propertyId: string): Promise<{ property: PropertyDTO; blocks: BlockDTO[]; floors: FloorDTO[]; rooms: RoomDTO[] }> => {
    const property = await propertyService.getPropertyById(propertyId);
    if (!property) throw new Error('Property not found');

    const blocks = await propertyService.getBlocks(propertyId);

    const floorsPromises = blocks.map(block => propertyService.getFloors(block.id));
    const floorsArrays = await Promise.all(floorsPromises);
    const floors = floorsArrays.flat();

    const roomsPromises = floors.map(floor => propertyService.getRooms(floor.id));
    const roomsArrays = await Promise.all(roomsPromises);
    const rooms = roomsArrays.flat();

    return { property, blocks, floors, rooms };
  },

  createRegion: async (region: { name: string; code: string; description?: string }): Promise<RegionDTO> => {
    const { data, error } = await supabase
      .from('regions')
      .insert([
        {
          name: region.name,
          code: region.code,
          description: region.description || '',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return mapRegionFromDb(data);
  },

  updateRegion: async (id: string, updates: { name?: string; code?: string; description?: string; isActive?: boolean }): Promise<RegionDTO> => {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.code !== undefined) updateData.code = updates.code;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('regions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapRegionFromDb(data);
  },

  createEstate: async (estate: { regionId: string; name: string; code: string; city: string; state: string; address?: string; pincode?: string; latitude?: number; longitude?: number; images?: string[]; contactPerson?: string; contactEmail?: string; contactPhone?: string }): Promise<EstateDTO> => {
    const { data, error } = await supabase
      .from('estates')
      .insert([
        {
          region_id: sanitizeUUID(estate.regionId),
          name: estate.name,
          code: estate.code,
          city: estate.city,
          state: estate.state,
          address: estate.address || '',
          pincode: estate.pincode || '',
          latitude: estate.latitude,
          longitude: estate.longitude,
          images: estate.images || [],
          contact_person: estate.contactPerson || '',
          contact_email: estate.contactEmail || '',
          contact_phone: estate.contactPhone || '',
        },
      ])
      .select('*, region:regions(*)')
      .single();

    if (error) throw error;
    return mapEstateFromDb(data);
  },

  updateEstate: async (id: string, updates: { regionId?: string; name?: string; code?: string; city?: string; state?: string; address?: string; pincode?: string; latitude?: number; longitude?: number; images?: string[]; contactPerson?: string; contactEmail?: string; contactPhone?: string; isActive?: boolean }): Promise<EstateDTO> => {
    const updateData: any = {};
    if (updates.regionId !== undefined) updateData.region_id = sanitizeUUID(updates.regionId);
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.code !== undefined) updateData.code = updates.code;
    if (updates.city !== undefined) updateData.city = updates.city;
    if (updates.state !== undefined) updateData.state = updates.state;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.pincode !== undefined) updateData.pincode = updates.pincode;
    if (updates.latitude !== undefined) updateData.latitude = updates.latitude;
    if (updates.longitude !== undefined) updateData.longitude = updates.longitude;
    if (updates.images !== undefined) updateData.images = updates.images;
    if (updates.contactPerson !== undefined) updateData.contact_person = updates.contactPerson;
    if (updates.contactEmail !== undefined) updateData.contact_email = updates.contactEmail;
    if (updates.contactPhone !== undefined) updateData.contact_phone = updates.contactPhone;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('estates')
      .update(updateData)
      .eq('id', id)
      .select('*, region:regions(*)')
      .single();

    if (error) throw error;
    return mapEstateFromDb(data);
  },

  createAssetType: async (assetType: { name: string; subtype: string; category: string; description?: string; moduleId?: string }): Promise<AssetTypeDTO> => {
    const { data, error } = await supabase
      .from('asset_types')
      .insert([
        {
          name: assetType.name,
          subtype: assetType.subtype,
          category: assetType.category,
          description: assetType.description || '',
          module_id: assetType.moduleId ? sanitizeUUID(assetType.moduleId) : null,
        },
      ])
      .select('*, module:modules(*)')
      .single();

    if (error) throw error;
    return mapAssetTypeFromDb(data);
  },

  updateAssetType: async (id: string, updates: { name?: string; subtype?: string; category?: string; description?: string; moduleId?: string; isActive?: boolean }): Promise<AssetTypeDTO> => {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.subtype !== undefined) updateData.subtype = updates.subtype;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.moduleId !== undefined) updateData.module_id = updates.moduleId ? sanitizeUUID(updates.moduleId) : null;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabase
      .from('asset_types')
      .update(updateData)
      .eq('id', id)
      .select('*, module:modules(*)')
      .single();

    if (error) throw error;
    return mapAssetTypeFromDb(data);
  },
};

function mapRegionFromDb(dbRegion: any): RegionDTO {
  return {
    id: dbRegion.id,
    name: dbRegion.name,
    code: dbRegion.code,
    description: dbRegion.description || '',
    isActive: dbRegion.is_active,
    createdAt: dbRegion.created_at,
    updatedAt: dbRegion.updated_at,
  };
}

function mapEstateFromDb(dbEstate: any): EstateDTO {
  return {
    id: dbEstate.id,
    regionId: dbEstate.region_id,
    name: dbEstate.name,
    code: dbEstate.code,
    address: dbEstate.address || '',
    city: dbEstate.city || '',
    state: dbEstate.state || '',
    pincode: dbEstate.pincode || '',
    latitude: dbEstate.latitude,
    longitude: dbEstate.longitude,
    images: dbEstate.images || [],
    contactPerson: dbEstate.contact_person || '',
    contactEmail: dbEstate.contact_email || '',
    contactPhone: dbEstate.contact_phone || '',
    isActive: dbEstate.is_active,
    createdAt: dbEstate.created_at,
    updatedAt: dbEstate.updated_at,
    region: dbEstate.region ? mapRegionFromDb(dbEstate.region) : undefined,
  };
}

function mapModuleFromDb(dbModule: any): ModuleDTO {
  return {
    id: dbModule.id,
    name: dbModule.name,
    code: dbModule.code,
    description: dbModule.description || '',
    isActive: dbModule.is_active,
    createdAt: dbModule.created_at,
    updatedAt: dbModule.updated_at,
  };
}

function mapPropertyTypeFromDb(dbPropertyType: any): PropertyTypeDTO {
  return {
    id: dbPropertyType.id,
    moduleId: dbPropertyType.module_id,
    name: dbPropertyType.name,
    code: dbPropertyType.code,
    description: dbPropertyType.description || '',
    isActive: dbPropertyType.is_active,
    sortOrder: dbPropertyType.sort_order,
    createdAt: dbPropertyType.created_at,
    updatedAt: dbPropertyType.updated_at,
    module: dbPropertyType.module ? mapModuleFromDb(dbPropertyType.module) : undefined,
  };
}

function mapAssetTypeFromDb(dbAssetType: any): AssetTypeDTO {
  return {
    id: dbAssetType.id,
    name: dbAssetType.name,
    subtype: dbAssetType.subtype || '',
    category: dbAssetType.category,
    description: dbAssetType.description || '',
    moduleId: dbAssetType.module_id,
    isActive: dbAssetType.is_active,
    createdAt: dbAssetType.created_at,
    module: dbAssetType.module ? mapModuleFromDb(dbAssetType.module) : undefined,
  };
}

function mapPropertyFromDb(dbProperty: any): PropertyDTO {
  return {
    id: dbProperty.id,
    estateId: dbProperty.estate_id,
    assetTypeId: dbProperty.asset_type_id,
    moduleId: dbProperty.module_id,
    propertyTypeId: dbProperty.property_type_id,
    name: dbProperty.name,
    code: dbProperty.code,
    description: dbProperty.description || '',
    address: dbProperty.address || '',
    latitude: dbProperty.latitude,
    longitude: dbProperty.longitude,
    isExempt: dbProperty.is_exempt,
    status: dbProperty.status,
    images: dbProperty.images || [],
    amenities: dbProperty.amenities || [],
    metadata: dbProperty.metadata || {},
    createdBy: dbProperty.created_by,
    updatedBy: dbProperty.updated_by,
    createdAt: dbProperty.created_at,
    updatedAt: dbProperty.updated_at,
    estate: dbProperty.estate ? mapEstateFromDb(dbProperty.estate) : undefined,
    assetType: dbProperty.assetType ? mapAssetTypeFromDb(dbProperty.assetType) : undefined,
    module: dbProperty.module ? mapModuleFromDb(dbProperty.module) : undefined,
    propertyType: dbProperty.propertyType ? mapPropertyTypeFromDb(dbProperty.propertyType) : undefined,
  };
}

function mapRoomTypeFromDb(dbRoomType: any): RoomTypeDTO {
  return {
    id: dbRoomType.id,
    name: dbRoomType.name,
    description: dbRoomType.description || '',
    defaultCapacity: dbRoomType.default_capacity,
    sortOrder: dbRoomType.sort_order,
    isActive: dbRoomType.is_active,
    createdAt: dbRoomType.created_at,
  };
}

function mapRoomFromDb(dbRoom: any): RoomDTO {
  return {
    id: dbRoom.id,
    floorId: dbRoom.floor_id,
    roomTypeId: dbRoom.room_type_id,
    roomNumber: dbRoom.room_number,
    capacity: dbRoom.capacity,
    basePrice: dbRoom.base_price,
    amenities: dbRoom.amenities || [],
    isSmokingAllowed: dbRoom.is_smoking_allowed,
    metadata: dbRoom.metadata || {},
    status: dbRoom.status,
    isActive: dbRoom.is_active,
    createdAt: dbRoom.created_at,
    updatedAt: dbRoom.updated_at,
    roomType: dbRoom.roomType ? mapRoomTypeFromDb(dbRoom.roomType) : undefined,
    floor: dbRoom.floor ? mapFloorFromDb(dbRoom.floor) : undefined,
  };
}

function mapAmenityFromDb(dbAmenity: any): AmenityDTO {
  return {
    id: dbAmenity.id,
    name: dbAmenity.name,
    icon: dbAmenity.icon,
    category: dbAmenity.category,
    isActive: dbAmenity.is_active,
    createdAt: dbAmenity.created_at,
  };
}

function mapBlockFromDb(dbBlock: any): BlockDTO {
  return {
    id: dbBlock.id,
    propertyId: dbBlock.property_id,
    name: dbBlock.name,
    code: dbBlock.code,
    floors: dbBlock.floors,
    isActive: dbBlock.is_active,
    createdAt: dbBlock.created_at,
  };
}

function mapFloorFromDb(dbFloor: any): FloorDTO {
  return {
    id: dbFloor.id,
    blockId: dbFloor.block_id,
    floorNumber: dbFloor.floor_number,
    name: dbFloor.name || '',
    isActive: dbFloor.is_active,
    createdAt: dbFloor.created_at,
  };
}
