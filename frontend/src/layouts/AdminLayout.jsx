import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
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
  Luggage,
  Crown,
  User,
  Menu,
  X,
  Sparkle,
  ShoppingBag,
  Wrench,
  Wallet,
  Receipt,
  ChevronRight,
  Tag,
  Briefcase,
  Radio,
  MessageSquare,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { RainbowButton } from '@/components/ui/rainbow-button';
import { GooeyMenu } from '@/components/ui/gooey-menu';
import { motion } from 'framer-motion';

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
      group: 'PORTFOLIO & DISTRIBUTION',
      items: [
        { name: 'Properties', path: '/properties', icon: Building2 },
        { name: 'Channel Manager (ARI)', path: '/distribution/channels', icon: Radio },
        { name: 'Multimodal Travel Hub', path: '/marketplace/multimodal', icon: Compass },
        { name: 'Super App & Multi-Tenancy', path: '/superapp', icon: Smartphone },
      ],
    },
    {
      group: 'OPERATIONS',
      items: [
        { name: 'Reservations', path: '/reservations', icon: CalendarCheck },
        { name: 'Housekeeping Board', path: '/housekeeping', icon: Sparkles },
        { name: 'Maintenance Board', path: '/maintenance', icon: Wrench },
        { name: 'Guests Directory', path: '/guests', icon: Users },
        { name: 'Corporate & Groups', path: '/corporate/accounts', icon: Briefcase },
        { name: 'Corporate Travel & Expense', path: '/corporate/expenses', icon: Receipt },
        { name: 'Omnichannel Dispatch', path: '/operations/omnichannel', icon: MessageSquare },
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
        { name: 'Rate Plans & Stay Rules', path: '/revenue/rate-plans', icon: Tag },
      ],
    },
  ];

  const financeNavGroups = [
    {
      group: 'FINANCE & FOLIOS',
      items: [
        { name: 'Financial Overview', path: '/finance', icon: Wallet },
        { name: 'Reservations & Folios', path: '/reservations', icon: Receipt },
        { name: 'Corporate Travel & Expense', path: '/corporate/expenses', icon: Briefcase },
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
        { name: 'Properties', path: '/properties', icon: Building2 },
        { name: 'Rate Plans & Restrictions', path: '/revenue/rate-plans', icon: Tag },
        { name: 'Channel Manager (ARI)', path: '/distribution/channels', icon: Radio },
        { name: 'Corporate Contracts', path: '/corporate/accounts', icon: Briefcase },
        { name: 'Corporate Travel & Expense', path: '/corporate/expenses', icon: Receipt },
        { name: 'Multimodal Travel Hub', path: '/marketplace/multimodal', icon: Compass },
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
        { name: 'Corporate & Groups', path: '/corporate/accounts', icon: Briefcase },
        { name: 'Omnichannel Dispatch', path: '/operations/omnichannel', icon: MessageSquare },
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
      group: 'GUEST SERVICES',
      items: [
        { name: 'Guest Dashboard', path: '/traveler/dashboard', icon: LayoutDashboard },
        { name: 'AI Concierge', path: '/concierge', icon: Sparkles },
        { name: 'Book Hotels', path: '/marketplace', icon: ShoppingBag },
        { name: 'Flights & Taxis', path: '/marketplace/multimodal', icon: Compass },
        { name: 'Support & Chat', path: '/operations/omnichannel', icon: MessageSquare },
        { name: 'Travel Wallet', path: '/superapp', icon: Smartphone },
        { name: 'Business Expenses', path: '/corporate/expenses', icon: Briefcase },
        { name: 'My Trips & Bookings', path: '/my-trips', icon: Luggage },
        { name: 'Loyalty Rewards', path: '/loyalty', icon: Crown },
        { name: 'Profile & Preferences', path: '/profile', icon: User },
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

  const displayName = user?.name
    ? user.name.replace(/\s*\(.*?\)\s*/g, '').trim() || user.name
    : 'Eleanor Vance';

  const homePath = isTraveler
    ? '/traveler/dashboard'
    : isRevenueManager
    ? '/revenue/recommendations'
    : isFinance
    ? '/finance'
    : isHousekeeping
    ? '/housekeeping'
    : isMaintenance
    ? '/maintenance'
    : isFrontDesk
    ? '/frontdesk/dashboard'
    : '/dashboard';

  // Compute editorial breadcrumb
  const currentPath = location.pathname;
  const pathSegments = currentPath.split('/').filter(Boolean);
  const breadcrumbSection = isTraveler ? 'TRAVELER' : 'HOSPITALITY';
  const breadcrumbPage = pathSegments.length > 0
    ? pathSegments[pathSegments.length - 1].toUpperCase().replace(/-/g, ' ')
    : 'OVERVIEW';

  return (
    <div className="min-h-screen bg-[#0B0C1E] text-[#FAF6F0] flex flex-col md:flex-row antialiased">
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between px-5 py-3.5 bg-[#0D0E20] border-b border-[#2C315E]">
        <Link to={homePath} className="flex items-center gap-2.5 group cursor-pointer" title="Return to Home">
          <div className="w-8 h-8 rounded-[2px] bg-[#1B1E3D] border border-[#DFB76C]/40 group-hover:border-[#DFB76C] flex items-center justify-center text-[#DFB76C] transition-colors">
            <Compass className="w-4 h-4 stroke-[1.5] group-hover:rotate-45 transition-transform duration-500 ease-out" />
          </div>
          <div>
            <span className="font-cinzel text-sm font-bold tracking-[0.18em] text-white group-hover:text-[#DFB76C] transition-colors">NEXGILE</span>
            <span className="font-cinzel text-[10px] tracking-[0.14em] text-[#DFB76C] ml-1">TRAVAI</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <GooeyMenu
            width={200}
            align="end"
            triggerLabel="Open profile menu"
            triggerStyle={{ width: 34, height: 34, borderRadius: '50%', padding: 0 }}
            surfaceClassName="bg-[#0D0E20]"
            trigger={
              <span
                aria-hidden="true"
                className="relative flex h-full w-full items-center justify-center rounded-full bg-[#1B1E3D] border border-[#DFB76C]/60 text-xs font-cinzel font-bold text-[#DFB76C] shadow-md"
              >
                {displayName.charAt(0).toUpperCase()}
                <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400 border border-[#0D0E20]" />
              </span>
            }
            options={[
              `${displayName}`,
              isTraveler ? 'My Trips' : 'Dashboard',
              'AI Concierge',
              'Sign Out',
            ]}
            optionClassName={(option) =>
              option === 'Sign Out'
                ? 'text-rose-400 hover:text-rose-300'
                : option === displayName
                ? 'text-[#DFB76C] font-semibold text-xs border-b border-[#2C315E]/40 pb-1 pointer-events-none'
                : undefined
            }
            onSelect={(opt) => {
              if (opt === 'Sign Out') handleLogout();
              else if (opt === 'My Trips') navigate('/traveler/trips');
              else if (opt === 'Dashboard') navigate(homePath);
              else if (opt === 'AI Concierge') navigate('/concierge');
            }}
          />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-[#DFB76C] hover:text-white focus:outline-none cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 stroke-[1.5]" /> : <Menu className="w-5 h-5 stroke-[1.5]" />}
          </button>
        </div>
      </div>

      {/* Luxury Editorial Sidebar */}
      <aside
        className={`fixed md:sticky top-0 h-screen z-40 w-64 bg-[#0D0E20] border-r border-[#2C315E]/80 flex flex-col transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-[#2C315E]/60 bg-[#0D0E20]">
          <Link
            to={homePath}
            title="Return to Home"
            className="flex items-center gap-3 group cursor-pointer transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-[2px] bg-[#13152C] border border-[#DFB76C]/40 group-hover:border-[#DFB76C] flex items-center justify-center text-[#DFB76C] shadow-[0_2px_12px_rgba(223,183,108,0.15)] group-hover:shadow-[0_2px_16px_rgba(223,183,108,0.35)] flex-shrink-0 transition-all">
              <Compass className="w-5 h-5 stroke-[1.5] group-hover:rotate-45 transition-transform duration-500 ease-out" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="font-cinzel font-bold text-sm tracking-[0.22em] text-white group-hover:text-[#DFB76C] transition-colors">NEXGILE</span>
                <span className="font-cinzel font-medium text-[11px] tracking-[0.18em] text-[#DFB76C]">TRAVAI</span>
              </div>
              <div className="font-cinzel text-[8.5px] uppercase font-semibold tracking-[0.24em] text-[#DFB76C]/70 group-hover:text-[#DFB76C] truncate mt-0.5 transition-colors">
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
          </Link>
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
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#0B0C1E] text-[#FAF6F0]">
        {/* Top Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-3.5 border-b border-[#2C315E] bg-[#0B0C1E]/95 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="font-cinzel text-[10px] font-bold tracking-[0.24em] text-[#DFB76C] uppercase">
              {breadcrumbSection}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#DFB76C]/40" />
            <span className="font-cinzel text-[10px] font-semibold tracking-[0.2em] text-white uppercase">
              {breadcrumbPage}
            </span>
            <span className="mx-2 text-[#2C315E] font-light">|</span>
            <span className="font-cinzel text-[9px] tracking-[0.16em] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-[2px] border border-emerald-500/25 uppercase font-semibold">
              Atlas DB Active
            </span>
          </div>

          <div className="flex items-center gap-4">
            <GooeyMenu
              width={220}
              align="end"
              triggerLabel="Open profile menu"
              triggerStyle={{ width: 38, height: 38, borderRadius: '50%', padding: 0 }}
              surfaceClassName="bg-[#0D0E20]"
              trigger={
                <span
                  aria-hidden="true"
                  className="relative flex h-full w-full items-center justify-center rounded-full bg-[#1B1E3D] border border-[#DFB76C]/60 text-xs font-cinzel font-bold text-[#DFB76C] shadow-md hover:border-[#DFB76C] transition-colors"
                  title={`${displayName} (${user?.role || 'TRAVELER'})`}
                >
                  {displayName.charAt(0).toUpperCase()}
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 border border-[#0D0E20]" />
                </span>
              }
              options={[
                `${displayName}`,
                isTraveler ? 'My Trips & Bookings' : 'Executive Dashboard',
                'AI Concierge',
                'Sign Out',
              ]}
              optionClassName={(option) =>
                option === 'Sign Out'
                  ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-950/30'
                  : option === displayName
                  ? 'text-[#DFB76C] font-semibold text-xs border-b border-[#2C315E]/40 pb-1 mb-1 pointer-events-none'
                  : undefined
              }
              onSelect={(opt) => {
                if (opt === 'Sign Out') handleLogout();
                else if (opt === 'My Trips & Bookings') navigate('/traveler/trips');
                else if (opt === 'Executive Dashboard') navigate(homePath);
                else if (opt === 'AI Concierge') navigate('/concierge');
              }}
            />
          </div>
        </header>

        {/* Page Content Viewport */}
        <div className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          <Outlet />
        </div>

        {/* Movable Floating AI Concierge Launcher */}
        {location.pathname !== '/concierge' && (
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.08}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 cursor-grab active:cursor-grabbing touch-none select-none"
            title="Drag to move across screen · Click to open AI Concierge"
          >
            <RainbowButton
              onClick={() => navigate('/concierge')}
              glow={true}
              speed={3}
              size="default"
              className="rounded-full shadow-2xl"
            >
              <Sparkles className="w-4 h-4 text-[#DFB76C] animate-pulse" />
              <span>AI CONCIERGE</span>
            </RainbowButton>
          </motion.div>
        )}
      </main>
    </div>
  );
};
