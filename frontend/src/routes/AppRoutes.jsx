import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../hooks/useAuth';

// Phase 2 PMS Pages
import { PropertyList } from '../pages/properties/PropertyList';
import { PropertyForm } from '../pages/properties/PropertyForm';
import { PropertyDetail as PMSPropertyDetail } from '../pages/properties/PropertyDetail';
import { RoomTypeList } from '../pages/room-types/RoomTypeList';
import { RoomList } from '../pages/rooms/RoomList';
import { HousekeepingBoard } from '../pages/housekeeping/HousekeepingBoard';
import { MaintenanceBoard } from '../pages/maintenance/MaintenanceBoard';
import { FinanceOverview } from '../pages/finance/FinanceOverview';
import { FrontDeskDashboard } from '../pages/frontdesk/FrontDeskDashboard';
import { GuestList } from '../pages/guests/GuestList';
import { GuestForm } from '../pages/guests/GuestForm';
import { GuestDetail } from '../pages/guests/GuestDetail';
import { ReservationList } from '../pages/reservations/ReservationList';
import { ReservationForm } from '../pages/reservations/ReservationForm';
import { ReservationDetail } from '../pages/reservations/ReservationDetail';

// Phase 4 Analytics & AI Pricing Pages
import RevenueAnalytics from '../pages/analytics/RevenueAnalytics';
import OccupancyAnalytics from '../pages/analytics/OccupancyAnalytics';
import BookingAnalytics from '../pages/analytics/BookingAnalytics';
import ForecastAnalytics from '../pages/analytics/ForecastAnalytics';
import RateRecommendations from '../pages/revenue/RateRecommendations';

// Phase 5 Traveler Pages
import Marketplace from '../pages/marketplace/Marketplace';
import MarketplacePropertyDetail from '../pages/marketplace/PropertyDetail';
import BookingFlow from '../pages/marketplace/BookingFlow';
import MyTrips from '../pages/traveler/MyTrips';
import TripDetail from '../pages/traveler/TripDetail';
import Loyalty from '../pages/traveler/Loyalty';
import TravelerProfile from '../pages/traveler/TravelerProfile';

const RoleIndexRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'FRONT_DESK') return <Navigate to="/frontdesk/dashboard" replace />;
  if (user?.role === 'FINANCE') return <Navigate to="/finance" replace />;
  if (user?.role === 'MAINTENANCE') return <Navigate to="/maintenance" replace />;
  if (user?.role === 'HOUSEKEEPING') return <Navigate to="/housekeeping" replace />;
  if (user?.role === 'TRAVELER') return <Navigate to="/marketplace" replace />;
  if (user?.role === 'REVENUE_MANAGER') return <Navigate to="/revenue/recommendations" replace />;
  return <Navigate to="/dashboard" replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Layout & Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RoleIndexRedirect />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="frontdesk/dashboard" element={<FrontDeskDashboard />} />

        {/* Phase 2: PMS Management */}
        <Route path="properties" element={<PropertyList />} />
        <Route path="properties/new" element={<PropertyForm />} />
        <Route path="properties/:id" element={<PMSPropertyDetail />} />
        <Route path="properties/:id/edit" element={<PropertyForm />} />

        <Route path="room-types" element={<RoomTypeList />} />
        <Route path="rooms" element={<RoomList />} />
        <Route path="housekeeping" element={<HousekeepingBoard />} />
        <Route path="maintenance" element={<MaintenanceBoard />} />
        <Route path="finance" element={<FinanceOverview />} />

        <Route path="guests" element={<GuestList />} />
        <Route path="guests/new" element={<GuestForm />} />
        <Route path="guests/:id" element={<GuestDetail />} />
        <Route path="guests/:id/edit" element={<GuestForm />} />

        <Route path="reservations" element={<ReservationList />} />
        <Route path="reservations/new" element={<ReservationForm />} />
        <Route path="reservations/:id" element={<ReservationDetail />} />

        {/* Phase 4: Business Intelligence & Pricing */}
        <Route path="analytics/revenue" element={<RevenueAnalytics />} />
        <Route path="analytics/occupancy" element={<OccupancyAnalytics />} />
        <Route path="analytics/bookings" element={<BookingAnalytics />} />
        <Route path="analytics/forecast" element={<ForecastAnalytics />} />
        <Route path="revenue/recommendations" element={<RateRecommendations />} />

        {/* Phase 5: Traveler Experience */}
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="marketplace/properties/:property_id" element={<MarketplacePropertyDetail />} />
        <Route path="marketplace/book" element={<BookingFlow />} />
        <Route path="my-trips" element={<MyTrips />} />
        <Route path="my-trips/:reservation_id" element={<TripDetail />} />
        <Route path="loyalty" element={<Loyalty />} />
        <Route path="profile" element={<TravelerProfile />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
