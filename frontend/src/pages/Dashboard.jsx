import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Building2,
  BedDouble,
  Percent,
  CalendarCheck,
  TrendingUp,
  DollarSign,
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

  if (user?.role === 'FRONT_DESK') {
    return <Navigate to="/frontdesk/dashboard" replace />;
  }
  if (user?.role === 'FINANCE') {
    return <Navigate to="/finance" replace />;
  }
  if (user?.role === 'MAINTENANCE') {
    return <Navigate to="/maintenance" replace />;
  }
  if (user?.role === 'HOUSEKEEPING') {
    return <Navigate to="/housekeeping" replace />;
  }
  if (user?.role === 'TRAVELER') {
    return <Navigate to="/marketplace" replace />;
  }

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardOverview();
  }, []);

  const fetchDashboardOverview = async () => {
    try {
      setLoading(true);
      const res = await analyticsService.getDashboardOverview();
      setData(res);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard overview:', err);
      setError('Unable to load real-time analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Aggregating live PMS & Business Intelligence metrics..." />;
  }

  if (error || !data) {
    return (
      <div className="rounded-[4px] border border-[#993A3A]/30 bg-[#FDF2F2] p-8 text-center text-[#993A3A] max-w-lg mx-auto shadow-sm">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 stroke-[1.5]" />
        <h3 className="font-editorial text-xl font-normal mb-1">Intelligence Feed Unavailable</h3>
        <p className="font-sans text-xs text-[#993A3A]/80 mb-4">{error || 'Failed to connect to analytics services.'}</p>
        <button
          onClick={fetchDashboardOverview}
          className="btn-luxury-primary text-xs"
        >
          Retry Aggregation
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
      format: (v) => v,
    },
    {
      eyebrow: 'INVENTORY',
      title: 'Total Rooms',
      value: data.total_rooms,
      icon: BedDouble,
      link: '/rooms',
      format: (v) => v,
    },
    {
      eyebrow: 'PERFORMANCE',
      title: 'Occupancy Rate',
      value: `${data.occupancy_rate}%`,
      icon: Percent,
      link: '/analytics/occupancy',
      format: (v) => v,
    },
    {
      eyebrow: 'OPERATIONS',
      title: 'Active Bookings',
      value: data.active_reservations,
      icon: CalendarCheck,
      link: '/reservations',
      format: (v) => v,
    },
    {
      eyebrow: 'FINANCIAL',
      title: 'Total Revenue',
      value: `₹${data.total_revenue?.toLocaleString()}`,
      icon: DollarSign,
      link: '/analytics/revenue',
      format: (v) => v,
    },
    {
      eyebrow: 'YIELD',
      title: 'Avg Daily Rate (ADR)',
      value: `₹${data.adr?.toLocaleString()}`,
      icon: TrendingUp,
      link: '/analytics/revenue',
      format: (v) => v,
    },
    {
      eyebrow: 'DAILY PIPELINE',
      title: "Today's Check-ins",
      value: data.today_checkins,
      icon: UserCheck,
      link: '/reservations',
      format: (v) => v,
    },
    {
      eyebrow: 'DEPARTURES',
      title: "Today's Check-outs",
      value: data.today_checkouts,
      icon: LogOut,
      link: '/reservations',
      format: (v) => v,
    },
  ];

  return (
    <div className="space-y-10">
      {/* Editorial Header Banner */}
      <div className="relative overflow-hidden rounded-[4px] border border-[#DFB76C]/35 bg-[#FFFFFF] p-8 md:p-10 shadow-[0_4px_24px_rgba(19,21,44,0.03)]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 mb-2 font-cinzel text-[10px] font-bold uppercase tracking-[0.26em] text-[#B88E43]">
              <Sparkles size={14} className="text-[#DFB76C]" /> NEXGILE-TRAVAI / OVERVIEW
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl text-[#13152C] font-normal tracking-tight">
              Good morning, {user?.name || 'Director'}
            </h1>
            <p className="mt-2 font-sans text-xs sm:text-sm text-[#13152C]/65 max-w-xl leading-relaxed">
              A refined summary of today's property inventory, revenue trajectory, and operational arrivals.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/revenue/recommendations"
              className="btn-luxury-gold text-xs"
            >
              <Sparkle size={13} className="text-[#0D0E20]" />
              <span>Yield Intelligence</span>
            </Link>
            <Link
              to="/reservations/new"
              className="btn-luxury-primary text-xs"
            >
              + Create Reservation
            </Link>
          </div>
        </div>
        <div className="mt-6 gold-hairline"></div>
      </div>

      {/* 8 Premium Hospitality KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={idx}
              to={kpi.link}
              className="group relative bg-[#FFFFFF] border border-[#DFB76C]/25 rounded-[4px] p-5 shadow-[0_2px_12px_rgba(19,21,44,0.02)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#DFB76C] hover:shadow-[0_6px_20px_rgba(223,183,108,0.12)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-cinzel text-[9px] font-bold uppercase tracking-[0.2em] text-[#B88E43]">
                    {kpi.eyebrow}
                  </span>
                  <div className="w-8 h-8 rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/25 flex items-center justify-center text-[#13152C] group-hover:text-[#B88E43] transition-colors">
                    <Icon size={15} strokeWidth={1.75} />
                  </div>
                </div>
                <div className="font-sans text-xs text-[#13152C]/60 mt-1">{kpi.title}</div>
              </div>
              <div className="mt-4">
                <div className="font-editorial text-3xl font-normal text-[#13152C] tracking-tight">
                  {kpi.value}
                </div>
                <div className="mt-2 flex items-center text-[10px] font-cinzel tracking-wider text-[#13152C]/40 group-hover:text-[#B88E43] transition-colors uppercase">
                  <span>Explore Metrics</span>
                  <ArrowRight size={11} className="ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Operational Highlights (Rooms to Clean, Maintenance, Service Requests) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-5 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[2px] bg-[#FBF6ED] border border-[#DFB76C]/30 flex items-center justify-center text-[#B88E43]">
              <Layers size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-cinzel text-[9px] uppercase tracking-wider text-[#13152C]/50 font-bold">Housekeeping</p>
              <p className="font-editorial text-xl font-normal text-[#13152C]">{data.rooms_to_clean} Rooms to Clean</p>
            </div>
          </div>
          <Link
            to="/rooms?status=CLEANING"
            className="btn-luxury-secondary text-[11px] py-1 px-2.5"
          >
            Review
          </Link>
        </div>

        <div className="flex items-center justify-between rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-5 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[2px] bg-[#FDF3EE] border border-[#9A4E2B]/25 flex items-center justify-center text-[#9A4E2B]">
              <Wrench size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-cinzel text-[9px] uppercase tracking-wider text-[#13152C]/50 font-bold">Facility</p>
              <p className="font-editorial text-xl font-normal text-[#13152C]">{data.open_maintenance} Open Orders</p>
            </div>
          </div>
          <Link
            to="/rooms?status=MAINTENANCE"
            className="btn-luxury-secondary text-[11px] py-1 px-2.5"
          >
            Inspect
          </Link>
        </div>

        <div className="flex items-center justify-between rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-5 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[2px] bg-[#F4EFE6] border border-[#13152C]/15 flex items-center justify-center text-[#13152C]">
              <Clock size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-cinzel text-[9px] uppercase tracking-wider text-[#13152C]/50 font-bold">Concierge Service</p>
              <p className="font-editorial text-xl font-normal text-[#13152C]">{data.pending_service_requests} Requests</p>
            </div>
          </div>
          <span className="font-cinzel text-[9px] tracking-wider uppercase text-[#13152C] bg-[#F4EFE6] px-2.5 py-1 rounded-[2px] border border-[#13152C]/15 font-semibold">
            Live
          </span>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#DFB76C]/20">
            <div>
              <span className="font-cinzel text-[9px] font-bold uppercase tracking-[0.24em] text-[#B88E43]">
                FINANCIAL LEDGER
              </span>
              <h3 className="font-editorial text-xl font-normal text-[#13152C]">Revenue Trajectory</h3>
              <p className="font-sans text-xs text-[#13152C]/60 mt-0.5">Daily room yield across the 14-day cycle</p>
            </div>
            <Link to="/analytics/revenue" className="font-cinzel text-[10px] text-[#B88E43] hover:text-[#13152C] font-semibold tracking-wider flex items-center gap-1 uppercase transition-colors">
              Details <ArrowRight size={12} />
            </Link>
          </div>
          <div className="mt-4 h-56">
            <SvgAreaChart
              data={data.revenue_chart}
              xKey="date"
              yKey="revenue"
              color="#13152C"
              secondaryColor="#DFB76C"
              unit="₹"
              height={220}
            />
          </div>
        </div>

        {/* Occupancy Chart */}
        <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#DFB76C]/20">
            <div>
              <span className="font-cinzel text-[9px] font-bold uppercase tracking-[0.24em] text-[#B88E43]">
                INVENTORY UTILIZATION
              </span>
              <h3 className="font-editorial text-xl font-normal text-[#13152C]">Occupancy Velocity (%)</h3>
              <p className="font-sans text-xs text-[#13152C]/60 mt-0.5">Occupied room night percentages</p>
            </div>
            <Link to="/analytics/occupancy" className="font-cinzel text-[10px] text-[#B88E43] hover:text-[#13152C] font-semibold tracking-wider flex items-center gap-1 uppercase transition-colors">
              Details <ArrowRight size={12} />
            </Link>
          </div>
          <div className="mt-4 h-56">
            <SvgAreaChart
              data={data.occupancy_chart}
              xKey="date"
              yKey="occupancy"
              color="#DFB76C"
              secondaryColor="#13152C"
              unit=""
              height={220}
            />
          </div>
        </div>
      </div>

      {/* Operational Columns: Recent Bookings, Today's Arrivals, Today's Departures */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Reservations */}
        <div className="lg:col-span-1 rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#DFB76C]/20">
              <div>
                <span className="font-cinzel text-[9px] uppercase tracking-wider text-[#B88E43] font-bold">Ledger</span>
                <h3 className="font-editorial text-lg text-[#13152C]">Recent Bookings</h3>
              </div>
              <Link to="/reservations" className="font-cinzel text-[10px] text-[#13152C]/60 hover:text-[#13152C] uppercase tracking-wider">
                View all →
              </Link>
            </div>
            <div className="mt-4 space-y-2.5">
              {data.recent_reservations && data.recent_reservations.length > 0 ? (
                data.recent_reservations.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between rounded-[2px] bg-[#FAF6F0] p-3 border border-[#DFB76C]/20 hover:border-[#DFB76C] transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-sans text-xs font-semibold text-[#13152C] truncate">{res.guest_name}</p>
                      <p className="font-sans text-[11px] text-[#13152C]/60">
                        Room {res.room_number} • ₹{res.total_amount?.toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge status={res.status} size="sm" />
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#13152C]/40 py-6 text-center font-sans">No recent bookings recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* Today's Arrivals */}
        <div className="lg:col-span-1 rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#DFB76C]/20">
              <div>
                <span className="font-cinzel text-[9px] uppercase tracking-wider text-[#2D5A40] font-bold">Front Desk</span>
                <h3 className="font-editorial text-lg text-[#13152C]">Today's Arrivals</h3>
              </div>
              <span className="font-cinzel text-[10px] text-[#2D5A40] font-semibold">{data.today_arrivals?.length || 0} Guests</span>
            </div>
            <div className="mt-4 space-y-2.5">
              {data.today_arrivals && data.today_arrivals.length > 0 ? (
                data.today_arrivals.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between rounded-[2px] bg-[#FAF6F0] p-3 border border-[#DFB76C]/20 hover:border-[#DFB76C] transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-sans text-xs font-semibold text-[#13152C] truncate">{res.guest_name}</p>
                      <p className="font-sans text-[11px] text-[#13152C]/60">
                        Room {res.room_number} • {res.booking_reference}
                      </p>
                    </div>
                    <Link
                      to={`/reservations/${res.id}`}
                      className="btn-luxury-primary text-[10px] py-1 px-2.5"
                    >
                      Check In
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#13152C]/40 py-6 text-center font-sans">No arrivals scheduled for today.</p>
              )}
            </div>
          </div>
        </div>

        {/* Today's Departures */}
        <div className="lg:col-span-1 rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#DFB76C]/20">
              <div>
                <span className="font-cinzel text-[9px] uppercase tracking-wider text-[#B88E43] font-bold">Turnaround</span>
                <h3 className="font-editorial text-lg text-[#13152C]">Today's Departures</h3>
              </div>
              <span className="font-cinzel text-[10px] text-[#B88E43] font-semibold">{data.today_departures?.length || 0} Guests</span>
            </div>
            <div className="mt-4 space-y-2.5">
              {data.today_departures && data.today_departures.length > 0 ? (
                data.today_departures.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between rounded-[2px] bg-[#FAF6F0] p-3 border border-[#DFB76C]/20 hover:border-[#DFB76C] transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="font-sans text-xs font-semibold text-[#13152C] truncate">{res.guest_name}</p>
                      <p className="font-sans text-[11px] text-[#13152C]/60">
                        Room {res.room_number} • {res.booking_reference}
                      </p>
                    </div>
                    <Link
                      to={`/reservations/${res.id}`}
                      className="btn-luxury-secondary text-[10px] py-1 px-2.5"
                    >
                      Check Out
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#13152C]/40 py-6 text-center font-sans">No departures scheduled for today.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
