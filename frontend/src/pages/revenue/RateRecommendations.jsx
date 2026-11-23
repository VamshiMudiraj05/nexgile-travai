import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Building2,
  RefreshCw,
  CheckCircle,
  Info,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { revenueService } from '../../services/revenueService';
import { propertyService } from '../../services/propertyService';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function RateRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState('');
  const [actionSuccess, setActionSuccess] = useState(null);
  const [applyingId, setApplyingId] = useState(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [propertyId]);

  const fetchProperties = async () => {
    try {
      const res = await propertyService.getProperties({ limit: 100 });
      setProperties(res.items || []);
    } catch (err) {
      console.error('Failed to load properties for recommendations:', err);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const params = {};
      if (propertyId) params.property_id = propertyId;

      const res = await revenueService.getRecommendations(params);
      setRecommendations(res || []);
    } catch (err) {
      console.error('Failed to fetch rate recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (rec) => {
    try {
      setApplyingId(rec.room_type_id);
      await revenueService.applyRecommendation({
        room_type_id: rec.room_type_id,
        recommended_rate: rec.recommended_rate,
        reason: rec.reason,
      });

      setActionSuccess(`Successfully applied rate ₹{rec.recommended_rate.toLocaleString()} to ${rec.room_type_name}!`);
      setTimeout(() => setActionSuccess(null), 5000);

      // Remove from recommendations list
      setRecommendations((prev) => prev.filter((r) => r.room_type_id !== rec.room_type_id));
    } catch (err) {
      console.error('Failed to apply recommendation:', err);
      alert('Failed to apply recommendation. Please try again.');
    } finally {
      setApplyingId(null);
    }
  };

  const handleIgnore = (recId) => {
    setRecommendations((prev) => prev.filter((r) => r.room_type_id !== recId));
  };

  return (
    <div className="space-y-10">
      {/* Editorial Header */}
      <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-8 md:p-10 shadow-md">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 mb-2 font-cinzel text-[10px] font-bold uppercase tracking-[0.26em] text-[#DFB76C]">
              <Sparkles size={14} className="text-[#DFB76C]" /> REVENUE
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl text-white font-normal tracking-tight">
              Rate Intelligence
            </h1>
            <p className="mt-2 font-sans text-xs sm:text-sm text-white/65 max-w-xl leading-relaxed">
              View and apply smart pricing suggestions based on current demand and upcoming occupancy.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchRecommendations}
              className="btn-luxury-secondary text-xs"
            >
              <RefreshCw size={13} className="text-[#DFB76C]" />
              <span>Refresh Suggestions</span>
            </button>
          </div>
        </div>
        <div className="mt-6 gold-hairline"></div>
      </div>

      {/* Property Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[4px] border border-[#2C315E] bg-[#13152C] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Building2 size={16} className="text-[#DFB76C]" />
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="luxury-input text-xs font-semibold bg-[#1B1E3D] cursor-pointer"
          >
            <option value="">All Managed Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.city})
              </option>
            ))}
          </select>
        </div>
        <span className="font-cinzel text-[10px] uppercase tracking-wider text-[#DFB76C] font-semibold">
          {recommendations.length} Price Suggestions Available
        </span>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="flex items-center gap-3 rounded-[3px] border border-emerald-500/40 bg-emerald-950/60 p-4 text-xs font-sans text-emerald-300 shadow-sm animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}

      {loading ? (
        <LoadingSpinner text="Analyzing current booking rates..." />
      ) : recommendations.length === 0 ? (
        <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-12 text-center shadow-sm max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-[2px] bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <CheckCircle size={24} strokeWidth={1.5} />
          </div>
          <h3 className="font-editorial text-2xl font-normal text-white">All Rates are Up to Date</h3>
          <p className="mt-2 text-xs font-sans text-white/60 max-w-md mx-auto leading-relaxed">
            All your room prices match current demand. No adjustments needed right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec) => {
            const isPositive = rec.change_percentage >= 0;
            return (
              <div
                key={rec.room_type_id}
                className="relative flex flex-col justify-between overflow-hidden rounded-[4px] border border-[#2C315E] bg-[#13152C] p-6 shadow-sm hover:border-[#DFB76C] transition-all hover:shadow-[0_8px_24px_rgba(223,183,108,0.12)]"
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-cinzel text-[9px] font-bold text-[#DFB76C] tracking-[0.2em] uppercase block">
                        {rec.property_name}
                      </span>
                      <h3 className="font-editorial text-xl font-normal text-white mt-0.5">
                        {rec.room_type_name}
                      </h3>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-[2px] px-2.5 py-1 text-[10px] font-cinzel font-bold uppercase tracking-wider border ${
                        isPositive
                          ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                          : 'bg-[#1B1E3D] text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {isPositive ? `+${rec.change_percentage}%` : `${rec.change_percentage}%`}
                    </span>
                  </div>

                  {/* Price Comparison */}
                  <div className="mt-5 grid grid-cols-2 gap-2 rounded-[2px] bg-[#1B1E3D] p-4 border border-[#2C315E]">
                    <div>
                      <span className="font-cinzel text-[8.5px] uppercase tracking-wider text-white/50 block">Current Rate</span>
                      <p className="font-editorial text-lg text-white/70 line-through decoration-rose-400/40 mt-0.5">
                        ₹{rec.current_rate?.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right border-l border-[#2C315E] pl-3">
                      <span className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#DFB76C] font-bold block">Recommended</span>
                      <p className="font-editorial text-2xl text-white font-semibold mt-0.5">
                        ₹{rec.recommended_rate?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Reason & Confidence */}
                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-2 text-xs font-sans text-white/75 leading-relaxed bg-[#1B1E3D] p-2.5 rounded-[2px] border border-[#2C315E]">
                      <Info size={14} className="mt-0.5 shrink-0 text-[#DFB76C]" />
                      <span>{rec.reason}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#2C315E] pt-3 text-[11px] font-sans text-white/60">
                      <span className="font-cinzel text-[9px] uppercase tracking-wider">Confidence Score</span>
                      <span className="font-bold text-white font-sans">
                        {Math.round(rec.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center gap-3 border-t border-[#2C315E] pt-4">
                  <button
                    onClick={() => handleApply(rec)}
                    disabled={applyingId === rec.room_type_id}
                    className="flex-1 btn-luxury-primary text-[11px] py-2"
                  >
                    {applyingId === rec.room_type_id ? 'Applying Rate...' : 'Apply Recommendation →'}
                  </button>
                  <button
                    onClick={() => handleIgnore(rec.room_type_id)}
                    className="btn-luxury-secondary text-[11px] py-2 px-3"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
