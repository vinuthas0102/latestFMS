import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ToastContainer } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useAuthStore } from './stores/authStore';

const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then(m => ({ default: m.SearchPage })));
const MapSearchPage = lazy(() => import('./pages/MapSearchPage').then(m => ({ default: m.MapSearchPage })));
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage').then(m => ({ default: m.PropertyDetailPage })));
const PropertiesPage = lazy(() => import('./pages/PropertiesPage').then(m => ({ default: m.PropertiesPage })));
const UserDashboardPage = lazy(() => import('./pages/UserDashboardPage').then(m => ({ default: m.UserDashboardPage })));
const ManagerPage = lazy(() => import('./pages/ManagerPage').then(m => ({ default: m.ManagerPage })));
const CreatePropertyPage = lazy(() => import('./pages/CreatePropertyPage').then(m => ({ default: m.CreatePropertyPage })));
const PaymentGatewayPage = lazy(() => import('./pages/PaymentGatewayPage').then(m => ({ default: m.PaymentGatewayPage })));
const BookingConfirmationPage = lazy(() => import('./pages/BookingConfirmationPage').then(m => ({ default: m.BookingConfirmationPage })));
const BookingTrackingPage = lazy(() => import('./pages/BookingTrackingPage').then(m => ({ default: m.BookingTrackingPage })));
const CheckInPage = lazy(() => import('./pages/CheckInPage').then(m => ({ default: m.CheckInPage })));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage').then(m => ({ default: m.MaintenancePage })));
const AdHocLinksPage = lazy(() => import('./pages/AdHocLinksPage').then(m => ({ default: m.AdHocLinksPage })));
const BookingHistoryPage = lazy(() => import('./pages/BookingHistoryPage').then(m => ({ default: m.BookingHistoryPage })));
const BookingDetailPage = lazy(() => import('./pages/BookingDetailPage').then(m => ({ default: m.BookingDetailPage })));
const AdHocBookingPage = lazy(() => import('./pages/AdHocBookingPage').then(m => ({ default: m.AdHocBookingPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const QuarterFreeviewPage = lazy(() => import('./pages/QuarterFreeviewPage').then(m => ({ default: m.QuarterFreeviewPage })));
const QuarterRequestsPage = lazy(() => import('./pages/QuarterRequestsPage').then(m => ({ default: m.QuarterRequestsPage })));
const QuarterManagerPage = lazy(() => import('./pages/QuarterManagerPage').then(m => ({ default: m.QuarterManagerPage })));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <BrowserRouter>
      <ToastContainer />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/map-search" element={<MapSearchPage />} />
          <Route path="/track-booking" element={<BookingTrackingPage />} />
          <Route path="/properties/:id" element={<PropertyDetailPage />} />

          <Route
            path="/properties"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <PropertiesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <ManagerPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/properties/create"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <ErrorBoundary>
                  <CreatePropertyPage />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />

          <Route
            path="/properties/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <ErrorBoundary>
                  <CreatePropertyPage />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />

          <Route
            path="/check-in"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <CheckInPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['public', 'dept_user', 'govt_official', 'admin', 'manager']}>
                <UserDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route path="/payment" element={<PaymentGatewayPage />} />
          <Route path="/booking-confirmation" element={<BookingConfirmationPage />} />

          <Route
            path="/maintenance"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <MaintenancePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ad-hoc-links"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <AdHocLinksPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bookings/history"
            element={
              <ProtectedRoute>
                <BookingHistoryPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          <Route path="/bookings" element={<Navigate to="/bookings/history" replace />} />

          <Route
            path="/bookings/:id"
            element={
              <ProtectedRoute>
                <BookingDetailPage />
              </ProtectedRoute>
            }
          />

          <Route path="/book/:token" element={<AdHocBookingPage />} />

          <Route
            path="/quarters"
            element={
              <ProtectedRoute allowedRoles={['govt_official', 'admin', 'manager']}>
                <QuarterFreeviewPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quarters/requests"
            element={
              <ProtectedRoute allowedRoles={['govt_official']}>
                <QuarterRequestsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quarters/manager"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <QuarterManagerPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
