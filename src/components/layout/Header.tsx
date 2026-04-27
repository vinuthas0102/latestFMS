import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Bell, LogOut, Search, UserCheck, Calendar, Settings, Wrench, Link as LinkIcon, Shield, ChevronLeft, ChevronRight, MapPin, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';
import { ROLE_LABELS } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';

interface NavItem {
  route: string;
  label: string;
  icon: React.ReactNode;
  accentColor: string;
}

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const isRegularUser = user && !isManager;

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setShowLeftArrow(container.scrollLeft > 10);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll);
      }
      window.removeEventListener('resize', checkScroll);
    };
  }, [isManager, isAdmin]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 280;
    const targetScroll =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  };

  const baseNavItems: NavItem[] = [
    {
      route: ROUTES.SEARCH,
      label: 'Search',
      icon: <Search size={20} />,
      accentColor: 'rgb(6, 182, 212)',
    },
    {
      route: ROUTES.MAP_SEARCH,
      label: 'Map Search',
      icon: <MapPin size={20} />,
      accentColor: 'rgb(16, 185, 129)',
    },
    {
      route: ROUTES.BOOKINGS,
      label: 'Bookings',
      icon: <Calendar size={20} />,
      accentColor: 'rgb(245, 158, 11)',
    },
  ];

  const regularUserNavItems: NavItem[] = [
    {
      route: ROUTES.DASHBOARD,
      label: 'My Dashboard',
      icon: <LayoutDashboard size={20} />,
      accentColor: 'rgb(14, 165, 233)',
    },
    {
      route: ROUTES.SEARCH,
      label: 'Search',
      icon: <Search size={20} />,
      accentColor: 'rgb(6, 182, 212)',
    },
    {
      route: ROUTES.MAP_SEARCH,
      label: 'Map',
      icon: <MapPin size={20} />,
      accentColor: 'rgb(16, 185, 129)',
    },
  ];

  const managerNavItems: NavItem[] = [
    {
      route: ROUTES.PROPERTIES,
      label: 'Properties',
      icon: <Building2 size={20} />,
      accentColor: 'rgb(5, 150, 105)',
    },
    {
      route: ROUTES.CHECK_IN,
      label: 'Check-In',
      icon: <UserCheck size={20} />,
      accentColor: 'rgb(13, 148, 136)',
    },
    {
      route: ROUTES.MANAGER,
      label: 'Manager',
      icon: <Settings size={20} />,
      accentColor: 'rgb(71, 85, 105)',
    },
    {
      route: ROUTES.MAINTENANCE,
      label: 'Maintenance',
      icon: <Wrench size={20} />,
      accentColor: 'rgb(234, 88, 12)',
    },
    {
      route: '/ad-hoc-links',
      label: 'Links',
      icon: <LinkIcon size={20} />,
      accentColor: 'rgb(71, 85, 105)',
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      route: ROUTES.ADMIN,
      label: 'Admin',
      icon: <Shield size={20} />,
      accentColor: 'rgb(71, 85, 105)',
    },
  ];

  const navItems = isRegularUser
    ? regularUserNavItems
    : [
        ...baseNavItems,
        ...(isManager ? managerNavItems : []),
        ...(isAdmin ? adminNavItems : []),
      ];

  return (
    <header className="glass-header sticky top-0 z-40 border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-6">
          <Link to={ROUTES.HOME} className="flex items-center gap-2 group transition-all duration-200 flex-shrink-0">
            <div className="p-1.5 rounded-lg bg-blue-600 transition-all duration-200 group-hover:bg-blue-700">
              <Building2 className="text-white" size={22} />
            </div>
            <span className="text-lg font-bold text-gray-900">FMS</span>
          </Link>

          {isAuthenticated && user ? (
            <>
              <div className="relative flex-1 max-w-3xl">
                {showLeftArrow && (
                  <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-20 nav-scroll-button"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}

                <div
                  ref={scrollContainerRef}
                  className="flex gap-3 overflow-x-auto scrollbar-hide py-2 px-10"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {navItems.map((item, index) => {
                    const isActive = location.pathname === item.route || location.pathname.startsWith(item.route + '/');

                    return (
                      <Link
                        key={item.route}
                        to={item.route}
                        className={`nav-card group ${isActive ? 'nav-card-active' : ''}`}
                        style={{
                          animationDelay: `${index * 50}ms`,
                          borderColor: isActive ? item.accentColor : undefined,
                        }}
                      >
                        <div
                          className="nav-card-icon text-gray-600 group-hover:scale-105 transition-transform duration-200"
                          style={{
                            color: isActive ? item.accentColor : undefined,
                          }}
                        >
                          {item.icon}
                        </div>
                        <span
                          className="font-medium text-xs tracking-wide"
                          style={{
                            color: isActive ? item.accentColor : 'rgb(75, 85, 99)',
                          }}
                        >
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>

                {showRightArrow && (
                  <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-20 nav-scroll-button"
                    aria-label="Scroll right"
                  >
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  className="relative p-2.5 text-gray-600 hover:text-gray-900 rounded-lg transition-all duration-200 group glass-button"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-notification-pulse" />
                </button>

                <div className="flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 glass-button-static">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white bg-blue-600">
                    <span>{user.fullName.charAt(0) || 'U'}</span>
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-sm font-semibold text-gray-900">{user.fullName || user.email}</div>
                    <div className="text-xs text-gray-600">{ROLE_LABELS[user.role]}</div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 transition-all duration-200 group glass-button-logout"
                  aria-label="Logout"
                >
                  <LogOut size={16} className="inline mr-2" />
                  <span className="hidden lg:inline">Logout</span>
                </button>
              </div>
            </>
          ) : (
            <Button onClick={() => navigate(ROUTES.LOGIN)}>Sign In</Button>
          )}
        </div>
      </div>
    </header>
  );
};
