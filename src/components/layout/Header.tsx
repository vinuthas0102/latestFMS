import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Bell, User, LogOut, Menu, Home, Search, UserCheck, Calendar, Settings, Wrench, Link as LinkIcon, Shield } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../ui/Button';
import { ROLE_LABELS } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const isManager = user?.role === 'manager' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  return (
    <header className="glass-header animate-header-gradient sticky top-0 z-40 border-b border-white/40 shadow-lg shadow-blue-100/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to={ROUTES.HOME} className="flex items-center gap-3 group transition-all duration-300">
            <div className="relative p-2 rounded-xl overflow-hidden transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-cyan-200/40">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-300/60 via-cyan-300/60 to-teal-300/60 animate-logo-gradient" />
              <Building2 className="relative text-blue-700 transition-all duration-300 group-hover:text-blue-800" size={32} />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-700 via-cyan-700 to-teal-700 bg-clip-text text-transparent">FMS</span>
          </Link>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-2">
                <Link
                  to={ROUTES.DASHBOARD}
                  className={`nav-item-dashboard px-4 py-2 rounded-xl text-sm font-medium transition-all duration-400 hover:scale-105 ${
                    location.pathname === ROUTES.DASHBOARD
                      ? 'active'
                      : 'text-gray-700'
                  }`}
                >
                  <Home className={`w-4 h-4 inline mr-2 transition-all duration-300 ${location.pathname === ROUTES.DASHBOARD ? 'animate-icon-bounce' : ''}`} />
                  Dashboard
                </Link>
                <Link
                  to={ROUTES.SEARCH}
                  className={`nav-item-search px-4 py-2 rounded-xl text-sm font-medium transition-all duration-400 hover:scale-105 ${
                    location.pathname === ROUTES.SEARCH
                      ? 'active'
                      : 'text-gray-700'
                  }`}
                >
                  <Search className={`w-4 h-4 inline mr-2 transition-all duration-300 ${location.pathname === ROUTES.SEARCH ? 'animate-icon-bounce' : ''}`} />
                  Search
                </Link>
                <Link
                  to={ROUTES.BOOKINGS}
                  className={`nav-item-bookings px-4 py-2 rounded-xl text-sm font-medium transition-all duration-400 hover:scale-105 ${
                    location.pathname.startsWith('/bookings')
                      ? 'active'
                      : 'text-gray-700'
                  }`}
                >
                  <Calendar className={`w-4 h-4 inline mr-2 transition-all duration-300 ${location.pathname.startsWith('/bookings') ? 'animate-icon-bounce' : ''}`} />
                  Bookings
                </Link>
                {isManager && (
                  <>
                    <Link
                      to={ROUTES.PROPERTIES}
                      className={`nav-item-properties px-4 py-2 rounded-xl text-sm font-medium transition-all duration-400 hover:scale-105 ${
                        location.pathname.startsWith('/properties')
                          ? 'active'
                          : 'text-gray-700'
                      }`}
                    >
                      <Building2 className={`w-4 h-4 inline mr-2 transition-all duration-300 ${location.pathname.startsWith('/properties') ? 'animate-icon-bounce' : ''}`} />
                      Properties
                    </Link>
                    <Link
                      to={ROUTES.CHECK_IN}
                      className={`nav-item-checkin px-4 py-2 rounded-xl text-sm font-medium transition-all duration-400 hover:scale-105 ${
                        location.pathname === ROUTES.CHECK_IN
                          ? 'active'
                          : 'text-gray-700'
                      }`}
                    >
                      <UserCheck className={`w-4 h-4 inline mr-2 transition-all duration-300 ${location.pathname === ROUTES.CHECK_IN ? 'animate-icon-bounce' : ''}`} />
                      Check-In
                    </Link>
                    <Link
                      to={ROUTES.MANAGER}
                      className={`nav-item-manager px-4 py-2 rounded-xl text-sm font-medium transition-all duration-400 hover:scale-105 ${
                        location.pathname === ROUTES.MANAGER
                          ? 'active'
                          : 'text-gray-700'
                      }`}
                    >
                      <Settings className={`w-4 h-4 inline mr-2 transition-all duration-300 ${location.pathname === ROUTES.MANAGER ? 'animate-icon-bounce' : ''}`} />
                      Manager
                    </Link>
                    <Link
                      to={ROUTES.MAINTENANCE}
                      className={`nav-item-maintenance px-4 py-2 rounded-xl text-sm font-medium transition-all duration-400 hover:scale-105 ${
                        location.pathname === ROUTES.MAINTENANCE
                          ? 'active'
                          : 'text-gray-700'
                      }`}
                    >
                      <Wrench className={`w-4 h-4 inline mr-2 transition-all duration-300 ${location.pathname === ROUTES.MAINTENANCE ? 'animate-icon-bounce' : ''}`} />
                      Maintenance
                    </Link>
                    <Link
                      to="/ad-hoc-links"
                      className={`nav-item-links px-4 py-2 rounded-xl text-sm font-medium transition-all duration-400 hover:scale-105 ${
                        location.pathname === '/ad-hoc-links'
                          ? 'active'
                          : 'text-gray-700'
                      }`}
                    >
                      <LinkIcon className={`w-4 h-4 inline mr-2 transition-all duration-300 ${location.pathname === '/ad-hoc-links' ? 'animate-icon-bounce' : ''}`} />
                      Links
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <Link
                    to={ROUTES.ADMIN}
                    className={`nav-item-admin px-4 py-2 rounded-xl text-sm font-medium transition-all duration-400 hover:scale-105 ${
                      location.pathname === ROUTES.ADMIN
                        ? 'active'
                        : 'text-gray-700'
                    }`}
                  >
                    <Shield className={`w-4 h-4 inline mr-2 transition-all duration-300 ${location.pathname === ROUTES.ADMIN ? 'animate-icon-bounce' : ''}`} />
                    Admin
                  </Link>
                )}
              </nav>
              <button className="relative p-2.5 text-gray-600 hover:text-cyan-700 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-md hover:shadow-cyan-200/30 group" style={{
                background: 'transparent'
              }} onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(207, 250, 254, 0.3), rgba(165, 243, 252, 0.4))';
              }} onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}>
                <Bell size={20} className="transition-all duration-300 group-hover:rotate-12" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gradient-to-br from-red-400 to-pink-500 rounded-full animate-notification-pulse shadow-md shadow-red-300/50" />
              </button>

              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-blue-200/30 border border-white/60 group" style={{
                background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.4), rgba(224, 242, 254, 0.5))'
              }}>
                <div className="relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white overflow-hidden shadow-md transition-all duration-300 group-hover:shadow-lg">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-400 animate-logo-gradient" />
                  <span className="relative z-10">{user.fullName.charAt(0) || 'U'}</span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-gray-800">{user.fullName || user.email}</div>
                  <div className="text-xs text-gray-600">{ROLE_LABELS[user.role]}</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 transition-all duration-300 hover:scale-105 hover:shadow-md group"
                style={{ background: 'transparent' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, rgba(254, 215, 215, 0.4), rgba(254, 202, 202, 0.5))';
                  e.currentTarget.style.color = 'rgb(185, 28, 28)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(254, 202, 202, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgb(55, 65, 81)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <LogOut size={16} className="inline mr-2 transition-all duration-300 group-hover:translate-x-1" />
                Logout
              </button>
            </div>
          ) : (
            <Button onClick={() => navigate(ROUTES.LOGIN)}>Sign In</Button>
          )}
        </div>
      </div>
    </header>
  );
};
