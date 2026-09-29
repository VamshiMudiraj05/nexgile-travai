import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Bed,
  CheckCircle,
  Building2,
  Clock,
  Printer,
  ShieldCheck,
  CreditCard,
  Sparkles,
} from 'lucide-react';
import { travelerService } from '../../services/travelerService';
import StatusBadge from '../../components/StatusBadge';
import ConfirmationModal from '../../components/ConfirmationModal';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function TripDetail() {
  const { reservation_id } = useParams();
  const navigate = useNavigate();

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
      <div className="mx-auto max-w-3xl rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-16 text-center shadow-sm">
        <h3 className="font-editorial text-2xl font-bold text-[#13152C]">Reservation Not Found</h3>
        <p className="mt-1 font-sans text-xs text-[#13152C]/60">
          The requested itinerary could not be retrieved from the central reservation registry.
        </p>
        <Link
          to="/my-trips"
          className="mt-6 inline-flex items-center gap-2 bg-[#13152C] text-[#DFB76C] px-5 py-2.5 font-cinzel text-xs tracking-wider uppercase rounded-[2px]"
        >
          &larr; Return to My Trips
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Top Navigation & Print */}
      <div className="flex items-center justify-between border-b border-[#DFB76C]/20 pb-4">
        <Link
          to="/my-trips"
          className="inline-flex items-center gap-2 font-cinzel text-xs tracking-wider uppercase text-[#13152C]/70 hover:text-[#13152C] transition-colors"
        >
          <ArrowLeft size={14} className="text-[#B88E43]" /> Back to Itineraries
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to={`/concierge?reservation_id=${trip.id}`}
            className="btn-luxury-primary text-[11px] py-2 px-3.5 inline-flex items-center gap-1.5"
          >
            <Sparkles size={13} className="text-[#DFB76C]" />
            <span>Ask AI Concierge</span>
          </Link>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-[2px] border border-[#2C315E]/20 bg-[#FFFFFF] px-4 py-2 font-cinzel text-[11px] tracking-wider uppercase text-[#13152C] hover:bg-[#F4EFE6] transition-all cursor-pointer shadow-sm"
          >
            <Printer size={14} className="text-[#B88E43]" /> Print Folio Receipt
          </button>
        </div>
      </div>

      {/* Main Folio Card */}
      <div className="rounded-[4px] border border-[#2C315E]/15 bg-[#FFFFFF] p-8 md:p-10 shadow-sm space-y-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-6 border-b border-[#2C315E]/10 pb-8 md:flex-row md:items-start">
          <div>
            <div className="flex items-center gap-3">
              <StatusBadge status={trip.status} />
              <span className="font-cinzel text-[10px] tracking-[0.2em] text-[#B88E43] uppercase">
                Verified Resident Folio
              </span>
            </div>
            <h1 className="mt-3 font-editorial text-3xl md:text-4xl text-[#13152C] tracking-tight">
              {trip.property_name}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 font-sans text-xs text-[#13152C]/70">
              <MapPin size={14} className="text-[#B88E43]" />
              {trip.property_address || trip.property_city}
            </p>
          </div>

          <div className="rounded-[2px] border border-[#DFB76C]/40 bg-[#FAF6F0] p-4 text-right">
            <span className="font-cinzel text-[9px] uppercase tracking-widest text-[#13152C]/60 block">
              Folio Reference
            </span>
            <p className="mt-0.5 font-mono text-base font-bold text-[#13152C]">
              {trip.booking_reference}
            </p>
          </div>
        </div>

        {/* Stay Grid Info */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-[2px] bg-[#FAF6F0] p-5 border border-[#2C315E]/10">
            <span className="font-cinzel text-[10px] tracking-wider text-[#B88E43] uppercase block">
              Check-In Date
            </span>
            <p className="mt-2 font-editorial text-2xl font-bold text-[#13152C]">{trip.check_in_date}</p>
            <p className="mt-1 font-sans text-[11px] text-[#13152C]/60">Arrival Window: From 3:00 PM</p>
          </div>

          <div className="rounded-[2px] bg-[#FAF6F0] p-5 border border-[#2C315E]/10">
            <span className="font-cinzel text-[10px] tracking-wider text-[#B88E43] uppercase block">
              Check-Out Date
            </span>
            <p className="mt-2 font-editorial text-2xl font-bold text-[#13152C]">{trip.check_out_date}</p>
            <p className="mt-1 font-sans text-[11px] text-[#13152C]/60">Departure Window: Until 11:00 AM</p>
          </div>

          <div className="rounded-[2px] bg-[#FAF6F0] p-5 border border-[#2C315E]/10">
            <span className="font-cinzel text-[10px] tracking-wider text-[#B88E43] uppercase block">
              Suite Allocation
            </span>
            <p className="mt-2 font-editorial text-2xl font-bold text-[#13152C]">
              Suite {trip.room_number || 'TBD'}
            </p>
            <p className="mt-1 font-sans text-[11px] text-[#13152C]/70 truncate">{trip.room_type_name}</p>
          </div>
        </div>

        {/* Guest & Special Requests */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="rounded-[2px] bg-[#FAF6F0]/60 p-6 border border-[#2C315E]/10 space-y-3">
            <h3 className="font-cinzel text-[11px] tracking-wider text-[#13152C] uppercase font-bold border-b border-[#2C315E]/10 pb-2">
              Registered Guest Details
            </h3>
            <div className="space-y-1.5 font-sans text-xs">
              <p className="font-bold text-[#13152C] text-sm">{trip.guest_name}</p>
              <p className="text-[#13152C]/70">{trip.guest_email}</p>
              <p className="text-[#13152C]/70">{trip.guest_phone || 'Phone on file'}</p>
              <p className="text-[#B88E43] font-medium pt-1">
                Occupancy: {trip.adults} Adult(s), {trip.children || 0} Child(ren)
              </p>
            </div>
          </div>

          <div className="rounded-[2px] bg-[#FAF6F0]/60 p-6 border border-[#2C315E]/10 space-y-3">
            <h3 className="font-cinzel text-[11px] tracking-wider text-[#13152C] uppercase font-bold border-b border-[#2C315E]/10 pb-2">
              Concierge Requests & Instructions
            </h3>
            <p className="font-sans text-xs text-[#13152C]/80 italic leading-relaxed pt-1">
              "{trip.special_requests || 'No specific dietary or concierge arrangements recorded for this reservation.'}"
            </p>
          </div>
        </div>

        {/* Payment & Charges Breakdown */}
        <div className="rounded-[2px] bg-[#FAF6F0] p-6 border border-[#DFB76C]/30 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2C315E]/10 pb-3">
            <h3 className="font-cinzel text-xs tracking-wider text-[#13152C] uppercase font-bold">
              Settlement & Charges Audit
            </h3>
            <span className="font-cinzel text-[10px] tracking-widest uppercase bg-emerald-50 text-emerald-800 border border-emerald-300/60 px-2.5 py-0.5 rounded-[2px] font-bold">
              {trip.payment_status || 'SETTLED IN FULL'}
            </span>
          </div>

          <div className="flex justify-between font-sans text-xs text-[#13152C]/80">
            <span>Suite Accommodation ({trip.nights} nights @ ₹{trip.base_rate?.toLocaleString()})</span>
            <span className="font-medium text-[#13152C]">₹{trip.room_rate_total?.toLocaleString()}</span>
          </div>

          <div className="flex justify-between font-sans text-xs text-[#13152C]/80">
            <span>Hospitality Taxes & Sovereign Tourism Levy (12%)</span>
            <span className="font-medium text-[#13152C]">₹{trip.taxes_amount?.toLocaleString()}</span>
          </div>

          <div className="flex justify-between border-t border-[#2C315E]/15 pt-4">
            <span className="font-cinzel text-xs tracking-wider uppercase text-[#13152C] font-bold">
              Total Folio Surcharge
            </span>
            <span className="font-editorial text-2xl font-bold text-[#13152C]">
              ₹{trip.total_amount?.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between border-t border-[#2C315E]/10 pt-6">
          {trip.status === 'CONFIRMED' && (
            <button
              onClick={() => setCancelling(true)}
              className="rounded-[2px] border border-rose-300 bg-rose-50 px-4 py-2 font-cinzel text-xs tracking-wider uppercase text-rose-700 hover:bg-rose-100 transition-all cursor-pointer"
            >
              Cancel Reservation
            </button>
          )}

          {trip.status === 'CHECKED_IN' && (
            <div className="flex items-center gap-2 font-cinzel text-xs tracking-wider uppercase text-emerald-700 font-bold">
              <CheckCircle size={16} /> Currently In Residence — Welcome
            </div>
          )}

          {trip.status === 'CHECKED_OUT' && (
            <div className="flex items-center gap-2 font-cinzel text-xs tracking-wider uppercase text-[#13152C]/60 font-bold">
              <CheckCircle size={16} /> Stay Concluded & Archived
            </div>
          )}

          <Link
            to="/marketplace"
            className="ml-auto inline-flex items-center gap-2 rounded-[2px] bg-[#13152C] text-[#DFB76C] border border-[#DFB76C]/40 px-6 py-2.5 font-cinzel text-xs tracking-widest uppercase hover:bg-[#1B1E3D] hover:border-[#DFB76C] transition-all shadow-sm"
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
