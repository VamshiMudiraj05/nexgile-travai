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
  Filter,
  CheckCircle,
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
    <div className="space-y-12 max-w-7xl mx-auto pb-24">
      {/* Editorial Hero Banner */}
      <div className="relative overflow-hidden rounded-[4px] border border-[#DFB76C]/30 bg-[#13152C] p-8 md:p-14 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#DFB76C]/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-3xl">
          <span className="eyebrow-label text-[#DFB76C] block mb-2">
            CURATED INDIAN LUXURY HOSPITALITY &middot; EDITORIAL COLLECTION
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-editorial font-bold text-[#FFFFFF] tracking-tight leading-tight">
            Discover Exceptional Estates &amp; Sanctuaries
          </h1>
          <p className="mt-3 text-sm text-[#FAF6F0]/80 font-sans max-w-xl">
            Live estate inventory, transparent member privileges, and personalized luxury accommodations crafted for the discerning traveler.
          </p>
        </div>

        {/* Unified Luxury Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-10 grid grid-cols-1 gap-3 rounded-[3px] border border-[#DFB76C]/40 bg-[#FFFFFF] p-4 shadow-xl sm:grid-cols-2 lg:grid-cols-5"
        >
          {/* Destination */}
          <div className="flex items-center gap-3 rounded-[2px] bg-[#FAF6F0] px-4 py-2.5 border border-[#DFB76C]/20">
            <MapPin size={18} className="text-[#B88E43] shrink-0" />
            <div className="min-w-0 flex-1">
              <label className="block eyebrow-label text-[#13152C]/60">Destination</label>
              <input
                type="text"
                placeholder="e.g. Udaipur, Goa, Jaipur..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-[#13152C] placeholder-[#13152C]/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Check-In */}
          <div className="flex items-center gap-3 rounded-[2px] bg-[#FAF6F0] px-4 py-2.5 border border-[#DFB76C]/20">
            <Calendar size={18} className="text-[#B88E43] shrink-0" />
            <div className="min-w-0 flex-1">
              <label className="block eyebrow-label text-[#13152C]/60">Arrival</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-[#13152C] focus:outline-none"
              />
            </div>
          </div>

          {/* Check-Out */}
          <div className="flex items-center gap-3 rounded-[2px] bg-[#FAF6F0] px-4 py-2.5 border border-[#DFB76C]/20">
            <Calendar size={18} className="text-[#B88E43] shrink-0" />
            <div className="min-w-0 flex-1">
              <label className="block eyebrow-label text-[#13152C]/60">Departure</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-[#13152C] focus:outline-none"
              />
            </div>
          </div>

          {/* Guests & Rooms */}
          <div className="flex items-center gap-3 rounded-[2px] bg-[#FAF6F0] px-4 py-2.5 border border-[#DFB76C]/20">
            <Users size={18} className="text-[#B88E43] shrink-0" />
            <div className="min-w-0 flex-1">
              <label className="block eyebrow-label text-[#13152C]/60">Guests &amp; Suites</label>
              <select
                value={`${adults}-${rooms}`}
                onChange={(e) => {
                  const [a, r] = e.target.value.split('-');
                  setAdults(Number(a));
                  setRooms(Number(r));
                }}
                className="w-full bg-transparent text-xs font-semibold text-[#13152C] focus:outline-none"
              >
                <option value="1-1">1 Guest, 1 Suite</option>
                <option value="2-1">2 Guests, 1 Suite</option>
                <option value="3-1">3 Guests, 1 Suite</option>
                <option value="4-2">4 Guests, 2 Suites</option>
              </select>
            </div>
          </div>

          {/* Search CTA */}
          <div className="flex items-center">
            <button
              type="submit"
              className="btn-luxury-primary w-full h-full py-3.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search size={15} className="text-[#DFB76C]" />
              <span>Explore Stays</span>
            </button>
          </div>
        </form>
      </div>

      {/* Personalized AI Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#DFB76C]/30">
            <div>
              <span className="eyebrow-label text-[#B88E43] flex items-center gap-1.5">
                <Sparkles size={14} /> AI INTELLIGENCE &middot; CURATED FOR YOU
              </span>
              <h2 className="text-2xl font-editorial font-bold text-[#13152C] mt-0.5">
                Personalized Stays &amp; Preferred Retreats
              </h2>
            </div>
            <Link to="/profile" className="text-xs font-cinzel text-[#B88E43] hover:underline">
              Edit Preferences &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.slice(0, 3).map((rec) => (
              <div
                key={rec.property_id}
                className="group flex flex-col justify-between overflow-hidden rounded-[4px] border border-[#DFB76C]/35 bg-[#FFFFFF] p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div>
                  <div className="relative h-52 overflow-hidden rounded-[2px] bg-[#13152C]">
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
                    <div className="absolute top-3 right-3 rounded-[2px] bg-[#13152C]/90 px-2.5 py-1 text-[10px] font-cinzel font-bold text-[#DFB76C] border border-[#DFB76C]/40">
                      {Math.round(rec.match_score * 100)}% Match
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between">
                      <span className="eyebrow-label text-[#13152C]/60">{rec.city}</span>
                      <StarRating rating={rec.star_rating} size={13} />
                    </div>
                    <h3 className="mt-1 font-editorial text-xl font-bold text-[#13152C] group-hover:text-[#B88E43] transition-colors">
                      {rec.property_name}
                    </h3>
                    <p className="mt-1 text-xs text-[#B88E43] font-medium font-cinzel">
                      {rec.match_reasons?.[0] || 'Matches your travel profile'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[#DFB76C]/20 pt-4">
                  <div>
                    <span className="eyebrow-label text-[#13152C]/60 block">From</span>
                    <p className="text-xl font-editorial font-bold text-[#13152C]">
                      ₹{rec.starting_price?.toLocaleString()}
                      <span className="text-xs font-sans font-normal text-[#13152C]/60"> / night</span>
                    </p>
                  </div>
                  <Link
                    to={`/marketplace/properties/${rec.property_id}?check_in=${checkIn}&check_out=${checkOut}&adults=${adults}`}
                    className="btn-luxury-secondary text-xs inline-flex items-center gap-1.5"
                  >
                    <span>View Estate</span>
                    <ArrowRight size={13} className="text-[#B88E43]" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Property Catalog */}
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center pb-3 border-b border-[#DFB76C]/30">
          <div>
            <span className="eyebrow-label text-[#B88E43]">ESTATE COLLECTION</span>
            <h2 className="text-2xl font-editorial font-bold text-[#13152C] mt-0.5">Available Accommodations</h2>
            <p className="text-xs text-[#13152C]/70">
              {properties.length} estates with confirmed availability for {checkIn} to {checkOut}
            </p>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-[#B88E43]" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                fetchCatalogAndRecommendations(checkIn, checkOut);
              }}
              className="rounded-[3px] border border-[#DFB76C]/40 bg-[#FAF6F0] px-3.5 py-2 text-xs font-semibold text-[#13152C] focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF]"
            >
              <option value="price_asc">Rate: Low to High</option>
              <option value="price_desc">Rate: High to Low</option>
              <option value="rating">Guest Star Rating</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Consulting live suite inventory and room rates..." />
        ) : properties.length === 0 ? (
          <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-14 text-center shadow-sm">
            <Building2 size={40} className="mx-auto text-[#B88E43]" />
            <h3 className="mt-4 font-editorial text-2xl font-bold text-[#13152C]">No Available Accommodations Found</h3>
            <p className="mt-1 text-xs text-[#13152C]/70">
              Try adjusting your destination, date range, or guest capacity.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((prop) => (
              <div
                key={prop.id}
                className="group flex flex-col justify-between overflow-hidden rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div>
                  {/* Large Editorial Photo Header */}
                  <div className="relative h-60 overflow-hidden bg-[#13152C]">
                    {prop.photos && prop.photos.length > 0 ? (
                      <img
                        src={prop.photos[0]}
                        alt={prop.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#DFB76C]/60">
                        <Building2 size={40} />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 rounded-[2px] bg-[#13152C]/90 px-3 py-1 text-[11px] font-cinzel font-bold text-[#F2D59B] border border-[#DFB76C]/30">
                      {prop.city}, {prop.country}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <span className="eyebrow-label text-[#B88E43]">
                        {prop.property_type || 'Luxury Resort'}
                      </span>
                      <StarRating rating={prop.star_rating} size={14} />
                    </div>

                    <h3 className="mt-2 font-editorial text-2xl font-bold text-[#13152C] group-hover:text-[#B88E43] transition-colors">
                      {prop.name}
                    </h3>

                    {/* Amenities pills */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {prop.amenities && prop.amenities.slice(0, 3).map((amenity, aIdx) => (
                        <span
                          key={aIdx}
                          className="rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/25 px-2.5 py-1 text-[10px] font-cinzel text-[#13152C]"
                        >
                          {amenity}
                        </span>
                      ))}
                      {prop.amenities?.length > 3 && (
                        <span className="rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/25 px-2 py-1 text-[10px] font-cinzel text-[#13152C]/60">
                          +{prop.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Pricing & CTA */}
                <div className="flex items-center justify-between border-t border-[#DFB76C]/20 bg-[#FAF6F0]/60 p-6">
                  <div>
                    <span className="eyebrow-label text-[#13152C]/60 block">Starting From</span>
                    <p className="font-editorial text-2xl font-bold text-[#13152C]">
                      ₹{prop.starting_price?.toLocaleString()}
                      <span className="text-xs font-sans font-normal text-[#13152C]/60"> / night</span>
                    </p>
                  </div>
                  <Link
                    to={`/marketplace/properties/${prop.id}?check_in=${checkIn}&check_out=${checkOut}&adults=${adults}`}
                    className="btn-luxury-primary text-xs inline-flex items-center gap-1.5"
                  >
                    <span>VIEW PROPERTY</span>
                    <ArrowRight size={13} className="text-[#DFB76C]" />
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
