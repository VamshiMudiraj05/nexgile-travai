import React, { useState, useEffect } from 'react';
import {
  Percent,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Filter,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { propertyService } from '../../services/propertyService';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { SvgAreaChart } from '../../components/SvgAreaChart';

export default function OccupancyAnalytics() {
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
    fetchOccupancyData();
  }, [propertyId, startDate, endDate]);

  const fetchProperties = async () => {
    try {
      const res = await propertyService.getProperties({ limit: 100 });
      setProperties(res.items || []);
    } catch (err) {
      console.error('Failed to load properties for filter:', err);
    }
  };

  const fetchOccupancyData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (propertyId) params.property_id = propertyId;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await analyticsService.getOccupancyAnalytics(params);
      setData(res);
    } catch (err) {
      console.error('Failed to fetch occupancy analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center pb-6 border-b border-[#DFB76C]/30">
        <div>
          <span className="eyebrow-label text-[#B88E43]">03 / REVENUE INTELLIGENCE &middot; CAPACITY AUDIT</span>
          <h1 className="text-3xl font-editorial font-bold text-[#13152C] tracking-tight mt-1">
            Occupancy Analytics &amp; Capacity Utilization
          </h1>
          <p className="mt-1 text-xs text-[#13152C]/70">
            Real-time room occupancy trends, peaks, troughs, and utilization rates across properties.
          </p>
        </div>
        <button
          onClick={fetchOccupancyData}
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
        <LoadingSpinner message="Analyzing occupancy capacity &amp; stay velocity..." />
      ) : data ? (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-6 shadow-sm">
              <div className="flex items-center justify-between text-[#B88E43]">
                <span className="eyebrow-label text-[#B88E43]">Current Occupancy</span>
                <Percent size={18} />
              </div>
              <p className="mt-3 text-3xl font-editorial font-bold text-[#13152C]">
                {data.summary?.current}%
              </p>
              <p className="mt-1 text-[11px] text-[#13152C]/60">Active live rate</p>
            </div>

            <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-6 shadow-sm">
              <div className="flex items-center justify-between text-[#B88E43]">
                <span className="eyebrow-label text-[#B88E43]">Average Occupancy</span>
                <TrendingUp size={18} />
              </div>
              <p className="mt-3 text-3xl font-editorial font-bold text-[#13152C]">
                {data.summary?.average}%
              </p>
              <p className="mt-1 text-[11px] text-[#13152C]/60">Window baseline</p>
            </div>

            <div className="bg-[#FFFFFF] border border-emerald-300 rounded-[4px] p-6 shadow-sm">
              <div className="flex items-center justify-between text-emerald-800">
                <span className="eyebrow-label text-emerald-800">Peak Occupancy</span>
                <ArrowUp size={18} />
              </div>
              <p className="mt-3 text-3xl font-editorial font-bold text-emerald-900">
                {data.summary?.peak}%
              </p>
              <p className="mt-1 text-[11px] text-emerald-800/80">Maximum recorded</p>
            </div>

            <div className="bg-[#FFFFFF] border border-amber-300 rounded-[4px] p-6 shadow-sm">
              <div className="flex items-center justify-between text-amber-800">
                <span className="eyebrow-label text-amber-800">Lowest Occupancy</span>
                <ArrowDown size={18} />
              </div>
              <p className="mt-3 text-3xl font-editorial font-bold text-amber-900">
                {data.summary?.lowest}%
              </p>
              <p className="mt-1 text-[11px] text-amber-800/80">Trough point</p>
            </div>
          </div>

          {/* Occupancy Timeline Chart */}
          <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-6 shadow-sm">
            <span className="eyebrow-label text-[#B88E43]">UTILIZATION PACING</span>
            <h3 className="font-editorial text-xl font-bold text-[#13152C] mt-0.5">Occupancy Timeline (%)</h3>
            <p className="text-xs text-[#13152C]/60 mb-5">Daily percentage of occupied inventory</p>
            <div className="h-64">
              <SvgAreaChart
                data={data.trend}
                xKey="date"
                yKey="occupancy"
                color="#DFB76C"
                unit="%"
                height={250}
              />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
