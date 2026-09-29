import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Users,
  Bed,
  Check,
  Star,
  ArrowLeft,
  Building2,
  Sparkles,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { marketplaceService } from '../../services/marketplaceService';
import StarRating from '../../components/StarRating';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function PropertyDetail() {
  const { property_id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkIn = searchParams.get('check_in') || '';
  const checkOut = searchParams.get('check_out') || '';
  const adults = Number(searchParams.get('adults')) || 2;

  useEffect(() => {
    fetchPropertyDetail();
  }, [property_id, checkIn, checkOut]);

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
      `/marketplace/book?property_id=${property.id}&room_type_id=${roomType.id}&check_in=${checkIn}&check_out=${checkOut}&adults=${adults}`
    );
  };

  if (loading) {
    return <LoadingSpinner message="Consulting estate room inventory & rate schedules..." />;
  }

  if (!property) {
    return (
      <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-16 text-center max-w-xl mx-auto my-12 shadow-sm">
        <h3 className="text-2xl font-editorial font-bold text-[#13152C]">Estate Not Located</h3>
        <p className="text-xs text-[#13152C]/60 mt-2 mb-6">The requested estate folio could not be retrieved from the central inventory.</p>
        <Link to="/marketplace" className="btn-luxury-secondary text-xs inline-block">
          &larr; Return to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-24">
      {/* Back Button */}
      <Link
        to="/marketplace"
        className="inline-flex items-center gap-2 text-xs font-cinzel text-[#13152C]/70 hover:text-[#13152C] transition-colors"
      >
        <ArrowLeft size={16} className="text-[#B88E43]" /> Back to Search Results
      </Link>

      {/* Property Title & Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end pb-6 border-b border-[#DFB76C]/30">
        <div>
          <div className="flex items-center gap-3">
            <span className="eyebrow-label text-[#B88E43]">
              {property.property_type || 'ESTATE & SANCTUARY'}
            </span>
            <StarRating rating={property.star_rating} size={15} />
          </div>
          <h1 className="mt-2 text-4xl font-editorial font-bold text-[#13152C] tracking-tight md:text-5xl">
            {property.name}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-[#13152C]/70">
            <MapPin size={14} className="text-[#B88E43]" />
            {property.address_line_1}, {property.city}, {property.state}, {property.country}
          </p>
        </div>

        <div className="rounded-[3px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-4 shadow-sm">
          <p className="eyebrow-label text-[#13152C]/60">Stay Dates</p>
          <p className="text-xs font-bold text-[#13152C] font-mono flex items-center gap-2 mt-1">
            <Calendar size={13} className="text-[#B88E43]" />
            {checkIn} &rarr; {checkOut}
          </p>
        </div>
      </div>

      {/* Large Editorial Photo Gallery */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2 h-96 overflow-hidden rounded-[4px] bg-[#13152C]">
          {property.photos && property.photos.length > 0 ? (
            <img
              src={property.photos[0]}
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
          <div className="h-[11.5rem] overflow-hidden rounded-[4px] bg-[#13152C]">
            {property.photos && property.photos[1] ? (
              <img
                src={property.photos[1]}
                alt="Estate Detail"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[#DFB76C]/60">
                <Building2 size={32} />
              </div>
            )}
          </div>
          <div className="h-[11.5rem] overflow-hidden rounded-[4px] bg-[#13152C]">
            {property.photos && property.photos[2] ? (
              <img
                src={property.photos[2]}
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
          <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-8 shadow-sm">
            <span className="eyebrow-label text-[#B88E43]">ESTATE ARCHITECTURE &amp; HERITAGE</span>
            <h2 className="text-2xl font-editorial font-bold text-[#13152C] mt-1 mb-4">About the Sanctuary</h2>
            <p className="text-sm leading-relaxed text-[#13152C]/80 font-sans">
              {property.description ||
                'Experience world-class hospitality, premier luxury amenities, and tailor-made guest experiences at this premier resort destination.'}
            </p>
          </div>

          {/* Amenities Grid */}
          <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-8 shadow-sm">
            <span className="eyebrow-label text-[#B88E43]">SIGNATURE COMFORTS</span>
            <h2 className="text-2xl font-editorial font-bold text-[#13152C] mt-1 mb-6">Property Highlights &amp; Amenities</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {property.amenities && property.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-[#13152C]">
                  <CheckCircle size={15} className="text-[#B88E43] shrink-0" />
                  <span className="font-medium">{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Benefits Card */}
        <div className="space-y-4">
          <div className="rounded-[4px] border border-[#DFB76C]/40 bg-[#13152C] text-[#FAF6F0] p-8 shadow-md">
            <div className="flex items-center gap-2 text-[#DFB76C] font-cinzel text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={18} /> Nexgile Direct Privileges
            </div>
            <ul className="mt-5 space-y-3.5 text-xs text-[#FAF6F0]/90">
              <li className="flex items-center gap-2.5">
                <Check size={14} className="text-[#DFB76C]" /> Best Direct Rate Guaranteed
              </li>
              <li className="flex items-center gap-2.5">
                <Check size={14} className="text-[#DFB76C]" /> Earn 1 Loyalty Point per ₹100
              </li>
              <li className="flex items-center gap-2.5">
                <Check size={14} className="text-[#DFB76C]" /> Bespoke In-Room Welcome Amenity
              </li>
              <li className="flex items-center gap-2.5">
                <Check size={14} className="text-[#DFB76C]" /> Dedicated VIP Concierge Desk
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Available Room Types */}
      <div className="space-y-6 pt-4">
        <div>
          <span className="eyebrow-label text-[#B88E43]">SUITE ACCOMMODATION OPTIONS</span>
          <h2 className="text-3xl font-editorial font-bold text-[#13152C] mt-1">Available Suite Options</h2>
          <p className="text-xs text-[#13152C]/70">
            Real-time live inventory for selected dates ({checkIn} to {checkOut})
          </p>
        </div>

        <div className="space-y-5">
          {property.room_types && property.room_types.length > 0 ? (
            property.room_types.map((rt) => (
              <div
                key={rt.id}
                className="flex flex-col justify-between gap-6 rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-8 shadow-sm transition-all md:flex-row md:items-center hover:shadow-md"
              >
                {/* Room Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/30 px-2.5 py-0.5 text-[10px] font-cinzel font-bold text-[#B88E43] uppercase">
                      {rt.code}
                    </span>
                    <span className="text-xs text-[#13152C]/60 font-cinzel">
                      {rt.available_rooms_count} suites available
                    </span>
                  </div>

                  <h3 className="text-2xl font-editorial font-bold text-[#13152C]">{rt.name}</h3>

                  <div className="flex flex-wrap items-center gap-5 text-xs text-[#13152C]/80">
                    <div className="flex items-center gap-1.5">
                      <Bed size={15} className="text-[#B88E43]" />
                      <span>{rt.bed_type}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={15} className="text-[#B88E43]" />
                      <span>Accommodates up to {rt.max_occupancy} Guests</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {rt.amenities && rt.amenities.map((amenity, aIdx) => (
                      <span
                        key={aIdx}
                        className="rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/20 px-2 py-0.5 text-[10px] font-cinzel text-[#13152C]/80"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Room Pricing & Select Action */}
                <div className="flex flex-col items-start border-t border-[#DFB76C]/20 pt-4 md:items-end md:border-t-0 md:pt-0">
                  <div className="text-left md:text-right">
                    <span className="eyebrow-label text-[#13152C]/60">Nightly Rate</span>
                    <p className="text-3xl font-editorial font-bold text-[#13152C]">
                      ₹{rt.base_rate?.toLocaleString()}
                    </p>
                    <p className="text-xs font-semibold text-[#B88E43] font-cinzel mt-0.5">
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
            <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-10 text-center text-[#13152C]/60 font-editorial">
              No suites currently available for the selected reservation dates.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
