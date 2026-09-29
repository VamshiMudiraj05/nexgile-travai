import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  CheckCircle,
  Building2,
  Calendar,
  Users,
  Bed,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Lock,
} from 'lucide-react';
import { marketplaceService } from '../../services/marketplaceService';
import { travelerService } from '../../services/travelerService';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export default function BookingFlow() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const propertyId = searchParams.get('property_id');
  const roomTypeId = searchParams.get('room_type_id');
  const checkIn = searchParams.get('check_in');
  const checkOut = searchParams.get('check_out');
  const adults = Number(searchParams.get('adults')) || 2;

  const [property, setProperty] = useState(null);
  const [roomType, setRoomType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Payment method selection: "PAYPAL" or "DEMO_CARD"
  const [paymentMethod, setPaymentMethod] = useState('PAYPAL');

  // Form fields
  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.name?.split(' ').slice(1).join(' ') || 'Resident');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [specialRequests, setSpecialRequests] = useState('');

  useEffect(() => {
    const isPaypalReturn = searchParams.get('paypal_return') === 'true';
    const isPaypalCancel = searchParams.get('paypal_cancel') === 'true';
    const reservationId = searchParams.get('reservation_id');
    const paypalToken = searchParams.get('token'); // PayPal Order ID

    if (isPaypalReturn && reservationId) {
      handlePayPalReturn(paypalToken, reservationId);
    } else if (isPaypalCancel) {
      setErrorMessage('PayPal checkout was cancelled. You can retry payment anytime.');
      if (propertyId && roomTypeId) {
        fetchDetails();
      } else {
        setLoading(false);
      }
    } else if (propertyId && roomTypeId) {
      fetchDetails();
    } else {
      setLoading(false);
    }
  }, [searchParams, propertyId, roomTypeId]);

  const handlePayPalReturn = async (orderId, resId) => {
    try {
      setLoading(true);
      // Capture order if orderId is provided
      if (orderId) {
        try {
          await paymentService.capturePayPalOrder({
            order_id: orderId,
            reservation_id: resId,
          });
        } catch (capErr) {
          console.warn('PayPal capture during return callback:', capErr);
        }
      }

      // Fetch the full reservation record
      const resData = await travelerService.getTripDetail(resId);
      setConfirmedBooking({
        booking_reference: resData.booking_reference,
        property_name: resData.property?.name || resData.property_name || 'Confirmed Stay',
        room_number: resData.room?.room_number || resData.room_number || 'TBD',
        room_type_name: resData.room_type?.name || resData.room_type_name || 'Standard Suite',
        guest_name: resData.guest_name || `${resData.guest?.first_name || ''} ${resData.guest?.last_name || ''}`.trim() || 'Traveler',
        check_in_date: resData.check_in_date,
        check_out_date: resData.check_out_date,
        nights: resData.number_of_nights || 1,
        total_amount: resData.total_amount,
        payment_method: 'PAYPAL',
      });
    } catch (err) {
      console.error('Failed to verify PayPal return flow:', err);
      setErrorMessage('Could not verify PayPal payment status. Please check My Trips.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const propRes = await marketplaceService.getPropertyDetails(propertyId, {
        check_in: checkIn,
        check_out: checkOut,
        adults,
      });
      setProperty(propRes);

      const rt = propRes.room_types.find((r) => r.id === roomTypeId);
      setRoomType(rt || propRes.room_types[0]);
    } catch (err) {
      console.error('Failed to load booking details:', err);
      setErrorMessage('Failed to load reservation checkout.');
    } finally {
      setLoading(false);
    }
  };

  const nights = Math.max(
    Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    ) || 1,
    1
  );

  const baseTotal = (roomType?.base_rate || 200) * nights;
  const taxesTotal = Math.round(baseTotal * 0.12);
  const totalAmount = baseTotal + taxesTotal;

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    try {
      setBookingLoading(true);
      setErrorMessage(null);

      // 1. Create reservation in MongoDB
      const payload = {
        property_id: propertyId,
        room_type_id: roomTypeId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        adults,
        children: 0,
        guest_first_name: firstName,
        guest_last_name: lastName,
        guest_email: email,
        guest_phone: phone,
        special_requests: specialRequests,
        payment_method: paymentMethod,
      };

      const reservationRes = await travelerService.createBooking(payload);

      // 2. If PayPal selected, create PayPal order and redirect to PayPal Sandbox login page
      if (paymentMethod === 'PAYPAL') {
        const orderRes = await paymentService.createPayPalOrder({
          reservation_id: reservationRes.reservation_id,
          amount: totalAmount,
          currency: 'USD',
          booking_reference: reservationRes.booking_reference,
          description: `Stay at ${reservationRes.property_name}`,
        });

        if (orderRes.approval_url) {
          // Redirect browser directly to PayPal Sandbox checkout/login
          window.location.href = orderRes.approval_url;
          return;
        }
      }

      setConfirmedBooking(reservationRes);
    } catch (err) {
      console.error('Booking failed:', err);
      const detail = err.response?.data?.detail || 'This room is no longer available for the selected dates.';
      setErrorMessage(detail);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Preparing secure reservation checkout..." />;
  }

  // Confirmation Screen (04 CONFIRMATION)
  if (confirmedBooking) {
    return (
      <div className="mx-auto max-w-2xl space-y-8 py-8">
        <div className="rounded-[4px] border border-[#DFB76C]/50 bg-[#FFFFFF] p-10 shadow-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[3px] bg-[#13152C] border border-[#DFB76C]/40 text-[#F2D59B]">
            <CheckCircle size={32} />
          </div>

          <span className="mt-5 inline-block eyebrow-label text-[#B88E43]">
            RESERVATION CONFIRMED &middot; FOLIO ISSUED
          </span>
          <h1 className="mt-2 text-3xl font-editorial font-bold text-[#13152C]">
            Your Stay at {confirmedBooking.property_name} is Confirmed
          </h1>

          <div className="mt-6 rounded-[3px] bg-[#FAF6F0] p-5 border border-[#DFB76C]/30 text-center">
            <p className="eyebrow-label text-[#13152C]/60">Booking Reference Folio</p>
            <p className="text-2xl font-cinzel font-bold text-[#13152C] tracking-widest mt-1">
              {confirmedBooking.booking_reference}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-[2px] bg-[#13152C] px-3 py-1 text-[10px] font-cinzel font-semibold text-[#F2D59B]">
              <Lock size={11} className="text-[#DFB76C]" /> Paid via {paymentMethod === 'PAYPAL' ? 'PayPal Express' : 'Direct Card Simulation'}
            </div>
          </div>

          <div className="mt-6 divide-y divide-[#ECE5DA] text-left text-xs text-[#13152C]/80">
            <div className="flex justify-between py-3">
              <span className="eyebrow-label text-[#13152C]/60">Estate</span>
              <span className="font-editorial text-base font-bold text-[#13152C]">{confirmedBooking.property_name}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="eyebrow-label text-[#13152C]/60">Suite</span>
              <span className="font-semibold text-[#13152C]">Suite #{confirmedBooking.room_number} &bull; {confirmedBooking.room_type_name}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="eyebrow-label text-[#13152C]/60">Resident</span>
              <span className="font-semibold text-[#13152C]">{confirmedBooking.guest_name}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="eyebrow-label text-[#13152C]/60">Arrival</span>
              <span className="font-mono text-[#13152C]">{confirmedBooking.check_in_date}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="eyebrow-label text-[#13152C]/60">Departure</span>
              <span className="font-mono text-[#13152C]">{confirmedBooking.check_out_date} ({confirmedBooking.nights} Nights)</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="eyebrow-label text-[#13152C]/60">Total Paid</span>
              <span className="font-editorial text-xl font-bold text-[#13152C]">₹{confirmedBooking.total_amount?.toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button
              onClick={() => navigate('/my-trips')}
              className="btn-luxury-primary flex-1 py-3 text-xs"
            >
              View My Itinerary &rarr;
            </button>
            <Link
              to="/marketplace"
              className="btn-luxury-secondary px-6 py-3 text-xs"
            >
              Explore Stays
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-24">
      {/* Back Button */}
      <Link
        to={`/marketplace/properties/${propertyId}?check_in=${checkIn}&check_out=${checkOut}&adults=${adults}`}
        className="inline-flex items-center gap-2 text-xs font-cinzel text-[#13152C]/70 hover:text-[#13152C] transition-colors"
      >
        <ArrowLeft size={16} className="text-[#B88E43]" /> Back to Property Details
      </Link>

      {/* Progression Banner */}
      <div className="border-b border-[#DFB76C]/30 pb-6">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-cinzel">
          <div className="text-[#13152C]/40">
            <span className="block font-bold">01</span>
            <span className="text-[10px] tracking-wider uppercase">Select Suite</span>
          </div>
          <div className="text-[#B88E43] font-bold border-b-2 border-[#DFB76C] pb-2">
            <span className="block">02</span>
            <span className="text-[10px] tracking-wider uppercase">Guest Details</span>
          </div>
          <div className="text-[#13152C]/40">
            <span className="block font-bold">03</span>
            <span className="text-[10px] tracking-wider uppercase">Payment</span>
          </div>
          <div className="text-[#13152C]/40">
            <span className="block font-bold">04</span>
            <span className="text-[10px] tracking-wider uppercase">Confirmation</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h1 className="text-3xl font-editorial font-bold text-[#13152C]">Complete Your Reservation</h1>
          <div className="flex items-center gap-1.5 text-xs text-[#B88E43] font-cinzel font-semibold">
            <ShieldCheck size={16} /> Instant Confirmation
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-[4px] border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          <AlertCircle size={18} className="shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Form: Guest Information & Payment Gateway */}
        <form onSubmit={handleConfirmBooking} className="lg:col-span-2 space-y-8">
          {/* Guest Information */}
          <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-8 shadow-sm space-y-6">
            <div className="border-b border-[#DFB76C]/20 pb-3">
              <span className="eyebrow-label text-[#B88E43]">STEP 02</span>
              <h2 className="text-xl font-editorial font-bold text-[#13152C]">Primary Resident Information</h2>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block eyebrow-label text-[#13152C]/70 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-xs font-medium text-[#13152C] focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF]"
                />
              </div>
              <div>
                <label className="block eyebrow-label text-[#13152C]/70 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-xs font-medium text-[#13152C] focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block eyebrow-label text-[#13152C]/70 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-xs font-medium text-[#13152C] focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF]"
                />
              </div>
              <div>
                <label className="block eyebrow-label text-[#13152C]/70 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-xs font-medium text-[#13152C] focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF]"
                />
              </div>
            </div>

            <div>
              <label className="block eyebrow-label text-[#13152C]/70 mb-1">Bespoke Guest Requests (Optional)</label>
              <textarea
                rows="2"
                placeholder="High floor, quiet wing, late arrival, diet preferences..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-xs font-medium text-[#13152C] focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF]"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#DFB76C]/20 pb-3">
              <div>
                <span className="eyebrow-label text-[#B88E43]">STEP 03</span>
                <h2 className="text-xl font-editorial font-bold text-[#13152C] flex items-center gap-2">
                  <CreditCard size={18} className="text-[#B88E43]" /> Settlement Method
                </h2>
              </div>
              <span className="rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/40 px-2 py-0.5 text-[10px] font-cinzel font-bold text-[#B88E43]">
                SSL 256-bit Encrypted
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* PayPal Option */}
              <div
                onClick={() => setPaymentMethod('PAYPAL')}
                className={`flex cursor-pointer items-center justify-between rounded-[3px] border p-5 transition-all ${
                  paymentMethod === 'PAYPAL'
                    ? 'border-[#DFB76C] bg-[#FAF6F0] shadow-sm'
                    : 'border-[#ECE5DA] bg-[#FFFFFF] hover:border-[#DFB76C]/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[3px] bg-[#13152C] text-[#F2D59B] font-editorial font-bold text-lg">
                    P
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#13152C]">PayPal Sandbox</p>
                    <p className="text-[10px] text-[#13152C]/60 font-cinzel">Official PayPal Gateway</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment_method"
                  checked={paymentMethod === 'PAYPAL'}
                  onChange={() => setPaymentMethod('PAYPAL')}
                  className="accent-[#13152C]"
                />
              </div>

              {/* Demo Card Option */}
              <div
                onClick={() => setPaymentMethod('DEMO_CARD')}
                className={`flex cursor-pointer items-center justify-between rounded-[3px] border p-5 transition-all ${
                  paymentMethod === 'DEMO_CARD'
                    ? 'border-[#DFB76C] bg-[#FAF6F0] shadow-sm'
                    : 'border-[#ECE5DA] bg-[#FFFFFF] hover:border-[#DFB76C]/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[3px] bg-[#13152C] text-[#F2D59B]">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#13152C]">Direct Card Simulation</p>
                    <p className="text-[10px] text-[#13152C]/60 font-cinzel">Instant Test Checkout</p>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment_method"
                  checked={paymentMethod === 'DEMO_CARD'}
                  onChange={() => setPaymentMethod('DEMO_CARD')}
                  className="accent-[#13152C]"
                />
              </div>
            </div>

            {paymentMethod === 'PAYPAL' ? (
              <div className="rounded-[3px] border border-[#DFB76C]/40 bg-[#FAF6F0] p-4 text-xs text-[#13152C]/80 space-y-1">
                <p className="font-cinzel font-bold text-[#13152C]">
                  PayPal Sandbox Checkout Active
                </p>
                <p className="text-[11px] text-[#13152C]/60 leading-relaxed">
                  Your transaction is authenticated securely through PayPal Sandbox REST API with live order approval.
                </p>
              </div>
            ) : (
              <div className="rounded-[3px] border border-[#ECE5DA] bg-[#FAF6F0] p-4 text-xs text-[#13152C]/80 space-y-1">
                <p className="font-cinzel font-bold text-[#13152C]">Controlled Mock Payment</p>
                <p className="text-[11px] text-[#13152C]/60">
                  Instant sandbox folio creation without external payment gateway redirect.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={bookingLoading}
              className="btn-luxury-primary w-full py-4 text-xs cursor-pointer disabled:opacity-50"
            >
              {bookingLoading
                ? 'Securing Room & Capturing Payment...'
                : paymentMethod === 'PAYPAL'
                ? `CONFIRM WITH PAYPAL (₹${totalAmount.toLocaleString()}) →`
                : `CONFIRM & PAY ₹${totalAmount.toLocaleString()} →`}
            </button>
          </div>
        </form>

        {/* Right Summary Folio */}
        <div className="space-y-4">
          <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-7 shadow-sm space-y-5">
            <span className="eyebrow-label text-[#B88E43]">FOLIO PREVIEW</span>
            <h3 className="text-xl font-editorial font-bold text-[#13152C]">Reservation Summary</h3>

            {property && (
              <div className="border-b border-[#DFB76C]/20 pb-4">
                <p className="eyebrow-label text-[#13152C]/60">{property.city}</p>
                <p className="text-lg font-editorial font-bold text-[#13152C]">{property.name}</p>
              </div>
            )}

            {roomType && (
              <div className="rounded-[3px] bg-[#FAF6F0] p-4 text-xs space-y-1 border border-[#DFB76C]/20">
                <p className="font-editorial text-base font-bold text-[#13152C]">{roomType.name}</p>
                <p className="text-[#13152C]/60 text-[11px]">{roomType.bed_type} &bull; Up to {adults} Guests</p>
              </div>
            )}

            <div className="divide-y divide-[#ECE5DA] text-xs text-[#13152C]/80">
              <div className="flex justify-between py-2.5">
                <span className="eyebrow-label text-[#13152C]/60">Dates</span>
                <span className="font-mono text-xs text-[#13152C]">{checkIn} &rarr; {checkOut}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="eyebrow-label text-[#13152C]/60">Duration</span>
                <span className="font-semibold text-[#13152C]">{nights} Night{nights > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="eyebrow-label text-[#13152C]/60">Rate / Night</span>
                <span className="font-semibold text-[#13152C]">₹{roomType?.base_rate?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="eyebrow-label text-[#13152C]/60">Stay Subtotal</span>
                <span className="font-semibold text-[#13152C]">₹{baseTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="eyebrow-label text-[#13152C]/60">GST &amp; Taxes (12%)</span>
                <span className="font-semibold text-[#13152C]">₹{taxesTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-4 border-t border-[#DFB76C]/30">
                <span className="eyebrow-label text-[#13152C]">Total Stay Amount</span>
                <span className="text-2xl font-editorial font-bold text-[#13152C]">₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
