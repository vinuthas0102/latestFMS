import React from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useSidebar } from '../../contexts/SidebarContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isOpen, toggle } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      {/* Main content — shifts right based on sidebar width */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          isOpen ? 'md:ml-60' : 'md:ml-16'
        } ml-0`}
      >
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center h-12 px-4 bg-white border-b border-gray-200 shadow-sm flex-shrink-0 z-20 sticky top-0">
          <button
            onClick={toggle}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 ml-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">F</span>
            </div>
            <span className="text-[15px] font-bold text-gray-900">FMS Portal</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
