import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CalendarX,
  Clock,
  PieChart,
  TrendingUp,
  Filter,
  RefreshCw,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { propertyService } from '../../services/propertyService';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { SvgAreaChart } from '../../components/SvgAreaChart';
import { SvgDonutChart } from '../../components/SvgDonutChart';

export default function BookingAnalytics() {
  const [data, setData] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [propertyId, setPropertyId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchBookingData();
  }, [propertyId, startDate, endDate]);

  const fetchProperties = async () => {
    try {
      const res = await propertyService.getProperties({ limit: 100 });
      setProperties(res.items || []);
    } catch (err) {
      console.error('Failed to load properties for filter:', err);
    }
  };

  const fetchBookingData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (propertyId) params.property_id = propertyId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await analyticsService.getBookingAnalytics(params);
      setData(res);
    } catch (err) {
      console.error('Failed to fetch booking analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center pb-6 border-b border-[#DFB76C]/30">
        <div>
          <span className="eyebrow-label text-[#B88E43]">03 / REVENUE INTELLIGENCE &middot; BOOKING DYNAMICS</span>
          <h1 className="text-3xl font-editorial font-bold text-[#13152C] tracking-tight mt-1">
            Booking &amp; Channel Analytics
          </h1>
          <p className="mt-1 text-xs text-[#13152C]/70">
            Booking volumes, channels, length of stay, and cancellation metrics.
          </p>
        </div>
        <button
          onClick={fetchBookingData}
          className="btn-luxury-secondary text-xs inline-flex items-center gap-2 self-start cursor-pointer"
        >
          <RefreshCw size={14} className="text-[#B88E43]" />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-5 shadow-sm">
        <div className="flex items-center gap-2 eyebrow-label text-[#B88E43]">
          <Filter size={15} /> Filters:
        </div>

        {/* Property Filter */}
        <select
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          className="rounded-[3px] border border-[#DFB76C]/40 bg-[#FAF6F0] px-3.5 py-2 text-xs font-semibold text-[#13152C] focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF]"
        >
          <option value="">All Hotel Estates</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-[3px] border border-[#DFB76C]/40 bg-[#FAF6F0] px-3.5 py-2 text-xs text-[#13152C] focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF]"
          />
          <span className="text-xs text-[#13152C]/60 font-cinzel">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-[3px] border border-[#DFB76C]/40 bg-[#FAF6F0] px-3.5 py-2 text-xs text-[#13152C] focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF]"
          />
        </div>

        {(propertyId || startDate || endDate) && (
          <button
            onClick={() => {
              setPropertyId('');
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs font-cinzel text-[#B88E43] hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading && !data ? (
        <LoadingSpinner message="Aggregating booking channels &amp; acquisition mix..." />
      ) : data ? (
        <>
          {/* Status Metric Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-4 shadow-sm">
              <span className="eyebrow-label text-[#13152C]/60">Total Folios</span>
              <p className="mt-2 text-2xl font-editorial font-bold text-[#13152C]">{data.total_bookings}</p>
            </div>
            <div className="rounded-[4px] border border-emerald-300 bg-[#FFFFFF] p-4 shadow-sm">
              <span className="eyebrow-label text-emerald-800">Confirmed</span>
              <p className="mt-2 text-2xl font-editorial font-bold text-emerald-900">{data.confirmed}</p>
            </div>
            <div className="rounded-[4px] border border-[#2C315E]/30 bg-[#FFFFFF] p-4 shadow-sm">
              <span className="eyebrow-label text-[#13152C]/80">Checked In</span>
              <p className="mt-2 text-2xl font-editorial font-bold text-[#13152C]">{data.checked_in}</p>
            </div>
            <div className="rounded-[4px] border border-amber-300 bg-[#FFFFFF] p-4 shadow-sm">
              <span className="eyebrow-label text-amber-800">Checked Out</span>
              <p className="mt-2 text-2xl font-editorial font-bold text-amber-900">{data.checked_out}</p>
            </div>
            <div className="rounded-[4px] border border-rose-300 bg-[#FFFFFF] p-4 shadow-sm">
              <span className="eyebrow-label text-rose-800">Cancellation</span>
              <p className="mt-2 text-2xl font-editorial font-bold text-rose-900">{data.cancellation_rate}%</p>
            </div>
            <div className="rounded-[4px] border border-[#DFB76C]/40 bg-[#FFFFFF] p-4 shadow-sm">
              <span className="eyebrow-label text-[#B88E43]">Avg Stay</span>
              <p className="mt-2 text-2xl font-editorial font-bold text-[#13152C]">{data.average_length_of_stay} N</p>
            </div>
          </div>

          {/* Charts Row: Trend & Distribution */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Bookings Trend */}
            <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-6 shadow-sm">
              <span className="eyebrow-label text-[#B88E43]">VELOCITY TIMELINE</span>
              <h3 className="font-editorial text-xl font-bold text-[#13152C] mt-0.5">Bookings Over Time</h3>
              <p className="text-xs text-[#13152C]/60 mb-5">Volume velocity per check-in arrival date</p>
              <div className="h-60">
                <SvgAreaChart
                  data={data.trend}
                  xKey="date"
                  yKey="bookings"
                  color="#DFB76C"
                  unit=""
                  height={240}
                />
              </div>
            </div>

            {/* Source Breakdown Donut */}
            <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-6 shadow-sm">
              <span className="eyebrow-label text-[#B88E43]">ORIGIN DISTRIBUTION</span>
              <h3 className="font-editorial text-xl font-bold text-[#13152C] mt-0.5">Booking Acquisition Channels</h3>
              <p className="text-xs text-[#13152C]/60 mb-5">Direct vs Marketplace vs Corporate share</p>
              <div className="flex items-center justify-center pt-2">
                <SvgDonutChart
                  data={data.bookings_by_source}
                  nameKey="source"
                  valueKey="count"
                  size={200}
                  strokeWidth={24}
                  centerLabel="Bookings"
                />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
