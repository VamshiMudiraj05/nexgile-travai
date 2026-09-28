import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Building2,
  Luggage,
  Sparkles,
} from 'lucide-react';
import { travelerService } from '../../services/travelerService';
import StatusBadge from '../../components/StatusBadge';
import ConfirmationModal from '../../components/ConfirmationModal';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function MyTrips() {
  const [tripsData, setTripsData] = useState({
    all: [],
    upcoming: [],
    current: [],
    past: [],
    cancelled: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [cancellingTrip, setCancellingTrip] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const res = await travelerService.getMyTrips();
      setTripsData(res);
    } catch (err) {
      console.error('Failed to load trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancellingTrip) return;
    try {
      setActionLoading(true);
      await travelerService.cancelBooking(cancellingTrip.id, 'Traveler requested online cancellation');
      setCancellingTrip(null);
      await fetchTrips();
    } catch (err) {
      console.error('Cancellation failed:', err);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const currentList = tripsData[activeTab] || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col justify-between gap-6 border-b border-[#DFB76C]/20 pb-6 md:flex-row md:items-end">
        <div>
          <span className="font-cinzel text-[10px] tracking-[0.25em] text-[#B88E43] uppercase">
            05 / Traveler Portfolio
          </span>
          <h1 className="mt-1 font-editorial text-3xl md:text-4xl text-[#13152C] tracking-tight">
            My Stays & Itineraries
          </h1>
          <p className="mt-1 font-sans text-xs md:text-sm text-[#13152C]/70 max-w-2xl">
            Review your upcoming verified journeys, active room folios, and historical hospitality reservations.
          </p>
        </div>

        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 bg-[#13152C] border border-[#DFB76C]/40 text-[#DFB76C] px-5 py-2.5 font-cinzel text-xs tracking-widest uppercase hover:bg-[#1B1E3D] hover:border-[#DFB76C] transition-all shadow-sm rounded-[2px]"
        >
          <Luggage size={14} className="text-[#DFB76C]" /> Book a New Stay →
        </Link>
      </div>

      {/* Luxury Tabs */}
      <div className="flex border-b border-[#2C315E]/15 gap-4 md:gap-8 overflow-x-auto">
        {[
          { key: 'upcoming', label: 'Upcoming Stays', count: tripsData.upcoming?.length },
          { key: 'current', label: 'Currently Staying', count: tripsData.current?.length },
          { key: 'past', label: 'Completed Stays', count: tripsData.past?.length },
          { key: 'cancelled', label: 'Cancelled', count: tripsData.cancelled?.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2.5 pb-3 font-cinzel text-xs tracking-wider uppercase transition-all border-b-2 -mb-[2px] whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? 'border-[#B88E43] text-[#13152C] font-bold'
                : 'border-transparent text-[#13152C]/50 hover:text-[#13152C]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`px-2 py-0.5 text-[10px] font-sans rounded-[2px] ${
                activeTab === tab.key
                  ? 'bg-[#13152C] text-[#DFB76C]'
                  : 'bg-[#ECE5DA] text-[#13152C]/70'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner text="Retrieving verified itinerary records..." />
      ) : currentList.length === 0 ? (
        <div className="rounded-[4px] border border-[#DFB76C]/25 bg-[#FFFFFF] p-16 text-center shadow-sm">
          <Luggage size={36} className="mx-auto text-[#B88E43]/60 mb-3" />
          <h3 className="font-editorial text-2xl text-[#13152C]">No {activeTab} journeys recorded</h3>
          <p className="mt-1 font-sans text-xs text-[#13152C]/70 max-w-md mx-auto">
            {activeTab === 'upcoming'
              ? 'Your future sanctuary awaits. Explore curated estates across world-class travel destinations.'
              : `You currently have no ${activeTab} reservation history recorded in your profile.`}
          </p>
          {activeTab === 'upcoming' && (
            <Link
              to="/marketplace"
              className="mt-6 inline-flex items-center gap-2 bg-[#DFB76C] text-[#13152C] px-6 py-2.5 font-cinzel text-xs tracking-widest uppercase hover:bg-[#F2D59B] transition-all shadow-sm rounded-[2px]"
            >
              Explore Estates →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {currentList.map((trip, idx) => (
            <div
              key={trip.id}
              className={`group flex flex-col justify-between overflow-hidden rounded-[4px] border bg-[#FFFFFF] shadow-sm transition-all hover:shadow-md ${
                activeTab === 'upcoming' && idx === 0
                  ? 'border-[#DFB76C] ring-1 ring-[#DFB76C]/30'
                  : 'border-[#2C315E]/15 hover:border-[#DFB76C]/60'
              }`}
            >
              <div>
                {/* Photo & Status Banner */}
                <div className="relative h-52 overflow-hidden bg-[#0D0E20]">
                  {trip.property_photo ? (
                    <img
                      src={trip.property_photo}
                      alt={trip.property_name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[#DFB76C]/40">
                      <Building2 size={44} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D0E20]/80 via-transparent to-black/30 pointer-events-none" />

                  <div className="absolute top-3.5 left-3.5">
                    <StatusBadge status={trip.status} />
                  </div>
                  <div className="absolute top-3.5 right-3.5 rounded-[2px] bg-[#0D0E20]/90 px-3 py-1 font-mono text-[11px] font-bold text-[#DFB76C] backdrop-blur-md border border-[#DFB76C]/30">
                    REF: {trip.booking_reference}
                  </div>

                  {activeTab === 'upcoming' && idx === 0 && (
                    <div className="absolute bottom-3 left-3.5 flex items-center gap-1.5 px-2.5 py-1 bg-[#DFB76C] text-[#13152C] font-cinzel text-[10px] tracking-wider uppercase font-bold rounded-[2px]">
                      <Sparkles size={12} /> Next Upcoming Journey
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 font-cinzel text-[10px] tracking-widest text-[#B88E43] uppercase">
                      <MapPin size={12} /> {trip.property_city}
                    </div>
                    <h3 className="mt-1 font-editorial text-2xl font-bold text-[#13152C] tracking-tight group-hover:text-[#B88E43] transition-colors">
                      {trip.property_name}
                    </h3>
                    <p className="mt-0.5 font-sans text-xs text-[#13152C]/70">
                      <span className="font-semibold text-[#13152C]">{trip.room_type_name}</span> • Suite {trip.room_number || 'To Be Assigned'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-[2px] bg-[#FAF6F0] p-3 border border-[#2C315E]/10 font-sans text-xs text-[#13152C]">
                    <Calendar size={15} className="text-[#B88E43] shrink-0" />
                    <span className="font-medium">
                      {trip.check_in_date} &rarr; {trip.check_out_date}
                    </span>
                    <span className="ml-auto font-cinzel text-[10px] tracking-wider uppercase text-[#13152C]/60">
                      ({trip.nights} Nights)
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between border-t border-[#2C315E]/10 bg-[#FAF6F0] px-6 py-4">
                <div>
                  <span className="block font-cinzel text-[9px] tracking-widest text-[#13152C]/60 uppercase">Total Settled</span>
                  <p className="font-editorial text-xl font-bold text-[#13152C]">
                    ₹{trip.total_amount?.toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/my-trips/${trip.id}`}
                    className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#13152C] bg-[#13152C] px-4 py-2 font-cinzel text-[11px] tracking-wider uppercase text-[#DFB76C] hover:bg-[#1B1E3D] hover:border-[#DFB76C] transition-all"
                  >
                    View Folio &rarr;
                  </Link>
                  {trip.status === 'CONFIRMED' && (
                    <button
                      onClick={() => setCancellingTrip(trip)}
                      className="rounded-[2px] border border-rose-300/40 bg-rose-50 px-3 py-2 font-cinzel text-[10px] tracking-wider uppercase text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(cancellingTrip)}
        onClose={() => setCancellingTrip(null)}
        onConfirm={handleCancelBooking}
        title="Cancel Trip Reservation"
        message={`Are you sure you want to cancel your stay at ${cancellingTrip?.property_name} (${cancellingTrip?.booking_reference})? The room will be released immediately.`}
        confirmText="Confirm Cancellation"
        confirmVariant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
}
