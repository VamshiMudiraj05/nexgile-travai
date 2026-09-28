import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  CalendarCheck, 
  Edit3, 
  ArrowLeft,
  Plus,
  Heart,
  FileText
} from 'lucide-react';
import { guestService } from '../../services/guestService';
import { reservationService } from '../../services/reservationService';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';

export const GuestDetail = () => {
  const { id } = useParams();
  const [guest, setGuest] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuestData = async () => {
      try {
        setLoading(true);
        const [gData, rData] = await Promise.all([
          guestService.getGuestById(id),
          reservationService.getReservations({ guest_id: id, limit: 50 }),
        ]);
        setGuest(gData);
        setReservations(rData.items || []);
      } catch (err) {
        console.error('Failed to load guest:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGuestData();
  }, [id]);

  if (loading) return <LoadingSpinner message="Consulting guest record & stay archives..." />;
  if (!guest) return <EmptyState title="Guest folio not located" />;

  const gId = guest.id || guest._id;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-[#DFB76C]/30">
        <Link
          to="/guests"
          className="inline-flex items-center gap-2 text-xs font-cinzel tracking-wider text-[#13152C]/70 hover:text-[#13152C] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#B88E43]" />
          <span>Back to Guests Directory</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to={`/guests/${gId}/edit`}
            className="btn-luxury-secondary text-xs"
          >
            <Edit3 className="w-3.5 h-3.5 inline mr-1.5 text-[#B88E43]" />
            <span>Edit Profile</span>
          </Link>

          <Link
            to={`/reservations/new?guest_id=${gId}`}
            className="btn-luxury-gold text-xs"
          >
            <Plus className="w-3.5 h-3.5 inline mr-1.5 text-[#13152C]" />
            <span>New Reservation</span>
          </Link>
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[4px] bg-[#13152C] border border-[#DFB76C]/50 flex items-center justify-center text-2xl font-editorial font-bold text-[#F2D59B] shadow-sm">
              {guest.first_name?.[0]?.toUpperCase()}{guest.last_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <span className="eyebrow-label text-[#B88E43]">VIP GUEST FOLIO</span>
              <h1 className="text-3xl font-editorial font-bold text-[#13152C] tracking-tight">
                {guest.first_name} {guest.last_name}
              </h1>
              <p className="text-xs text-[#13152C]/60 mt-1">
                {guest.nationality || 'International'} Resident &bull; {guest.city || 'Location unspecified'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-6 py-3 rounded-[3px] bg-[#FAF6F0] border border-[#DFB76C]/30 text-center">
              <span className="text-2xl font-editorial font-bold text-[#13152C] block">{reservations.length}</span>
              <span className="eyebrow-label text-[#B88E43] block mt-0.5">Total Stays</span>
            </div>
          </div>
        </div>

        {/* Contact details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#DFB76C]/20 text-xs text-[#13152C]/80">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#B88E43]" />
            <span>{guest.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#B88E43]" />
            <span>{guest.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>ID: {guest.identity_type} ({guest.identity_number || 'Verified'})</span>
          </div>
        </div>
      </div>

      {/* Preferences and Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-6 shadow-sm space-y-2">
          <div className="border-b border-[#DFB76C]/20 pb-2 flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#B88E43]" />
            <h2 className="eyebrow-label text-[#B88E43]">
              Bespoke Stay Preferences
            </h2>
          </div>
          <p className="text-xs text-[#13152C]/80 leading-relaxed pt-1">
            {guest.preferences || 'No specific preferences recorded for this guest.'}
          </p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-6 shadow-sm space-y-2">
          <div className="border-b border-[#DFB76C]/20 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#B88E43]" />
            <h2 className="eyebrow-label text-[#B88E43]">
              Concierge & CRM Notes
            </h2>
          </div>
          <p className="text-xs text-[#13152C]/80 leading-relaxed pt-1">
            {guest.notes || 'No internal staff notes on record.'}
          </p>
        </div>
      </div>

      {/* Stay History Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-editorial font-bold text-[#13152C] tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#B88E43]" />
            <span>Historical Stay Folios</span>
          </h2>
        </div>

        {reservations.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No previous stays"
            description="Create a reservation for this guest to track their booking lifecycle and room preferences."
          />
        ) : (
          <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6F0] border-b border-[#DFB76C]/30 text-[#13152C]/70">
                <tr>
                  <th className="py-3.5 px-4 eyebrow-label">Booking Ref</th>
                  <th className="py-3.5 px-4 eyebrow-label">Estate</th>
                  <th className="py-3.5 px-4 eyebrow-label">Suite & Category</th>
                  <th className="py-3.5 px-4 eyebrow-label">Stay Window</th>
                  <th className="py-3.5 px-4 eyebrow-label">Total Folio</th>
                  <th className="py-3.5 px-4 eyebrow-label">Status</th>
                  <th className="py-3.5 px-4 text-right eyebrow-label">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE5DA]/60">
                {reservations.map((res) => (
                  <tr key={res.id || res._id} className="hover:bg-[#FAF6F0]/60 transition-colors">
                    <td className="py-3.5 px-4 font-cinzel font-bold text-[#13152C]">
                      {res.booking_reference}
                    </td>
                    <td className="py-3.5 px-4 text-[#13152C] font-semibold">{res.property_name || 'Property'}</td>
                    <td className="py-3.5 px-4 text-[#13152C]/80">
                      Suite #{res.room_number} &bull; {res.room_type_name}
                    </td>
                    <td className="py-3.5 px-4 text-[#13152C]/70 font-mono text-[11px]">
                      {res.check_in_date} &rarr; {res.check_out_date}
                    </td>
                    <td className="py-3.5 px-4 font-editorial font-bold text-base text-[#13152C]">
                      ₹{res.total_amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={res.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/reservations/${res.id || res._id}`}
                        className="text-xs font-cinzel font-semibold text-[#B88E43] hover:underline"
                      >
                        View &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
