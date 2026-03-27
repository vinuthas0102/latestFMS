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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to={ROUTES.HOME} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Building2 className="text-blue-600" size={32} />
            <span className="text-xl font-bold text-gray-900">FMS</span>
          </Link>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  to={ROUTES.DASHBOARD}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === ROUTES.DASHBOARD
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Home className="w-4 h-4 inline mr-1.5" />
                  Dashboard
                </Link>
                <Link
                  to={ROUTES.SEARCH}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === ROUTES.SEARCH
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Search className="w-4 h-4 inline mr-1.5" />
                  Search
                </Link>
                <Link
                  to={ROUTES.BOOKINGS}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/bookings')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Calendar className="w-4 h-4 inline mr-1.5" />
                  Bookings
                </Link>
                {isManager && (
                  <>
                    <Link
                      to={ROUTES.PROPERTIES}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname.startsWith('/properties')
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Building2 className="w-4 h-4 inline mr-1.5" />
                      Properties
                    </Link>
                    <Link
                      to={ROUTES.CHECK_IN}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === ROUTES.CHECK_IN
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <UserCheck className="w-4 h-4 inline mr-1.5" />
                      Check-In
                    </Link>
                    <Link
                      to={ROUTES.MANAGER}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === ROUTES.MANAGER
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Settings className="w-4 h-4 inline mr-1.5" />
                      Manager
                    </Link>
                    <Link
                      to={ROUTES.MAINTENANCE}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === ROUTES.MAINTENANCE
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Wrench className="w-4 h-4 inline mr-1.5" />
                      Maintenance
                    </Link>
                    <Link
                      to="/ad-hoc-links"
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === '/ad-hoc-links'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <LinkIcon className="w-4 h-4 inline mr-1.5" />
                      Links
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <Link
                    to={ROUTES.ADMIN}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === ROUTES.ADMIN
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Shield className="w-4 h-4 inline mr-1.5" />
                    Admin
                  </Link>
                )}
              </nav>
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                  {user.fullName.charAt(0) || 'U'}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">{user.fullName || user.email}</div>
                  <div className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</div>
                </div>
              </div>

              <Button variant="ghost" size="sm" onClick={handleLogout} icon={<LogOut size={16} />}>
                Logout
              </Button>
            </div>
          ) : (
            <Button onClick={() => navigate(ROUTES.LOGIN)}>Sign In</Button>
          )}
        </div>
      </div>
    </header>
  );
};
