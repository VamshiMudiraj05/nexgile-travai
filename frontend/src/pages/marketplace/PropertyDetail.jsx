import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Users,
  Bed,
  Check,
  CheckCircle,
  Building2,
  ArrowLeft,
  CalendarDays,
} from 'lucide-react';
import { marketplaceService } from '../../services/marketplaceService';
import StarRating from '../../components/StarRating';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Calendar } from '@/components/ui/calendar';

export default function PropertyDetail() {
  const { property_id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkIn = searchParams.get('check_in') || '';
  const checkOut = searchParams.get('check_out') || '';
  const adults = Number(searchParams.get('adults')) || 2;

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dateRange = {
    from: checkIn ? new Date(checkIn + 'T00:00:00') : null,
    to: checkOut ? new Date(checkOut + 'T00:00:00') : null,
  };

  const handleRangeSelect = (range) => {
    if (range?.from) {
      const cinStr = range.from.toISOString().split('T')[0];
      if (range.to) {
        const coutStr = range.to.toISOString().split('T')[0];
        setSearchParams({
          check_in: cinStr,
          check_out: coutStr,
          adults: String(adults),
        });
        setIsDatePickerOpen(false);
      }
    }
  };

  useEffect(() => {
    fetchPropertyDetail();
  }, [property_id, checkIn, checkOut]);

  // Assemble full photo gallery: property photos, room photos, then curated fallbacks
  const galleryPhotos = useMemo(() => {
    const list = [...(property?.photos || [])];
    if (property?.room_types) {
      for (const rt of property.room_types) {
        if (rt.photos && Array.isArray(rt.photos)) {
          for (const p of rt.photos) {
            if (p && !list.includes(p)) list.push(p);
          }
        }
      }
    }
    const fallbacks = [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80",
    ];
    for (const fb of fallbacks) {
      if (list.length >= 3) break;
      if (!list.includes(fb)) list.push(fb);
    }
    return list;
  }, [property]);

  const fetchPropertyDetail = async () => {
    try {
      setLoading(true);
      const res = await marketplaceService.getPropertyDetails(property_id, {
        check_in: checkIn,
        check_out: checkOut,
        adults,
      });
      setProperty(res);
    } catch (err) {
      console.error('Failed to load property details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoom = (roomType) => {
    navigate(
      `/marketplace/checkout?property_id=${property_id}&room_type_id=${roomType.id}&check_in=${checkIn}&check_out=${checkOut}&adults=${adults}`
    );
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving verified estate availability..." />;
  }

  if (!property) {
    return (
      <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-16 text-center max-w-xl mx-auto my-12 shadow-sm text-[#FAF6F0]">
        <h3 className="text-2xl font-editorial font-bold text-white">Estate Not Located</h3>
        <p className="text-xs text-white/60 mt-2 mb-6">The requested estate folio could not be retrieved from the central inventory.</p>
        <Link to="/marketplace" className="btn-luxury-secondary text-xs inline-block">
          &larr; Return to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-24 text-[#FAF6F0]">
      {/* Back Button */}
      <Link
        to="/marketplace"
        className="inline-flex items-center gap-2 text-xs font-cinzel text-white/70 hover:text-[#DFB76C] transition-colors"
      >
        <ArrowLeft size={16} className="text-[#DFB76C]" /> Back to Search Results
      </Link>

      {/* Property Title & Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end pb-6 border-b border-[#2C315E]">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-cinzel text-[10px] tracking-[0.2em] uppercase font-bold text-[#DFB76C]">
              {property.property_type || 'ESTATE & SANCTUARY'}
            </span>
            <StarRating rating={property.star_rating} size={15} />
          </div>
          <h1 className="mt-2 text-3xl font-editorial font-bold text-white tracking-tight md:text-5xl">
            {property.name}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-white/70">
            <MapPin size={14} className="text-[#DFB76C]" />
            {property.address_line_1}, {property.city}, {property.state}, {property.country}
          </p>
        </div>

        {/* Stay Dates with EasyUI Calendar Range Picker */}
        <div className="relative" ref={datePickerRef}>
          <div
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            className="rounded-[3px] border border-[#2C315E] bg-[#13152C] hover:border-[#DFB76C]/60 p-4 shadow-sm cursor-pointer transition-colors"
            title="Click to modify dates with EasyUI Calendar"
          >
            <p className="font-cinzel text-[9px] uppercase tracking-wider text-white/60">Stay Dates (Click to Change)</p>
            <p className="text-xs font-bold text-[#DFB76C] font-mono flex items-center gap-2 mt-1">
              <CalendarDays size={14} className="text-[#DFB76C]" />
              {checkIn} &rarr; {checkOut}
            </p>
          </div>

          {isDatePickerOpen && (
            <div className="absolute right-0 top-full mt-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <Calendar
                mode="range"
                value={dateRange}
                onChange={handleRangeSelect}
                minDate={new Date()}
                className="shadow-2xl border-[#DFB76C]/40"
              />
            </div>
          )}
        </div>
      </div>

      {/* Large Editorial Photo Gallery */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2 h-96 overflow-hidden rounded-[4px] bg-[#13152C] border border-[#2C315E]">
          {galleryPhotos && galleryPhotos.length > 0 && galleryPhotos[0] ? (
            <img
              src={galleryPhotos[0]}
              alt={property.name}
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[#DFB76C]/60">
              <Building2 size={54} />
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="h-[11.5rem] overflow-hidden rounded-[4px] bg-[#13152C] border border-[#2C315E]">
            {galleryPhotos && galleryPhotos[1] ? (
              <img
                src={galleryPhotos[1]}
                alt="Estate Detail"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[#DFB76C]/60">
                <Building2 size={32} />
              </div>
            )}
          </div>
          <div className="h-[11.5rem] overflow-hidden rounded-[4px] bg-[#13152C] border border-[#2C315E]">
            {galleryPhotos && galleryPhotos[2] ? (
              <img
                src={galleryPhotos[2]}
                alt="Suite View"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[#DFB76C]/60">
                <Building2 size={32} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Property Overview & Amenities */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-8 shadow-sm">
            <span className="font-cinzel text-[10px] uppercase tracking-wider text-[#DFB76C] font-semibold">ESTATE ARCHITECTURE &amp; HERITAGE</span>
            <h2 className="text-2xl font-editorial font-bold text-white mt-1 mb-4">About the Sanctuary</h2>
            <p className="text-sm leading-relaxed text-white/80 font-sans">
              {property.description ||
                'Experience world-class hospitality, premier luxury amenities, and tailor-made guest experiences at this premier resort destination.'}
            </p>
          </div>

          {/* Amenities Grid */}
          <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-8 shadow-sm">
            <span className="font-cinzel text-[10px] uppercase tracking-wider text-[#DFB76C] font-semibold">SIGNATURE COMFORTS</span>
            <h2 className="text-2xl font-editorial font-bold text-white mt-1 mb-6">Property Highlights &amp; Amenities</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {property.amenities && property.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-white">
                  <CheckCircle size={15} className="text-[#DFB76C] shrink-0" />
                  <span className="font-medium">{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resident Privileges Card */}
        <div>
          <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-7 shadow-sm space-y-5 sticky top-20">
            <span className="font-cinzel text-[10px] uppercase tracking-wider text-[#DFB76C] font-semibold">MEMBER RECOGNITION</span>
            <h3 className="text-xl font-editorial font-bold text-white">Resident Inclusions</h3>
            <ul className="space-y-3 text-xs text-white/80 font-sans">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[#DFB76C]" /> Welcome Artisan High Tea Ceremony
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[#DFB76C]" /> Complimentary High-Speed Satellite Wi-Fi
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[#DFB76C]" /> In-suite Refreshment Bar Replenishment
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[#DFB76C]" /> Dedicated VIP Concierge Desk
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Available Room Types */}
      <div className="space-y-6 pt-4">
        <div>
          <span className="font-cinzel text-[10px] uppercase tracking-wider text-[#DFB76C] font-semibold">SUITE ACCOMMODATION OPTIONS</span>
          <h2 className="text-3xl font-editorial font-bold text-white mt-1">Available Suite Options</h2>
          <p className="text-xs text-white/70">
            Real-time live inventory for selected dates ({checkIn} to {checkOut})
          </p>
        </div>

        <div className="space-y-5">
          {property.room_types && property.room_types.length > 0 ? (
            property.room_types.map((rt) => (
              <div
                key={rt.id}
                className="flex flex-col justify-between gap-6 rounded-[4px] border border-[#2C315E] bg-[#13152C] p-8 shadow-sm transition-all md:flex-row md:items-center hover:border-[#DFB76C]/50"
              >
                {/* Room Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] px-2.5 py-0.5 text-[10px] font-cinzel font-bold text-[#DFB76C] uppercase">
                      {rt.code}
                    </span>
                    <span className="text-xs text-white/60 font-cinzel">
                      {rt.available_rooms_count} suites available
                    </span>
                  </div>

                  <h3 className="text-2xl font-editorial font-bold text-white">{rt.name}</h3>

                  <div className="flex flex-wrap items-center gap-5 text-xs text-white/80">
                    <div className="flex items-center gap-1.5">
                      <Bed size={15} className="text-[#DFB76C]" />
                      <span>{rt.bed_type}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={15} className="text-[#DFB76C]" />
                      <span>Accommodates up to {rt.max_occupancy} Guests</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {rt.amenities && rt.amenities.map((amenity, aIdx) => (
                      <span
                        key={aIdx}
                        className="rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] px-2 py-0.5 text-[10px] font-cinzel text-white/80"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Room Pricing & Select Action */}
                <div className="flex flex-col items-start border-t border-[#2C315E] pt-4 md:items-end md:border-t-0 md:pt-0">
                  <div className="text-left md:text-right">
                    <span className="font-cinzel text-[10px] uppercase tracking-wider text-white/60">Nightly Rate</span>
                    <p className="text-3xl font-editorial font-bold text-white">
                      ₹{rt.base_rate?.toLocaleString()}
                    </p>
                    <p className="text-xs font-semibold text-[#DFB76C] font-cinzel mt-0.5">
                      Total Stay: ₹{rt.total_stay_price?.toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => handleSelectRoom(rt)}
                    disabled={rt.available_rooms_count === 0}
                    className="btn-luxury-primary mt-4 w-full md:w-auto text-xs cursor-pointer disabled:opacity-50"
                  >
                    {rt.available_rooms_count > 0 ? 'SELECT SUITE →' : 'SOLD OUT'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-10 text-center text-white/60 font-editorial">
              No suites currently available for the selected reservation dates.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
