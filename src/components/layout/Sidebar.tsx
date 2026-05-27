import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Building2, Home, IndianRupee, LogOut } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { useAuthStore } from '../../stores/authStore';
import { getModuleTabs, ModuleTab } from '../../utils/sidebarConfig';
import { ROLE_LABELS } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';

const MODULE_ICONS: Record<string, React.ReactNode> = {
  Building2:   <Building2 size={22} strokeWidth={1.75} />,
  Home:        <Home size={22} strokeWidth={1.75} />,
  IndianRupee: <IndianRupee size={22} strokeWidth={1.75} />,
};

interface ModuleButtonProps {
  tab: ModuleTab;
  isActive: boolean;
  onClick: () => void;
}

const ModuleButton: React.FC<ModuleButtonProps> = ({ tab, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`relative w-full flex flex-col items-center justify-center gap-1.5 py-3.5 px-1 transition-all duration-150 group focus:outline-none ${
      isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-700'
    }`}
  >
    {/* Active left accent bar */}
    {isActive && (
      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-9 bg-blue-600 rounded-r-full" />
    )}

    {/* Icon container */}
    <span
      className={`flex items-center justify-center w-11 h-11 rounded-2xl transition-all duration-150 ${
        isActive
          ? 'bg-blue-50 text-blue-600 shadow-sm'
          : 'group-hover:bg-gray-100 group-hover:text-gray-700'
      }`}
    >
      {MODULE_ICONS[tab.iconName]}
    </span>

    {/* Label */}
    <span
      className={`text-[9px] font-bold tracking-widest uppercase leading-none ${
        isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
      }`}
    >
      {tab.title}
    </span>
  </button>
);

function isTabActive(tab: ModuleTab, pathname: string): boolean {
  // Rent uses a sub-path of /quarters — match it exactly first
  if (tab.activePrefix === '/quarters/rent') {
    return pathname === '/quarters/rent' || pathname.startsWith('/quarters/rent/');
  }
  // Quarters tab must NOT activate when on the Rent sub-path
  if (tab.activePrefix === '/quarters') {
    if (pathname === '/quarters/rent' || pathname.startsWith('/quarters/rent/')) return false;
  }
  return pathname === tab.activePrefix || pathname.startsWith(tab.activePrefix + '/');
}

const RailContent: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = user ? getModuleTabs(user.role) : [];
  const initials = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <aside className="w-16 h-full flex flex-col bg-white border-r border-gray-100" style={{ boxShadow: '1px 0 0 0 rgba(0,0,0,0.05)' }}>
      {/* ── Logo ── */}
      <div className="flex items-center justify-center h-[60px] border-b border-gray-100 flex-shrink-0">
        <button
          onClick={() => { navigate(ROUTES.HOME); onNavigate?.(); }}
          className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
          title="FMS Portal"
        >
          <Building2 size={17} className="text-white" strokeWidth={2} />
        </button>
      </div>

      {/* ── User avatar ── */}
      {user && (
        <div className="flex items-center justify-center py-3 border-b border-gray-100 flex-shrink-0">
          <div
            title={`${user.fullName || user.email} · ${ROLE_LABELS[user.role]}`}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold select-none shadow-sm ring-2 ring-white cursor-default"
          >
            {initials}
          </div>
        </div>
      )}

      {/* ── Module tabs ── */}
      <nav className="flex flex-col pt-1 flex-shrink-0">
        {tabs.map((tab) => (
          <ModuleButton
            key={tab.activePrefix}
            tab={tab}
            isActive={isTabActive(tab, location.pathname)}
            onClick={() => { navigate(tab.route); onNavigate?.(); }}
          />
        ))}
      </nav>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Divider ── */}
      <div className="mx-4 border-t border-gray-100 flex-shrink-0" />

      {/* ── Logout ── */}
      <div className="flex items-center justify-center py-4 flex-shrink-0">
        <button
          onClick={handleLogout}
          title="Logout"
          className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 active:scale-95 transition-all duration-150"
        >
          <LogOut size={18} strokeWidth={1.75} />
        </button>
      </div>
    </aside>
  );
};

export const Sidebar: React.FC = () => {
  const { isMobileOpen, closeMobile } = useSidebar();

  return (
    <>
      {/* Desktop: fixed left rail, always visible */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 z-40 w-16">
        <RailContent />
      </div>

      {/* Mobile: slide-in drawer with backdrop */}
      {isMobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={closeMobile}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 w-16 md:hidden">
            <RailContent onNavigate={closeMobile} />
          </div>
        </>
      )}

      {/* Mobile: bottom tab bar */}
      <MobileTabBar />
    </>
  );
};

const MobileTabBar: React.FC = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const tabs = user ? getModuleTabs(user.role) : [];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex items-stretch h-16" style={{ boxShadow: '0 -1px 0 rgba(0,0,0,0.06)' }}>
      {tabs.map((tab) => {
        const active = isTabActive(tab, location.pathname);
        return (
          <button
            key={tab.activePrefix}
            onClick={() => navigate(tab.route)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${
              active ? 'text-blue-600' : 'text-gray-400 active:text-gray-700'
            }`}
          >
            <span className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-all ${active ? 'bg-blue-50' : ''}`}>
              {MODULE_ICONS[tab.iconName]}
            </span>
            <span className="text-[9px] font-bold tracking-widest uppercase">{tab.title}</span>
          </button>
        );
      })}
    </nav>
  );
};
