import React, { useEffect, useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Toggle } from '../ui/Toggle';
import { propertyService } from '../../services/propertyService';
import { RoomTypeDTO, AmenityDTO } from '../../types';
import { Plus, Trash2, Copy, DoorOpen, Building } from 'lucide-react';
import { FormLoadingSkeleton } from '../ui/LoadingSkeleton';

interface Room {
  tempId: string;
  blockId: string;
  floorNumber: number;
  roomNumber: string;
  roomTypeId: string | null;
  capacity: number;
  basePrice: number;
  amenities: string[];
  isSmokingAllowed: boolean;
}

interface RoomsTabProps {
  formData: {
    blocks: Array<{ tempId: string; name: string; code: string; floors: number }>;
    rooms: Room[];
  };
  updateFormData: (updates: any) => void;
}

export const RoomsTab: React.FC<RoomsTabProps> = ({ formData, updateFormData }) => {
  const [roomTypes, setRoomTypes] = useState<RoomTypeDTO[]>([]);
  const [amenities, setAmenities] = useState<AmenityDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const blocks = formData?.blocks || [];
  const rooms = formData?.rooms || [];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setError('');
      const [types, amen] = await Promise.all([
        propertyService.getRoomTypes(),
        propertyService.getAmenities(),
      ]);
      setRoomTypes(types);
      setAmenities(amen);
    } catch (error: any) {
      console.error('Failed to load room data:', error);
      setError(error.message || 'Failed to load room data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const addRoom = () => {
    const defaultBlock = blocks[0]?.tempId || '';
    const newRoom: Room = {
      tempId: `room_${Date.now()}`,
      blockId: defaultBlock,
      floorNumber: 1,
      roomNumber: '',
      roomTypeId: null,
      capacity: 1,
      basePrice: 0,
      amenities: [],
      isSmokingAllowed: false,
    };
    updateFormData({ rooms: [...rooms, newRoom] });
  };

  const cloneFromPrevious = () => {
    if (rooms.length === 0) return;

    const lastRoom = rooms[rooms.length - 1];
    const newRoom: Room = {
      ...lastRoom,
      tempId: `room_${Date.now()}`,
      roomNumber: '',
    };
    updateFormData({ rooms: [newRoom, ...rooms] });
  };

  const removeRoom = (tempId: string) => {
    updateFormData({
      rooms: rooms.filter((r) => r.tempId !== tempId),
    });
  };

  const updateRoom = (tempId: string, updates: Partial<Room>) => {
    updateFormData({
      rooms: rooms.map((r) =>
        r.tempId === tempId ? { ...r, ...updates } : r
      ),
    });
  };

  const toggleAmenity = (roomTempId: string, amenityId: string) => {
    const room = rooms.find((r) => r.tempId === roomTempId);
    if (!room) return;

    const newAmenities = room.amenities.includes(amenityId)
      ? room.amenities.filter((a) => a !== amenityId)
      : [...room.amenities, amenityId];

    updateRoom(roomTempId, { amenities: newAmenities });
  };

  const getFloorOptions = (blockId: string) => {
    const block = blocks.find((b) => b.tempId === blockId);
    if (!block) return [];
    return Array.from({ length: block.floors }, (_, i) => i + 1);
  };

  if (loading) {
    return <FormLoadingSkeleton />;
  }

  if (blocks.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Building className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-2">No blocks defined yet</p>
        <p className="text-sm text-gray-500">Please complete the "Blocks & Floors" tab first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Setup</h3>
        <p className="text-sm text-gray-600 mb-6">
          Add individual rooms to your property. Use "Clone from Previous" to quickly duplicate room configurations.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={loadData}
            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={addRoom} variant="outline" disabled={loading}>
          <Plus className="w-4 h-4 mr-2" />
          Add Room
        </Button>
        <Button
          onClick={cloneFromPrevious}
          variant="outline"
          disabled={loading || rooms.length === 0}
        >
          <Copy className="w-4 h-4 mr-2" />
          Clone from Previous
        </Button>
      </div>

      <div className="space-y-4">
        {rooms.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <DoorOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">No rooms added yet</p>
            <p className="text-sm text-gray-500">Click "Add Room" to start defining rooms</p>
          </div>
        ) : (
          rooms.map((room, index) => (
            <div
              key={room.tempId}
              className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-semibold text-gray-900">Room {index + 1}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRoom(room.tempId)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Block *
                  </label>
                  <Select
                    value={room.blockId}
                    onChange={(e) => updateRoom(room.tempId, { blockId: e.target.value, floorNumber: 1 })}
                  >
                    <option value="">Select block...</option>
                    {blocks.map((block) => (
                      <option key={block.tempId} value={block.tempId}>
                        {block.name || block.code}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Floor *
                  </label>
                  <Select
                    value={room.floorNumber}
                    onChange={(e) => updateRoom(room.tempId, { floorNumber: parseInt(e.target.value) })}
                    disabled={!room.blockId}
                  >
                    <option value="">Select floor...</option>
                    {getFloorOptions(room.blockId).map((floor) => (
                      <option key={floor} value={floor}>
                        Floor {floor}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Number *
                  </label>
                  <Input
                    type="text"
                    value={room.roomNumber}
                    onChange={(e) => updateRoom(room.tempId, { roomNumber: e.target.value })}
                    placeholder="e.g., 101"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Type *
                  </label>
                  <Select
                    value={room.roomTypeId || ''}
                    onChange={(e) => updateRoom(room.tempId, { roomTypeId: e.target.value || null })}
                    disabled={loading}
                  >
                    <option value="">Select type...</option>
                    {roomTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} (Capacity: {type.defaultCapacity})
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacity *
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={room.capacity}
                    onChange={(e) => updateRoom(room.tempId, { capacity: parseInt(e.target.value) || 1 })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Price (₹/night) *
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="100"
                    value={room.basePrice}
                    onChange={(e) => updateRoom(room.tempId, { basePrice: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Amenities
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {amenities.map((amenity) => (
                    <label
                      key={amenity.id}
                      className="flex items-center gap-2 p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={room.amenities.includes(amenity.id)}
                        onChange={() => toggleAmenity(room.tempId, amenity.id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{amenity.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium text-gray-700">Smoking Allowed</span>
                <Toggle
                  checked={room.isSmokingAllowed}
                  onChange={(checked) => updateRoom(room.tempId, { isSmokingAllowed: checked })}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {rooms.length > 0 && (
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm font-medium text-green-900">
            {rooms.length} room{rooms.length !== 1 ? 's' : ''} configured
          </p>
        </div>
      )}
    </div>
  );
};
