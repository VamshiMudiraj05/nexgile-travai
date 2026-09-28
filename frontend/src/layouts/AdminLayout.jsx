import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  CalendarCheck,
  Users,
  Sparkles,
  TrendingUp,
  FileBarChart,
  Percent,
  Calendar,
  Compass,
  UserCircle,
  Luggage,
  Crown,
  User,
  LogOut,
  Menu,
  X,
  Sparkle,
  ShoppingBag,
  Wrench,
  Wallet,
  Receipt,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ROLE_BADGE_COLORS } from '../utils/constants';

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isTraveler = user?.role === 'TRAVELER';
  const isFrontDesk = user?.role === 'FRONT_DESK';
  const isRevenueManager = user?.role === 'REVENUE_MANAGER';
  const isHousekeeping = user?.role === 'HOUSEKEEPING';
  const isMaintenance = user?.role === 'MAINTENANCE';
  const isFinance = user?.role === 'FINANCE';

  // Navigation groupings strictly preserving all routes
  const adminNavGroups = [
    {
      group: 'OVERVIEW',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'PORTFOLIO',
      items: [
        { name: 'Properties', path: '/properties', icon: Building2 },
      ],
    },
    {
      group: 'OPERATIONS',
      items: [
        { name: 'Reservations', path: '/reservations', icon: CalendarCheck },
        { name: 'Housekeeping Board', path: '/housekeeping', icon: Sparkles },
        { name: 'Maintenance Board', path: '/maintenance', icon: Wrench },
        { name: 'Guests Directory', path: '/guests', icon: Users },
      ],
    },
    {
      group: 'FINANCE & BI',
      items: [
        { name: 'Financial Ledger', path: '/finance', icon: Wallet },
        { name: 'Revenue Analytics', path: '/analytics/revenue', icon: TrendingUp },
        { name: 'Occupancy', path: '/analytics/occupancy', icon: Percent },
        { name: 'Bookings Distribution', path: '/analytics/bookings', icon: Calendar },
        { name: 'Demand Forecast', path: '/analytics/forecast', icon: FileBarChart },
      ],
    },
    {
      group: 'INTELLIGENCE',
      items: [
        { name: 'Rate Recommendations', path: '/revenue/recommendations', icon: Sparkle },
      ],
    },
  ];

  const financeNavGroups = [
    {
      group: 'FINANCE & FOLIOS',
      items: [
        { name: 'Financial Overview', path: '/finance', icon: Wallet },
        { name: 'Reservations & Folios', path: '/reservations', icon: Receipt },
      ],
    },
    {
      group: 'AUDITING & BI',
      items: [
        { name: 'Revenue Analytics (RevPAR)', path: '/analytics/revenue', icon: TrendingUp },
        { name: 'Channel Distribution', path: '/analytics/bookings', icon: Calendar },
        { name: 'Revenue Forecast', path: '/analytics/forecast', icon: FileBarChart },
      ],
    },
  ];

  const revenueManagerNavGroups = [
    {
      group: 'REVENUE INTELLIGENCE',
      items: [
        { name: 'Rate Recommendations', path: '/revenue/recommendations', icon: Sparkle },
        { name: 'Revenue Overview', path: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'ANALYTICS & BI',
      items: [
        { name: 'Revenue & Yield', path: '/analytics/revenue', icon: TrendingUp },
        { name: 'Occupancy Trends', path: '/analytics/occupancy', icon: Percent },
        { name: 'Demand Forecasting', path: '/analytics/forecast', icon: FileBarChart },
        { name: 'Channel Distribution', path: '/analytics/bookings', icon: Calendar },
      ],
    },
    {
      group: 'PORTFOLIO & RATES',
      items: [
        { name: 'Properties & Rate Plans', path: '/properties', icon: Building2 },
      ],
    },
  ];

  const frontDeskNavGroups = [
    {
      group: 'FRONT DESK CORE',
      items: [
        { name: 'Front Desk Hub', path: '/frontdesk/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'OPERATIONS',
      items: [
        { name: 'Reservations', path: '/reservations', icon: CalendarCheck },
        { name: 'Housekeeping Board', path: '/housekeeping', icon: Sparkles },
        { name: 'Maintenance Board', path: '/maintenance', icon: Wrench },
        { name: 'Guests Directory', path: '/guests', icon: Users },
        { name: 'Rooms & Units', path: '/rooms', icon: BedDouble },
      ],
    },
  ];

  const housekeepingNavGroups = [
    {
      group: 'HOUSEKEEPING',
      items: [
        { name: 'Turnaround Board', path: '/housekeeping', icon: Sparkles },
        { name: 'Room Floor Inventory', path: '/rooms', icon: BedDouble },
      ],
    },
  ];

  const maintenanceNavGroups = [
    {
      group: 'ENGINEERING',
      items: [
        { name: 'Work Orders Board', path: '/maintenance', icon: Wrench },
        { name: 'Unit Diagnostics', path: '/rooms', icon: BedDouble },
      ],
    },
  ];

  const travelerNavGroups = [
    {
      group: 'TRAVELER CONCIERGE',
      items: [
        { name: 'Marketplace & Stays', path: '/marketplace', icon: ShoppingBag },
        { name: 'My Trips & Folios', path: '/my-trips', icon: Luggage },
        { name: 'Loyalty Privilege', path: '/loyalty', icon: Crown },
        { name: 'Traveler Profile', path: '/profile', icon: User },
      ],
    },
  ];

  const navGroups = isTraveler
    ? travelerNavGroups
    : isRevenueManager
    ? revenueManagerNavGroups
    : isFinance
    ? financeNavGroups
    : isHousekeeping
    ? housekeepingNavGroups
    : isMaintenance
    ? maintenanceNavGroups
    : isFrontDesk
    ? frontDeskNavGroups
    : adminNavGroups;

  const roleBadgeClass = user?.role && ROLE_BADGE_COLORS[user.role]
    ? ROLE_BADGE_COLORS[user.role]
    : 'bg-[#13152C] text-[#DFB76C] border-[#DFB76C]/30';

  // Compute editorial breadcrumb
  const currentPath = location.pathname;
  const pathSegments = currentPath.split('/').filter(Boolean);
  const breadcrumbSection = isTraveler ? 'TRAVELER' : 'HOSPITALITY';
  const breadcrumbPage = pathSegments.length > 0
    ? pathSegments[pathSegments.length - 1].toUpperCase().replace(/-/g, ' ')
    : 'OVERVIEW';

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#13152C] flex flex-col md:flex-row antialiased">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between px-5 py-3.5 bg-[#0D0E20] border-b border-[#2C315E]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[2px] bg-[#1B1E3D] border border-[#DFB76C]/40 flex items-center justify-center text-[#DFB76C]">
            <Compass className="w-4 h-4 stroke-[1.5]" />
          </div>
          <div>
            <span className="font-cinzel text-sm font-bold tracking-[0.18em] text-white">NEXGILE</span>
            <span className="font-cinzel text-[10px] tracking-[0.14em] text-[#DFB76C] ml-1">TRAVAI</span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-[#DFB76C] hover:text-white focus:outline-none cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 stroke-[1.5]" /> : <Menu className="w-5 h-5 stroke-[1.5]" />}
        </button>
      </div>

      {/* Luxury Editorial Sidebar */}
      <aside
        className={`fixed md:sticky top-0 h-screen z-40 w-64 bg-[#0D0E20] border-r border-[#2C315E]/80 flex flex-col transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-[#2C315E]/60 bg-[#0D0E20]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[2px] bg-[#13152C] border border-[#DFB76C]/40 flex items-center justify-center text-[#DFB76C] shadow-[0_2px_12px_rgba(223,183,108,0.15)] flex-shrink-0">
              <Compass className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="font-cinzel font-bold text-sm tracking-[0.22em] text-white">NEXGILE</span>
                <span className="font-cinzel font-medium text-[11px] tracking-[0.18em] text-[#DFB76C]">TRAVAI</span>
              </div>
              <div className="font-cinzel text-[8.5px] uppercase font-semibold tracking-[0.24em] text-[#DFB76C]/70 truncate mt-0.5">
                {isTraveler
                  ? 'Traveler Concierge'
                  : isRevenueManager
                  ? 'Yield & BI Suite'
                  : isFinance
                  ? 'Financial Folio'
                  : isHousekeeping
                  ? 'Operations Board'
                  : isMaintenance
                  ? 'Facility Board'
                  : isFrontDesk
                  ? 'Front Desk PMS'
                  : 'Hospitality & Travel'}
              </div>
            </div>
          </div>
          {/* Hairline gold accent rule */}
          <div className="mt-4 h-[1px] bg-gradient-to-r from-[#DFB76C]/50 via-[#DFB76C]/20 to-transparent"></div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto custom-nav-scrollbar">
          {navGroups.map((group) => (
            <div key={group.group}>
              <div className="px-3 mb-2 font-cinzel text-[9px] font-bold uppercase tracking-[0.26em] text-[#DFB76C]/60">
                {group.group}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2 rounded-[2px] text-xs transition-all duration-200 group ${
                          isActive
                            ? 'bg-[#1B1E3D] text-[#FAF6F0] border-l-2 border-[#DFB76C] font-semibold shadow-[0_2px_8px_rgba(13,14,32,0.4)]'
                            : 'text-[#FAF6F0]/65 hover:text-white hover:bg-[#13152C]/70'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 stroke-[1.5] text-[#DFB76C]/70 group-hover:text-[#DFB76C] transition-colors" />
                        <span className="font-sans tracking-wide">{item.name}</span>
                      </div>
                      <span className="text-[10px] text-[#DFB76C] opacity-0 group-hover:opacity-100 transition-opacity">
                        →
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile & Logout in Sidebar Footer */}
        <div className="p-4 border-t border-[#2C315E]/70 bg-[#0D0E20]">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-[2px] bg-[#13152C]/60 border border-[#2C315E]/40">
            <div className="w-8 h-8 rounded-[2px] bg-[#1B1E3D] border border-[#DFB76C]/30 flex items-center justify-center text-[#DFB76C] font-cinzel text-xs font-bold flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserCircle className="w-4 h-4 stroke-[1.5]" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate font-sans">{user?.name || 'Authorized Member'}</p>
              <p className="text-[10px] text-[#FAF6F0]/50 truncate font-sans">{user?.email || 'pms@nexgile.com'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className={`font-cinzel text-[8.5px] px-2 py-0.5 rounded-[2px] border font-bold tracking-[0.16em] uppercase ${roleBadgeClass}`}>
              {user?.role || 'GUEST'}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs text-[#DFB76C] hover:text-[#F2D59B] font-sans font-medium px-2 py-1 rounded-[2px] hover:bg-[#13152C] transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 stroke-[1.5]" />
              <span className="tracking-wide">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#FAF6F0]">
        {/* Top Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-3.5 border-b border-[#DFB76C]/20 bg-[#FFFFFF]/90 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="font-cinzel text-[10px] font-bold tracking-[0.24em] text-[#B88E43] uppercase">
              {breadcrumbSection}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#13152C]/30" />
            <span className="font-cinzel text-[10px] font-semibold tracking-[0.2em] text-[#13152C] uppercase">
              {breadcrumbPage}
            </span>
            <span className="mx-2 text-[#13152C]/20 font-light">|</span>
            <span className="font-cinzel text-[9px] tracking-[0.16em] text-[#2D5A40] bg-[#F2F8F4] px-2 py-0.5 rounded-[2px] border border-[#2D5A40]/25 uppercase font-semibold">
              Atlas DB Active
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs font-semibold text-[#13152C] font-sans">{user?.name}</div>
              <div className="text-[11px] text-[#13152C]/50 font-sans">{user?.email}</div>
            </div>
            <div className={`px-2.5 py-0.5 rounded-[2px] border text-[9.5px] font-bold font-cinzel tracking-[0.16em] uppercase ${roleBadgeClass}`}>
              {user?.role}
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <div className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
