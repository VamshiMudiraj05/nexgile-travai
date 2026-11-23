import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Star,
  Sparkles,
  ArrowRight,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';
import { marketplaceService } from '../../services/marketplaceService';
import { travelerService } from '../../services/travelerService';
import StarRating from '../../components/StarRating';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function Marketplace() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search parameters
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [sortBy, setSortBy] = useState('price_asc');

  useEffect(() => {
    // Set default dates: check-in today + 3 days, check-out today + 6 days
    const today = new Date();
    const cin = new Date(today);
    cin.setDate(today.getDate() + 3);
    const cout = new Date(today);
    cout.setDate(today.getDate() + 6);

    const cinStr = cin.toISOString().split('T')[0];
    const coutStr = cout.toISOString().split('T')[0];
    setCheckIn(cinStr);
    setCheckOut(coutStr);

    fetchCatalogAndRecommendations(cinStr, coutStr);
  }, []);

  const fetchCatalogAndRecommendations = async (cin, cout) => {
    try {
      setLoading(true);
      const searchRes = await marketplaceService.search({
        check_in: cin,
        check_out: cout,
        adults,
        children,
        rooms,
        sort_by: sortBy,
      });
      setProperties(searchRes.properties || []);

      // Fetch personalized recommendations
      try {
        const recRes = await travelerService.getRecommendations();
        setRecommendations(recRes || []);
      } catch (e) {
        // Traveler might not be logged in or model returned empty
      }
    } catch (err) {
      console.error('Failed to search marketplace:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCatalogAndRecommendations(checkIn, checkOut);
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-16">
      {/* Editorial Hero Banner */}
      <div className="relative overflow-hidden rounded-[4px] border border-[#2C315E] bg-[#13152C] p-6 md:p-10 shadow-md">
        <div className="relative z-10 max-w-3xl">
          <span className="font-cinzel text-[10px] tracking-[0.25em] text-[#DFB76C] uppercase font-semibold block mb-2">
            CURATED LUXURY HOSPITALITY &middot; HOTEL SUITES
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-editorial font-bold text-white tracking-tight leading-tight">
            Discover Exceptional Estates &amp; Sanctuaries
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-white/70 font-sans max-w-xl leading-relaxed">
            Live estate inventory, transparent member privileges, and verified luxury accommodations.
          </p>
        </div>

        {/* Unified Luxury Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-6 grid grid-cols-1 gap-2.5 rounded-[3px] border border-[#2C315E] bg-[#0B0C1E] p-3 shadow-md sm:grid-cols-2 lg:grid-cols-5"
        >
          {/* Destination */}
          <div className="flex items-center gap-2.5 rounded-[2px] bg-[#1B1E3D] px-3.5 py-2 border border-[#2C315E]">
            <MapPin size={16} className="text-[#DFB76C] shrink-0" />
            <div className="min-w-0 flex-1">
              <label className="block font-cinzel text-[9px] tracking-wider uppercase text-[#DFB76C]">Destination</label>
              <input
                type="text"
                placeholder="Udaipur, Goa, Mumbai..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-white placeholder-white/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Check-In */}
          <div className="flex items-center gap-2.5 rounded-[2px] bg-[#1B1E3D] px-3.5 py-2 border border-[#2C315E]">
            <Calendar size={16} className="text-[#DFB76C] shrink-0" />
            <div className="min-w-0 flex-1">
              <label className="block font-cinzel text-[9px] tracking-wider uppercase text-[#DFB76C]">Arrival</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-white focus:outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Check-Out */}
          <div className="flex items-center gap-2.5 rounded-[2px] bg-[#1B1E3D] px-3.5 py-2 border border-[#2C315E]">
            <Calendar size={16} className="text-[#DFB76C] shrink-0" />
            <div className="min-w-0 flex-1">
              <label className="block font-cinzel text-[9px] tracking-wider uppercase text-[#DFB76C]">Departure</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-white focus:outline-none [color-scheme:dark]"
              />
            </div>
          </div>

          {/* Guests & Rooms */}
          <div className="flex items-center gap-2.5 rounded-[2px] bg-[#1B1E3D] px-3.5 py-2 border border-[#2C315E]">
            <Users size={16} className="text-[#DFB76C] shrink-0" />
            <div className="min-w-0 flex-1">
              <label className="block font-cinzel text-[9px] tracking-wider uppercase text-[#DFB76C]">Guests &amp; Suites</label>
              <select
                value={`${adults}-${rooms}`}
                onChange={(e) => {
                  const [a, r] = e.target.value.split('-');
                  setAdults(Number(a));
                  setRooms(Number(r));
                }}
                className="w-full bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer [color-scheme:dark]"
              >
                <option value="1-1" className="bg-[#13152C] text-white">1 Guest, 1 Suite</option>
                <option value="2-1" className="bg-[#13152C] text-white">2 Guests, 1 Suite</option>
                <option value="3-1" className="bg-[#13152C] text-white">3 Guests, 1 Suite</option>
                <option value="4-2" className="bg-[#13152C] text-white">4 Guests, 2 Suites</option>
              </select>
            </div>
          </div>

          {/* Search CTA */}
          <div className="flex items-center">
            <button
              type="submit"
              className="w-full h-full py-2.5 rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-[#13152C] font-cinzel text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer transition shadow-sm"
            >
              <Search size={15} />
              <span>Explore Stays</span>
            </button>
          </div>
        </form>
      </div>

      {/* Personalized Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#2C315E]">
            <div>
              <span className="font-cinzel text-[10px] tracking-widest text-[#DFB76C] uppercase font-semibold flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#DFB76C]" /> CURATED FOR YOU
              </span>
              <h2 className="text-xl font-editorial font-bold text-white mt-0.5">
                Personalized Stays &amp; Preferred Retreats
              </h2>
            </div>
            <Link to="/profile" className="text-xs font-cinzel text-[#DFB76C] hover:underline">
              Edit Preferences &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.slice(0, 3).map((rec) => (
              <div
                key={rec.property_id}
                className="group flex flex-col justify-between overflow-hidden rounded-[4px] border border-[#2C315E] bg-[#13152C] p-5 shadow-sm hover:border-[#DFB76C]/60 transition-all"
              >
                <div>
                  <div className="relative h-48 overflow-hidden rounded-[2px] bg-[#1B1E3D]">
                    {rec.photos && rec.photos.length > 0 ? (
                      <img
                        src={rec.photos[0]}
                        alt={rec.property_name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#DFB76C]/60">
                        <Building2 size={36} />
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5 rounded-[2px] bg-[#0B0C1E]/90 px-2 py-0.5 text-[9px] font-cinzel font-bold text-[#DFB76C] border border-[#DFB76C]/40">
                      {Math.round(rec.match_score * 100)}% Match
                    </div>
                  </div>

                  <div className="mt-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-cinzel text-[10px] text-white/60 tracking-wider uppercase">{rec.city}</span>
                      <StarRating rating={rec.star_rating} size={13} />
                    </div>
                    <h3 className="mt-1 font-editorial text-lg font-bold text-white group-hover:text-[#DFB76C] transition-colors">
                      {rec.property_name}
                    </h3>
                    <p className="mt-0.5 text-xs text-[#DFB76C]/80 font-medium font-sans">
                      {rec.match_reasons?.[0] || 'Matches your travel profile'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[#2C315E] pt-3.5">
                  <div>
                    <span className="font-cinzel text-[9px] text-white/50 block uppercase tracking-wider">From</span>
                    <p className="text-lg font-editorial font-bold text-[#DFB76C]">
                      ₹{rec.starting_price?.toLocaleString()}
                      <span className="text-xs font-sans font-normal text-white/60"> / night</span>
                    </p>
                  </div>
                  <Link
                    to={`/marketplace/properties/${rec.property_id}?check_in=${checkIn}&check_out=${checkOut}&adults=${adults}`}
                    className="px-3.5 py-1.5 rounded-[2px] bg-[#1B1E3D] hover:bg-[#24284F] text-[#DFB76C] border border-[#2C315E] font-cinzel text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition"
                  >
                    <span>View Estate</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Property Catalog */}
      <div className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center pb-2.5 border-b border-[#2C315E]">
          <div>
            <span className="font-cinzel text-[10px] tracking-widest text-[#DFB76C] uppercase font-semibold">ESTATE COLLECTION</span>
            <h2 className="text-xl font-editorial font-bold text-white mt-0.5">Available Accommodations</h2>
            <p className="text-xs text-white/60 font-sans">
              {properties.length} estates available for {checkIn} to {checkOut}
            </p>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-[#DFB76C]" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                fetchCatalogAndRecommendations(checkIn, checkOut);
              }}
              className="rounded-[2px] border border-[#2C315E] bg-[#1B1E3D] px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-[#DFB76C] cursor-pointer [color-scheme:dark]"
            >
              <option value="price_asc" className="bg-[#13152C] text-white">Rate: Low to High</option>
              <option value="price_desc" className="bg-[#13152C] text-white">Rate: High to Low</option>
              <option value="rating" className="bg-[#13152C] text-white">Guest Star Rating</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Consulting live suite inventory and room rates..." />
        ) : properties.length === 0 ? (
          <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-12 text-center shadow-sm">
            <Building2 size={36} className="mx-auto text-[#DFB76C]" />
            <h3 className="mt-3 font-editorial text-xl font-bold text-white">No Available Accommodations Found</h3>
            <p className="mt-1 text-xs text-white/60 font-sans">
              Try adjusting your destination, date range, or guest capacity.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((prop) => (
              <div
                key={prop.id}
                className="group flex flex-col justify-between overflow-hidden rounded-[4px] border border-[#2C315E] bg-[#13152C] shadow-sm hover:border-[#DFB76C]/60 transition-all duration-300"
              >
                <div>
                  {/* Large Editorial Photo Header */}
                  <div className="relative h-52 overflow-hidden bg-[#1B1E3D]">
                    {prop.photos && prop.photos.length > 0 ? (
                      <img
                        src={prop.photos[0]}
                        alt={prop.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#DFB76C]/60">
                        <Building2 size={36} />
                      </div>
                    )}
                    <div className="absolute top-2.5 left-2.5 rounded-[2px] bg-[#0B0C1E]/90 px-2.5 py-1 text-[10px] font-cinzel font-bold text-[#DFB76C] border border-[#DFB76C]/30">
                      {prop.city}, {prop.country}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="font-cinzel text-[10px] tracking-wider uppercase text-white/60">
                        {prop.property_type || 'Luxury Resort'}
                      </span>
                      <StarRating rating={prop.star_rating} size={13} />
                    </div>

                    <h3 className="mt-1.5 font-editorial text-xl font-bold text-white group-hover:text-[#DFB76C] transition-colors">
                      {prop.name}
                    </h3>

                    {/* Amenities pills */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {prop.amenities && prop.amenities.slice(0, 3).map((amenity, aIdx) => (
                        <span
                          key={aIdx}
                          className="rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] px-2 py-0.5 text-[9px] font-cinzel text-[#DFB76C]"
                        >
                          {amenity}
                        </span>
                      ))}
                      {prop.amenities?.length > 3 && (
                        <span className="rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] px-2 py-0.5 text-[9px] font-cinzel text-white/50">
                          +{prop.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Pricing & CTA */}
                <div className="flex items-center justify-between border-t border-[#2C315E] bg-[#1B1E3D]/40 p-4">
                  <div>
                    <span className="font-cinzel text-[9px] text-white/50 block uppercase tracking-wider">Starting From</span>
                    <p className="font-editorial text-xl font-bold text-[#DFB76C]">
                      ₹{prop.starting_price?.toLocaleString()}
                      <span className="text-xs font-sans font-normal text-white/60"> / night</span>
                    </p>
                  </div>
                  <Link
                    to={`/marketplace/properties/${prop.id}?check_in=${checkIn}&check_out=${checkOut}&adults=${adults}`}
                    className="px-3.5 py-1.5 rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-[#13152C] font-cinzel text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1.5 transition shadow-sm"
                  >
                    <span>View Suite</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
