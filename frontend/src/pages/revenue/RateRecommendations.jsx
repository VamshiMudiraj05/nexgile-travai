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

      setActionSuccess(`Successfully applied rate ₹${rec.recommended_rate.toLocaleString()} to ${rec.room_type_name}!`);
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
      <div className="rounded-[4px] border border-[#DFB76C]/35 bg-[#FFFFFF] p-8 md:p-10 shadow-[0_4px_24px_rgba(19,21,44,0.03)]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 mb-2 font-cinzel text-[10px] font-bold uppercase tracking-[0.26em] text-[#B88E43]">
              <Sparkles size={14} className="text-[#DFB76C]" /> 03 / REVENUE
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl text-[#13152C] font-normal tracking-tight">
              Rate Intelligence
            </h1>
            <p className="mt-2 font-sans text-xs sm:text-sm text-[#13152C]/65 max-w-xl leading-relaxed">
              Understand occupancy pace, market elasticity, and automated room pricing recommendations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchRecommendations}
              className="btn-luxury-secondary text-xs"
            >
              <RefreshCw size={13} className="text-[#13152C]" />
              <span>Refresh Pace Model</span>
            </button>
          </div>
        </div>
        <div className="mt-6 gold-hairline"></div>
      </div>

      {/* Property Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Building2 size={16} className="text-[#DFB76C]" />
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="luxury-input text-xs font-semibold bg-[#FAF6F0] cursor-pointer"
          >
            <option value="">All Managed Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.city})
              </option>
            ))}
          </select>
        </div>
        <span className="font-cinzel text-[10px] uppercase tracking-wider text-[#B88E43] font-semibold">
          {recommendations.length} Active Yield Opportunities
        </span>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="flex items-center gap-3 rounded-[3px] border border-[#2D5A40]/30 bg-[#F2F8F4] p-4 text-xs font-sans text-[#2D5A40] shadow-sm animate-fadeIn">
          <CheckCircle2 size={16} className="text-[#2D5A40] shrink-0" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}

      {loading ? (
        <LoadingSpinner text="Evaluating booking pace & inventory elasticity..." />
      ) : recommendations.length === 0 ? (
        <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-12 text-center shadow-sm max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-[2px] bg-[#F2F8F4] border border-[#2D5A40]/30 flex items-center justify-center mx-auto mb-4 text-[#2D5A40]">
            <CheckCircle size={24} strokeWidth={1.5} />
          </div>
          <h3 className="font-editorial text-2xl font-normal text-[#13152C]">All Rates Fully Optimized</h3>
          <p className="mt-2 text-xs font-sans text-[#13152C]/60 max-w-md mx-auto leading-relaxed">
            Current room rates precisely mirror market demand velocity, seasonal occupancy pace, and competitive tiering.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((rec) => {
            const isPositive = rec.change_percentage >= 0;
            return (
              <div
                key={rec.room_type_id}
                className="relative flex flex-col justify-between overflow-hidden rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-6 shadow-sm hover:border-[#DFB76C] transition-all hover:shadow-[0_8px_24px_rgba(223,183,108,0.12)]"
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-cinzel text-[9px] font-bold text-[#B88E43] tracking-[0.2em] uppercase block">
                        {rec.property_name}
                      </span>
                      <h3 className="font-editorial text-xl font-normal text-[#13152C] mt-0.5">
                        {rec.room_type_name}
                      </h3>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-[2px] px-2.5 py-1 text-[10px] font-cinzel font-bold uppercase tracking-wider border ${
                        isPositive
                          ? 'bg-[#F2F8F4] text-[#2D5A40] border-[#2D5A40]/30'
                          : 'bg-[#FDF2F2] text-[#993A3A] border-[#993A3A]/25'
                      }`}
                    >
                      {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {isPositive ? `+${rec.change_percentage}%` : `${rec.change_percentage}%`}
                    </span>
                  </div>

                  {/* Price Comparison */}
                  <div className="mt-5 grid grid-cols-2 gap-2 rounded-[2px] bg-[#FAF6F0] p-4 border border-[#DFB76C]/20">
                    <div>
                      <span className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#13152C]/50 block">Current Rate</span>
                      <p className="font-editorial text-lg text-[#13152C]/70 line-through decoration-[#993A3A]/40 mt-0.5">
                        ₹{rec.current_rate?.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right border-l border-[#DFB76C]/20 pl-3">
                      <span className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#B88E43] font-bold block">Recommended</span>
                      <p className="font-editorial text-2xl text-[#13152C] font-semibold mt-0.5">
                        ₹{rec.recommended_rate?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Reason & Confidence */}
                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-2 text-xs font-sans text-[#13152C]/75 leading-relaxed bg-[#FFFFFF] p-2.5 rounded-[2px] border border-[#13152C]/10">
                      <Info size={14} className="mt-0.5 shrink-0 text-[#B88E43]" />
                      <span>{rec.reason}</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-[#DFB76C]/20 pt-3 text-[11px] font-sans text-[#13152C]/60">
                      <span className="font-cinzel text-[9px] uppercase tracking-wider">AI Confidence</span>
                      <span className="font-bold text-[#13152C] font-sans">
                        {Math.round(rec.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center gap-3 border-t border-[#DFB76C]/20 pt-4">
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
