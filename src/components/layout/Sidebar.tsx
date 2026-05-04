import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2, Home, FileText, Calendar, LayoutDashboard,
  UserCheck, Settings, Wrench, Shield, IndianRupee,
  Link as LinkIcon, ChevronLeft, ChevronRight, LogOut,
} from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';
import { useAuthStore } from '../../stores/authStore';
import { getSidebarModules, SidebarModule } from '../../utils/sidebarConfig';
import { ROLE_LABELS } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';

const ICON_MAP: Record<string, React.ReactNode> = {
  Home:          <Home size={18} />,
  Building2:     <Building2 size={18} />,
  FileText:      <FileText size={18} />,
  Calendar:      <Calendar size={18} />,
  LayoutDashboard: <LayoutDashboard size={18} />,
  UserCheck:     <UserCheck size={18} />,
  Settings:      <Settings size={18} />,
  Wrench:        <Wrench size={18} />,
  Shield:        <Shield size={18} />,
  IndianRupee:   <IndianRupee size={18} />,
  Link:          <LinkIcon size={18} />,
};

const ICON_MAP_SM: Record<string, React.ReactNode> = {
  Home:          <Home size={20} />,
  Building2:     <Building2 size={20} />,
  FileText:      <FileText size={20} />,
  Calendar:      <Calendar size={20} />,
  LayoutDashboard: <LayoutDashboard size={20} />,
  UserCheck:     <UserCheck size={20} />,
  Settings:      <Settings size={20} />,
  Wrench:        <Wrench size={20} />,
  Shield:        <Shield size={20} />,
  IndianRupee:   <IndianRupee size={20} />,
  Link:          <LinkIcon size={20} />,
};

interface CollapsedModulePinProps {
  module: SidebarModule;
  isActive: boolean;
}

const CollapsedModulePin: React.FC<CollapsedModulePinProps> = ({ module, isActive }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(module.route)}
      title={module.title}
      className={`relative group w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 ${
        isActive
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
      }`}
    >
      {ICON_MAP_SM[module.iconName]}
      {/* Tooltip */}
      <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity duration-150">
        {module.title}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
      </div>
    </button>
  );
};

export const Sidebar: React.FC = () => {
  const { isOpen, toggle, close } = useSidebar();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const modules = user ? getSidebarModules(user.role) : [];
  const initials = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const isRouteActive = (route: string) =>
    location.pathname === route ||
    (route !== '/' && location.pathname.startsWith(route + '/'));

  const isModuleActive = (module: SidebarModule) =>
    module.items.some((item) => isRouteActive(item.route));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-white border-r border-gray-200 shadow-lg transition-all duration-200 ease-in-out ${
          isOpen ? 'w-60' : 'w-16'
        } ${
          /* On mobile, slide fully off-screen when closed */
          !isOpen ? 'max-md:-translate-x-full' : ''
        }`}
      >
        {/* ── Logo / header ── */}
        <div className={`flex items-center border-b border-gray-100 flex-shrink-0 ${isOpen ? 'h-14 px-4' : 'h-14 justify-center'}`}>
          {isOpen ? (
            <Link
              to={ROUTES.HOME}
              className="flex items-center gap-2.5 group flex-1 min-w-0"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition-colors flex-shrink-0">
                <Building2 size={16} className="text-white" />
              </div>
              <span className="text-[16px] font-bold text-gray-900 tracking-tight truncate">FMS Portal</span>
            </Link>
          ) : (
            <Link to={ROUTES.HOME} className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm hover:bg-blue-700 transition-colors">
              <Building2 size={16} className="text-white" />
            </Link>
          )}
        </div>

        {/* ── User identity (expanded only) ── */}
        {isOpen && user && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 select-none shadow-sm">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">
                {user.fullName || user.email}
              </p>
              <p className="text-[11px] text-gray-500 truncate leading-tight mt-0.5">
                {ROLE_LABELS[user.role]}
              </p>
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-1">
          {isOpen ? (
            /* EXPANDED: module groups with items */
            modules.map((module) => {
              const modActive = isModuleActive(module);
              return (
                <div key={module.title} className="px-3">
                  {/* Module heading — clickable, navigates to module route */}
                  <button
                    onClick={() => navigate(module.route)}
                    className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg mb-1 transition-all group ${
                      modActive
                        ? 'text-blue-700'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <span className={`flex-shrink-0 ${modActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}`}>
                      {ICON_MAP_SM[module.iconName]}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest flex-1 text-left">
                      {module.title}
                    </span>
                  </button>

                  {/* Items */}
                  <div className="space-y-0.5 pl-1">
                    {module.items.map((item) => {
                      const active = isRouteActive(item.route);
                      return (
                        <Link
                          key={item.route}
                          to={item.route}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                            active
                              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <span className={`flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-400'}`}>
                            {ICON_MAP[item.iconName]}
                          </span>
                          <span className="truncate">{item.label}</span>
                          {active && (
                            <span className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0" />
                          )}
                        </Link>
                      );
                    })}
                  </div>

                  {/* Module separator */}
                  <div className="mt-2 mb-1 border-t border-gray-100" />
                </div>
              );
            })
          ) : (
            /* COLLAPSED: icon-only module buttons */
            <div className="flex flex-col items-center gap-2 px-3">
              {modules.map((module) => (
                <CollapsedModulePin
                  key={module.title}
                  module={module}
                  isActive={isModuleActive(module)}
                />
              ))}
            </div>
          )}
        </nav>

        {/* ── Bottom actions ── */}
        <div className={`border-t border-gray-100 flex-shrink-0 py-3 ${isOpen ? 'px-3 space-y-1' : 'flex flex-col items-center gap-2 px-3'}`}>
          {/* Logout */}
          {isOpen ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogOut size={17} className="flex-shrink-0" />
              <span>Logout</span>
            </button>
          ) : (
            <button
              onClick={handleLogout}
              title="Logout"
              className="group w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all relative"
            >
              <LogOut size={18} />
              <div className="absolute left-full ml-3 px-2 py-1 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity duration-150">
                Logout
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </div>
            </button>
          )}

          {/* Toggle expand/collapse */}
          <button
            onClick={toggle}
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className={`flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all ${
              isOpen ? 'w-full h-8 gap-2 text-xs font-medium' : 'w-10 h-10'
            }`}
          >
            {isOpen ? (
              <>
                <ChevronLeft size={15} />
                <span>Collapse</span>
              </>
            ) : (
              <ChevronRight size={18} />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
