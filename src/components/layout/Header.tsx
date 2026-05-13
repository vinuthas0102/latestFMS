import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Building2, Bell, LogOut, UserCheck, Calendar, Settings,
  Wrench, Link as LinkIcon, Shield, ChevronLeft, ChevronRight,
  LayoutDashboard, Home, Download, MapPin, CreditCard, BadgeCheck, X,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';
import { ROLE_LABELS } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import { downloadPageAsHtml } from '../../utils/downloadHtml';

interface NavItem {
  route: string;
  label: string;
  icon: React.ReactNode;
}

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value?: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <div className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold leading-none mb-0.5">{label}</div>
      <div className="text-[13px] font-semibold text-gray-800 leading-tight truncate">{value || '—'}</div>
    </div>
  </div>
);

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const userPanelRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const isRegularUser = user && !isManager;

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 8);
    setShowRightArrow(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (el) el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [isManager, isAdmin]);

  useEffect(() => {
    if (!showUserPanel) return;
    const handler = (e: MouseEvent) => {
      if (userPanelRef.current && !userPanelRef.current.contains(e.target as Node)) {
        setShowUserPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showUserPanel]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({
      left: el.scrollLeft + (direction === 'left' ? -240 : 240),
      behavior: 'smooth',
    });
  };

  const baseNavItems: NavItem[] = [
    { route: ROUTES.BOOKINGS, label: 'Bookings', icon: <Calendar size={17} /> },
  ];

  const regularUserNavItems: NavItem[] = [
    { route: ROUTES.DASHBOARD, label: 'My Dashboard', icon: <LayoutDashboard size={17} /> },
    { route: ROUTES.BOOKINGS, label: 'My Bookings', icon: <Calendar size={17} /> },
  ];

  const managerNavItems: NavItem[] = [
    { route: ROUTES.PROPERTIES, label: 'Properties', icon: <Building2 size={17} /> },
    { route: ROUTES.CHECK_IN, label: 'Check-In', icon: <UserCheck size={17} /> },
    { route: ROUTES.MANAGER, label: 'Manager', icon: <Settings size={17} /> },
    { route: ROUTES.MAINTENANCE, label: 'Maintenance', icon: <Wrench size={17} /> },
    { route: '/ad-hoc-links', label: 'Links', icon: <LinkIcon size={17} /> },
  ];

  const adminNavItems: NavItem[] = [
    { route: ROUTES.ADMIN, label: 'Admin', icon: <Shield size={17} /> },
  ];

  const quartersManagerNavItem: NavItem = {
    route: ROUTES.QUARTERS_MANAGER,
    label: 'Quarters',
    icon: <Home size={17} />,
  };

  const navItems = isRegularUser
    ? regularUserNavItems
    : [
        ...baseNavItems,
        ...(isManager ? managerNavItems : []),
        ...(isAdmin ? adminNavItems : []),
      ];

  const initials = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';

  return (
    <header className="header-bar sticky top-0 z-40">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-[60px] gap-3">

          {/* Logo */}
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2.5 flex-shrink-0 group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition-colors duration-150">
              <Building2 size={19} className="text-white" />
            </div>
            <span className="text-[17px] font-bold text-gray-900 tracking-tight">FMS</span>
          </Link>

          {isAuthenticated && user ? (
            <>
              {/* Divider */}
              <div className="w-px h-7 bg-gray-200 flex-shrink-0" />

              {/* Scrollable nav strip */}
              <div className="relative flex items-stretch flex-1 min-w-0 self-stretch">
                {showLeftArrow && (
                  <button
                    onClick={() => scroll('left')}
                    className="nav-arrow-btn"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft size={15} />
                  </button>
                )}

                <div
                  ref={scrollContainerRef}
                  className="flex items-stretch overflow-x-auto scrollbar-hide flex-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {navItems.map((item) => {
                    const isActive =
                      location.pathname === item.route ||
                      (item.route !== '/' && location.pathname.startsWith(item.route + '/'));

                    return (
                      <Link
                        key={item.route}
                        to={item.route}
                        className={`nav-tab ${isActive ? 'nav-tab-active' : 'nav-tab-idle'}`}
                      >
                        <span className="nav-tab-icon">{item.icon}</span>
                        <span className="nav-tab-label">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {showRightArrow && (
                  <button
                    onClick={() => scroll('right')}
                    className="nav-arrow-btn"
                    aria-label="Scroll right"
                  >
                    <ChevronRight size={15} />
                  </button>
                )}
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2 flex-shrink-0 ml-1">
                {/* Bell */}
                <button className="header-icon-btn relative" aria-label="Notifications">
                  <Bell size={19} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                </button>

                {/* Download offline copy */}
                <button
                  className="header-icon-btn"
                  aria-label="Download offline copy"
                  title="Download Offline Copy"
                  onClick={() => downloadPageAsHtml(location.pathname)}
                >
                  <Download size={17} />
                </button>

                {/* User identity */}
                <div className="relative" ref={userPanelRef}>
                  <button
                    type="button"
                    onClick={() => setShowUserPanel(v => !v)}
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 shadow-sm hover:border-blue-300 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 select-none">
                      {initials}
                    </div>
                    <div className="text-left hidden sm:block leading-snug">
                      <div className="text-[13px] font-semibold text-gray-900 whitespace-nowrap leading-tight">
                        {user.fullName || user.email}
                      </div>
                      <div className="text-[11px] text-gray-500 whitespace-nowrap leading-tight">
                        {user.govtEmployeeId && <span className="font-mono">{user.govtEmployeeId}</span>}
                        {user.govtEmployeeId && ' · '}
                        {ROLE_LABELS[user.role]}
                      </div>
                    </div>
                  </button>

                  {/* Info popover */}
                  {showUserPanel && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl border border-gray-200 shadow-2xl z-50 overflow-hidden">
                      {/* Header */}
                      <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold flex-shrink-0 border-2 border-white/40">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-white font-bold text-sm leading-tight truncate">{user.fullName || user.email}</div>
                          <div className="text-blue-100 text-[11px] mt-0.5">{ROLE_LABELS[user.role]}</div>
                        </div>
                        <button
                          onClick={() => setShowUserPanel(false)}
                          className="ml-auto text-white/70 hover:text-white transition-colors flex-shrink-0"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      {/* Fields */}
                      <div className="px-5 py-4 space-y-3">
                        <InfoRow icon={<BadgeCheck size={13} />} label="EMP ID" value={user.govtEmployeeId} />
                        <InfoRow icon={<BadgeCheck size={13} />} label="EMP Name" value={user.fullName} />
                        <InfoRow icon={<MapPin size={13} />} label="Project Location" value={user.projectLocation} />
                        <InfoRow icon={<CreditCard size={13} />} label="SAP ID" value={user.sapId} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Logout */}
                <button onClick={handleLogout} className="header-logout-btn" aria-label="Logout">
                  <LogOut size={15} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="ml-auto">
              <Button onClick={() => navigate(ROUTES.LOGIN)}>Sign In</Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
