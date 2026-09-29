import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  Percent,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { propertyService } from '../../services/propertyService';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { SvgAreaChart } from '../../components/SvgAreaChart';

export default function ForecastAnalytics() {
  const [data, setData] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [horizon, setHorizon] = useState(7);
  const [propertyId, setPropertyId] = useState('');

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchForecastData();
  }, [horizon, propertyId]);

  const fetchProperties = async () => {
    try {
      const res = await propertyService.getProperties({ limit: 100 });
      setProperties(res.items || []);
    } catch (err) {
      console.error('Failed to load properties for forecast filter:', err);
    }
  };

  const fetchForecastData = async () => {
    try {
      setLoading(true);
      const params = { horizon };
      if (propertyId) params.property_id = propertyId;

      const res = await analyticsService.getForecast(params);
      setData(res);
    } catch (err) {
      console.error('Failed to fetch forecast:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center pb-6 border-b border-[#DFB76C]/30">
        <div>
          <span className="eyebrow-label text-[#B88E43]">03 / REVENUE INTELLIGENCE &middot; STATISTICAL PROJECTIONS</span>
          <h1 className="text-3xl font-editorial font-bold text-[#13152C] tracking-tight mt-1">
            Statistical Demand &amp; Revenue Forecast
          </h1>
          <p className="mt-1 text-xs text-[#13152C]/70">
            Forward-looking statistical projections modeled on pickup pace and day-of-week velocity.
          </p>
        </div>

        {/* Horizon Toggle */}
        <div className="flex items-center gap-2 rounded-[3px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-1.5 shadow-sm">
          <button
            onClick={() => setHorizon(7)}
            className={`rounded-[2px] px-4 py-1.5 text-xs font-cinzel tracking-wider transition-all cursor-pointer ${
              horizon === 7
                ? 'bg-[#13152C] text-[#F2D59B] border border-[#DFB76C]/40'
                : 'text-[#13152C]/70 hover:text-[#13152C]'
            }`}
          >
            7-Day Horizon
          </button>
          <button
            onClick={() => setHorizon(30)}
            className={`rounded-[2px] px-4 py-1.5 text-xs font-cinzel tracking-wider transition-all cursor-pointer ${
              horizon === 30
                ? 'bg-[#13152C] text-[#F2D59B] border border-[#DFB76C]/40'
                : 'text-[#13152C]/70 hover:text-[#13152C]'
            }`}
          >
            30-Day Horizon
          </button>
        </div>
      </div>

      {/* Property Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Building2 size={16} className="text-[#B88E43]" />
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="rounded-[3px] border border-[#DFB76C]/40 bg-[#FAF6F0] px-3.5 py-2 text-xs font-semibold text-[#13152C] focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF]"
          >
            <option value="">All Hotel Estates (Consolidated)</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.city})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchForecastData}
          className="btn-luxury-secondary text-xs inline-flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw size={13} className="text-[#B88E43]" />
          <span>Re-run Statistical Model</span>
        </button>
      </div>

      {/* Notice Banner */}
      <div className="flex items-center gap-3 rounded-[4px] border border-[#DFB76C]/40 bg-[#FAF6F0] p-4 text-xs text-[#13152C]/80">
        <AlertTriangle size={18} className="shrink-0 text-[#B88E43]" />
        <span>
          <strong className="font-cinzel text-[#13152C]">Predictive Notice:</strong> Values below are statistical forward-looking projections derived from active reservations, day-of-week pacing, and historical pace curves.
        </span>
      </div>

      {loading && !data ? (
        <LoadingSpinner message="Computing forward demand projections..." />
      ) : data ? (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Projected Revenue */}
            <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#DFB76C]/20 mb-4">
                <div>
                  <span className="eyebrow-label text-[#B88E43]">PROJECTED REVENUE PACE</span>
                  <h3 className="font-editorial text-xl font-bold text-[#13152C] mt-0.5">Projected Revenue</h3>
                  <p className="text-xs text-[#13152C]/60">Estimated stay earnings per forward date</p>
                </div>
                <span className="px-2.5 py-1 rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/40 font-cinzel text-[10px] text-[#B88E43] font-bold">
                  Model
                </span>
              </div>
              <div className="h-60">
                <SvgAreaChart
                  data={data.forecast}
                  xKey="date"
                  yKey="revenue"
                  color="#DFB76C"
                  unit="₹"
                  height={240}
                />
              </div>
            </div>

            {/* Projected Occupancy */}
            <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#DFB76C]/20 mb-4">
                <div>
                  <span className="eyebrow-label text-[#B88E43]">PROJECTED CAPACITY PACING</span>
                  <h3 className="font-editorial text-xl font-bold text-[#13152C] mt-0.5">Projected Occupancy (%)</h3>
                  <p className="text-xs text-[#13152C]/60">Anticipated room utilization rate</p>
                </div>
                <span className="px-2.5 py-1 rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/40 font-cinzel text-[10px] text-[#B88E43] font-bold">
                  Model
                </span>
              </div>
              <div className="h-60">
                <SvgAreaChart
                  data={data.forecast}
                  xKey="date"
                  yKey="occupancy"
                  color="#13152C"
                  unit="%"
                  height={240}
                />
              </div>
            </div>
          </div>

          {/* Forecast Table */}
          <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-6 shadow-sm">
            <span className="eyebrow-label text-[#B88E43]">STATISTICAL RUN</span>
            <h3 className="font-editorial text-xl font-bold text-[#13152C] mb-4">
              Detailed {horizon}-Day Projections Matrix
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#FAF6F0] border-b border-[#DFB76C]/30 text-[#13152C]/70">
                    <th className="py-3 px-4 eyebrow-label">Target Date</th>
                    <th className="py-3 px-4 eyebrow-label text-center">Classification</th>
                    <th className="py-3 px-4 eyebrow-label text-center">Projected Occupancy</th>
                    <th className="py-3 px-4 eyebrow-label text-right">Projected Revenue</th>
                    <th className="py-3 px-4 eyebrow-label text-right">Estimated Bookings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE5DA]/60">
                  {data.forecast.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF6F0]/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#13152C]">{item.date}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/30 px-2 py-0.5 text-[10px] font-cinzel font-bold text-[#B88E43] uppercase tracking-wider">
                          Projection
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-editorial font-bold text-base text-[#13152C]">
                        {item.occupancy}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-editorial font-bold text-base text-[#13152C]">
                        ₹{item.revenue?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-cinzel font-bold text-xs text-[#13152C]/80">
                        {item.bookings} Folios
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
