import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../hooks/useAuth';

// Public Pages (Code-split for instant initial FCP)
const LandingPage = lazy(() => import('../pages/LandingPage'));
const Login = lazy(() => import('../pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('../pages/Register').then((m) => ({ default: m.Register })));
const Dashboard = lazy(() => import('../pages/Dashboard'));

// Phase 2 PMS Pages
const PropertyList = lazy(() => import('../pages/properties/PropertyList').then((m) => ({ default: m.PropertyList })));
const PropertyForm = lazy(() => import('../pages/properties/PropertyForm').then((m) => ({ default: m.PropertyForm })));
const PMSPropertyDetail = lazy(() => import('../pages/properties/PropertyDetail').then((m) => ({ default: m.PropertyDetail })));
const RoomTypeList = lazy(() => import('../pages/room-types/RoomTypeList').then((m) => ({ default: m.RoomTypeList })));
const RoomList = lazy(() => import('../pages/rooms/RoomList').then((m) => ({ default: m.RoomList })));
const HousekeepingBoard = lazy(() => import('../pages/housekeeping/HousekeepingBoard').then((m) => ({ default: m.HousekeepingBoard })));
const MaintenanceBoard = lazy(() => import('../pages/maintenance/MaintenanceBoard').then((m) => ({ default: m.MaintenanceBoard })));
const FinanceOverview = lazy(() => import('../pages/finance/FinanceOverview').then((m) => ({ default: m.FinanceOverview })));
const FrontDeskDashboard = lazy(() => import('../pages/frontdesk/FrontDeskDashboard').then((m) => ({ default: m.FrontDeskDashboard })));
const GuestList = lazy(() => import('../pages/guests/GuestList').then((m) => ({ default: m.GuestList })));
const GuestForm = lazy(() => import('../pages/guests/GuestForm').then((m) => ({ default: m.GuestForm })));
const GuestDetail = lazy(() => import('../pages/guests/GuestDetail').then((m) => ({ default: m.GuestDetail })));
const ReservationList = lazy(() => import('../pages/reservations/ReservationList').then((m) => ({ default: m.ReservationList })));
const ReservationForm = lazy(() => import('../pages/reservations/ReservationForm').then((m) => ({ default: m.ReservationForm })));
const ReservationDetail = lazy(() => import('../pages/reservations/ReservationDetail').then((m) => ({ default: m.ReservationDetail })));

// Phase 4 Analytics & AI Pricing Pages
const RevenueAnalytics = lazy(() => import('../pages/analytics/RevenueAnalytics'));
const OccupancyAnalytics = lazy(() => import('../pages/analytics/OccupancyAnalytics'));
const BookingAnalytics = lazy(() => import('../pages/analytics/BookingAnalytics'));
const ForecastAnalytics = lazy(() => import('../pages/analytics/ForecastAnalytics'));
const RateRecommendations = lazy(() => import('../pages/revenue/RateRecommendations'));
const RatePlanManager = lazy(() => import('../pages/revenue/RatePlanManager'));
const CorporateAccounts = lazy(() => import('../pages/corporate/CorporateAccounts'));
const CorporateExpenseManager = lazy(() => import('../pages/corporate/CorporateExpenseManager'));
const ChannelManager = lazy(() => import('../pages/channels/ChannelManager'));

// Phase 5 Traveler Pages
const Marketplace = lazy(() => import('../pages/marketplace/Marketplace'));
const MultimodalMarketplace = lazy(() => import('../pages/marketplace/MultimodalMarketplace'));
const MarketplacePropertyDetail = lazy(() => import('../pages/marketplace/PropertyDetail'));
const BookingFlow = lazy(() => import('../pages/marketplace/BookingFlow'));
const MyTrips = lazy(() => import('../pages/traveler/MyTrips'));
const TripDetail = lazy(() => import('../pages/traveler/TripDetail'));
const Loyalty = lazy(() => import('../pages/traveler/Loyalty'));
const TravelerProfile = lazy(() => import('../pages/traveler/TravelerProfile'));
const Concierge = lazy(() => import('../pages/traveler/Concierge'));
const OmnichannelDispatchHub = lazy(() => import('../pages/concierge/OmnichannelDispatchHub'));
const MobileSuperAppHub = lazy(() => import('../pages/traveler/MobileSuperAppHub'));
const TravelerDashboard = lazy(() => import('../pages/traveler/TravelerDashboard'));

const RoleIndexRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'FRONT_DESK') return <Navigate to="/frontdesk/dashboard" replace />;
  if (user?.role === 'FINANCE') return <Navigate to="/finance" replace />;
  if (user?.role === 'MAINTENANCE') return <Navigate to="/maintenance" replace />;
  if (user?.role === 'HOUSEKEEPING') return <Navigate to="/housekeeping" replace />;
  if (user?.role === 'TRAVELER') return <Navigate to="/traveler/dashboard" replace />;
  if (user?.role === 'REVENUE_MANAGER') return <Navigate to="/revenue/recommendations" replace />;
  return <Navigate to="/dashboard" replace />;
};

export const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner text="Loading Nexgile Luxury Suite..." />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Layout & Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="app" element={<RoleIndexRedirect />} />
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
          <Route path="operations/omnichannel" element={<OmnichannelDispatchHub />} />
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
          <Route path="revenue/rate-plans" element={<RatePlanManager />} />
          <Route path="corporate/accounts" element={<CorporateAccounts />} />
          <Route path="corporate/expenses" element={<CorporateExpenseManager />} />
          <Route path="distribution/channels" element={<ChannelManager />} />

          {/* Phase 5: Traveler Experience */}
          <Route path="traveler/dashboard" element={<TravelerDashboard />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="marketplace/multimodal" element={<MultimodalMarketplace />} />
          <Route path="marketplace/properties/:property_id" element={<MarketplacePropertyDetail />} />
          <Route path="marketplace/book" element={<BookingFlow />} />
          <Route path="marketplace/checkout" element={<BookingFlow />} />
          <Route path="my-trips" element={<MyTrips />} />
          <Route path="my-trips/:reservation_id" element={<TripDetail />} />
          <Route path="loyalty" element={<Loyalty />} />
          <Route path="profile" element={<TravelerProfile />} />
          <Route path="superapp" element={<MobileSuperAppHub />} />
          <Route path="concierge" element={<Concierge />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};
