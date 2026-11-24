import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Building2,
  RefreshCw,
  CheckCircle,
  Info,
  CheckCircle2,
  ChevronDown,
  Search,
  Check,
  Filter,
  ArrowUpDown,
  SlidersHorizontal,
  X,
  BedDouble
} from 'lucide-react';
import { revenueService } from '../../services/revenueService';
import { propertyService } from '../../services/propertyService';
import LoadingSpinner from '../../components/LoadingSpinner';

const STRATEGY_OPTIONS = [
  { id: 'ALL', label: 'All Recommendation Directives', desc: 'Surge pricing, stimulus discounts, and demand adjustments' },
  { id: 'SURGE', label: 'Surge Demand (+ Rates)', desc: 'Increase rates for upcoming peak occupancy' },
  { id: 'DISCOUNT', label: 'Stimulate Demand (- Rates)', desc: 'Discounted rates to accelerate bookings' },
  { id: 'HIGH_CONFIDENCE', label: 'High Confidence (≥80%)', desc: 'Directives backed by strong occupancy velocity' },
];

const SORT_OPTIONS = [
  { id: 'IMPACT_DESC', label: 'Largest Rate Shift (% change)' },
  { id: 'CONFIDENCE_DESC', label: 'Highest Confidence Score' },
  { id: 'PRICE_DESC', label: 'Highest Recommended Rate' },
  { id: 'PRICE_ASC', label: 'Lowest Recommended Rate' },
];

export default function RateRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState('');
  const [strategyFilter, setStrategyFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('IMPACT_DESC');
  const [actionSuccess, setActionSuccess] = useState(null);
  const [applyingId, setApplyingId] = useState(null);

  // Dropdown states
  const [isPropertyOpen, setIsPropertyOpen] = useState(false);
  const [isStrategyOpen, setIsStrategyOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [propertySearch, setPropertySearch] = useState('');

  const propertyDropdownRef = useRef(null);
  const strategyDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchRecommendations();
  }, [propertyId]);

  // Click outside listener for all custom luxury dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (propertyDropdownRef.current && !propertyDropdownRef.current.contains(e.target)) {
        setIsPropertyOpen(false);
      }
      if (strategyDropdownRef.current && !strategyDropdownRef.current.contains(e.target)) {
        setIsStrategyOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      setActionSuccess(`Successfully applied rate ₹${rec.recommended_rate?.toLocaleString()} to ${rec.room_type_name}!`);
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

  // Selected property object
  const selectedProperty = useMemo(() => {
    return properties.find((p) => (p.id || p._id) === propertyId);
  }, [properties, propertyId]);

  // Filtered property list for search within dropdown
  const filteredProperties = useMemo(() => {
    if (!propertySearch.trim()) return properties;
    const q = propertySearch.toLowerCase();
    return properties.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q) ||
        p.property_code?.toLowerCase().includes(q)
    );
  }, [properties, propertySearch]);

  // Filtered and sorted recommendations
  const displayedRecommendations = useMemo(() => {
    let list = [...recommendations];

    // Strategy Filter
    if (strategyFilter === 'SURGE') {
      list = list.filter((r) => r.change_percentage > 0);
    } else if (strategyFilter === 'DISCOUNT') {
      list = list.filter((r) => r.change_percentage < 0);
    } else if (strategyFilter === 'HIGH_CONFIDENCE') {
      list = list.filter((r) => (r.confidence || 0) >= 0.8);
    }

    // Sort By
    list.sort((a, b) => {
      if (sortBy === 'IMPACT_DESC') {
        return Math.abs(b.change_percentage || 0) - Math.abs(a.change_percentage || 0);
      }
      if (sortBy === 'CONFIDENCE_DESC') {
        return (b.confidence || 0) - (a.confidence || 0);
      }
      if (sortBy === 'PRICE_DESC') {
        return (b.recommended_rate || 0) - (a.recommended_rate || 0);
      }
      if (sortBy === 'PRICE_ASC') {
        return (a.recommended_rate || 0) - (b.recommended_rate || 0);
      }
      return 0;
    });

    return list;
  }, [recommendations, strategyFilter, sortBy]);

  const activeStrategy = STRATEGY_OPTIONS.find((s) => s.id === strategyFilter) || STRATEGY_OPTIONS[0];
  const activeSort = SORT_OPTIONS.find((s) => s.id === sortBy) || SORT_OPTIONS[0];

  return (
    <div className="space-y-8 pb-16">
      {/* Editorial Header */}
      <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-8 md:p-10 shadow-md">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 mb-2 font-cinzel text-[10px] font-bold uppercase tracking-[0.26em] text-[#DFB76C]">
              <Sparkles size={14} className="text-[#DFB76C]" /> REVENUE & YIELD STRATEGY
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl text-white font-normal tracking-tight">
              Rate Intelligence & Dynamic Pricing
            </h1>
            <p className="mt-2 font-sans text-xs sm:text-sm text-white/65 max-w-xl leading-relaxed">
              Algorithmic price suggestions driven by live occupancy velocity, market demand surge, and seasonal rate parity.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchRecommendations}
              className="btn-luxury-secondary text-xs"
            >
              <RefreshCw size={13} className="text-[#DFB76C]" />
              <span>Refresh Directives</span>
            </button>
          </div>
        </div>
        <div className="mt-6 gold-hairline"></div>
      </div>

      {/* Luxury Dropdown Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-[4px] border border-[#2C315E] bg-[#13152C] p-4 shadow-sm z-30 relative">
        <div className="flex flex-wrap items-center gap-3">
          {/* 1. Custom Property Dropdown Menu */}
          <div className="relative" ref={propertyDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsPropertyOpen(!isPropertyOpen);
                setIsStrategyOpen(false);
                setIsSortOpen(false);
              }}
              className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-[3px] bg-[#1B1E3D] hover:bg-[#24284F] border border-[#2C315E] hover:border-[#DFB76C]/60 text-xs font-sans text-white transition-all min-w-[280px] max-w-md cursor-pointer group shadow-inner"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Building2 size={15} className="text-[#DFB76C] shrink-0" />
                <div className="text-left truncate">
                  <div className="font-medium text-white truncate text-xs">
                    {selectedProperty ? selectedProperty.name : 'All Managed Properties'}
                  </div>
                  <div className="text-[10px] text-white/50 truncate">
                    {selectedProperty ? `${selectedProperty.city}, ${selectedProperty.country}` : `${properties.length} Estates Enrolled`}
                  </div>
                </div>
              </div>
              <ChevronDown
                size={14}
                className={`text-[#DFB76C] transition-transform duration-200 shrink-0 ${
                  isPropertyOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Property Dropdown Panel */}
            <AnimatePresence>
              {isPropertyOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute left-0 top-full mt-2 w-80 sm:w-96 rounded-[4px] bg-[#13152C] border border-[#2C315E] shadow-2xl p-2 z-50 overflow-hidden"
                >
                  {/* Search inside property dropdown */}
                  <div className="relative mb-2 px-1 pt-1">
                    <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#DFB76C] pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search estate by name or city..."
                      value={propertySearch}
                      onChange={(e) => setPropertySearch(e.target.value)}
                      className="w-full !pl-8 pr-3 py-1.5 bg-[#1B1E3D] border border-[#2C315E] rounded-[2px] text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#DFB76C]"
                    />
                    {propertySearch && (
                      <button
                        onClick={() => setPropertySearch('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Options List */}
                  <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {/* All Properties Option */}
                    <button
                      type="button"
                      onClick={() => {
                        setPropertyId('');
                        setIsPropertyOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-[2px] transition-colors flex items-center justify-between cursor-pointer ${
                        !propertyId
                          ? 'bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/40 font-semibold'
                          : 'text-white/80 hover:bg-[#1B1E3D]/80 hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="font-editorial text-sm">All Managed Properties</div>
                        <div className="text-[10px] text-white/50">Show global suggestions across all 21 portfolios</div>
                      </div>
                      {!propertyId && <Check size={14} className="text-[#DFB76C] shrink-0" />}
                    </button>

                    <div className="gold-hairline my-1 opacity-40" />

                    {filteredProperties.length === 0 ? (
                      <div className="py-4 text-center text-xs text-white/40 font-sans">
                        No estates matching "{propertySearch}"
                      </div>
                    ) : (
                      filteredProperties.map((p) => {
                        const pId = p.id || p._id;
                        const isSelected = propertyId === pId;
                        return (
                          <button
                            key={pId}
                            type="button"
                            onClick={() => {
                              setPropertyId(pId);
                              setIsPropertyOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-[2px] transition-colors flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/40 font-semibold'
                                : 'text-white/80 hover:bg-[#1B1E3D]/80 hover:text-white'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <div className="font-sans text-xs truncate font-medium text-white">
                                {p.name}
                              </div>
                              <div className="text-[10px] text-white/50 flex items-center gap-1.5 mt-0.5">
                                <span>{p.city}, {p.country}</span>
                                <span>&bull;</span>
                                <span className="font-cinzel text-[8.5px] text-[#DFB76C] bg-[#13152C] px-1 rounded-[1px] border border-[#2C315E]">
                                  {p.property_code}
                                </span>
                              </div>
                            </div>
                            {isSelected && <Check size={14} className="text-[#DFB76C] shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 2. Custom Strategy Directives Dropdown Menu */}
          <div className="relative" ref={strategyDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsStrategyOpen(!isStrategyOpen);
                setIsPropertyOpen(false);
                setIsSortOpen(false);
              }}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-[3px] bg-[#1B1E3D] hover:bg-[#24284F] border border-[#2C315E] hover:border-[#DFB76C]/60 text-xs font-sans text-white transition-all min-w-[210px] cursor-pointer shadow-inner"
            >
              <div className="flex items-center gap-2 truncate">
                <SlidersHorizontal size={13} className="text-[#DFB76C] shrink-0" />
                <span className="truncate">{activeStrategy.label}</span>
              </div>
              <ChevronDown
                size={13}
                className={`text-[#DFB76C] transition-transform duration-200 shrink-0 ${
                  isStrategyOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Strategy Dropdown Panel */}
            <AnimatePresence>
              {isStrategyOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute left-0 top-full mt-2 w-72 rounded-[4px] bg-[#13152C] border border-[#2C315E] shadow-2xl p-1.5 z-50 overflow-hidden"
                >
                  <div className="space-y-1">
                    {STRATEGY_OPTIONS.map((opt) => {
                      const isSelected = strategyFilter === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setStrategyFilter(opt.id);
                            setIsStrategyOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-[2px] transition-colors flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/40 font-semibold'
                              : 'text-white/80 hover:bg-[#1B1E3D]/80 hover:text-white'
                          }`}
                        >
                          <div>
                            <div className="font-sans text-xs">{opt.label}</div>
                            <div className="text-[10px] text-white/50">{opt.desc}</div>
                          </div>
                          {isSelected && <Check size={14} className="text-[#DFB76C] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 3. Custom Sort Dropdown Menu */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsSortOpen(!isSortOpen);
                setIsPropertyOpen(false);
                setIsStrategyOpen(false);
              }}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-[3px] bg-[#1B1E3D] hover:bg-[#24284F] border border-[#2C315E] hover:border-[#DFB76C]/60 text-xs font-sans text-white transition-all min-w-[200px] cursor-pointer shadow-inner"
            >
              <div className="flex items-center gap-2 truncate">
                <ArrowUpDown size={13} className="text-[#DFB76C] shrink-0" />
                <span className="truncate">{activeSort.label}</span>
              </div>
              <ChevronDown
                size={13}
                className={`text-[#DFB76C] transition-transform duration-200 shrink-0 ${
                  isSortOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Sort Dropdown Panel */}
            <AnimatePresence>
              {isSortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-64 rounded-[4px] bg-[#13152C] border border-[#2C315E] shadow-2xl p-1.5 z-50 overflow-hidden"
                >
                  <div className="space-y-1">
                    {SORT_OPTIONS.map((opt) => {
                      const isSelected = sortBy === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSortBy(opt.id);
                            setIsSortOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-[2px] transition-colors flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/40 font-semibold'
                              : 'text-white/80 hover:bg-[#1B1E3D]/80 hover:text-white'
                          }`}
                        >
                          <span className="font-sans text-xs">{opt.label}</span>
                          {isSelected && <Check size={14} className="text-[#DFB76C] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-cinzel text-[10px] uppercase tracking-wider text-[#DFB76C] font-semibold bg-[#1B1E3D] px-2.5 py-1 rounded-[2px] border border-[#2C315E]">
            {displayedRecommendations.length} of {recommendations.length} Directives Active
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="flex items-center gap-3 rounded-[3px] border border-emerald-500/40 bg-[#1B1E3D] p-4 text-xs font-sans text-emerald-300 shadow-md animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}

      {loading ? (
        <LoadingSpinner text="Computing demand velocity and optimal rates..." />
      ) : displayedRecommendations.length === 0 ? (
        <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-12 text-center shadow-sm max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-[2px] bg-[#1B1E3D] border border-emerald-500/40 flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <CheckCircle size={24} strokeWidth={1.5} />
          </div>
          <h3 className="font-editorial text-2xl font-normal text-white">All Rates are Up to Date</h3>
          <p className="mt-2 text-xs font-sans text-white/60 max-w-md mx-auto leading-relaxed">
            {recommendations.length > 0
              ? 'No recommendations match your active filter criteria. Try adjusting the strategy or estate selection.'
              : 'All your room prices match current demand and yield curve targets. No adjustments needed right now.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayedRecommendations.map((rec) => {
            const isPositive = rec.change_percentage >= 0;
            return (
              <div
                key={rec.room_type_id}
                className="relative flex flex-col justify-between overflow-hidden rounded-[4px] border border-[#2C315E] bg-[#13152C] p-6 shadow-sm hover:border-[#DFB76C]/80 transition-all hover:shadow-[0_8px_24px_rgba(223,183,108,0.12)] group"
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="font-cinzel text-[9px] font-bold text-[#DFB76C] tracking-[0.2em] uppercase block truncate">
                        {rec.property_name}
                      </span>
                      <h3 className="font-editorial text-xl font-normal text-white mt-0.5 truncate">
                        {rec.room_type_name}
                      </h3>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-[2px] px-2.5 py-1 text-[10px] font-cinzel font-bold uppercase tracking-wider border shrink-0 ${
                        isPositive
                          ? 'bg-[#1B1E3D] text-emerald-400 border-emerald-500/30'
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
                      <p className="font-editorial text-lg text-white/70 line-through decoration-rose-400/50 mt-0.5">
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
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#1B1E3D] rounded-full overflow-hidden border border-[#2C315E]">
                          <div
                            className="h-full bg-gradient-to-r from-[#DFB76C] to-emerald-400"
                            style={{ width: `${Math.round((rec.confidence || 0) * 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-white font-sans text-xs">
                          {Math.round((rec.confidence || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-[#2C315E] pt-4">
                  <button
                    onClick={() => handleApply(rec)}
                    disabled={applyingId === rec.room_type_id}
                    className="w-full h-10 px-3.5 py-2 rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-[#13152C] font-cinzel text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {applyingId === rec.room_type_id ? 'Applying Rate...' : 'Apply Rate →'}
                  </button>
                  <button
                    onClick={() => handleIgnore(rec.room_type_id)}
                    className="w-full h-10 px-3.5 py-2 rounded-[2px] bg-[#1B1E3D] hover:bg-[#24284F] text-[#FAF6F0] border border-[#2C315E] hover:border-[#DFB76C]/60 font-cinzel text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center transition cursor-pointer"
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
