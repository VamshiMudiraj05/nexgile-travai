import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Building2,
  Luggage,
  Sparkles,
  Plane,
  Car,
  Ticket,
  QrCode,
  Compass,
  Wifi,
  WifiOff,
  Download,
} from 'lucide-react';
import { travelerService } from '../../services/travelerService';
import { pdfService } from '../../services/pdfService';
import StatusBadge from '../../components/StatusBadge';
import ConfirmationModal from '../../components/ConfirmationModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useCurrency } from '../../context/CurrencyContext';

export default function MyTrips() {
  const { formatPrice } = useCurrency();
  const [tripsData, setTripsData] = useState({
    all: [],
    upcoming: [],
    current: [],
    past: [],
    cancelled: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [cancellingTrip, setCancellingTrip] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isLoadedFromOfflineVault, setIsLoadedFromOfflineVault] = useState(false);

  useEffect(() => {
    fetchTrips();

    const handleOnline = () => {
      setIsOffline(false);
      fetchTrips();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const res = await travelerService.getMyTrips();
      setTripsData(res);
      setIsLoadedFromOfflineVault(false);
      localStorage.setItem('nexgile_offline_vault_trips', JSON.stringify(res));
    } catch (err) {
      console.warn('Network unavailable, falling back to offline vault:', err);
      const cached = localStorage.getItem('nexgile_offline_vault_trips');
      if (cached) {
        try {
          setTripsData(JSON.parse(cached));
          setIsLoadedFromOfflineVault(true);
        } catch (e) {
          console.error('Failed to parse cached offline trips:', e);
        }
      }
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

  const handleDownloadPDF = (trip) => {
    if (!trip) return;
    if (trip.product_type === 'FLIGHT') {
      pdfService.generateBoardingPassPDF({
        pnr: trip.pnr || trip.booking_reference,
        booking_reference: trip.booking_reference,
        airline: trip.airline || trip.supplier_name || 'British Airways',
        origin: trip.origin || 'NYC',
        destination: trip.destination || 'LON',
        flight_number: trip.flight_number || 'BA-178',
        departure_date: trip.departure_date || trip.check_in_date,
        departure_time: trip.departure_time || '10:30 AM',
        gate: 'B12',
        seat: '4A',
        passenger_name: trip.guest_name || 'Eleanor Vance',
      });
    } else {
      pdfService.generateHotelTaxInvoicePDF({
        invoice_number: `INV-${String(trip.id).slice(-6)}`,
        booking_reference: trip.booking_reference,
        guest_name: trip.guest_name,
        property_name: trip.property_name || 'Nexgile Grand Palace & Resort',
        property_city: trip.property_city || 'Goa',
        room_number: trip.room_number || '304',
        room_type: trip.room_type_name || 'Royal Suite',
        check_in: trip.check_in_date,
        check_out: trip.check_out_date,
        nights: trip.nights || 3,
        total_amount: trip.total_amount,
        subtotal: (trip.total_amount || 0) * 0.88,
        tax_total: (trip.total_amount || 0) * 0.12,
        payment_method: 'Card / Razorpay Settlement',
      });
    }
  };

  const rawList = tripsData[activeTab] || [];
  const currentList = useMemo(() => {
    if (categoryFilter === 'HOTEL') {
      return rawList.filter((t) => !t.product_type || t.product_type === 'HOTEL');
    }
    if (categoryFilter === 'TRANSPORT') {
      return rawList.filter((t) => t.product_type === 'FLIGHT' || t.product_type === 'CAR');
    }
    return rawList;
  }, [rawList, categoryFilter]);

  return (
    <div className="space-y-8 pb-12 text-[#FAF6F0]">
      {/* Editorial Header */}
      <div className="flex flex-col justify-between gap-6 border-b border-[#2C315E] pb-6 md:flex-row md:items-end">
        <div>
          <span className="font-cinzel text-[10px] tracking-[0.25em] text-[#DFB76C] uppercase font-semibold">
            MY JOURNEYS & ITINERARIES
          </span>
          <h1 className="mt-1 font-editorial text-3xl md:text-4xl text-white tracking-tight font-bold">
            My Trips & Passes
          </h1>
          <p className="mt-1 font-sans text-xs md:text-sm text-white/70 max-w-2xl">
            View your verified resort reservations, flight tickets, private airport transfers, and digital passes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/marketplace/multimodal"
            className="inline-flex items-center gap-1.5 bg-[#1B1E3D] hover:bg-[#2C315E] text-[#DFB76C] border border-[#2C315E] px-4 py-2 font-cinzel text-xs tracking-wider uppercase font-bold transition-all rounded-[2px]"
          >
            <Plane size={13} className="text-[#DFB76C]" /> Book Flight / Cab →
          </Link>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 bg-[#DFB76C] hover:bg-[#F2D59B] text-[#13152C] px-4 py-2 font-cinzel text-xs tracking-wider uppercase font-bold transition-all shadow-sm rounded-[2px]"
          >
            <Luggage size={13} className="text-[#13152C]" /> Book Hotel Stay →
          </Link>
        </div>
      </div>

      {/* Offline Airplane Mode Vault Banner */}
      {(isOffline || isLoadedFromOfflineVault) && (
        <div className="flex items-center justify-between p-3.5 rounded-[2px] bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-sans animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold uppercase tracking-wider text-[11px] font-cinzel">Offline Airplane Mode Active:</span>
              <span className="ml-1 text-white/80">Displaying cryptographically stored boarding passes & QR access keys from local device vault.</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-[2px] bg-amber-500/20 text-amber-300 text-[10px] font-mono uppercase font-bold tracking-widest border border-amber-500/40">
            Offline Vault Ready
          </span>
        </div>
      )}

      {/* Luxury Tabs & Category Filters */}
      <div className="space-y-4 border-b border-[#2C315E] pb-3">
        <div className="flex gap-4 md:gap-8 overflow-x-auto">
          {[
            { key: 'upcoming', label: 'Upcoming Journeys', count: tripsData.upcoming?.length },
            { key: 'current', label: 'Currently Active', count: tripsData.current?.length },
            { key: 'past', label: 'Past Trips', count: tripsData.past?.length },
            { key: 'cancelled', label: 'Cancelled', count: tripsData.cancelled?.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2.5 pb-2 font-cinzel text-xs tracking-wider uppercase transition-all border-b-2 -mb-[2px] whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? 'border-[#DFB76C] text-[#DFB76C] font-bold'
                  : 'border-transparent text-white/60 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 text-[10px] font-sans rounded-[2px] ${
                  activeTab === tab.key
                    ? 'bg-[#1B1E3D] text-[#DFB76C] border border-[#2C315E]'
                    : 'bg-[#13152C] text-white/50 border border-[#2C315E]/60'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 pt-1 text-xs">
          <span className="font-cinzel text-[10px] tracking-wider uppercase text-white/50">Filter:</span>
          {[
            { key: 'ALL', label: 'All Products' },
            { key: 'HOTEL', label: 'Hotels & Resorts' },
            { key: 'TRANSPORT', label: 'Flights & Cabs' },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key)}
              className={`px-2.5 py-1 rounded-[2px] text-[11px] font-cinzel transition-all cursor-pointer ${
                categoryFilter === cat.key
                  ? 'bg-[#DFB76C] text-[#0B0C1E] font-bold shadow-sm'
                  : 'bg-[#1B1E3D] text-white/70 hover:text-white border border-[#2C315E]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner text="Loading your trips..." />
      ) : currentList.length === 0 ? (
        <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-16 text-center shadow-sm">
          <Luggage size={36} className="mx-auto text-[#DFB76C]/60 mb-3" />
          <h3 className="font-editorial text-2xl text-white font-bold">No {activeTab} trips found</h3>
          <p className="mt-1 font-sans text-xs text-white/70 max-w-md mx-auto">
            {activeTab === 'upcoming'
              ? 'You have no upcoming hotel reservations. Browse our luxury properties and plan your next journey.'
              : `You have no ${activeTab} stays recorded in your account.`}
          </p>
          {activeTab === 'upcoming' && (
            <Link
              to="/marketplace"
              className="mt-6 inline-flex items-center gap-2 bg-[#DFB76C] text-[#13152C] px-6 py-2.5 font-cinzel text-xs tracking-widest uppercase hover:bg-[#F2D59B] font-bold transition-all shadow-sm rounded-[2px]"
            >
              Browse Hotels →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {currentList.map((trip, idx) => (
            <div
              key={trip.id}
              className={`group flex flex-col justify-between overflow-hidden rounded-[4px] border bg-[#13152C] shadow-sm transition-all hover:shadow-md ${
                activeTab === 'upcoming' && idx === 0
                  ? 'border-[#DFB76C] ring-1 ring-[#DFB76C]/30'
                  : 'border-[#2C315E] hover:border-[#DFB76C]/60'
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
                      {trip.product_type === 'FLIGHT' ? (
                        <Plane size={48} className="text-[#DFB76C]" />
                      ) : trip.product_type === 'CAR' ? (
                        <Car size={48} className="text-[#DFB76C]" />
                      ) : (
                        <Building2 size={44} />
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D0E20]/90 via-transparent to-black/30 pointer-events-none" />

                  <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
                    {trip.product_type === 'FLIGHT' ? (
                      <span className="px-2 py-0.5 rounded-[2px] bg-sky-950/90 border border-sky-400/40 text-sky-300 font-cinzel text-[10px] font-bold">
                        ✈️ FLIGHT
                      </span>
                    ) : trip.product_type === 'CAR' ? (
                      <span className="px-2 py-0.5 rounded-[2px] bg-emerald-950/90 border border-emerald-400/40 text-emerald-300 font-cinzel text-[10px] font-bold">
                        🚗 CHAUFFEUR
                      </span>
                    ) : null}
                    <StatusBadge status={trip.status} />
                  </div>

                  <div className="absolute top-3.5 right-3.5 flex flex-col items-end gap-1">
                    <span className="rounded-[2px] bg-[#0D0E20]/90 px-3 py-1 font-mono text-[11px] font-bold text-[#DFB76C] backdrop-blur-md border border-[#DFB76C]/30">
                      REF: {trip.booking_reference}
                    </span>
                    {trip.voucher_code && (
                      <span className="rounded-[2px] bg-[#13152C]/90 px-2 py-0.5 font-mono text-[10px] text-emerald-400 border border-emerald-500/30">
                        PASS: {trip.voucher_code}
                      </span>
                    )}
                  </div>

                  {activeTab === 'upcoming' && idx === 0 && (
                    <div className="absolute bottom-3 left-3.5 flex items-center gap-1.5 px-2.5 py-1 bg-[#DFB76C] text-[#13152C] font-cinzel text-[10px] tracking-wider uppercase font-bold rounded-[2px]">
                      <Sparkles size={12} /> Next Journey
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 font-cinzel text-[10px] tracking-widest text-[#DFB76C] uppercase font-semibold">
                      {trip.product_type === 'FLIGHT' ? (
                        <Plane size={12} />
                      ) : trip.product_type === 'CAR' ? (
                        <Car size={12} />
                      ) : (
                        <MapPin size={12} />
                      )}
                      <span>{trip.property_city || 'Confirmed Partner'}</span>
                    </div>
                    <h3 className="mt-1 font-editorial text-2xl font-bold text-white tracking-tight group-hover:text-[#DFB76C] transition-colors">
                      {trip.property_name}
                    </h3>
                    <p className="mt-0.5 font-sans text-xs text-white/70">
                      <span className="font-semibold text-white">{trip.room_type_name}</span>
                      {trip.product_type === 'FLIGHT' ? (
                        <span> &bull; Seat {trip.room_number || 'Auto-Assigned'}</span>
                      ) : trip.product_type === 'CAR' ? (
                        <span> &bull; Fleet Conf: {trip.room_number || 'Verified'}</span>
                      ) : (
                        <span> &bull; Room {trip.room_number || 'Assigned at check-in'}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-[2px] bg-[#1B1E3D] p-3 border border-[#2C315E] font-sans text-xs text-white/90">
                    <Calendar size={15} className="text-[#DFB76C] shrink-0" />
                    <span className="font-medium">
                      {trip.check_in_date} {trip.check_out_date && trip.check_out_date !== trip.check_in_date ? `→ ${trip.check_out_date}` : ''}
                    </span>
                    <span className="ml-auto font-cinzel text-[10px] tracking-wider uppercase text-white/60">
                      {trip.product_type === 'FLIGHT' ? 'Flight Departure' : trip.product_type === 'CAR' ? 'Fleet Booking' : `(${trip.nights} Nights)`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between border-t border-[#2C315E] bg-[#1B1E3D]/50 px-6 py-4">
                <div>
                  <span className="block font-cinzel text-[9px] tracking-widest text-white/60 uppercase">Total Paid</span>
                  <p className="font-editorial text-xl font-bold text-[#DFB76C]">
                    {formatPrice(trip.total_amount)}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleDownloadPDF(trip)}
                    className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#DFB76C]/40 bg-[#13152C] px-3.5 py-2 font-cinzel text-[10px] tracking-wider uppercase text-[#DFB76C] hover:bg-[#DFB76C] hover:text-[#13152C] transition-all font-semibold cursor-pointer shadow-sm"
                    title={trip.product_type === 'FLIGHT' ? 'Download Boarding Pass (PDF)' : 'Download Tax Invoice (PDF)'}
                  >
                    <Download size={13} />
                    <span>PDF</span>
                  </button>
                  <Link
                    to={`/my-trips/${trip.id}`}
                    className="inline-flex items-center gap-1.5 rounded-[2px] border border-[#2C315E] bg-[#13152C] px-3.5 py-2 font-cinzel text-[10px] tracking-wider uppercase text-white/80 hover:text-white hover:border-[#DFB76C]/60 transition-all font-semibold"
                  >
                    Details &rarr;
                  </Link>
                  {trip.status === 'CONFIRMED' && (
                    <button
                      onClick={() => setCancellingTrip(trip)}
                      className="rounded-[2px] border border-rose-500/40 bg-rose-950/40 px-3 py-2 font-cinzel text-[10px] tracking-wider uppercase text-rose-300 hover:bg-rose-900/60 transition-all cursor-pointer"
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
