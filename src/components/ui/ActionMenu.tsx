import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'warning';
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  trigger?: React.ReactNode;
  align?: 'left' | 'right';
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  items,
  trigger,
  align = 'right',
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [open]);

  const variantStyles: Record<string, string> = {
    default: 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
    danger:  'text-red-600 hover:bg-red-50 hover:text-red-700',
    warning: 'text-amber-600 hover:bg-amber-50 hover:text-amber-700',
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 focus:outline-none"
      >
        {trigger ?? <MoreHorizontal size={15} />}
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-1 w-52 bg-white rounded-xl border border-gray-200 shadow-xl py-1.5 animate-[fadeIn_0.1s_ease-out] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          style={{ top: '100%' }}
        >
          {items.map((item, idx) => (
            <button
              key={idx}
              disabled={item.disabled}
              onClick={e => { e.stopPropagation(); setOpen(false); item.onClick(); }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                variantStyles[item.variant ?? 'default']
              }`}
            >
              {item.icon && (
                <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center opacity-70">
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
