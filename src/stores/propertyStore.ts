import { create } from 'zustand';
import { PropertyDTO, RoomTypeDTO, AmenityDTO, EstateDTO, RegionDTO, ModuleDTO, PropertyTypeDTO } from '../types';
import { propertyService } from '../services/propertyService';

interface PropertyStore {
  properties: PropertyDTO[];
  currentProperty: PropertyDTO | null;
  modules: ModuleDTO[];
  propertyTypes: PropertyTypeDTO[];
  roomTypes: RoomTypeDTO[];
  amenities: AmenityDTO[];
  estates: EstateDTO[];
  regions: RegionDTO[];
  loading: boolean;
  setProperties: (properties: PropertyDTO[]) => void;
  setCurrentProperty: (property: PropertyDTO | null) => void;
  fetchProperties: (filters?: any) => Promise<void>;
  fetchPropertyById: (id: string) => Promise<void>;
  fetchModules: () => Promise<void>;
  fetchPropertyTypes: (moduleId?: string) => Promise<void>;
  fetchRoomTypes: () => Promise<void>;
  fetchAmenities: () => Promise<void>;
  fetchEstates: (regionId?: string) => Promise<void>;
  fetchRegions: () => Promise<void>;
}

export const usePropertyStore = create<PropertyStore>((set) => ({
  properties: [],
  currentProperty: null,
  modules: [],
  propertyTypes: [],
  roomTypes: [],
  amenities: [],
  estates: [],
  regions: [],
  loading: false,

  setProperties: (properties) => set({ properties }),

  setCurrentProperty: (property) => set({ currentProperty: property }),

  fetchProperties: async (filters) => {
    set({ loading: true });
    try {
      const properties = await propertyService.getProperties(filters);
      set({ properties, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchPropertyById: async (id) => {
    set({ loading: true });
    try {
      const property = await propertyService.getPropertyById(id);
      set({ currentProperty: property, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  fetchModules: async () => {
    try {
      const modules = await propertyService.getModules();
      set({ modules });
    } catch (error) {
      throw error;
    }
  },

  fetchPropertyTypes: async (moduleId) => {
    try {
      const propertyTypes = await propertyService.getPropertyTypes(moduleId);
      set({ propertyTypes });
    } catch (error) {
      throw error;
    }
  },

  fetchRoomTypes: async () => {
    try {
      const roomTypes = await propertyService.getRoomTypes();
      set({ roomTypes });
    } catch (error) {
      throw error;
    }
  },

  fetchAmenities: async () => {
    try {
      const amenities = await propertyService.getAmenities();
      set({ amenities });
    } catch (error) {
      throw error;
    }
  },

  fetchEstates: async (regionId) => {
    try {
      const estates = await propertyService.getEstates(regionId);
      set({ estates });
    } catch (error) {
      throw error;
    }
  },

  fetchRegions: async () => {
    try {
      const regions = await propertyService.getRegions();
      set({ regions });
    } catch (error) {
      throw error;
    }
  },
}));
