import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { ProfileFormContent, ProfileHeaderCard } from './ProfileFormContent';

export const ProfileDrawer: React.FC = () => {
  const { profileDrawerOpen, closeProfileDrawer } = useUIStore();

  /* Close on Escape */
  useEffect(() => {
    if (!profileDrawerOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeProfileDrawer(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [profileDrawerOpen, closeProfileDrawer]);

  /* Prevent body scroll while open */
  useEffect(() => {
    document.body.style.overflow = profileDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [profileDrawerOpen]);

  if (!profileDrawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50 transition-opacity duration-200"
        onClick={closeProfileDrawer}
      />

      {/* Drawer panel — slides in from the right */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col bg-gray-50"
        style={{ width: 'min(680px, 100vw)', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}
      >
        {/* Drawer top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="text-[14px] font-bold text-gray-900">My Profile</span>
          </div>
          <button
            onClick={closeProfileDrawer}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Close profile"
          >
            <X size={17} />
          </button>
        </div>

        {/* User identity card */}
        <ProfileHeaderCard />

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-5">
            <ProfileFormContent compact />
          </div>
        </div>
      </div>
    </>
  );
};
