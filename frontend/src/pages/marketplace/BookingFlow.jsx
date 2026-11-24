import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  CheckCircle,
  Building2,
  ArrowLeft,
  AlertCircle,
  Lock,
  CalendarDays,
} from 'lucide-react';
import { marketplaceService } from '../../services/marketplaceService';
import { travelerService } from '../../services/travelerService';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useCurrency } from '../../context/CurrencyContext';
import { Calendar } from '@/components/ui/calendar';
import { WalletBalance, RazorpayMark, RazorpayIcon, PayPalIcon, NexgileMark, WiseMark } from '@/components/ui/wallet-balance';

export default function BookingFlow() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice, currency } = useCurrency();

  const propertyId = searchParams.get('property_id');
  const roomTypeId = searchParams.get('room_type_id');
  const initialCheckIn = searchParams.get('check_in') || '';
  const initialCheckOut = searchParams.get('check_out') || '';
  const adults = Number(searchParams.get('adults')) || 2;

  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef(null);

  const [property, setProperty] = useState(null);
  const [roomType, setRoomType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Payment method selection: "RAZORPAY" or "DEMO_CARD"
  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY');
  const [showWalletPouch, setShowWalletPouch] = useState(false);

  const checkoutWalletAccounts = React.useMemo(() => [
    {
      id: "razorpay_pay",
      name: "Razorpay Express",
      balance: 45000,
      logo: <RazorpayMark />,
      background: "#0c2340",
      amountColor: "#528FF0"
    },
    {
      id: "nexgile_reserve",
      name: "Nexgile Reserve",
      balance: 125000,
      logo: <NexgileMark />,
      background: "#1c2237",
      amountColor: "#DFB76C"
    },
    {
      id: "loyalty_bank",
      name: "Travel Loyalty",
      balance: 15400,
      logo: <WiseMark />,
      background: "#163300",
      amountColor: "#a0d67b"
    }
  ], []);

  // Form fields
  const [firstName, setFirstName] = useState(user?.name?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(user?.name?.split(' ').slice(1).join(' ') || 'Resident');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('+91 98123 45678');
  const [specialRequests, setSpecialRequests] = useState('');

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
      setCheckIn(cinStr);
      if (range.to) {
        const coutStr = range.to.toISOString().split('T')[0];
        setCheckOut(coutStr);
        setIsDatePickerOpen(false);
      }
    }
  };

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

      // Fetch confirmed reservation details
      const resData = await travelerService.getBookingDetails(resId);
      setConfirmedBooking({
        booking_reference: resData.booking_reference,
        property_name: resData.property_name || 'Confirmed Stay',
        room_number: resData.room_number || 'Auto-Assigned',
        room_type_name: resData.room_type_name || 'Standard Suite',
        guest_name: `${resData.guest_first_name || ''} ${resData.guest_last_name || ''}`.trim() || 'Resident Guest',
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

      const payload = {
        property_id: propertyId,
        room_type_id: roomTypeId,
        check_in_date: checkIn,
        check_out_date: checkOut,
        adults: adults || 1,
        children: 0,
        guest_first_name: firstName || 'Resident',
        guest_last_name: lastName || 'Guest',
        guest_name: `${firstName} ${lastName}`.trim(),
        guest_email: email,
        guest_phone: phone || '+91 98765 43210',
        special_requests: specialRequests,
        payment_method: paymentMethod || 'RAZORPAY',
        rate_per_night: roomType?.base_rate || 200,
        total_amount: totalAmount,
      };

      const resResponse = await travelerService.createBooking(payload);
      const reservationId = resResponse.reservation_id || resResponse.id || resResponse._id;

      if (paymentMethod === 'RAZORPAY') {
        const orderData = await paymentService.createRazorpayOrder({
          reservation_id: reservationId,
        });

        const scriptLoaded = await paymentService.loadRazorpayScript();
        const activeKeyId = (orderData?.key_id && !orderData.key_id.startsWith('rzp_test_placeholder'))
          ? orderData.key_id
          : (import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_U3uGDG8G6pVswQ');

        if ((scriptLoaded || window.Razorpay) && window.Razorpay && activeKeyId) {
          const cleanPhone = (phone || '9876543210').replace(/\D/g, '').slice(-10) || '9876543210';
          const options = {
            key: activeKeyId,
            amount: orderData.amount,
            currency: 'INR',
            name: 'Nexgile TravAI',
            description: `Reservation #${resResponse.booking_reference}`,
            order_id: orderData.order_id,
            prefill: {
              name: `${firstName} ${lastName}`.trim() || 'Resident Guest',
              email: email || 'traveler@nexgile.com',
              contact: cleanPhone,
            },
            theme: {
              color: '#DFB76C',
            },
            handler: async function (response) {
              try {
                setBookingLoading(true);
                await paymentService.verifyRazorpayPayment({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  reservation_id: reservationId,
                });
                setConfirmedBooking({
                  booking_reference: resResponse.booking_reference,
                  property_name: property?.name || 'Confirmed Stay',
                  room_number: resResponse.room?.room_number || resResponse.room_number || 'Auto-Assigned',
                  room_type_name: roomType?.name || 'Standard Suite',
                  guest_name: `${firstName} ${lastName}`.trim(),
                  check_in_date: checkIn,
                  check_out_date: checkOut,
                  nights,
                  total_amount: totalAmount,
                  payment_method: 'RAZORPAY',
                });
              } catch (verifyErr) {
                console.error('Razorpay verification error:', verifyErr);
                setErrorMessage('Payment verification failed. Please contact support.');
              } finally {
                setBookingLoading(false);
              }
            },
            modal: {
              ondismiss: function () {
                setErrorMessage('Razorpay checkout was dismissed. Room reservation has been released.');
                setBookingLoading(false);
                travelerService.cancelBooking(reservationId, 'Checkout dismissed before payment').catch(() => {});
              },
            },
          };
          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (err) {
            setErrorMessage(`Payment failed: ${err.error?.description || 'Transaction declined.'}`);
            setBookingLoading(false);
            travelerService.cancelBooking(reservationId, 'Payment failed').catch(() => {});
          });
          rzp.open();
          return;
        } else {
          setErrorMessage('Unable to initialize Razorpay payment popup. Please check your network connection or disable script blockers.');
          setBookingLoading(false);
          return;
        }
      } else if (paymentMethod === 'PAYPAL') {
        const orderRes = await paymentService.createPayPalOrder({
          reservation_id: reservationId,
          amount: totalAmount,
          currency: 'INR',
          description: `Stay at ${property?.name || 'Hotel'} - ${roomType?.name || 'Suite'}`,
          return_url: `${window.location.origin}/marketplace/checkout?paypal_return=true&reservation_id=${reservationId}`,
          cancel_url: `${window.location.origin}/marketplace/checkout?paypal_cancel=true&property_id=${propertyId}&room_type_id=${roomTypeId}&check_in=${checkIn}&check_out=${checkOut}`,
        });

        if (orderRes?.approval_url) {
          window.location.href = orderRes.approval_url;
          return;
        } else {
          // Sandbox Fallback Simulator (instant capture)
          await paymentService.capturePayPalOrder({
            order_id: orderRes.order_id,
            reservation_id: reservationId,
          });
        }
      }

      setConfirmedBooking({
        booking_reference: resResponse.booking_reference,
        property_name: property?.name || 'Confirmed Stay',
        room_number: resResponse.room?.room_number || resResponse.room_number || 'Auto-Assigned',
        room_type_name: roomType?.name || 'Standard Suite',
        guest_name: `${firstName} ${lastName}`.trim(),
        check_in_date: checkIn,
        check_out_date: checkOut,
        nights,
        total_amount: totalAmount,
        payment_method: paymentMethod,
      });
    } catch (err) {
      console.error('Failed to create reservation:', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Unable to confirm reservation. The suite might no longer be available for the selected dates.';
      setErrorMessage(msg);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving verified estate availability..." />;
  }

  // Confirmation Screen (04 CONFIRMATION)
  if (confirmedBooking) {
    return (
      <div className="mx-auto max-w-2xl space-y-8 py-8 text-[#FAF6F0]">
        <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-10 shadow-xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[3px] bg-[#1B1E3D] border border-[#DFB76C]/40 text-[#DFB76C]">
            <CheckCircle size={32} />
          </div>

          <span className="mt-5 inline-block font-cinzel text-[10px] tracking-[0.24em] text-[#DFB76C] uppercase font-bold">
            RESERVATION CONFIRMED &middot; FOLIO ISSUED
          </span>
          <h1 className="mt-2 text-3xl font-editorial font-bold text-white">
            Your Stay at {confirmedBooking.property_name} is Confirmed
          </h1>

          <div className="mt-6 rounded-[3px] bg-[#1B1E3D] p-5 border border-[#2C315E] text-center">
            <p className="font-cinzel text-[10px] uppercase tracking-wider text-white/60">Booking Reference Folio</p>
            <p className="text-2xl font-cinzel font-bold text-[#DFB76C] tracking-widest mt-1">
              {confirmedBooking.booking_reference}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-[2px] bg-[#13152C] border border-[#2C315E] px-3 py-1 text-[10px] font-cinzel font-semibold text-white">
              <Lock size={11} className="text-[#DFB76C]" /> Paid via {paymentMethod === 'RAZORPAY' ? 'Razorpay Express' : paymentMethod === 'PAYPAL' ? 'PayPal Express' : 'Direct Card Simulation'}
            </div>
          </div>

          <div className="mt-6 divide-y divide-[#2C315E] text-left text-xs text-white/80">
            <div className="flex justify-between py-3">
              <span className="font-cinzel text-[10px] uppercase tracking-wider text-white/60">Estate</span>
              <span className="font-editorial text-base font-bold text-white">{confirmedBooking.property_name}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="font-cinzel text-[10px] uppercase tracking-wider text-white/60">Suite</span>
              <span className="font-semibold text-white">Suite #{confirmedBooking.room_number} &bull; {confirmedBooking.room_type_name}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="font-cinzel text-[10px] uppercase tracking-wider text-white/60">Resident</span>
              <span className="font-semibold text-white">{confirmedBooking.guest_name}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="font-cinzel text-[10px] uppercase tracking-wider text-white/60">Arrival</span>
              <span className="font-mono text-white">{confirmedBooking.check_in_date}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="font-cinzel text-[10px] uppercase tracking-wider text-white/60">Departure</span>
              <span className="font-mono text-white">{confirmedBooking.check_out_date} ({confirmedBooking.nights} Nights)</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="font-cinzel text-[10px] uppercase tracking-wider text-white/60">Total Paid</span>
              <span className="font-editorial text-xl font-bold text-[#DFB76C]">{formatPrice(confirmedBooking.total_amount)}</span>
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
    <div className="mx-auto max-w-5xl space-y-10 pb-24 text-[#FAF6F0]">
      {/* Back Button */}
      <Link
        to={`/marketplace/properties/${propertyId}?check_in=${checkIn}&check_out=${checkOut}&adults=${adults}`}
        className="inline-flex items-center gap-2 text-xs font-cinzel text-white/70 hover:text-[#DFB76C] transition-colors"
      >
        <ArrowLeft size={16} className="text-[#DFB76C]" /> Back to Property Details
      </Link>

      {/* Progression Banner */}
      <div className="border-b border-[#2C315E] pb-6">
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-cinzel">
          <div className="text-white/40">
            <span className="block font-bold">01</span>
            <span className="text-[10px] tracking-wider uppercase">Select Suite</span>
          </div>
          <div className="text-[#DFB76C] font-bold border-b-2 border-[#DFB76C] pb-2">
            <span className="block">02</span>
            <span className="text-[10px] tracking-wider uppercase">Guest Details</span>
          </div>
          <div className="text-white/40">
            <span className="block font-bold">03</span>
            <span className="text-[10px] tracking-wider uppercase">Payment</span>
          </div>
          <div className="text-white/40">
            <span className="block font-bold">04</span>
            <span className="text-[10px] tracking-wider uppercase">Confirmation</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h1 className="text-3xl font-editorial font-bold text-white">Complete Your Reservation</h1>
          <div className="flex items-center gap-1.5 text-xs text-[#DFB76C] font-cinzel font-semibold">
            <ShieldCheck size={16} /> Instant Confirmation
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-[4px] border border-rose-500/40 bg-rose-950/40 p-4 text-xs font-semibold text-rose-300">
          <AlertCircle size={18} className="shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Form: Guest Information & Payment Gateway */}
        <form onSubmit={handleConfirmBooking} className="lg:col-span-2 space-y-8">
          {/* Guest Information */}
          <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-8 shadow-sm space-y-6">
            <div className="border-b border-[#2C315E] pb-3">
              <span className="font-cinzel text-[10px] uppercase tracking-wider text-[#DFB76C] font-semibold">STEP 02</span>
              <h2 className="text-xl font-editorial font-bold text-white">Primary Resident Information</h2>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block font-cinzel text-[10px] uppercase tracking-wider text-white/70 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1B1E3D] border border-[#2C315E] rounded-[3px] text-xs font-medium text-white focus:outline-none focus:border-[#DFB76C]"
                />
              </div>
              <div>
                <label className="block font-cinzel text-[10px] uppercase tracking-wider text-white/70 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1B1E3D] border border-[#2C315E] rounded-[3px] text-xs font-medium text-white focus:outline-none focus:border-[#DFB76C]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block font-cinzel text-[10px] uppercase tracking-wider text-white/70 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1B1E3D] border border-[#2C315E] rounded-[3px] text-xs font-medium text-white focus:outline-none focus:border-[#DFB76C]"
                />
              </div>
              <div>
                <label className="block font-cinzel text-[10px] uppercase tracking-wider text-white/70 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1B1E3D] border border-[#2C315E] rounded-[3px] text-xs font-medium text-white focus:outline-none focus:border-[#DFB76C]"
                />
              </div>
            </div>

            <div>
              <label className="block font-cinzel text-[10px] uppercase tracking-wider text-white/70 mb-1">Bespoke Guest Requests (Optional)</label>
              <textarea
                rows="2"
                placeholder="High floor, quiet wing, late arrival, diet preferences..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#1B1E3D] border border-[#2C315E] rounded-[3px] text-xs font-medium text-white focus:outline-none focus:border-[#DFB76C]"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[#2C315E] pb-3">
              <div>
                <span className="font-cinzel text-[10px] uppercase tracking-wider text-[#DFB76C] font-semibold">STEP 03</span>
                <h2 className="text-xl font-editorial font-bold text-white flex items-center gap-2">
                  <CreditCard size={18} className="text-[#DFB76C]" /> Settlement Method
                </h2>
              </div>
              <span className="rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] px-2 py-0.5 text-[10px] font-cinzel font-bold text-[#DFB76C]">
                SSL 256-bit Encrypted
              </span>
            </div>

            {/* EasyUI Wallet Balance Pouch preview */}
            <div className="rounded-[4px] border border-[#2C315E] bg-[#181B38] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-[2px] bg-[#0B0C1E] text-[#DFB76C] border border-[#DFB76C]/30">
                    <CreditCard size={14} />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-white">Stored Travel Wallet & Card Pouch</p>
                    <p className="text-[10px] text-white/60">Tuck and reveal linked payment cards with spring physics</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWalletPouch(!showWalletPouch)}
                  className="px-3 py-1.5 bg-[#1B1E3D] hover:bg-[#2C315E] border border-[#2C315E] text-[#DFB76C] text-[11px] font-cinzel font-bold rounded-[2px] transition cursor-pointer"
                >
                  {showWalletPouch ? "Hide Wallet Pouch ▲" : "View Wallet Pouch ▼"}
                </button>
              </div>

              {showWalletPouch && (
                <div className="mt-4 pt-4 border-t border-[#2C315E] flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
                  <WalletBalance
                    accounts={checkoutWalletAccounts}
                    currency="INR"
                    locale="en-IN"
                    totalLabel="Combined Travel Liquidity"
                    className="max-w-[300px]"
                  />
                  <p className="text-[10px] text-white/50 text-center mt-2">
                    Click the center eye icon to toggle balance privacy
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Razorpay Option */}
              <div
                onClick={() => setPaymentMethod('RAZORPAY')}
                className={`flex cursor-pointer flex-col justify-between rounded-[3px] border p-4 transition-all ${
                  paymentMethod === 'RAZORPAY'
                    ? 'border-[#DFB76C] bg-[#1B1E3D] shadow-sm'
                    : 'border-[#2C315E] bg-[#13152C] hover:border-[#DFB76C]/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[3px] bg-[#0C2340] border border-[#0C83FD]/40 shadow-inner shrink-0">
                    <RazorpayIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === 'RAZORPAY'}
                    onChange={() => setPaymentMethod('RAZORPAY')}
                    className="accent-[#DFB76C]"
                  />
                </div>
                <div className="mt-3">
                  <p className="text-xs font-bold text-white flex items-center gap-1">
                    Razorpay <span className="text-[9px] text-amber-400 font-mono font-normal">(Test)</span>
                  </p>
                  <p className="text-[10px] text-white/60 font-cinzel mt-0.5">UPI &bull; NetBanking &bull; INR Cards</p>
                </div>
              </div>

              {/* PayPal Option */}
              <div
                onClick={() => setPaymentMethod('PAYPAL')}
                className={`flex cursor-pointer flex-col justify-between rounded-[3px] border p-4 transition-all ${
                  paymentMethod === 'PAYPAL'
                    ? 'border-[#DFB76C] bg-[#1B1E3D] shadow-sm'
                    : 'border-[#2C315E] bg-[#13152C] hover:border-[#DFB76C]/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[3px] bg-[#001c38] border border-[#0079C1]/40 shadow-inner shrink-0">
                    <PayPalIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === 'PAYPAL'}
                    onChange={() => setPaymentMethod('PAYPAL')}
                    className="accent-[#DFB76C]"
                  />
                </div>
                <div className="mt-3">
                  <p className="text-xs font-bold text-white flex items-center gap-1">
                    PayPal <span className="text-[9px] text-amber-400 font-mono font-normal">(Sandbox)</span>
                  </p>
                  <p className="text-[10px] text-white/60 font-cinzel mt-0.5">PayPal Wallet &bull; Global Cards</p>
                </div>
              </div>

              {/* Demo Card Option */}
              <div
                onClick={() => setPaymentMethod('DEMO_CARD')}
                className={`flex cursor-pointer flex-col justify-between rounded-[3px] border p-4 transition-all ${
                  paymentMethod === 'DEMO_CARD'
                    ? 'border-[#DFB76C] bg-[#1B1E3D] shadow-sm'
                    : 'border-[#2C315E] bg-[#13152C] hover:border-[#DFB76C]/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[3px] bg-[#0B0C1E] text-[#DFB76C] border border-[#2C315E]">
                    <CreditCard size={16} />
                  </div>
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === 'DEMO_CARD'}
                    onChange={() => setPaymentMethod('DEMO_CARD')}
                    className="accent-[#DFB76C]"
                  />
                </div>
                <div className="mt-3">
                  <p className="text-xs font-bold text-white">Direct Simulation</p>
                  <p className="text-[10px] text-white/60 font-cinzel mt-0.5">Instant 1-Click Sandbox</p>
                </div>
              </div>
            </div>

            {paymentMethod === 'RAZORPAY' ? (
              <div className="rounded-[3px] border border-[#2C315E] bg-[#1B1E3D] p-4 text-xs text-white/80 space-y-1">
                <p className="font-cinzel font-bold text-[#DFB76C]">
                  Razorpay Test Gateway Active
                </p>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Your transaction is processed via Razorpay Test Mode with server-side HMAC-SHA256 signature verification. Real money is never charged.
                </p>
              </div>
            ) : paymentMethod === 'PAYPAL' ? (
              <div className="rounded-[3px] border border-[#2C315E] bg-[#1B1E3D] p-4 text-xs text-white/80 space-y-1">
                <p className="font-cinzel font-bold text-[#DFB76C]">
                  PayPal Sandbox Checkout Active
                </p>
                <p className="text-[11px] text-white/60 leading-relaxed">
                  Your reservation is authenticated securely through the official PayPal REST API v2 with automatic INR/USD exchange rate conversion (~₹86 = $1 USD).
                </p>
              </div>
            ) : (
              <div className="rounded-[3px] border border-[#2C315E] bg-[#1B1E3D] p-4 text-xs text-white/80 space-y-1">
                <p className="font-cinzel font-bold text-[#DFB76C]">Direct Test Checkout</p>
                <p className="text-[11px] text-white/60">
                  Instant sandbox booking confirmation without launching payment window.
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
                : paymentMethod === 'RAZORPAY'
                ? `CONFIRM WITH RAZORPAY (${formatPrice(totalAmount)}) →`
                : paymentMethod === 'PAYPAL'
                ? `CONFIRM WITH PAYPAL (${formatPrice(totalAmount)}) →`
                : `CONFIRM & PAY ${formatPrice(totalAmount)} →`}
            </button>
          </div>
        </form>

        {/* Right Summary Folio with EasyUI Calendar Date Adjustment */}
        <div className="space-y-4">
          <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-7 shadow-sm space-y-5">
            <span className="font-cinzel text-[10px] uppercase tracking-wider text-[#DFB76C] font-semibold">FOLIO PREVIEW</span>
            <h3 className="text-xl font-editorial font-bold text-white">Reservation Summary</h3>

            {property && (
              <div className="border-b border-[#2C315E] pb-4">
                <p className="font-cinzel text-[10px] uppercase tracking-wider text-white/60">{property.city}</p>
                <p className="text-lg font-editorial font-bold text-white">{property.name}</p>
              </div>
            )}

            {roomType && (
              <div className="rounded-[3px] bg-[#1B1E3D] p-4 text-xs space-y-1 border border-[#2C315E]">
                <p className="font-editorial text-base font-bold text-white">{roomType.name}</p>
                <p className="text-white/60 text-[11px]">{roomType.bed_type} &bull; Up to {adults} Guests</p>
              </div>
            )}

            <div className="divide-y divide-[#2C315E] text-xs text-white/80">
              {/* Interactive Dates Modification Trigger */}
              <div className="py-2.5 relative" ref={datePickerRef}>
                <div className="flex justify-between items-center">
                  <span className="font-cinzel text-[10px] uppercase tracking-wider text-white/60">Stay Dates</span>
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    className="flex items-center gap-1.5 font-mono text-xs text-[#DFB76C] hover:underline cursor-pointer"
                    title="Click to modify dates with EasyUI Calendar"
                  >
                    <CalendarDays size={13} className="text-[#DFB76C]" />
                    <span>{checkIn} &rarr; {checkOut}</span>
                  </button>
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

              <div className="flex justify-between py-2.5">
                <span className="font-cinzel text-[10px] uppercase tracking-wider text-white/60">Duration</span>
                <span className="font-semibold text-white">{nights} Night{nights > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="font-cinzel text-[10px] uppercase tracking-wider text-white/60">Rate / Night</span>
                <span className="font-semibold text-white">{formatPrice(roomType?.base_rate)}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="font-cinzel text-[10px] uppercase tracking-wider text-white/60">Stay Subtotal</span>
                <span className="font-semibold text-white">{formatPrice(baseTotal)}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="font-cinzel text-[10px] uppercase tracking-wider text-white/60">GST &amp; Taxes (12%)</span>
                <span className="font-semibold text-white">{formatPrice(taxesTotal)}</span>
              </div>
              <div className="flex justify-between py-4 border-t border-[#2C315E]">
                <span className="font-cinzel text-xs font-bold text-white uppercase tracking-wider">Total Stay Amount</span>
                <span className="text-2xl font-editorial font-bold text-[#DFB76C]">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
