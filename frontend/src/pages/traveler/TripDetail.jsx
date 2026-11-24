import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  CheckCircle,
  Printer,
  Sparkles,
  Plane,
  Car,
  QrCode,
} from 'lucide-react';
import { travelerService } from '../../services/travelerService';
import StatusBadge from '../../components/StatusBadge';
import ConfirmationModal from '../../components/ConfirmationModal';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function TripDetail() {
  const { reservation_id } = useParams();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTripDetail();
  }, [reservation_id]);

  const fetchTripDetail = async () => {
    try {
      setLoading(true);
      const res = await travelerService.getTripDetail(reservation_id);
      setTrip(res);
    } catch (err) {
      console.error('Failed to load trip folio:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      await travelerService.cancelBooking(reservation_id, 'Traveler requested cancellation via folio');
      setCancelling(false);
      await fetchTripDetail();
    } catch (err) {
      console.error('Failed to cancel:', err);
      alert('Failed to cancel reservation.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving verified reservation folio..." />;
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-3xl rounded-[4px] border border-[#2C315E] bg-[#13152C] p-16 text-center shadow-md">
        <h3 className="font-editorial text-2xl font-bold text-white">Booking Not Found</h3>
        <p className="mt-1 font-sans text-xs text-white/60">
          We could not find this booking. It may have been removed or changed.
        </p>
        <Link
          to="/my-trips"
          className="mt-6 inline-flex items-center gap-2 bg-[#DFB76C] text-[#13152C] px-5 py-2.5 font-cinzel text-xs tracking-wider uppercase font-bold rounded-[2px]"
        >
          &larr; Back to My Trips
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12 text-[#FAF6F0]">
      {/* Top Navigation & Print */}
      <div className="flex items-center justify-between border-b border-[#2C315E] pb-4">
        <Link
          to="/my-trips"
          className="inline-flex items-center gap-2 font-cinzel text-xs tracking-wider uppercase text-white/70 hover:text-[#DFB76C] transition-colors"
        >
          <ArrowLeft size={14} className="text-[#DFB76C]" /> Back to My Trips
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to={`/concierge?reservation_id=${trip.id}`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-[#13152C] font-cinzel text-[11px] font-bold tracking-wider uppercase shadow-sm transition"
          >
            <Sparkles size={13} className="text-[#13152C]" />
            <span>Ask Concierge</span>
          </Link>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-[2px] border border-[#2C315E] bg-[#1B1E3D] px-4 py-2 font-cinzel text-[11px] tracking-wider uppercase text-white/90 hover:border-[#DFB76C]/60 hover:text-[#DFB76C] transition-all cursor-pointer shadow-sm"
          >
            <Printer size={14} className="text-[#DFB76C]" /> Print Receipt
          </button>
        </div>
      </div>

      {/* Main Folio Card */}
      <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-8 md:p-10 shadow-sm space-y-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-6 border-b border-[#2C315E] pb-8 md:flex-row md:items-start">
          <div>
            <div className="flex items-center gap-3">
              <StatusBadge status={trip.status} />
              <span className="font-cinzel text-[10px] tracking-[0.2em] text-[#DFB76C] uppercase font-semibold">
                {trip.product_type === 'FLIGHT'
                  ? '✈️ Confirmed Flight Itinerary'
                  : trip.product_type === 'CAR'
                  ? '🚗 Confirmed Airport Chauffeur'
                  : 'Confirmed Hotel Booking'}
              </span>
            </div>
            <h1 className="mt-3 font-editorial text-3xl md:text-4xl text-white tracking-tight font-bold">
              {trip.property_name}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 font-sans text-xs text-white/70">
              {trip.product_type === 'FLIGHT' ? (
                <Plane size={14} className="text-[#DFB76C]" />
              ) : trip.product_type === 'CAR' ? (
                <Car size={14} className="text-[#DFB76C]" />
              ) : (
                <MapPin size={14} className="text-[#DFB76C]" />
              )}
              {trip.property_address || trip.property_city}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="rounded-[2px] border border-[#DFB76C]/40 bg-[#1B1E3D] p-4 text-right">
              <span className="font-cinzel text-[9px] uppercase tracking-widest text-white/60 block">
                Booking Reference
              </span>
              <p className="mt-0.5 font-mono text-base font-bold text-[#DFB76C]">
                {trip.booking_reference}
              </p>
            </div>
            {trip.voucher_code && (
              <div className="rounded-[2px] border border-emerald-500/40 bg-emerald-950/40 px-3 py-1.5 text-right font-mono text-xs text-emerald-300 flex items-center gap-2">
                <QrCode size={14} className="text-emerald-400" />
                <span>PASS: {trip.voucher_code}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stay / Trip Grid Info */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-[2px] bg-[#1B1E3D] p-5 border border-[#2C315E]">
            <span className="font-cinzel text-[10px] tracking-wider text-[#DFB76C] uppercase block font-semibold">
              {trip.product_type === 'FLIGHT' ? 'Departure Date' : trip.product_type === 'CAR' ? 'Pickup Date' : 'Check-In Date'}
            </span>
            <p className="mt-2 font-editorial text-2xl font-bold text-white">{trip.check_in_date}</p>
            <p className="mt-1 font-sans text-[11px] text-white/60">
              {trip.product_type === 'FLIGHT' ? 'Scheduled departure' : trip.product_type === 'CAR' ? 'Chauffeur pickup' : 'Check-in from 3:00 PM'}
            </p>
          </div>

          <div className="rounded-[2px] bg-[#1B1E3D] p-5 border border-[#2C315E]">
            <span className="font-cinzel text-[10px] tracking-wider text-[#DFB76C] uppercase block font-semibold">
              {trip.product_type === 'FLIGHT' ? 'Arrival / Return' : trip.product_type === 'CAR' ? 'Drop-Off Date' : 'Check-Out Date'}
            </span>
            <p className="mt-2 font-editorial text-2xl font-bold text-white">{trip.check_out_date || trip.check_in_date}</p>
            <p className="mt-1 font-sans text-[11px] text-white/60">
              {trip.product_type === 'FLIGHT' ? 'Terminal gate access' : trip.product_type === 'CAR' ? 'Final drop-off' : 'Check-out before 11:00 AM'}
            </p>
          </div>

          <div className="rounded-[2px] bg-[#1B1E3D] p-5 border border-[#2C315E]">
            <span className="font-cinzel text-[10px] tracking-wider text-[#DFB76C] uppercase block font-semibold">
              {trip.product_type === 'FLIGHT' ? 'Flight & Seat' : trip.product_type === 'CAR' ? 'Fleet & Category' : 'Room & Suite'}
            </span>
            <p className="mt-2 font-editorial text-2xl font-bold text-white">
              {trip.product_type === 'FLIGHT'
                ? `Seat ${trip.room_number || 'Auto'}`
                : trip.product_type === 'CAR'
                ? `Fleet ${trip.room_number || 'Confirmed'}`
                : `Room ${trip.room_number || 'Pending Check-in'}`}
            </p>
            <p className="mt-1 font-sans text-[11px] text-white/70 truncate">{trip.room_type_name}</p>
          </div>
        </div>

        {/* Guest & Special Requests */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-[2px] bg-[#1B1E3D]/80 p-6 border border-[#2C315E] space-y-3">
            <h3 className="font-cinzel text-[11px] tracking-wider text-[#DFB76C] uppercase font-bold border-b border-[#2C315E] pb-2">
              Registered Guest Details
            </h3>
            <div className="space-y-1.5 font-sans text-xs">
              <p className="font-bold text-white text-sm">{trip.guest_name}</p>
              <p className="text-white/70">{trip.guest_email}</p>
              <p className="text-white/70">{trip.guest_phone || 'Phone on file'}</p>
              <p className="text-[#DFB76C] font-medium pt-1">
                Occupancy: {trip.adults} Adult(s), {trip.children || 0} Child(ren)
              </p>
            </div>
          </div>

          <div className="rounded-[2px] bg-[#1B1E3D]/80 p-6 border border-[#2C315E] space-y-3">
            <h3 className="font-cinzel text-[11px] tracking-wider text-[#DFB76C] uppercase font-bold border-b border-[#2C315E] pb-2">
              Special Requests
            </h3>
            <p className="font-sans text-xs text-white/80 italic leading-relaxed pt-1">
              "{trip.special_requests || 'No special requests noted for this stay.'}"
            </p>
          </div>
        </div>

        {/* Payment & Charges Breakdown */}
        <div className="rounded-[2px] bg-[#1B1E3D] p-6 border border-[#2C315E] space-y-4">
          <div className="flex items-center justify-between border-b border-[#2C315E] pb-3">
            <h3 className="font-cinzel text-xs tracking-wider text-white uppercase font-bold">
              Payment & Charges
            </h3>
            <span className="font-cinzel text-[10px] tracking-widest uppercase bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-[2px] font-bold">
              {trip.payment_status || 'PAID IN FULL'}
            </span>
          </div>

          <div className="flex justify-between font-sans text-xs text-white/80">
            <span>Room Charges ({trip.nights} nights @ ₹{trip.base_rate?.toLocaleString()})</span>
            <span className="font-medium text-white">₹{trip.room_rate_total?.toLocaleString()}</span>
          </div>

          <div className="flex justify-between font-sans text-xs text-white/80">
            <span>Taxes & Fees (12%)</span>
            <span className="font-medium text-white">₹{trip.taxes_amount?.toLocaleString()}</span>
          </div>

          <div className="flex justify-between border-t border-[#2C315E] pt-4">
            <span className="font-cinzel text-xs tracking-wider uppercase text-white font-bold">
              Total Amount
            </span>
            <span className="font-editorial text-2xl font-bold text-[#DFB76C]">
              ₹{trip.total_amount?.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t border-[#2C315E] pt-6">
          {trip.status === 'CONFIRMED' && (
            <button
              onClick={() => setCancelling(true)}
              className="rounded-[2px] border border-rose-500/40 bg-rose-950/40 px-4 py-2 font-cinzel text-xs tracking-wider uppercase text-rose-300 hover:bg-rose-900/60 transition-all cursor-pointer font-semibold"
            >
              Cancel Reservation
            </button>
          )}

          {trip.status === 'CHECKED_IN' && (
            <div className="flex items-center gap-2 font-cinzel text-xs tracking-wider uppercase text-emerald-400 font-bold">
              <CheckCircle size={16} /> Currently Checked In
            </div>
          )}

          {trip.status === 'CHECKED_OUT' && (
            <div className="flex items-center gap-2 font-cinzel text-xs tracking-wider uppercase text-white/60 font-bold">
              <CheckCircle size={16} /> Stay Completed
            </div>
          )}

          <Link
            to="/marketplace"
            className="ml-auto inline-flex items-center gap-2 rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-[#13152C] px-6 py-2.5 font-cinzel text-xs tracking-widest uppercase font-bold transition-all shadow-sm"
          >
            Book Another Journey &rarr;
          </Link>
        </div>
      </div>

      <ConfirmationModal
        isOpen={cancelling}
        onClose={() => setCancelling(false)}
        onConfirm={handleCancel}
        title="Cancel Reservation"
        message={`Are you sure you want to cancel booking ${trip.booking_reference}?`}
        confirmText="Confirm Cancellation"
        confirmVariant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
}
