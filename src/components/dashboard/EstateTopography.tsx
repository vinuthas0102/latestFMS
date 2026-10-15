import React, { useState } from 'react';
import { Box } from 'lucide-react';

interface TopographyBlock {
  name: string;
  total: number;
  occupied: number;
  maintenance: number;
  available: number;
}

interface EstateTopographyProps {
  siteName: string;
  blocks: TopographyBlock[];
}

export const EstateTopography: React.FC<EstateTopographyProps> = ({ siteName, blocks }) => {
  const [hoveredBlock, setHoveredBlock] = useState<TopographyBlock | null>(null);

  const getBlockColor = (block: TopographyBlock) => {
    const occupancyRate = block.total > 0 ? block.occupied / block.total : 0;
    if (block.maintenance > 0 && block.maintenance >= block.total * 0.3) return 'from-red-400 to-red-600';
    if (occupancyRate > 0.8) return 'from-green-400 to-green-600';
    if (occupancyRate > 0.5) return 'from-teal-400 to-teal-600';
    if (occupancyRate > 0.2) return 'from-yellow-400 to-yellow-500';
    return 'from-sky-300 to-sky-500';
  };

  const getBlockHeight = (block: TopographyBlock) => {
    const maxHeight = 120;
    const minHeight = 50;
    const ratio = block.total > 0 ? block.total / Math.max(...blocks.map((b) => b.total)) : 0;
    return minHeight + ratio * (maxHeight - minHeight);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Box size={18} className="text-blue-600" />
        <h3 className="text-sm font-semibold text-gray-800">Estate Topography — {siteName}</h3>
      </div>

      <div
        className="relative overflow-hidden rounded-lg bg-gradient-to-b from-gray-100 to-gray-200 p-8"
        style={{ minHeight: '280px', perspective: '800px' }}
      >
        <div
          className="flex flex-wrap gap-6 justify-center items-end"
          style={{ transform: 'rotateX(20deg) rotateY(-5deg)', transformStyle: 'preserve-3d' }}
        >
          {blocks.map((block, idx) => {
            const height = getBlockHeight(block);
            const colors = getBlockColor(block);
            return (
              <div
                key={idx}
                className="relative cursor-pointer transition-all duration-200 hover:scale-105"
                onMouseEnter={() => setHoveredBlock(block)}
                onMouseLeave={() => setHoveredBlock(null)}
                style={{ height: `${height}px`, width: '70px', transformStyle: 'preserve-3d' }}
              >
                <div
                  className={`bg-gradient-to-b ${colors} rounded-t-md shadow-lg w-full h-full flex flex-col items-center justify-center text-white`}
                  style={{ boxShadow: '4px 4px 12px rgba(0,0,0,0.15)' }}
                >
                  <span className="text-xs font-bold">{block.name}</span>
                  <span className="text-[10px] mt-0.5 opacity-90">{block.total} units</span>
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gray-300 rounded-b-sm"
                  style={{ height: '12px', transform: 'translateZ(-12px) rotateX(90deg)', transformOrigin: 'top' }}
                />
              </div>
            );
          })}
        </div>

        {hoveredBlock && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 text-xs space-y-1 z-10">
            <p className="font-bold text-gray-800 text-sm">{hoveredBlock.name}</p>
            <p className="text-green-600">Occupied: {hoveredBlock.occupied}</p>
            <p className="text-sky-600">Available: {hoveredBlock.available}</p>
            <p className="text-red-500">Maintenance: {hoveredBlock.maintenance}</p>
            <p className="text-gray-500 pt-1 border-t border-gray-100">Total: {hoveredBlock.total}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gradient-to-b from-green-400 to-green-600" />
          <span className="text-gray-600">High Occupancy</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gradient-to-b from-yellow-400 to-yellow-500" />
          <span className="text-gray-600">Available</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-gradient-to-b from-red-400 to-red-600" />
          <span className="text-gray-600">Maintenance</span>
        </span>
      </div>
    </div>
  );
};
