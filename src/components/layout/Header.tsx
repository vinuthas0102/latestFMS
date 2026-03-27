import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Bell, LogOut, Home, Search, UserCheck, Calendar, Settings, Wrench, Link as LinkIcon, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';
import { ROLE_LABELS } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';

interface NavItem {
  route: string;
  label: string;
  icon: React.ReactNode;
  colorClass: string;
  gradientClass: string;
  iconColor: string;
  glowColor: string;
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
      route: ROUTES.DASHBOARD,
      label: 'Dashboard',
      icon: <Home size={20} />,
      colorClass: 'from-blue-400/20 via-blue-300/20 to-sky-300/20',
      gradientClass: 'from-blue-500/80 via-blue-400/80 to-sky-400/80',
      iconColor: 'text-blue-600',
      glowColor: 'shadow-blue-200/30',
    },
    {
      route: ROUTES.SEARCH,
      label: 'Search',
      icon: <Search size={20} />,
      colorClass: 'from-cyan-400/20 via-cyan-300/20 to-teal-300/20',
      gradientClass: 'from-cyan-500/80 via-cyan-400/80 to-teal-400/80',
      iconColor: 'text-cyan-600',
      glowColor: 'shadow-cyan-200/30',
    },
    {
      route: ROUTES.BOOKINGS,
      label: 'Bookings',
      icon: <Calendar size={20} />,
      colorClass: 'from-amber-400/20 via-yellow-300/20 to-amber-300/20',
      gradientClass: 'from-amber-500/80 via-yellow-400/80 to-amber-400/80',
      iconColor: 'text-amber-600',
      glowColor: 'shadow-amber-200/30',
    },
  ];

  const managerNavItems: NavItem[] = [
    {
      route: ROUTES.PROPERTIES,
      label: 'Properties',
      icon: <Building2 size={20} />,
      colorClass: 'from-emerald-400/20 via-green-300/20 to-emerald-300/20',
      gradientClass: 'from-emerald-500/80 via-green-400/80 to-emerald-400/80',
      iconColor: 'text-emerald-600',
      glowColor: 'shadow-emerald-200/30',
    },
    {
      route: ROUTES.CHECK_IN,
      label: 'Check-In',
      icon: <UserCheck size={20} />,
      colorClass: 'from-teal-400/20 via-teal-300/20 to-cyan-300/20',
      gradientClass: 'from-teal-500/80 via-teal-400/80 to-cyan-400/80',
      iconColor: 'text-teal-600',
      glowColor: 'shadow-teal-200/30',
    },
    {
      route: ROUTES.MANAGER,
      label: 'Manager',
      icon: <Settings size={20} />,
      colorClass: 'from-rose-400/20 via-pink-300/20 to-rose-300/20',
      gradientClass: 'from-rose-500/80 via-pink-400/80 to-rose-400/80',
      iconColor: 'text-rose-600',
      glowColor: 'shadow-rose-200/30',
    },
    {
      route: ROUTES.MAINTENANCE,
      label: 'Maintenance',
      icon: <Wrench size={20} />,
      colorClass: 'from-orange-400/20 via-orange-300/20 to-amber-300/20',
      gradientClass: 'from-orange-500/80 via-orange-400/80 to-amber-400/80',
      iconColor: 'text-orange-600',
      glowColor: 'shadow-orange-200/30',
    },
    {
      route: '/ad-hoc-links',
      label: 'Links',
      icon: <LinkIcon size={20} />,
      colorClass: 'from-violet-400/20 via-purple-300/20 to-violet-300/20',
      gradientClass: 'from-violet-500/80 via-purple-400/80 to-violet-400/80',
      iconColor: 'text-violet-600',
      glowColor: 'shadow-violet-200/30',
    },
  ];

  const adminNavItems: NavItem[] = [
    {
      route: ROUTES.ADMIN,
      label: 'Admin',
      icon: <Shield size={20} />,
      colorClass: 'from-fuchsia-400/20 via-pink-300/20 to-fuchsia-300/20',
      gradientClass: 'from-fuchsia-500/80 via-pink-400/80 to-fuchsia-400/80',
      iconColor: 'text-fuchsia-600',
      glowColor: 'shadow-fuchsia-200/30',
    },
  ];

  const navItems = [
    ...baseNavItems,
    ...(isManager ? managerNavItems : []),
    ...(isAdmin ? adminNavItems : []),
  ];

  return (
    <header className="glass-header animate-header-gradient sticky top-0 z-40 border-b border-white/40 shadow-lg shadow-blue-100/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-6">
          <Link to={ROUTES.HOME} className="flex items-center gap-3 group transition-all duration-300 flex-shrink-0">
            <div className="relative p-2 rounded-xl overflow-hidden transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-cyan-200/40">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-300/60 via-cyan-300/60 to-teal-300/60 animate-logo-gradient" />
              <Building2 className="relative text-blue-700 transition-all duration-300 group-hover:text-blue-800" size={32} />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-700 via-cyan-700 to-teal-700 bg-clip-text text-transparent">FMS</span>
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
                        }}
                      >
                        <div className={`nav-card-icon-container bg-gradient-to-br ${item.gradientClass}`}>
                          <div className={`nav-card-icon ${item.iconColor}`}>
                            {item.icon}
                          </div>
                        </div>
                        <span className="font-semibold text-sm">{item.label}</span>
                        {isActive && (
                          <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r ${item.gradientClass} shadow-md ${item.glowColor}`} />
                        )}
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
                  className="relative p-2.5 text-gray-600 hover:text-cyan-700 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-md hover:shadow-cyan-200/30 group glass-button"
                  aria-label="Notifications"
                >
                  <Bell size={20} className="transition-all duration-300 group-hover:rotate-12" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gradient-to-br from-red-400 to-pink-500 rounded-full animate-notification-pulse shadow-md shadow-red-300/50" />
                </button>

                <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-blue-200/30 border border-white/60 glass-button-static group">
                  <div className="relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white overflow-hidden shadow-md transition-all duration-300 group-hover:shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400 animate-logo-gradient" />
                    <span className="relative z-10">{user.fullName.charAt(0) || 'U'}</span>
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-sm font-semibold text-gray-800">{user.fullName || user.email}</div>
                    <div className="text-xs text-gray-600">{ROLE_LABELS[user.role]}</div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-md group glass-button-logout"
                  aria-label="Logout"
                >
                  <LogOut size={16} className="inline mr-2 transition-all duration-300 group-hover:translate-x-1" />
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
