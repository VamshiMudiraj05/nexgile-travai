import React, { useState, useEffect, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getRoleHomePath } from '../utils/roleRouting';
import {
  Building2,
  BedDouble,
  Percent,
  CalendarCheck,
  TrendingUp,
  IndianRupee,
  Sparkles,
  Layers,
  Wrench,
  Sparkle,
  ArrowRight,
  Clock,
  UserCheck,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import SvgAreaChart from '../components/SvgAreaChart';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cleanName = user?.name
    ? user.name.replace(/\s*\(.*?\)\s*/g, '').trim() || user.name
    : 'Administrator';

  const fetchDashboardOverview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await analyticsService.getDashboardOverview();
      setData(res);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard overview:', err);
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN' || !user?.role) {
      fetchDashboardOverview();
    }
  }, [user?.role, fetchDashboardOverview]);

  if (user?.role && user.role !== 'ADMIN') {
    return <Navigate to={getRoleHomePath(user.role)} replace />;
  }

  if (loading) {
    return <LoadingSpinner text="Loading dashboard metrics..." />;
  }

  if (error || !data) {
    return (
      <div className="rounded-[4px] border border-rose-500/40 bg-[#13152C] p-8 text-center text-rose-300 max-w-lg mx-auto shadow-md">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-400 stroke-[1.5]" />
        <h3 className="font-editorial text-xl font-bold text-white mb-1">Unable to Load Dashboard</h3>
        <p className="font-sans text-xs text-white/70 mb-4">{error || 'Failed to connect to analytics services.'}</p>
        <button
          onClick={fetchDashboardOverview}
          className="px-5 py-2 rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-[#13152C] font-cinzel text-xs font-bold uppercase transition cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  const kpis = [
    {
      eyebrow: 'PORTFOLIO',
      title: 'Total Properties',
      value: data.total_properties,
      icon: Building2,
      link: '/properties',
    },
    {
      eyebrow: 'INVENTORY',
      title: 'Total Rooms',
      value: data.total_rooms,
      icon: BedDouble,
      link: '/rooms',
    },
    {
      eyebrow: 'OCCUPANCY',
      title: 'Occupancy Rate',
      value: `${data.occupancy_rate}%`,
      icon: Percent,
      link: '/analytics/occupancy',
    },
    {
      eyebrow: 'BOOKINGS',
      title: 'Active Bookings',
      value: data.active_reservations,
      icon: CalendarCheck,
      link: '/reservations',
    },
    {
      eyebrow: 'REVENUE',
      title: 'Total Revenue',
      value: `₹${data.total_revenue?.toLocaleString()}`,
      icon: IndianRupee,
      link: '/analytics/revenue',
    },
    {
      eyebrow: 'ROOM RATE',
      title: 'Average Daily Rate',
      value: `₹${data.adr?.toLocaleString()}`,
      icon: TrendingUp,
      link: '/analytics/revenue',
    },
    {
      eyebrow: 'ARRIVALS',
      title: "Today's Check-ins",
      value: data.today_checkins,
      icon: UserCheck,
      link: '/reservations',
    },
    {
      eyebrow: 'DEPARTURES',
      title: "Today's Check-outs",
      value: data.today_checkouts,
      icon: LogOut,
      link: '/reservations',
    },
  ];

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto text-[#FAF6F0]">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-[4px] border border-[#2C315E] bg-[#13152C] p-6 sm:p-8 text-[#FAF6F0] shadow-md">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[2px] bg-[#1B1E3D] border border-[#DFB76C]/30 text-[#DFB76C] font-cinzel text-[10px] tracking-[0.2em] uppercase font-semibold mb-2">
              <Sparkles size={13} className="text-[#DFB76C]" />
              <span>MANAGEMENT OVERVIEW</span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Welcome, {cleanName}
            </h1>
            <p className="mt-1 font-sans text-xs sm:text-sm text-white/70 max-w-xl">
              Summary of your properties, occupancy rates, today's arrivals, and revenue.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/revenue/recommendations"
              className="flex items-center gap-2 px-4 py-2.5 rounded-[2px] bg-[#1B1E3D] hover:bg-[#24284F] text-[#DFB76C] border border-[#2C315E] font-cinzel text-xs font-semibold tracking-wider uppercase transition"
            >
              <Sparkle size={13} className="text-[#DFB76C]" />
              <span>Pricing Suggestions</span>
            </Link>
            <Link
              to="/reservations/new"
              className="flex items-center gap-2 px-4 py-2.5 rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-[#13152C] font-cinzel text-xs font-bold tracking-wider uppercase transition shadow-sm"
            >
              <span>+ New Booking</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={idx}
              to={kpi.link}
              className="group relative bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/60 rounded-[4px] p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-cinzel text-[9px] font-bold uppercase tracking-[0.2em] text-[#DFB76C]">
                    {kpi.eyebrow}
                  </span>
                  <div className="w-8 h-8 rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] flex items-center justify-center text-[#DFB76C] group-hover:border-[#DFB76C]/50 transition-colors">
                    <Icon size={15} strokeWidth={1.75} />
                  </div>
                </div>
                <div className="font-sans text-xs text-white/60 mt-1">{kpi.title}</div>
              </div>
              <div className="mt-4">
                <div className="font-editorial text-3xl font-bold text-white tracking-tight">
                  {kpi.value}
                </div>
                <div className="mt-2 flex items-center text-[10px] font-cinzel tracking-wider text-[#DFB76C]/70 group-hover:text-[#DFB76C] transition-colors uppercase">
                  <span>View Details</span>
                  <ArrowRight size={11} className="ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 3. Operational Highlights */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-[4px] border border-[#2C315E] bg-[#13152C] p-5 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] flex items-center justify-center text-[#DFB76C]">
              <Layers size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-cinzel text-[9px] uppercase tracking-wider text-white/50 font-bold">Housekeeping</p>
              <p className="font-editorial text-xl font-bold text-white">{data.rooms_to_clean} Rooms to Clean</p>
            </div>
          </div>
          <Link
            to="/housekeeping"
            className="px-3 py-1.5 rounded-[2px] bg-[#1B1E3D] hover:bg-[#24284F] text-[#DFB76C] border border-[#2C315E] font-cinzel text-[11px] font-bold uppercase tracking-wider transition"
          >
            View Board
          </Link>
        </div>

        <div className="flex items-center justify-between rounded-[4px] border border-[#2C315E] bg-[#13152C] p-5 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] flex items-center justify-center text-[#DFB76C]">
              <Wrench size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-cinzel text-[9px] uppercase tracking-wider text-white/50 font-bold">Maintenance</p>
              <p className="font-editorial text-xl font-bold text-white">{data.open_maintenance} Open Orders</p>
            </div>
          </div>
          <Link
            to="/maintenance"
            className="px-3 py-1.5 rounded-[2px] bg-[#1B1E3D] hover:bg-[#24284F] text-[#DFB76C] border border-[#2C315E] font-cinzel text-[11px] font-bold uppercase tracking-wider transition"
          >
            View Orders
          </Link>
        </div>

        <div className="flex items-center justify-between rounded-[4px] border border-[#2C315E] bg-[#13152C] p-5 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] flex items-center justify-center text-emerald-400">
              <Clock size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-cinzel text-[9px] uppercase tracking-wider text-white/50 font-bold">Guest Requests</p>
              <p className="font-editorial text-xl font-bold text-white">{data.pending_service_requests} Pending</p>
            </div>
          </div>
          <Link
            to="/operations/omnichannel"
            className="px-3 py-1.5 rounded-[2px] bg-[#1B1E3D] hover:bg-[#24284F] text-[#DFB76C] border border-[#2C315E] font-cinzel text-[11px] font-bold uppercase tracking-wider transition"
          >
            View Requests
          </Link>
        </div>
      </div>

      {/* 4. Visual Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#2C315E]">
            <div>
              <span className="font-cinzel text-[9px] font-bold uppercase tracking-[0.24em] text-[#DFB76C]">
                REVENUE
              </span>
              <h3 className="font-editorial text-xl font-bold text-white">Revenue (Last 14 Days)</h3>
              <p className="font-sans text-xs text-white/60 mt-0.5">Daily room revenue generated across your properties</p>
            </div>
            <Link to="/analytics/revenue" className="font-cinzel text-[10px] text-[#DFB76C] hover:text-[#F2D59B] font-semibold tracking-wider flex items-center gap-1 uppercase transition-colors">
              Details <ArrowRight size={12} />
            </Link>
          </div>
          <div className="mt-4 h-56">
            <SvgAreaChart
              data={data.revenue_chart}
              xKey="date"
              yKey="revenue"
              color="#DFB76C"
              secondaryColor="#13152C"
              unit="₹"
              height={220}
            />
          </div>
        </div>

        {/* Occupancy Chart */}
        <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#2C315E]">
            <div>
              <span className="font-cinzel text-[9px] font-bold uppercase tracking-[0.24em] text-[#DFB76C]">
                OCCUPANCY
              </span>
              <h3 className="font-editorial text-xl font-bold text-white">Occupancy Rate (%)</h3>
              <p className="font-sans text-xs text-white/60 mt-0.5">Percentage of available rooms occupied each day</p>
            </div>
            <Link to="/analytics/occupancy" className="font-cinzel text-[10px] text-[#DFB76C] hover:text-[#F2D59B] font-semibold tracking-wider flex items-center gap-1 uppercase transition-colors">
              Details <ArrowRight size={12} />
            </Link>
          </div>
          <div className="mt-4 h-56">
            <SvgAreaChart
              data={data.occupancy_chart}
              xKey="date"
              yKey="occupancy"
              color="#60A5FA"
              secondaryColor="#13152C"
              unit=""
              height={220}
            />
          </div>
        </div>
      </div>

      {/* 5. Operational Columns: Recent Bookings, Today's Arrivals, Today's Departures */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Reservations */}
        <div className="lg:col-span-1 rounded-[4px] border border-[#2C315E] bg-[#13152C] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#2C315E]">
              <div>
                <span className="font-cinzel text-[9px] uppercase tracking-wider text-[#DFB76C] font-bold">Latest Bookings</span>
                <h3 className="font-editorial text-lg font-bold text-white">Recent Bookings</h3>
              </div>
              <Link to="/reservations" className="font-cinzel text-[10px] text-[#DFB76C] hover:underline uppercase tracking-wider">
                View all →
              </Link>
            </div>
            <div className="mt-4 space-y-2.5">
              {data.recent_reservations && data.recent_reservations.length > 0 ? (
                data.recent_reservations.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between rounded-[2px] bg-[#1B1E3D] p-3 border border-[#2C315E] hover:border-[#DFB76C]/60 transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-sans text-xs font-semibold text-white truncate">{res.guest_name}</p>
                      <p className="font-sans text-[11px] text-white/60">
                        Room {res.room_number} &bull; ₹{res.total_amount?.toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge status={res.status} size="sm" />
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/40 py-6 text-center font-sans">No recent bookings recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* Today's Arrivals */}
        <div className="lg:col-span-1 rounded-[4px] border border-[#2C315E] bg-[#13152C] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#2C315E]">
              <div>
                <span className="font-cinzel text-[9px] uppercase tracking-wider text-emerald-400 font-bold">Front Desk</span>
                <h3 className="font-editorial text-lg font-bold text-white">Today's Arrivals</h3>
              </div>
              <span className="font-cinzel text-[10px] text-emerald-400 font-semibold">{data.today_arrivals?.length || 0} Guests</span>
            </div>
            <div className="mt-4 space-y-2.5">
              {data.today_arrivals && data.today_arrivals.length > 0 ? (
                data.today_arrivals.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between rounded-[2px] bg-[#1B1E3D] p-3 border border-[#2C315E] hover:border-[#DFB76C]/60 transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-sans text-xs font-semibold text-white truncate">{res.guest_name}</p>
                      <p className="font-sans text-[11px] text-white/60">
                        Room {res.room_number} &bull; {res.booking_reference}
                      </p>
                    </div>
                    <Link
                      to={`/reservations/${res.id}`}
                      className="px-3 py-1 rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-[#13152C] font-cinzel text-[10px] font-bold uppercase transition"
                    >
                      Check In
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/40 py-6 text-center font-sans">No arrivals scheduled for today.</p>
              )}
            </div>
          </div>
        </div>

        {/* Today's Departures */}
        <div className="lg:col-span-1 rounded-[4px] border border-[#2C315E] bg-[#13152C] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#2C315E]">
              <div>
                <span className="font-cinzel text-[9px] uppercase tracking-wider text-[#DFB76C] font-bold">Front Desk</span>
                <h3 className="font-editorial text-lg font-bold text-white">Today's Departures</h3>
              </div>
              <span className="font-cinzel text-[10px] text-[#DFB76C] font-semibold">{data.today_departures?.length || 0} Guests</span>
            </div>
            <div className="mt-4 space-y-2.5">
              {data.today_departures && data.today_departures.length > 0 ? (
                data.today_departures.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between rounded-[2px] bg-[#1B1E3D] p-3 border border-[#2C315E] hover:border-[#DFB76C]/60 transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-sans text-xs font-semibold text-white truncate">{res.guest_name}</p>
                      <p className="font-sans text-[11px] text-white/60">
                        Room {res.room_number} &bull; {res.booking_reference}
                      </p>
                    </div>
                    <Link
                      to={`/reservations/${res.id}`}
                      className="px-3 py-1 rounded-[2px] bg-[#1B1E3D] hover:bg-[#24284F] text-[#DFB76C] border border-[#2C315E] font-cinzel text-[10px] font-bold uppercase transition"
                    >
                      Check Out
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/40 py-6 text-center font-sans">No departures scheduled for today.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
