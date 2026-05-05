import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { BasicInfoTab } from '../components/property-creation/BasicInfoTab';
import { LocationTab } from '../components/property-creation/LocationTab';
import { BlocksFloorsTab } from '../components/property-creation/BlocksFloorsTab';
import { RoomsTab } from '../components/property-creation/RoomsTab';
import { ImagesTab } from '../components/property-creation/ImagesTab';
import { PricingTab } from '../components/property-creation/PricingTab';
import { Building2, ArrowLeft, Save } from 'lucide-react';
import { PropertyStatus } from '../types';
import { propertyService } from '../services/propertyService';
import { useUIStore } from '../stores/uiStore';
import { Spinner } from '../components/ui/Loading';
import { ROUTES } from '../constants/routes';

interface PropertyFormData {
  name: string;
  code: string;
  moduleId: string | null;
  propertyTypeId: string | null;
  assetTypeId: string | null;
  isExempt: boolean;
  estateId: string | null;
  address: string;
  latitude?: number;
  longitude?: number;
  blocks: Array<{
    id?: string;
    tempId: string;
    name: string;
    code: string;
    floors: number;
  }>;
  rooms: Array<{
    id?: string;
    tempId: string;
    blockId: string;
    floorNumber: number;
    roomNumber: string;
    roomTypeId: string | null;
    capacity: number;
    basePrice: number;
    amenities: string[];
    isSmokingAllowed: boolean;
    features?: import('../types').RoomFeatures;
    viewType?: string;
    bedCount?: number;
    bedType?: string;
  }>;
  images: string[];
  description: string;
  amenities: string[];
  status: PropertyStatus;
}

export const CreatePropertyPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const addToast = useUIStore((state) => state.addToast);
  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedPropertyId, setSavedPropertyId] = useState<string | null>(null);
  const [savedBlockIds, setSavedBlockIds] = useState<Map<string, string>>(new Map());

  const isEditMode = !!id;

  const [formData, setFormData] = useState<PropertyFormData>({
    name: '',
    code: '',
    moduleId: null,
    propertyTypeId: null,
    assetTypeId: null,
    isExempt: false,
    estateId: null,
    address: '',
    latitude: undefined,
    longitude: undefined,
    blocks: [],
    rooms: [],
    images: [],
    description: '',
    amenities: [],
    status: 'DRAFT',
  });

  const updateFormData = (updates: Partial<PropertyFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    if (isEditMode && id) {
      loadPropertyData(id);
    }
  }, [id, isEditMode]);

  const loadPropertyData = async (propertyId: string) => {
    setIsLoading(true);
    try {
      const { property, blocks, floors, rooms } = await propertyService.getPropertyHierarchy(propertyId);

      const blockIdMap = new Map<string, string>();
      const formBlocks = blocks.map((block) => {
        blockIdMap.set(block.id, block.id);
        return {
          id: block.id,
          tempId: block.id,
          name: block.name,
          code: block.code,
          floors: block.floors,
        };
      });

      const formRooms = rooms.map((room) => ({
        id: room.id,
        tempId: room.id,
        blockId: blocks.find((b) => floors.some((f) => f.id === room.floorId && f.blockId === b.id))?.id || '',
        floorNumber: floors.find((f) => f.id === room.floorId)?.floorNumber || 1,
        roomNumber: room.roomNumber,
        roomTypeId: room.roomTypeId,
        capacity: room.capacity,
        basePrice: room.basePrice,
        amenities: room.amenities,
        isSmokingAllowed: room.isSmokingAllowed,
      }));

      setFormData({
        name: property.name,
        code: property.code,
        moduleId: property.moduleId || null,
        propertyTypeId: property.propertyTypeId || null,
        assetTypeId: property.assetTypeId,
        isExempt: property.isExempt,
        estateId: property.estateId,
        address: property.address,
        latitude: property.latitude,
        longitude: property.longitude,
        blocks: formBlocks,
        rooms: formRooms,
        images: property.images,
        description: property.description,
        amenities: property.amenities,
        status: property.status,
      });

      setSavedPropertyId(propertyId);
      setSavedBlockIds(blockIdMap);
    } catch (error: any) {
      addToast(error.message || 'Failed to load property', 'error');
      navigate(ROUTES.PROPERTIES);
    } finally {
      setIsLoading(false);
    }
  };

  const isTabComplete = (tabId: string): boolean => {
    switch (tabId) {
      case 'basic':
        return !!(formData.name && formData.code && formData.moduleId && formData.propertyTypeId && formData.assetTypeId);
      case 'location':
        return !!formData.address;
      case 'blocks':
        return formData.blocks.length > 0;
      case 'rooms':
        return formData.rooms.length > 0 && formData.rooms.every(r => r.roomTypeId && r.roomNumber);
      case 'images':
        return true;
      case 'pricing':
        return true;
      default:
        return false;
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.name || !formData.code) {
      addToast('Property name and code are required to save as draft', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await saveProperty('DRAFT');
      addToast('Draft saved successfully', 'success');
    } catch (error: any) {
      addToast(error.message || 'Failed to save draft', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!isTabComplete('basic') || !isTabComplete('location') || !isTabComplete('blocks') || !isTabComplete('rooms')) {
      addToast('Please complete all required tabs before publishing', 'error');
      return;
    }

    if (!savedPropertyId && !isEditMode) {
      const codeExists = await propertyService.checkPropertyCodeExists(formData.code);
      if (codeExists) {
        addToast('Property code already exists. Please use a unique code.', 'error');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await saveProperty('PUBLISHED');
      addToast(isEditMode ? 'Property updated successfully' : 'Property published successfully', 'success');
      setTimeout(() => navigate(ROUTES.PROPERTIES), 1500);
    } catch (error: any) {
      addToast(error.message || 'Failed to publish property', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveProperty = async (status: PropertyStatus) => {
    try {
      let property;
      const propertyIdToUse = isEditMode ? id! : savedPropertyId;

      if (propertyIdToUse) {
        property = await propertyService.updateProperty(propertyIdToUse, {
          estateId: formData.estateId,
          assetTypeId: formData.assetTypeId,
          moduleId: formData.moduleId,
          propertyTypeId: formData.propertyTypeId,
          name: formData.name,
          code: formData.code,
          description: formData.description,
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          isExempt: formData.isExempt,
          status,
          images: formData.images,
          amenities: formData.amenities,
        });
      } else {
        property = await propertyService.createProperty({
          estateId: formData.estateId,
          assetTypeId: formData.assetTypeId,
          moduleId: formData.moduleId,
          propertyTypeId: formData.propertyTypeId,
          name: formData.name,
          code: formData.code,
          description: formData.description,
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          isExempt: formData.isExempt,
          status,
          images: formData.images,
          amenities: formData.amenities,
        });

        setSavedPropertyId(property.id);
      }

      const blockIdMap = new Map<string, string>(savedBlockIds);

      for (const block of formData.blocks) {
        if (block.id && savedBlockIds.has(block.tempId)) {
          try {
            await propertyService.updateBlock(block.id, {
              name: block.name,
              code: block.code,
              floors: block.floors,
            });
            blockIdMap.set(block.tempId, block.id);
          } catch (blockError: any) {
            console.error(`Failed to update block ${block.name}:`, blockError);
            throw new Error(`Failed to update block ${block.name}: ${blockError.message}`);
          }
        } else if (!savedBlockIds.has(block.tempId)) {
          try {
            const createdBlock = await propertyService.createBlock({
              propertyId: property.id,
              name: block.name,
              code: block.code,
              floors: block.floors,
            });

            blockIdMap.set(block.tempId, createdBlock.id);

            for (let floorNum = 1; floorNum <= block.floors; floorNum++) {
              try {
                await propertyService.createFloor({
                  blockId: createdBlock.id,
                  floorNumber: floorNum,
                  name: `Floor ${floorNum}`,
                });
              } catch (floorError: any) {
                console.error(`Failed to create floor ${floorNum} in block ${block.name}:`, floorError);
                throw new Error(`Failed to create floor ${floorNum} in block ${block.name}: ${floorError.message}`);
              }
            }
          } catch (blockError: any) {
            console.error(`Failed to create block ${block.name}:`, blockError);
            throw new Error(`Failed to create block ${block.name}: ${blockError.message}`);
          }
        }
      }

      setSavedBlockIds(blockIdMap);

      let successfulRooms = 0;
      let failedRooms = 0;

      for (const room of formData.rooms) {
        try {
          const actualBlockId = blockIdMap.get(room.blockId);
          if (!actualBlockId) {
            console.error(`Block mapping not found for room ${room.roomNumber}`);
            failedRooms++;
            continue;
          }

          const floors = await propertyService.getFloors(actualBlockId);
          const floor = floors.find((f) => f.floorNumber === room.floorNumber);
          if (!floor) {
            console.error(`Floor ${room.floorNumber} not found for room ${room.roomNumber}`);
            failedRooms++;
            continue;
          }

          const roomPayload = {
            floorId: floor.id,
            roomTypeId: room.roomTypeId,
            roomNumber: room.roomNumber,
            capacity: room.capacity,
            basePrice: room.basePrice,
            amenities: room.amenities,
            isSmokingAllowed: room.isSmokingAllowed,
            features: room.features,
            viewType: room.viewType,
            bedCount: room.bedCount,
            bedType: room.bedType,
          };
          if (room.id) {
            await propertyService.updateRoom(room.id, roomPayload);
          } else {
            await propertyService.createRoom(roomPayload);
          }
          successfulRooms++;
        } catch (roomError: any) {
          console.error(`Failed to ${room.id ? 'update' : 'create'} room ${room.roomNumber}:`, roomError);
          failedRooms++;
        }
      }

      if (failedRooms > 0) {
        throw new Error(`Property ${isEditMode ? 'updated' : 'created'} but ${failedRooms} out of ${formData.rooms.length} rooms failed. Please check the property and add missing rooms manually.`);
      }
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} property:`, error);
      throw error;
    }
  };

  const tabs = [
    {
      id: 'basic',
      label: '1. Basic Info',
      content: <BasicInfoTab formData={formData} updateFormData={updateFormData} />,
      isComplete: isTabComplete('basic'),
    },
    {
      id: 'location',
      label: '2. Location',
      content: <LocationTab formData={formData} updateFormData={updateFormData} />,
      isComplete: isTabComplete('location'),
    },
    {
      id: 'blocks',
      label: '3. Blocks & Floors',
      content: <BlocksFloorsTab formData={formData} updateFormData={updateFormData} />,
      isComplete: isTabComplete('blocks'),
    },
    {
      id: 'rooms',
      label: '4. Rooms',
      content: <RoomsTab formData={formData} updateFormData={updateFormData} />,
      isComplete: isTabComplete('rooms'),
    },
    {
      id: 'images',
      label: '5. Images',
      content: <ImagesTab formData={formData} updateFormData={updateFormData} />,
      isComplete: isTabComplete('images'),
    },
    {
      id: 'pricing',
      label: '6. Pricing',
      content: <PricingTab formData={formData} updateFormData={updateFormData} />,
      isComplete: isTabComplete('pricing'),
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/properties')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Loading Property...</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center h-96">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/properties')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {isEditMode ? 'Edit Property' : 'Create New Property'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isEditMode ? 'Update property details and save changes' : 'Complete all tabs and publish when ready'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={isSubmitting || !formData.name || !formData.code}
              >
                <Save className="w-4 h-4 mr-2" />
                {isEditMode ? 'Update Draft' : savedPropertyId ? 'Update Draft' : 'Save Draft'}
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isSubmitting}
              >
                {isEditMode ? 'Save Changes' : 'Publish Property'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <Tabs tabs={tabs} defaultTab={activeTab} onChange={setActiveTab} />
        </div>
      </div>
    </div>
  );
};
