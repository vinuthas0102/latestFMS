import React from 'react';
import { RoomDTO, BlockDTO, FloorDTO } from '../../types';
import { Home, Users, IndianRupee, Cigarette, CigaretteOff } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface RoomsDisplayProps {
  rooms: RoomDTO[];
  blocks: BlockDTO[];
  floors: FloorDTO[];
}

export const RoomsDisplay: React.FC<RoomsDisplayProps> = ({ rooms, blocks, floors }) => {
  if (rooms.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Home className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No rooms configured</p>
      </div>
    );
  }

  const getRoomLocation = (room: RoomDTO) => {
    const floor = floors.find((f) => f.id === room.floorId);
    const block = floor ? blocks.find((b) => b.id === floor.blockId) : null;
    return { block, floor };
  };

  const groupedRooms = rooms.reduce((acc, room) => {
    const roomTypeName = room.roomType?.name || 'Unknown';
    if (!acc[roomTypeName]) {
      acc[roomTypeName] = [];
    }
    acc[roomTypeName].push(room);
    return acc;
  }, {} as Record<string, RoomDTO[]>);

  return (
    <div className="space-y-6">
      {Object.entries(groupedRooms).map(([roomTypeName, roomsOfType]) => (
        <div key={roomTypeName}>
          <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Home className="w-5 h-5 text-blue-600" />
            {roomTypeName}
            <Badge variant="default">{roomsOfType.length} rooms</Badge>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roomsOfType.map((room) => {
              const { block, floor } = getRoomLocation(room);
              return (
                <div
                  key={room.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h5 className="font-semibold text-gray-900">Room {room.roomNumber}</h5>
                      <p className="text-xs text-gray-500 mt-1">
                        {block?.name} • {floor?.name || `Floor ${floor?.floorNumber}`}
                      </p>
                    </div>
                    <Badge
                      variant={
                        room.status === 'AVAILABLE'
                          ? 'success'
                          : room.status === 'MAINTENANCE'
                          ? 'error'
                          : 'warning'
                      }
                    >
                      {room.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4" />
                        Capacity
                      </span>
                      <span className="font-medium text-gray-900">{room.capacity} guests</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-600">
                        <IndianRupee className="w-4 h-4" />
                        Base Price
                      </span>
                      <span className="font-semibold text-gray-900">₹{room.basePrice}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-gray-600">
                        {room.isSmokingAllowed ? (
                          <Cigarette className="w-4 h-4" />
                        ) : (
                          <CigaretteOff className="w-4 h-4" />
                        )}
                        Smoking
                      </span>
                      <span className="font-medium text-gray-900">
                        {room.isSmokingAllowed ? 'Allowed' : 'Not Allowed'}
                      </span>
                    </div>
                  </div>

                  {room.amenities && room.amenities.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Amenities</p>
                      <div className="flex flex-wrap gap-1">
                        {room.amenities.slice(0, 3).map((amenity, index) => (
                          <Badge key={index} variant="default" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {room.amenities.length > 3 && (
                          <Badge variant="default" className="text-xs">
                            +{room.amenities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-700">{rooms.length}</p>
            <p className="text-xs text-blue-900 mt-1">Total Rooms</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-700">
              {rooms.filter((r) => r.status === 'AVAILABLE').length}
            </p>
            <p className="text-xs text-blue-900 mt-1">Available</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-700">
              {rooms.reduce((sum, room) => sum + room.capacity, 0)}
            </p>
            <p className="text-xs text-blue-900 mt-1">Total Capacity</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-700">
              ₹{Math.min(...rooms.map((r) => r.basePrice))}
            </p>
            <p className="text-xs text-blue-900 mt-1">Starting From</p>
          </div>
        </div>
      </div>
    </div>
  );
};
