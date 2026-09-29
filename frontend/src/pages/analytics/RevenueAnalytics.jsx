import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  TrendingUp,
  Percent,
  BedDouble,
  Building2,
  Calendar,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { propertyService } from '../../services/propertyService';
import LoadingSpinner from '../../components/LoadingSpinner';
import SvgAreaChart from '../../components/SvgAreaChart';
import SvgBarChart from '../../components/SvgBarChart';

export default function RevenueAnalytics() {
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
    fetchRevenueData();
  }, [propertyId, startDate, endDate]);

  const fetchProperties = async () => {
    try {
      const res = await propertyService.getProperties({ limit: 100 });
      setProperties(res.items || []);
    } catch (err) {
      console.error('Failed to load properties for filter:', err);
    }
  };

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (propertyId) params.property_id = propertyId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await analyticsService.getRevenueAnalytics(params);
      setData(res);
    } catch (err) {
      console.error('Failed to fetch revenue analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center pb-6 border-b border-[#DFB76C]/30">
        <div>
          <span className="eyebrow-label text-[#B88E43]">03 / REVENUE INTELLIGENCE &middot; FINANCIAL YIELD</span>
          <h1 className="text-3xl font-editorial font-bold text-[#13152C] tracking-tight mt-1">
            Revenue Analytics &amp; Financial Yield
          </h1>
          <p className="mt-1 text-xs text-[#13152C]/70">
            Realized room revenue, Average Daily Rate (ADR), and RevPAR performance across hotel estates.
          </p>
        </div>
        <button
          onClick={fetchRevenueData}
          className="btn-luxury-secondary text-xs inline-flex items-center gap-2 self-start cursor-pointer"
        >
          <RefreshCw size={14} className="text-[#B88E43]" />
          <span>Refresh Yield</span>
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
              {p.name} ({p.city})
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
        <LoadingSpinner message="Computing revenue yield &amp; portfolio metrics..." />
      ) : data ? (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-6 shadow-sm">
              <div className="flex items-center justify-between text-[#B88E43]">
                <span className="eyebrow-label text-[#B88E43]">Gross Revenue</span>
                <IndianRupee size={18} />
              </div>
              <p className="mt-3 text-3xl font-editorial font-bold text-[#13152C]">
                ₹{data.total_revenue?.toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] text-[#13152C]/60">Realized stay value</p>
            </div>

            <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-6 shadow-sm">
              <div className="flex items-center justify-between text-[#B88E43]">
                <span className="eyebrow-label text-[#B88E43]">Average Daily Rate</span>
                <TrendingUp size={18} />
              </div>
              <p className="mt-3 text-3xl font-editorial font-bold text-[#13152C]">
                ₹{data.adr?.toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] text-[#13152C]/60">ADR per room night sold</p>
            </div>

            <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-6 shadow-sm">
              <div className="flex items-center justify-between text-[#B88E43]">
                <span className="eyebrow-label text-[#B88E43]">RevPAR</span>
                <Percent size={18} />
              </div>
              <p className="mt-3 text-3xl font-editorial font-bold text-[#13152C]">
                ₹{data.revpar?.toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] text-[#13152C]/60">Revenue per available room</p>
            </div>

            <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-6 shadow-sm">
              <div className="flex items-center justify-between text-[#B88E43]">
                <span className="eyebrow-label text-[#B88E43]">Room Nights Sold</span>
                <BedDouble size={18} />
              </div>
              <p className="mt-3 text-3xl font-editorial font-bold text-[#13152C]">
                {data.rooms_sold} Nights
              </p>
              <p className="mt-1 text-[11px] text-[#13152C]/60">
                {data.occupancy_percentage}% portfolio occupancy
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Revenue Trend */}
            <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-6 shadow-sm">
              <span className="eyebrow-label text-[#B88E43]">DAILY REVENUE PACE</span>
              <h3 className="font-editorial text-xl font-bold text-[#13152C] mt-0.5">Revenue by Date</h3>
              <p className="text-xs text-[#13152C]/60 mb-5">Daily room booking income trajectory</p>
              <div className="h-60">
                <SvgAreaChart
                  data={data.revenue_by_date}
                  xKey="date"
                  yKey="revenue"
                  color="#DFB76C"
                  unit="₹"
                  height={240}
                />
              </div>
            </div>

            {/* Revenue by Property */}
            <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-6 shadow-sm">
              <span className="eyebrow-label text-[#B88E43]">ESTATE BREAKDOWN</span>
              <h3 className="font-editorial text-xl font-bold text-[#13152C] mt-0.5">Revenue by Property</h3>
              <p className="text-xs text-[#13152C]/60 mb-5">Contribution per hotel property</p>
              <div className="h-60">
                <SvgBarChart
                  data={data.revenue_by_property}
                  xKey="property_name"
                  yKey="revenue"
                  barColor="#13152C"
                  unit="₹"
                  height={240}
                />
              </div>
            </div>
          </div>

          {/* Revenue by Room Type Table */}
          <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-6 shadow-sm">
            <span className="eyebrow-label text-[#B88E43]">INVENTORY CATEGORY YIELD</span>
            <h3 className="font-editorial text-xl font-bold text-[#13152C] mt-0.5">Revenue by Suite Class</h3>
            <p className="text-xs text-[#13152C]/60 mb-4">Yield performance categorized by inventory class</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF6F0] border-b border-[#DFB76C]/30 text-[#13152C]/70">
                    <th className="py-3 px-4 eyebrow-label">Suite Type</th>
                    <th className="py-3 px-4 eyebrow-label text-center">Bookings</th>
                    <th className="py-3 px-4 eyebrow-label text-center">Nights Sold</th>
                    <th className="py-3 px-4 eyebrow-label text-right">Total Revenue</th>
                    <th className="py-3 px-4 eyebrow-label text-right">Realized ADR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE5DA]/60">
                  {data.revenue_by_room_type && data.revenue_by_room_type.length > 0 ? (
                    data.revenue_by_room_type.map((rt, idx) => (
                      <tr key={idx} className="hover:bg-[#FAF6F0]/60 transition-colors">
                        <td className="py-3.5 px-4 font-editorial font-bold text-sm text-[#13152C]">{rt.room_type_name}</td>
                        <td className="py-3.5 px-4 text-center text-[#13152C]/80">{rt.bookings}</td>
                        <td className="py-3.5 px-4 text-center text-[#13152C]/80">{rt.nights}</td>
                        <td className="py-3.5 px-4 text-right font-editorial font-bold text-base text-[#13152C]">
                          ₹{rt.revenue?.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right font-cinzel font-bold text-xs text-[#B88E43]">
                          ₹{rt.adr?.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-[#13152C]/50 font-editorial">
                        No room type revenue records matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
