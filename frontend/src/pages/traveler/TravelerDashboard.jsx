import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Building2,
  Key,
  Crown,
  Wallet,
  Sparkles,
  ArrowRight,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Luggage,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { travelerService } from '../../services/travelerService';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function TravelerDashboard() {
  const { user } = useAuth();
  const [tripsData, setTripsData] = useState({ upcoming: [], current: [], all: [] });
  const [_recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isKeyUnlocked, setIsKeyUnlocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const cleanName = user?.name
    ? user.name.replace(/\s*\(.*?\)\s*/g, '').trim() || user.name
    : 'Eleanor Vance';

  const loadTravelerData = useCallback(async () => {
    try {
      setLoading(true);
      const [trips, recs] = await Promise.allSettled([
        travelerService.getMyTrips(),
        travelerService.getRecommendations(),
      ]);

      if (trips.status === 'fulfilled' && trips.value) {
        setTripsData(trips.value);
      }
      if (recs.status === 'fulfilled' && recs.value) {
        setRecommendations(recs.value.slice(0, 3));
      }
    } catch (err) {
      console.error('Failed to load traveler dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTravelerData();
  }, [loadTravelerData]);

  const handleSimulateKeyUnlock = () => {
    setUnlocking(true);
    setTimeout(() => {
      setUnlocking(false);
      setIsKeyUnlocked(true);
      setTimeout(() => setIsKeyUnlocked(false), 5000);
    }, 1200);
  };

  if (loading) {
    return <LoadingSpinner text="Loading your guest dashboard..." />;
  }

  const upcomingTrips = tripsData.upcoming || [];
  const activeStay = tripsData.current?.[0] || upcomingTrips[0];

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      
      {/* 1. VIP Member Welcome Header */}
      <div className="relative overflow-hidden rounded-[4px] border border-[#2C315E] bg-[#13152C] p-6 sm:p-8 text-[#FAF6F0] shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[2px] bg-[#1B1E3D] border border-[#DFB76C]/30 text-[#DFB76C] font-cinzel text-[10px] tracking-[0.2em] uppercase font-semibold mb-2">
              <Crown className="w-3.5 h-3.5 text-[#DFB76C]" />
              <span>VIP Member</span>
            </div>
            <h1 className="font-editorial text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              Welcome back, {cleanName}
            </h1>
            <p className="mt-1 font-sans text-xs sm:text-sm text-white/70 max-w-xl">
              Access your digital room key, view upcoming bookings, check reward points, or chat with the concierge.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/marketplace"
              className="flex items-center gap-2 px-4 py-2.5 rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-[#13152C] font-cinzel text-xs font-bold tracking-wider uppercase transition shadow-sm"
            >
              <Compass className="w-4 h-4" />
              <span>Book a Stay</span>
            </Link>
            <Link
              to="/concierge"
              className="flex items-center gap-2 px-4 py-2.5 rounded-[2px] bg-[#1B1E3D] hover:bg-[#24284F] text-[#DFB76C] border border-[#2C315E] font-cinzel text-xs font-semibold tracking-wider uppercase transition"
            >
              <Sparkles className="w-4 h-4 text-[#DFB76C]" />
              <span>Ask Concierge</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Upcoming Trips */}
        <Link
          to="/my-trips"
          className="p-5 rounded-[4px] bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/60 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="font-cinzel text-[10px] tracking-wider uppercase text-white/60 font-semibold">
              Upcoming Stays
            </span>
            <div className="w-8 h-8 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] flex items-center justify-center">
              <Luggage className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-editorial text-2xl font-bold text-white">
            {upcomingTrips.length > 0 ? `${upcomingTrips.length} Booked` : '1 Reserved'}
          </div>
          <p className="mt-1 text-[11px] font-sans text-[#DFB76C] group-hover:underline flex items-center gap-1">
            <span>View your bookings</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Link>

        {/* Metric 2: Loyalty Rewards */}
        <Link
          to="/loyalty"
          className="p-5 rounded-[4px] bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/60 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="font-cinzel text-[10px] tracking-wider uppercase text-white/60 font-semibold">
              Reward Points
            </span>
            <div className="w-8 h-8 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-editorial text-2xl font-bold text-[#DFB76C]">
            14,250 <span className="text-xs font-sans text-white/50 font-normal">pts</span>
          </div>
          <p className="mt-1 text-[11px] font-sans text-[#DFB76C] group-hover:underline flex items-center gap-1">
            <span>Platinum Tier</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Link>

        {/* Metric 3: Travel Wallet */}
        <Link
          to="/superapp"
          className="p-5 rounded-[4px] bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/60 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="font-cinzel text-[10px] tracking-wider uppercase text-white/60 font-semibold">
              Travel Wallet
            </span>
            <div className="w-8 h-8 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-editorial text-2xl font-bold text-white">
            ₹28,500
          </div>
          <p className="mt-1 text-[11px] font-sans text-[#DFB76C] group-hover:underline flex items-center gap-1">
            <span>Available balance</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Link>

        {/* Metric 4: Concierge Status */}
        <Link
          to="/concierge"
          className="p-5 rounded-[4px] bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/60 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="font-cinzel text-[10px] tracking-wider uppercase text-white/60 font-semibold">
              Concierge
            </span>
            <div className="w-8 h-8 rounded-[2px] bg-[#1B1E3D] text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-editorial text-2xl font-bold text-white flex items-center gap-2">
            Available <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="mt-1 text-[11px] font-sans text-[#DFB76C] group-hover:underline flex items-center gap-1">
            <span>Chat anytime</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </Link>

      </div>

      {/* 3. Active Stay & Digital Room Key */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Active Stay Details (7 cols) */}
        <div className="lg:col-span-7 rounded-[4px] bg-[#13152C] border border-[#2C315E] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#2C315E]">
            <span className="font-cinzel text-xs tracking-wider uppercase text-[#DFB76C] font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#DFB76C]" />
              <span>Current or Next Booking</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-[2px] bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 font-cinzel text-[10px] font-bold uppercase">
              Confirmed
            </span>
          </div>

          <div className="mt-4">
            <h3 className="font-editorial text-xl font-bold text-white">
              {activeStay?.property_name || 'The Grand Palace Heritage Estate'}
            </h3>
            <p className="mt-1 text-xs text-white/70 flex items-center gap-1.5 font-sans">
              <MapPin className="w-3.5 h-3.5 text-[#DFB76C]" />
              <span>{activeStay?.property_city || 'Colaba, Mumbai'} &middot; Room #{activeStay?.room_number || '304'} (Royal King Ocean View)</span>
            </p>

            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] text-xs">
              <div>
                <span className="font-cinzel text-[9px] uppercase text-white/50 block font-semibold">Check-In</span>
                <span className="font-sans font-semibold text-white mt-0.5 block">
                  {activeStay?.check_in_date || 'Nov 26, 2026'}
                </span>
              </div>
              <div>
                <span className="font-cinzel text-[9px] uppercase text-white/50 block font-semibold">Check-Out</span>
                <span className="font-sans font-semibold text-white mt-0.5 block">
                  {activeStay?.check_out_date || 'Nov 30, 2026'}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="font-cinzel text-[9px] uppercase text-white/50 block font-semibold">Booking ID</span>
                <span className="font-mono text-xs text-[#DFB76C] font-bold mt-0.5 block">
                  {activeStay?.id ? `#${activeStay.id.slice(-6).toUpperCase()}` : '#RSV-84920'}
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                to="/my-trips"
                className="px-4 py-2 rounded-[2px] bg-[#1B1E3D] hover:bg-[#24284F] text-[#DFB76C] border border-[#2C315E] font-cinzel text-[11px] font-bold uppercase tracking-wider transition"
              >
                View Bill & Details
              </Link>
              <Link
                to="/concierge"
                className="px-4 py-2 rounded-[2px] bg-white/5 hover:bg-white/10 text-white font-cinzel text-[11px] font-semibold uppercase tracking-wider transition"
              >
                Message Hotel Staff
              </Link>
            </div>
          </div>
        </div>

        {/* Digital Room Keycard (5 cols) */}
        <div className="lg:col-span-5 rounded-[4px] bg-[#13152C] border border-[#2C315E] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#2C315E]">
              <span className="font-cinzel text-xs tracking-wider uppercase text-[#DFB76C] font-semibold flex items-center gap-2">
                <Key className="w-4 h-4 text-[#DFB76C]" />
                <span>Digital Room Key</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Ready to Use
              </span>
            </div>

            <div className="mt-4 p-5 rounded-[4px] bg-[#0B0C1E] border border-[#DFB76C]/30 text-center relative overflow-hidden">
              <div className="font-cinzel text-[10px] tracking-widest text-[#DFB76C] uppercase font-bold">
                ROOM PASS
              </div>
              <div className="font-editorial text-3xl font-bold text-white mt-1">
                Room #{activeStay?.room_number || '304'}
              </div>
              <p className="text-[11px] text-white/60 mt-1 font-sans">
                Hold your phone near your door lock to open
              </p>

              {isKeyUnlocked ? (
                <div className="mt-4 p-3 rounded-[2px] bg-emerald-950/70 border border-emerald-500/50 flex items-center justify-center gap-2 text-emerald-300 font-cinzel text-xs font-bold tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Door Unlocked &middot; Welcome!</span>
                </div>
              ) : (
                <button
                  onClick={handleSimulateKeyUnlock}
                  disabled={unlocking}
                  className="mt-4 w-full py-2.5 rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-[#13152C] font-cinzel text-xs font-bold tracking-widest uppercase transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {unlocking ? 'Opening Door...' : 'Tap to Unlock Room'}
                </button>
              )}
            </div>
          </div>

          <p className="mt-4 text-[11px] text-white/50 font-sans text-center">
            Works offline &middot; No internet connection needed at your door
          </p>
        </div>

      </div>

      {/* 4. Quick Services */}
      <div>
        <h3 className="font-editorial text-xl font-bold text-white mb-4">
          Quick Services
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Link
            to="/marketplace"
            className="p-5 rounded-[4px] bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/60 transition-all group"
          >
            <div className="w-9 h-9 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] flex items-center justify-center mb-3">
              <Building2 className="w-4 h-4" />
            </div>
            <h4 className="font-editorial text-base font-bold text-white group-hover:text-[#DFB76C] transition-colors">
              Book a Room
            </h4>
            <p className="mt-1 text-xs text-white/65 leading-relaxed font-sans">
              Find and book luxury rooms and suites at our properties.
            </p>
            <div className="mt-3 text-[11px] font-cinzel text-[#DFB76C] font-semibold flex items-center gap-1">
              <span>Find Rooms</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/marketplace/multimodal"
            className="p-5 rounded-[4px] bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/60 transition-all group"
          >
            <div className="w-9 h-9 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] flex items-center justify-center mb-3">
              <Compass className="w-4 h-4" />
            </div>
            <h4 className="font-editorial text-base font-bold text-white group-hover:text-[#DFB76C] transition-colors">
              Flights & Taxis
            </h4>
            <p className="mt-1 text-xs text-white/65 leading-relaxed font-sans">
              Book your hotel, flight tickets, and airport taxi in one booking.
            </p>
            <div className="mt-3 text-[11px] font-cinzel text-[#DFB76C] font-semibold flex items-center gap-1">
              <span>Book Transport</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/my-trips"
            className="p-5 rounded-[4px] bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/60 transition-all group"
          >
            <div className="w-9 h-9 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] flex items-center justify-center mb-3">
              <Luggage className="w-4 h-4" />
            </div>
            <h4 className="font-editorial text-base font-bold text-white group-hover:text-[#DFB76C] transition-colors">
              My Trips & Bills
            </h4>
            <p className="mt-1 text-xs text-white/65 leading-relaxed font-sans">
              View your booking history, download receipts, and check bills.
            </p>
            <div className="mt-3 text-[11px] font-cinzel text-[#DFB76C] font-semibold flex items-center gap-1">
              <span>View Bookings</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/corporate/expenses"
            className="p-5 rounded-[4px] bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/60 transition-all group"
          >
            <div className="w-9 h-9 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="font-editorial text-base font-bold text-white group-hover:text-[#DFB76C] transition-colors">
              Business Travel & Expenses
            </h4>
            <p className="mt-1 text-xs text-white/65 leading-relaxed font-sans">
              Submit trip expenses, scan paper receipts, and charge your company.
            </p>
            <div className="mt-3 text-[11px] font-cinzel text-[#DFB76C] font-semibold flex items-center gap-1">
              <span>Manage Expenses</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

        </div>
      </div>

    </div>
  );
}
