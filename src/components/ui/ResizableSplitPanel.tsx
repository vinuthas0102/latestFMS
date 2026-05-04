import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, PanelRightClose, GripVertical } from 'lucide-react';

interface ResizableSplitPanelProps {
  left: React.ReactNode;
  right: React.ReactNode | null;
  onCloseRight?: () => void;
  defaultLeftPct?: number;
  minLeftPct?: number;
  maxLeftPct?: number;
  rightHeader?: React.ReactNode;
  className?: string;
}

export const ResizableSplitPanel: React.FC<ResizableSplitPanelProps> = ({
  left,
  right,
  onCloseRight,
  defaultLeftPct = 65,
  minLeftPct = 35,
  maxLeftPct = 80,
  rightHeader,
  className = '',
}) => {
  const [leftPct, setLeftPct] = useState(defaultLeftPct);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(maxLeftPct, Math.max(minLeftPct, pct)));
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [minLeftPct, maxLeftPct]);

  const showRight = right !== null && right !== undefined;

  return (
    <div ref={containerRef} className={`flex gap-0 min-h-0 ${className}`}>
      {/* Left panel */}
      <div
        className="min-w-0 flex-shrink-0"
        style={{ width: showRight ? `${leftPct}%` : '100%', transition: dragging.current ? 'none' : 'width 0.2s ease' }}
      >
        {left}
      </div>

      {/* Drag handle */}
      {showRight && (
        <div
          onMouseDown={startDrag}
          className="flex-shrink-0 w-2.5 flex items-center justify-center cursor-col-resize group relative z-10 mx-0.5"
          title="Drag to resize"
        >
          <div className="absolute inset-y-0 w-1 bg-gray-200 group-hover:bg-blue-400 transition-colors rounded-full" />
          <div className="relative z-10 text-gray-300 group-hover:text-blue-500 transition-colors">
            <GripVertical size={14} />
          </div>
        </div>
      )}

      {/* Right panel */}
      {showRight && (
        <div
          className="min-w-0 flex-1 flex flex-col min-h-0"
          style={{ transition: dragging.current ? 'none' : 'flex 0.2s ease' }}
        >
          {/* Right panel header bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50 flex-shrink-0">
            <div className="flex-1 min-w-0">
              {rightHeader}
            </div>
            {onCloseRight && (
              <button
                onClick={onCloseRight}
                title="Close panel"
                className="ml-2 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <PanelRightClose size={15} />
              </button>
            )}
          </div>

          {/* Right panel content */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {right}
          </div>
        </div>
      )}
    </div>
  );
};
