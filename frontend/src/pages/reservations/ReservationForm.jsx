import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  AlertCircle, 
  CalendarCheck, 
  Building2, 
  User, 
  BedDouble,
  CheckCircle2
} from 'lucide-react';
import { propertyService } from '../../services/propertyService';
import { guestService } from '../../services/guestService';
import { roomTypeService } from '../../services/roomTypeService';
import { reservationService } from '../../services/reservationService';

export const ReservationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Pre-selected guest ID from query params if coming from Guest Detail page
  const searchParams = new URLSearchParams(location.search);
  const initialGuestId = searchParams.get('guest_id') || '';

  const [properties, setProperties] = useState([]);
  const [guests, setGuests] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Today and tomorrow dates in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    property_id: '',
    guest_id: initialGuestId,
    room_type_id: '',
    room_id: '',
    check_in_date: todayStr,
    check_out_date: tomorrowStr,
    number_of_adults: 2,
    number_of_children: 0,
    number_of_rooms: 1,
    rate_per_night: 5000,
    special_requests: '',
    source: 'DIRECT',
    status: 'CONFIRMED',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Calculations
  const checkIn = new Date(formData.check_in_date);
  const checkOut = new Date(formData.check_out_date);
  const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
  const subtotal = Math.round(formData.rate_per_night * nights);
  const taxes = Math.round(subtotal * 0.12);
  const totalAmount = subtotal + taxes;

  // Load initial dropdown dependencies
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [pData, gData] = await Promise.all([
          propertyService.getProperties({ limit: 100 }),
          guestService.getGuests({ limit: 100 }),
        ]);

        const props = pData.items || [];
        const gList = gData.items || [];
        setProperties(props);
        setGuests(gList);

        setFormData((prev) => {
          const defaultPropId = props.length > 0 ? (props[0].id || props[0]._id) : '';
          const defaultGuestId = gList.length > 0 ? (gList[0].id || gList[0]._id) : '';
          return {
            ...prev,
            property_id: prev.property_id || defaultPropId,
            guest_id: prev.guest_id || defaultGuestId,
          };
        });
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // When property changes, load room types and check availability
  useEffect(() => {
    if (formData.property_id) {
      const loadRoomTypes = async () => {
        try {
          const rTypes = await roomTypeService.getRoomTypesByProperty(formData.property_id);
          setRoomTypes(rTypes || []);
          if (rTypes.length > 0) {
            setFormData((prev) => ({
              ...prev,
              room_type_id: rTypes[0].id || rTypes[0]._id,
              rate_per_night: rTypes[0].base_price || 5000,
            }));
          }
        } catch (err) {
          console.error('Failed to load room types:', err);
        }
      };
      loadRoomTypes();
    }
  }, [formData.property_id]);

  // When dates, property, or room type changes, run real-time availability check
  useEffect(() => {
    if (formData.property_id && formData.check_in_date && formData.check_out_date) {
      const checkAvail = async () => {
        try {
          setIsCheckingAvailability(true);
          setError('');
          const res = await reservationService.checkAvailability({
            property_id: formData.property_id,
            check_in_date: formData.check_in_date,
            check_out_date: formData.check_out_date,
            room_type_id: formData.room_type_id || undefined,
          });

          const rooms = res.available_rooms || [];
          setAvailableRooms(rooms);

          if (rooms.length > 0) {
            setFormData((prev) => ({
              ...prev,
              room_id: rooms[0].room_id,
            }));
          } else {
            setFormData((prev) => ({ ...prev, room_id: '' }));
          }
        } catch (err) {
          console.error('Availability check failed:', err);
        } finally {
          setIsCheckingAvailability(false);
        }
      };
      checkAvail();
    }
  }, [formData.property_id, formData.room_type_id, formData.check_in_date, formData.check_out_date]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));

    // If room type changed, update default rate
    if (name === 'room_type_id') {
      const selectedRt = roomTypes.find((r) => (r.id || r._id) === value);
      if (selectedRt) {
        setFormData((prev) => ({
          ...prev,
          room_type_id: value,
          rate_per_night: selectedRt.base_price || prev.rate_per_night,
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.property_id) {
      setError('Please select an estate property.');
      return;
    }
    if (!formData.guest_id) {
      setError('Please select a guest folio or create a new guest.');
      return;
    }
    if (!formData.room_type_id) {
      setError('Please select a suite category.');
      return;
    }
    if (!formData.room_id || availableRooms.length === 0) {
      setError('No suites are available for the selected dates. Please adjust dates or select another suite category.');
      return;
    }

    if (new Date(formData.check_out_date) <= new Date(formData.check_in_date)) {
      setError('Check-out date must be after check-in date.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        rate_per_night: Number(formData.rate_per_night),
        subtotal,
        taxes,
        discounts: 0,
        total_amount: totalAmount,
        number_of_nights: nights,
      };

      const created = await reservationService.createReservation(payload);
      navigate(`/reservations/${created.id || created._id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create reservation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Consulting reservation ledger & estate inventory..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-[#DFB76C]/30">
        <div className="flex items-center gap-4">
          <Link
            to="/reservations"
            className="p-2.5 rounded-[3px] border border-[#DFB76C]/40 bg-[#FAF6F0] text-[#13152C] hover:bg-[#F4EFE6] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#B88E43]" />
          </Link>
          <div>
            <span className="eyebrow-label text-[#B88E43]">01 / OPERATIONS &middot; RESERVATIONS</span>
            <h1 className="text-3xl font-editorial font-bold text-[#13152C] tracking-tight">Create Reservation</h1>
            <p className="text-xs text-[#13152C]/70 mt-1">
              Live date availability verification, pricing computation, and room reservation.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-[4px] bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Property & Guest */}
        <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-7 shadow-sm space-y-5">
          <div className="border-b border-[#DFB76C]/20 pb-3">
            <span className="eyebrow-label text-[#B88E43]">Section 01</span>
            <h2 className="text-lg font-editorial font-semibold text-[#13152C]">
              Hotel Estate & Guest Selection
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block eyebrow-label text-[#13152C]/80 mb-2">
                Hotel Estate *
              </label>
              <select
                name="property_id"
                required
                value={formData.property_id}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-[#13152C] text-sm focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
              >
                {properties.map((p) => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.name} ({p.property_code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block eyebrow-label text-[#13152C]/80">
                  Guest Folio *
                </label>
                <Link to="/guests/new" className="text-xs font-medium text-[#B88E43] hover:underline">
                  + New Guest
                </Link>
              </div>
              <select
                name="guest_id"
                required
                value={formData.guest_id}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-[#13152C] text-sm focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
              >
                <option value="">-- Select Guest --</option>
                {guests.map((g) => (
                  <option key={g.id || g._id} value={g.id || g._id}>
                    {g.first_name} {g.last_name} ({g.phone || g.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Dates & Room Category */}
        <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-7 shadow-sm space-y-5">
          <div className="border-b border-[#DFB76C]/20 pb-3">
            <span className="eyebrow-label text-[#B88E43]">Section 02</span>
            <h2 className="text-lg font-editorial font-semibold text-[#13152C]">
              Stay Schedule & Suite Assignment
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block eyebrow-label text-[#13152C]/80 mb-2">
                Arrival Date *
              </label>
              <input
                type="date"
                name="check_in_date"
                required
                value={formData.check_in_date}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-[#13152C] text-sm focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
              />
            </div>

            <div>
              <label className="block eyebrow-label text-[#13152C]/80 mb-2">
                Departure Date *
              </label>
              <input
                type="date"
                name="check_out_date"
                required
                value={formData.check_out_date}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-[#13152C] text-sm focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
              />
            </div>

            <div>
              <label className="block eyebrow-label text-[#13152C]/80 mb-2">
                Suite Category *
              </label>
              <select
                name="room_type_id"
                required
                value={formData.room_type_id}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-[#13152C] text-sm focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
              >
                {roomTypes.map((rt) => (
                  <option key={rt.id || rt._id} value={rt.id || rt._id}>
                    {rt.name} ({rt.code}) &mdash; ₹{rt.base_price?.toLocaleString('en-IN')}/night
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block eyebrow-label text-[#13152C]/80 mb-2">
                Available Physical Suite Unit *
              </label>
              <select
                name="room_id"
                required
                value={formData.room_id}
                onChange={handleChange}
                disabled={isCheckingAvailability || availableRooms.length === 0}
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-[#13152C] text-sm focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] disabled:opacity-50 transition-all"
              >
                {isCheckingAvailability ? (
                  <option>Verifying suite availability...</option>
                ) : availableRooms.length === 0 ? (
                  <option value="">No suites available for dates</option>
                ) : (
                  availableRooms.map((r) => (
                    <option key={r.room_id} value={r.room_id}>
                      Suite #{r.room_number} (Level {r.floor})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block eyebrow-label text-[#13152C]/80 mb-2">
                Adults
              </label>
              <input
                type="number"
                name="number_of_adults"
                min={1}
                value={formData.number_of_adults}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-[#13152C] text-sm focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
              />
            </div>

            <div>
              <label className="block eyebrow-label text-[#13152C]/80 mb-2">
                Children
              </label>
              <input
                type="number"
                name="number_of_children"
                min={0}
                value={formData.number_of_children}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-[#13152C] text-sm focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block eyebrow-label text-[#13152C]/80 mb-2">
                Bespoke Guest Requests / Notes
              </label>
              <textarea
                name="special_requests"
                rows={2}
                value={formData.special_requests}
                onChange={handleChange}
                placeholder="e.g. Chauffeur pickup at 2 PM, high level suite, extra fine linen..."
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-[#13152C] text-sm focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Section 3: Pricing Summary Calculation */}
        <div className="bg-[#13152C] text-[#FAF6F0] border border-[#DFB76C]/30 rounded-[4px] p-7 shadow-md space-y-5">
          <div className="border-b border-[#2C315E] pb-3 flex items-center justify-between">
            <div>
              <span className="eyebrow-label text-[#DFB76C]">Section 03</span>
              <h2 className="text-lg font-editorial font-semibold text-[#FFFFFF]">
                Financial Summary & Rate Computation
              </h2>
            </div>
            <span className="text-xs text-[#DFB76C]/80 font-cinzel">Automated Ledger</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-[3px] bg-[#1B1E3D] border border-[#2C315E]">
              <span className="eyebrow-label text-[#DFB76C]/70 block mb-1">Nightly Tariff</span>
              <span className="text-xl font-editorial font-bold text-[#FFFFFF]">
                ₹{Number(formData.rate_per_night).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-4 rounded-[3px] bg-[#1B1E3D] border border-[#2C315E]">
              <span className="eyebrow-label text-[#DFB76C]/70 block mb-1">Stay Duration</span>
              <span className="text-xl font-editorial font-bold text-[#FFFFFF]">
                {nights} {nights === 1 ? 'Night' : 'Nights'}
              </span>
            </div>

            <div className="p-4 rounded-[3px] bg-[#1B1E3D] border border-[#2C315E]">
              <span className="eyebrow-label text-[#DFB76C]/70 block mb-1">Estimated GST (12%)</span>
              <span className="text-xl font-editorial font-bold text-[#FFFFFF]">
                ₹{taxes.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-4 rounded-[3px] bg-[#DFB76C]/10 border border-[#DFB76C]/40">
              <span className="eyebrow-label text-[#DFB76C] block mb-1">Total Estimated Bill</span>
              <span className="text-2xl font-editorial font-extrabold text-[#F2D59B]">
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#DFB76C]/30">
          <Link
            to="/reservations"
            className="btn-luxury-secondary"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting || availableRooms.length === 0}
            className="btn-luxury-gold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#13152C]" />
                <span>Confirming Folio...</span>
              </>
            ) : (
              <>
                <CalendarCheck className="w-4 h-4 text-[#13152C]" />
                <span>Confirm & Reserve Suite</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
