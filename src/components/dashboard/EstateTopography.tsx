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

const statusStyles = {
  occupied: 'bg-gradient-to-b from-green-400 to-green-600',
  available: 'bg-gradient-to-b from-blue-400 to-blue-600',
  maintenance: 'bg-gradient-to-b from-red-400 to-red-600',
};

const getStatusPercentage = (value: number, total: number) => (total > 0 ? (value / total) * 100 : 0);

export const EstateTopography: React.FC<EstateTopographyProps> = ({ siteName, blocks }) => {
  const [hoveredBlock, setHoveredBlock] = useState<TopographyBlock | null>(null);
  const maxTotal = Math.max(1, ...blocks.map((block) => block.total));

  const getBlockHeight = (block: TopographyBlock) => {
    const maxHeight = 120;
    const minHeight = 50;
    const ratio = block.total > 0 ? block.total / maxTotal : 0;
    return minHeight + ratio * (maxHeight - minHeight);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.04)]">
      <div className="mb-3 flex items-center gap-2">
        <Box size={18} className="text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-800">Estate Topography — {siteName}</h3>
      </div>

      <div
        className="relative overflow-hidden rounded-lg bg-gradient-to-b from-slate-100 to-slate-200 p-6"
        style={{ minHeight: '260px', perspective: '800px' }}
      >
        <div
          className="flex flex-wrap items-end justify-center gap-5"
          style={{ transform: 'rotateX(20deg) rotateY(-5deg)', transformStyle: 'preserve-3d' }}
        >
          {blocks.map((block) => {
            const occupied = Math.max(0, block.occupied);
            const available = Math.max(0, block.available);
            const maintenance = Math.max(0, block.maintenance);
            const statusTotal = Math.max(1, occupied + available + maintenance);
            const height = getBlockHeight(block);

            return (
              <div
                key={block.name}
                className="relative w-[78px] cursor-pointer transition-all duration-200 hover:scale-105"
                onMouseEnter={() => setHoveredBlock(block)}
                onMouseLeave={() => setHoveredBlock(null)}
                style={{ height: `${height}px`, transformStyle: 'preserve-3d' }}
                aria-label={`${block.name}: ${occupied} occupied, ${available} available, ${maintenance} under maintenance`}
              >
                <div
                  className="flex h-full w-full flex-col-reverse overflow-hidden rounded-t-md shadow-lg"
                  style={{ boxShadow: '4px 4px 12px rgba(0,0,0,0.15)' }}
                >
                  <div
                    className={`${statusStyles.occupied} flex items-center justify-center text-white`}
                    style={{ height: `${getStatusPercentage(occupied, statusTotal)}%` }}
                  >
                    {getStatusPercentage(occupied, statusTotal) >= 20 && <span className="text-[9px] font-bold">{occupied}</span>}
                  </div>
                  <div
                    className={`${statusStyles.available} flex items-center justify-center text-white`}
                    style={{ height: `${getStatusPercentage(available, statusTotal)}%` }}
                  >
                    {getStatusPercentage(available, statusTotal) >= 14 && <span className="text-[9px] font-bold">{available}</span>}
                  </div>
                  <div
                    className={`${statusStyles.maintenance} flex items-center justify-center text-white`}
                    style={{ height: `${getStatusPercentage(maintenance, statusTotal)}%` }}
                  >
                    {getStatusPercentage(maintenance, statusTotal) >= 10 && <span className="text-[9px] font-bold">{maintenance}</span>}
                  </div>
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-b-sm bg-slate-400"
                  style={{ height: '12px', transform: 'translateZ(-12px) rotateX(90deg)', transformOrigin: 'top' }}
                />
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-white drop-shadow-md">
                  <span className="block text-[10px] font-bold">{block.name}</span>
                  <span className="block text-[9px] font-semibold opacity-90">{block.total} total</span>
                </div>
              </div>
            );
          })}
        </div>

        {hoveredBlock && (
          <div className="absolute right-3 top-3 z-10 space-y-1 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg">
            <p className="text-sm font-bold text-slate-800">{hoveredBlock.name}</p>
            <p className="text-green-600">Occupied: {hoveredBlock.occupied}</p>
            <p className="text-blue-600">Available: {hoveredBlock.available}</p>
            <p className="text-red-600">Maintenance: {hoveredBlock.maintenance}</p>
            <p className="border-t border-slate-100 pt-1 text-slate-500">Total: {hoveredBlock.total}</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-green-500" />
          <span className="text-slate-600">Occupied</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-blue-500" />
          <span className="text-slate-600">Available</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-red-500" />
          <span className="text-slate-600">Maintenance</span>
        </span>
      </div>
    </div>
  );
};
