import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SearchPage } from './pages/SearchPage';
import { MapSearchPage } from './pages/MapSearchPage';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import { PropertiesPage } from './pages/PropertiesPage';
import { UserDashboardPage } from './pages/UserDashboardPage';
import { ManagerPage } from './pages/ManagerPage';
import { CreatePropertyPage } from './pages/CreatePropertyPage';
import { PaymentGatewayPage } from './pages/PaymentGatewayPage';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { BookingTrackingPage } from './pages/BookingTrackingPage';
import { CheckInPage } from './pages/CheckInPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { AdHocLinksPage } from './pages/AdHocLinksPage';
import { BookingHistoryPage } from './pages/BookingHistoryPage';
import { BookingDetailPage } from './pages/BookingDetailPage';
import { AdHocBookingPage } from './pages/AdHocBookingPage';
import { AdminPage } from './pages/AdminPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ToastContainer } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { useAuthStore } from './stores/authStore';

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <BrowserRouter>
      <ToastContainer />
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
