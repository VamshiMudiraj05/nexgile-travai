import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  CalendarCheck, 
  User, 
  Building2, 
  BedDouble, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  LogOut, 
  LogIn, 
  ArrowLeft,
  IndianRupee,
  FileText,
  Loader2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { reservationService } from '../../services/reservationService';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { FolioModal } from '../../components/FolioModal';
import { Receipt } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const ReservationDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Confirmation Modals
  const [checkInModal, setCheckInModal] = useState(false);
  const [checkOutModal, setCheckOutModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [folioModalOpen, setFolioModalOpen] = useState(false);

  const fetchReservation = async () => {
    try {
      setLoading(true);
      const data = await reservationService.getReservationById(id);
      setReservation(data);
    } catch (err) {
      console.error('Failed to load reservation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservation();
  }, [id]);

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      setError('');
      await reservationService.checkIn(id);
      setCheckInModal(false);
      fetchReservation();
    } catch (err) {
      setError(err.response?.data?.detail || 'Check-in failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      setError('');
      await reservationService.checkOut(id);
      setCheckOutModal(false);
      fetchReservation();
    } catch (err) {
      setError(err.response?.data?.detail || 'Check-out failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      setError('');
      await reservationService.cancelReservation(id);
      setCancelModal(false);
      fetchReservation();
    } catch (err) {
      setError(err.response?.data?.detail || 'Cancellation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Retrieving folio record..." />;
  if (!reservation) return <EmptyState title="Reservation record not found" />;

  const isConfirmed = reservation.status === 'CONFIRMED';
  const isCheckedIn = reservation.status === 'CHECKED_IN';
  const isCompleted = reservation.status === 'CHECKED_OUT' || reservation.status === 'CANCELLED';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2C315E]">
        <div className="flex items-center gap-4">
          <Link
            to="/reservations"
            className="p-2 rounded-[2px] text-white/60 hover:text-white hover:bg-[#1B1E3D] transition-colors border border-[#2C315E]"
          >
            <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-cinzel text-xs font-bold text-[#DFB76C] bg-[#1B1E3D] px-2.5 py-0.5 rounded-[2px] border border-[#2C315E] tracking-wider">
                #{reservation.booking_reference}
              </span>
              <StatusBadge status={reservation.status} size="sm" />
            </div>
            <h1 className="font-editorial text-3xl font-normal text-white tracking-tight">
              {reservation.guest_name || 'Guest'} • Suite #{reservation.room_number || '-'}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFolioModalOpen(true)}
            className="btn-luxury-secondary text-xs flex items-center gap-1.5 cursor-pointer"
            title="Open Guest Billing & Folio"
          >
            <Receipt className="w-3.5 h-3.5 text-[#DFB76C]" />
            <span>Guest Folio</span>
          </button>

          {isConfirmed && (
            <button
              onClick={() => setCheckInModal(true)}
              className="btn-luxury-primary text-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Concierge Check In</span>
            </button>
          )}

          {isCheckedIn && (
            <button
              onClick={() => setCheckOutModal(true)}
              className="btn-luxury-secondary text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Concierge Check Out</span>
            </button>
          )}

          {!isCompleted && (
            <button
              onClick={() => setCancelModal(true)}
              className="p-2 px-3 rounded-[2px] border border-rose-500/40 text-rose-400 hover:bg-[#1B1E3D] font-cinzel text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5 inline mr-1" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-[3px] bg-[#1B1E3D] border border-rose-500/40 flex items-center gap-3 text-rose-400 text-xs font-sans">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Guest Profile Card */}
        <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 shadow-sm space-y-3">
          <h2 className="font-cinzel text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#DFB76C] flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span>Guest Profile</span>
          </h2>
          <div>
            <Link
              to={`/guests/${reservation.guest_id}`}
              className="font-editorial text-xl font-normal text-white hover:text-[#DFB76C] transition-colors block"
            >
              {reservation.guest_name}
            </Link>
            <p className="font-sans text-xs text-white/60 mt-1">{reservation.guest_email || 'No email registered'}</p>
            <p className="font-sans text-xs text-white/60">{reservation.guest_phone || 'No phone registered'}</p>
          </div>
          <div className="pt-2 border-t border-[#2C315E] font-sans text-xs">
            <span className="text-white/50">Party Size: </span>
            <span className="font-semibold text-white">
              {reservation.number_of_adults} Adults, {reservation.number_of_children} Children
            </span>
          </div>
        </div>

        {/* Property & Room Details */}
        <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 shadow-sm space-y-3">
          <h2 className="font-cinzel text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#DFB76C] flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>Estate & Suite</span>
          </h2>
          <div>
            <Link
              to={`/properties/${reservation.property_id}`}
              className="font-editorial text-xl font-normal text-white hover:text-[#DFB76C] transition-colors block"
            >
              {reservation.property_name || 'Estate'}
            </Link>
            <p className="font-sans text-xs font-semibold text-white/80 mt-1">
              Suite #{reservation.room_number || 'Auto-assign'} • {reservation.room_type_name}
            </p>
          </div>
          <div className="pt-2 border-t border-[#2C315E] font-sans text-xs">
            <span className="text-white/50">Booking Channel: </span>
            <span className="font-semibold text-white">{reservation.source}</span>
          </div>
        </div>

        {/* Stay Schedule */}
        <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 shadow-sm space-y-3">
          <h2 className="font-cinzel text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#DFB76C] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Itinerary</span>
          </h2>
          <div className="space-y-1.5 font-sans text-xs">
            <div className="flex justify-between">
              <span className="text-white/60">Check-in:</span>
              <span className="font-semibold text-white font-mono">{reservation.check_in_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Check-out:</span>
              <span className="font-semibold text-white font-mono">{reservation.check_out_date}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-[#2C315E]">
              <span className="text-white/60">Stay Duration:</span>
              <span className="font-bold text-[#DFB76C] font-cinzel">
                {reservation.number_of_nights} {reservation.number_of_nights === 1 ? 'Night' : 'Nights'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Folio & Billing Breakdown */}
      <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="font-cinzel text-[10px] font-bold uppercase tracking-[0.22em] text-[#DFB76C] border-b border-[#2C315E] pb-3 flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-[#DFB76C]" />
          <span>Financial Folio & Settlement Ledger</span>
        </h2>

        <div className="space-y-3 font-sans text-xs">
          <div className="flex justify-between text-white/75">
            <span>Room Rate / Night:</span>
            <span className="font-mono font-semibold text-white">₹{reservation.rate_per_night?.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between text-white/75">
            <span>Subtotal ({reservation.number_of_nights} nights):</span>
            <span className="font-mono font-semibold text-white">₹{reservation.subtotal?.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between text-white/75">
            <span>Hospitality Luxury GST / Taxes (12%):</span>
            <span className="font-mono font-semibold text-white">₹{reservation.taxes?.toLocaleString('en-IN')}</span>
          </div>

          {reservation.discounts > 0 && (
            <div className="flex justify-between text-[#2D5A40]">
              <span>Privilege Member Concession:</span>
              <span className="font-mono font-semibold">- ₹{reservation.discounts?.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="flex justify-between pt-3 border-t border-[#2C315E] text-sm font-bold text-white">
            <span className="font-cinzel tracking-wider text-xs uppercase">Total Folio Charge:</span>
            <span className="font-editorial text-2xl font-normal text-white">
              ₹{reservation.total_amount?.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Special Requests & Audit Trail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 shadow-sm space-y-2">
          <h2 className="font-cinzel text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#DFB76C] flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#DFB76C]" />
            <span>Special Requests & Preferences</span>
          </h2>
          <p className="font-sans text-xs text-white/75 leading-relaxed pt-1">
            {reservation.special_requests || 'No special dietary, floor, or arrival requests recorded.'}
          </p>
        </div>

        <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 shadow-sm space-y-2 text-xs">
          <h2 className="font-cinzel text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#DFB76C]">
            Audit Lifecycle
          </h2>
          <div className="space-y-1.5 text-white/60 font-sans pt-1">
            <div>Created: <span className="text-white font-mono">{reservation.created_at || 'Recorded'}</span></div>
            {reservation.checked_in_at && (
              <div>Checked In: <span className="text-[#2D5A40] font-mono">{reservation.checked_in_at}</span></div>
            )}
            {reservation.checked_out_at && (
              <div>Checked Out: <span className="text-[#DFB76C] font-mono">{reservation.checked_out_at}</span></div>
            )}
          </div>
        </div>
      </div>

      {/* Check-In Modal */}
      <ConfirmationModal
        isOpen={checkInModal}
        onClose={() => setCheckInModal(false)}
        onConfirm={handleCheckIn}
        title="Confirm Guest Arrival"
        message={`Check in ${reservation.guest_name} into Suite #${reservation.room_number}? The unit state will immediately transition to OCCUPIED.`}
        confirmText="Confirm Check-In"
        isLoading={actionLoading}
      />

      {/* Check-Out Modal */}
      <ConfirmationModal
        isOpen={checkOutModal}
        onClose={() => setCheckOutModal(false)}
        onConfirm={handleCheckOut}
        title="Confirm Guest Departure"
        message={`Check out ${reservation.guest_name} from Suite #${reservation.room_number}? The suite will immediately transition to CLEANING.`}
        confirmText="Confirm Check-Out"
        isLoading={actionLoading}
      />

      {/* Cancel Modal */}
      <ConfirmationModal
        isOpen={cancelModal}
        onClose={() => setCancelModal(false)}
        onConfirm={handleCancel}
        title="Cancel Reservation"
        message="Are you sure you wish to cancel this booking? The assigned room will be returned to AVAILABLE inventory."
        confirmText="Cancel Reservation"
        isDestructive={true}
        isLoading={actionLoading}
      />

      {/* Guest Folio Modal */}
      {folioModalOpen && (
        <FolioModal
          isOpen={folioModalOpen}
          onClose={() => setFolioModalOpen(false)}
          reservationId={id}
          onFolioUpdated={() => fetchReservation()}
        />
      )}
    </div>
  );
};

export default ReservationDetail;
