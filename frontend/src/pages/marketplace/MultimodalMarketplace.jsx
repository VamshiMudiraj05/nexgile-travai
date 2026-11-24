import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plane,
  Building2,
  Car,
  Compass,
  Gift,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  Tag,
  ShieldCheck,
  CreditCard,
  QrCode,
  ArrowRight,
  Sparkles,
  Trash2,
  Lock,
  RefreshCw,
  Search,
  Check,
  DollarSign,
  MapPin,
  X,
  Ticket,
  Luggage,
  Users,
  Gauge,
  ChevronDown
} from 'lucide-react';
import { GooeyMenu } from '@/components/ui/gooey-menu';
import { multimodalService } from '../../services/multimodalService';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../hooks/useAuth';
import { useCurrency } from '../../context/CurrencyContext';
import { RazorpayIcon, PayPalIcon } from '@/components/ui/wallet-balance';

export default function MultimodalMarketplace() {
  const [activeTab, setActiveTab] = useState('flights');

  // Inventory states
  const [flights, setFlights] = useState([]);
  const [cars, setCars] = useState([]);
  const [activities, setActivities] = useState([]);
  const [packages, setPackages] = useState([]);

  // Search parameters (Localized to India)
  const [flightOrigin, setFlightOrigin] = useState('HYD');
  const [flightDest, setFlightDest] = useState('BOM');
  const [flightCabin, setFlightCabin] = useState('ECONOMY');

  const [carLocation, setCarLocation] = useState('Hyderabad Airport');
  const [carCategory, setCarCategory] = useState('');

  const [actDestination, setActDestination] = useState('Hyderabad');
  const [actCategory, setActCategory] = useState('');
  const [pkgDestination, setPkgDestination] = useState('Kerala Backwaters');

  // Loading & cart states
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('TRAVAI20');
  const [promoMessage, setPromoMessage] = useState(null);

  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  // Checkout modal
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [travelerName, setTravelerName] = useState(user?.name || 'Resident Guest');
  const [travelerEmail, setTravelerEmail] = useState(user?.email || 'guest@nexgile.com');
  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);

  useEffect(() => {
    if (user?.name) setTravelerName(user.name);
    if (user?.email) setTravelerEmail(user.email);
  }, [user]);

  // Disruption simulation state
  const [disruptionType, setDisruptionType] = useState('FLIGHT_DELAY');
  const [disruptionResult, setDisruptionResult] = useState(null);
  const [disruptionLoading, setDisruptionLoading] = useState(false);

  // Initial cart and inventory fetch
  useEffect(() => {
    fetchCart();
    fetchFlights();
  }, []);

  const fetchCart = async () => {
    try {
      const data = await multimodalService.getCart();
      setCart(data);
    } catch (err) {
      console.error('Failed to load cart', err);
    }
  };

  const fetchFlights = async () => {
    setLoading(true);
    try {
      const res = await multimodalService.searchFlights({
        origin: flightOrigin,
        destination: flightDest,
        cabin_class: flightCabin,
      });
      setFlights(res.flights || []);
    } catch (err) {
      console.error('Flight search error', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCars = async () => {
    setLoading(true);
    try {
      const res = await multimodalService.searchCars({
        location: carLocation,
        category: carCategory || undefined,
      });
      setCars(res.cars || []);
    } catch (err) {
      console.error('Car search error', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await multimodalService.searchActivities({
        destination: actDestination,
        category: actCategory || undefined,
      });
      setActivities(res.activities || []);
    } catch (err) {
      console.error('Activities search error', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await multimodalService.searchPackages({
        destination: pkgDestination,
      });
      setPackages(res.packages || []);
    } catch (err) {
      console.error('Package search error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'flights' && flights.length === 0) fetchFlights();
    if (tab === 'cars' && cars.length === 0) fetchCars();
    if (tab === 'activities' && activities.length === 0) fetchActivities();
    if (tab === 'packages' && packages.length === 0) fetchPackages();
  };

  // Cart actions
  const handleAddToCart = async (itemPayload) => {
    try {
      const updated = await multimodalService.addToCart(itemPayload);
      setCart(updated);
      setCartDrawerOpen(true);
    } catch (err) {
      alert('Error adding item to cart: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleRemoveFromCart = async (itemId) => {
    try {
      const updated = await multimodalService.removeFromCart(itemId);
      setCart(updated);
    } catch (err) {
      alert('Error removing item: ' + err.message);
    }
  };

  const handleHoldPrice = async () => {
    try {
      const res = await multimodalService.holdPrice();
      alert(`❄️ ${res.message}\nLocked Total: ₹{res.price_locked_amount}`);
      fetchCart();
    } catch (err) {
      alert('Error holding price: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCodeInput) return;
    try {
      const res = await multimodalService.applyPromo(promoCodeInput);
      setPromoMessage({ text: res.message, valid: res.is_valid });
      fetchCart();
    } catch (err) {
      setPromoMessage({ text: 'Failed to apply coupon', valid: false });
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setCheckoutLoading(true);
    setCheckoutError(null);

    const totalAmount = cart?.total_amount || 0;

    try {
      if (paymentMethod === 'RAZORPAY') {
        const orderData = await paymentService.createRazorpayOrder({
          amount: totalAmount,
          cart_id: cart?.id,
          notes: {
            traveler_name: travelerName,
            traveler_email: travelerEmail,
            items_count: cart?.items?.length || 1,
          },
        });

        const scriptLoaded = await paymentService.loadRazorpayScript();
        const activeKeyId = (orderData?.key_id && !orderData.key_id.startsWith('rzp_test_placeholder'))
          ? orderData.key_id
          : (import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_U3uGDG8G6pVswQ');

        if ((scriptLoaded || window.Razorpay) && window.Razorpay && activeKeyId) {
          const options = {
            key: activeKeyId,
            amount: orderData.amount,
            currency: 'INR',
            name: 'Nexgile TravAI Multimodal',
            description: `Multimodal Journey Checkout (${cart?.items?.length || 1} Items)`,
            order_id: orderData.order_id,
            prefill: {
              name: travelerName || 'Resident Guest',
              email: travelerEmail || 'traveler@nexgile.com',
            },
            theme: { color: '#DFB76C' },
            handler: async function (response) {
              try {
                setCheckoutLoading(true);
                await paymentService.verifyRazorpayPayment({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });
                const res = await multimodalService.checkout({
                  traveler_name: travelerName,
                  traveler_email: travelerEmail,
                  payment_method: 'RAZORPAY',
                  payment_details: {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                  },
                });
                setCheckoutSuccess(res);
                setCheckoutModalOpen(false);
                fetchCart();
              } catch (verifyErr) {
                console.error('Razorpay verification error:', verifyErr);
                setCheckoutError('Payment verification failed. Please try again.');
              } finally {
                setCheckoutLoading(false);
              }
            },
            modal: {
              ondismiss: function () {
                setCheckoutLoading(false);
                setCheckoutError('Razorpay payment checkout was dismissed.');
              },
            },
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
          return;
        } else {
          setCheckoutError('Unable to initialize Razorpay checkout. Please check that script blockers are disabled.');
          setCheckoutLoading(false);
          return;
        }
      } else if (paymentMethod === 'PAYPAL') {
        const orderRes = await paymentService.createPayPalOrder({
          amount: totalAmount,
          currency: 'INR',
          description: `Multimodal Journey Checkout (${cart?.items?.length || 1} Items)`,
        });

        if (orderRes?.approval_url) {
          window.location.href = orderRes.approval_url;
          return;
        } else {
          // PayPal Sandbox capture
          await paymentService.capturePayPalOrder({
            order_id: orderRes.order_id,
            reservation_id: cart?.id || "MULTIMODAL_HOLD",
          });
          const res = await multimodalService.checkout({
            traveler_name: travelerName,
            traveler_email: travelerEmail,
            payment_method: 'PAYPAL',
            payment_details: {
              paypal_order_id: orderRes.order_id,
            },
          });
          setCheckoutSuccess(res);
          setCheckoutModalOpen(false);
          fetchCart();
          return;
        }
      } else {
        // Direct Demo Simulation
        const res = await multimodalService.checkout({
          traveler_name: travelerName,
          traveler_email: travelerEmail,
          payment_method: 'DEMO_CARD',
        });
        setCheckoutSuccess(res);
        setCheckoutModalOpen(false);
        fetchCart();
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutError(err.response?.data?.detail || err.message || 'Checkout failed.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSimulateDisruption = async () => {
    setDisruptionLoading(true);
    try {
      const res = await multimodalService.resolveDisruption({
        booking_reference: checkoutSuccess?.master_booking_reference || 'PNR-202611-SAMPLE',
        product_type: 'FLIGHT',
        disruption_type: disruptionType,
      });
      setDisruptionResult(res);
    } catch (err) {
      alert('Disruption resolution error: ' + err.message);
    } finally {
      setDisruptionLoading(false);
    }
  };

  const totalCartItems = cart?.items?.length || 0;

  return (
    <div className="space-y-8 pb-16 font-sans text-[#FAF6F0]">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#2C315E] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-0.5 rounded-[2px] text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Phase 3 Live
            </span>
            <span className="px-3 py-0.5 rounded-[2px] text-xs font-semibold bg-[#DFB76C]/10 text-[#DFB76C] border border-[#DFB76C]/30">
              Multimodal Travel Marketplace
            </span>
          </div>
          <h1 className="font-editorial text-3xl md:text-4xl text-white tracking-tight font-bold flex items-center gap-3">
            <Compass className="w-8 h-8 text-[#DFB76C]" />
            Global Unified Travel Marketplace
          </h1>
          <p className="text-white/70 text-sm mt-1 max-w-2xl">
            Book integrated travel journeys: Flights, Premium Resorts, Rental Fleets, Curated Experiences, and Bundled Vacation Packages in one unified checkout cart with price freeze hold.
          </p>
        </div>

        {/* Floating Cart Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="relative flex items-center gap-2.5 px-5 py-2.5 bg-[#DFB76C] hover:bg-[#F2D59B] text-[#0B0C1E] font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px] shadow-sm transition"
          >
            <Luggage className="w-5 h-5" />
            <span>Trip Itinerary</span>
            {totalCartItems > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-[2px] bg-[#0B0C1E] text-[#DFB76C] text-xs font-bold">
                {totalCartItems}
              </span>
            )}
            {cart?.total_amount > 0 && (
              <span className="font-semibold text-[#0B0C1E] border-l border-[#0B0C1E]/30 pl-2">
                {formatPrice(cart.total_amount)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-[#2C315E] pb-6">
        <button
          onClick={() => handleTabChange('flights')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'flights' ? 'bg-[#DFB76C] text-[#0B0C1E] font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px]' : 'bg-[#1B1E3D] text-white/70 hover:text-white font-cinzel text-xs tracking-wider uppercase rounded-[2px] border border-[#2C315E]'
          }`}
        >
          <Plane className="w-4 h-4" /> Flights & Airline Networks
        </button>

        <button
          onClick={() => handleTabChange('hotels')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'hotels' ? 'bg-[#DFB76C] text-[#0B0C1E] font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px]' : 'bg-[#1B1E3D] text-white/70 hover:text-white font-cinzel text-xs tracking-wider uppercase rounded-[2px] border border-[#2C315E]'
          }`}
        >
          <Building2 className="w-4 h-4" /> Estate Hotels & Suites
        </button>

        <button
          onClick={() => handleTabChange('cars')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'cars' ? 'bg-[#DFB76C] text-[#0B0C1E] font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px]' : 'bg-[#1B1E3D] text-white/70 hover:text-white font-cinzel text-xs tracking-wider uppercase rounded-[2px] border border-[#2C315E]'
          }`}
        >
          <Car className="w-4 h-4" /> Chauffeur, Taxi & Fleets
        </button>

        <button
          onClick={() => handleTabChange('activities')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'activities' ? 'bg-[#DFB76C] text-[#0B0C1E] font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px]' : 'bg-[#1B1E3D] text-white/70 hover:text-white font-cinzel text-xs tracking-wider uppercase rounded-[2px] border border-[#2C315E]'
          }`}
        >
          <Compass className="w-4 h-4" /> Tours & VIP Experiences
        </button>

        <button
          onClick={() => handleTabChange('packages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'packages' ? 'bg-[#DFB76C] text-[#0B0C1E] font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px]' : 'bg-[#1B1E3D] text-white/70 hover:text-white font-cinzel text-xs tracking-wider uppercase rounded-[2px] border border-[#2C315E]'
          }`}
        >
          <Gift className="w-4 h-4 text-emerald-300" /> Dynamic Bundled Packages
        </button>

        <button
          onClick={() => handleTabChange('disruptions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'disruptions'
              ? 'bg-[#13152C] text-[#DFB76C] border border-[#DFB76C]/60 shadow-sm font-cinzel text-xs tracking-wider uppercase font-bold shadow-md shadow-amber-600/30'
              : 'bg-[#13152C] text-white/70 hover:bg-[#13152C] hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-300" /> AI Disruption Sentinel
        </button>
      </div>

      {/* --- TAB 1: FLIGHTS --- */}
      {activeTab === 'flights' && (
        <div className="space-y-6">
          {/* Flight Search Bar */}
          <div className="bg-[#13152C] p-5 rounded-[4px] border border-[#E5DDCF] grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                Origin Airport (IATA)
              </label>
              <input
                type="text"
                value={flightOrigin}
                onChange={(e) => setFlightOrigin(e.target.value.toUpperCase())}
                placeholder="HYD / DEL / BLR"
                className="w-full px-4 py-2.5 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] font-medium focus:ring-1 focus:ring-[#DFB76C] focus:border-[#DFB76C] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                Destination Airport
              </label>
              <input
                type="text"
                value={flightDest}
                onChange={(e) => setFlightDest(e.target.value.toUpperCase())}
                placeholder="BOM / MAA / CCU"
                className="w-full px-4 py-2.5 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] font-medium focus:ring-1 focus:ring-[#DFB76C] focus:border-[#DFB76C] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                Cabin Class
              </label>
              <GooeyMenu
                className="w-full"
                style={{ width: '100%' }}
                surfaceClassName="bg-[#13152C]"
                options={['Economy Class', 'Business Class', 'First Class Suite']}
                value={
                  flightCabin === 'FIRST'
                    ? 'First Class Suite'
                    : flightCabin === 'BUSINESS'
                    ? 'Business Class'
                    : 'Economy Class'
                }
                onSelect={(opt) => {
                  if (opt === 'First Class Suite') setFlightCabin('FIRST');
                  else if (opt === 'Business Class') setFlightCabin('BUSINESS');
                  else setFlightCabin('ECONOMY');
                }}
                triggerClassName="h-[42px] w-full rounded-[2px] bg-[#1B1E3D] px-4 border border-[#2C315E] hover:border-[#DFB76C]/60 transition-colors flex items-center justify-between"
                trigger={
                  <div className="flex h-full w-full items-center justify-between text-left">
                    <span className="text-sm font-medium text-white truncate">
                      {flightCabin === 'FIRST'
                        ? 'First Class Suite'
                        : flightCabin === 'BUSINESS'
                        ? 'Business Class'
                        : 'Economy Class'}
                    </span>
                    <ChevronDown size={14} className="text-[#DFB76C]/70 shrink-0 ml-2" />
                  </div>
                }
              />
            </div>
            <div>
              <button
                onClick={fetchFlights}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#DFB76C] hover:bg-[#F2D59B] text-[#0B0C1E] disabled:opacity-50 rounded-[2px] font-cinzel text-xs font-bold tracking-wider uppercase transition shadow-md shadow-[#DFB76C]/20"
              >
                <Search className="w-4 h-4" />
                {loading ? 'Searching GDS...' : 'Find Flights'}
              </button>
            </div>
          </div>

          {/* Flight Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flights.map((fl) => (
              <div
                key={fl.id}
                className="bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/40 p-5 rounded-[4px] transition shadow-lg hover:shadow-[#DFB76C]/10 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[2px] bg-[#1B1E3D] flex items-center justify-center text-[#DFB76C]">
                        <Plane className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{fl.airline}</h3>
                        <p className="text-xs text-white/70">Flight {fl.flight_number} • {fl.cabin_class}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs rounded-[2px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      {fl.seats_remaining} seats left
                    </span>
                  </div>

                  <div className="flex items-center justify-between my-4 px-3 py-2 bg-[#1B1E3D]/50 rounded-[2px]">
                    <div>
                      <div className="text-lg font-bold text-white">{fl.departure_time}</div>
                      <div className="text-xs text-white/70">{fl.origin}</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-white/50">{fl.duration}</span>
                      <div className="w-24 h-0.5 bg-[#2C315E] my-1 relative">
                        <div className="w-2 h-2 rounded-[2px] bg-[#DFB76C] absolute -top-0.5 left-1/2 -translate-x-1/2" />
                      </div>
                      <span className="text-xs text-[#DFB76C]">{fl.stops === 0 ? 'Nonstop' : `${fl.stops} stop`}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{fl.arrival_time}</div>
                      <div className="text-xs text-white/70">{fl.destination}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#2C315E]">
                  <div>
                    <span className="text-xs text-white/70">Fare Per Passenger / Seat</span>
                    <div className="text-2xl font-bold text-white">{formatPrice(fl.price)}</div>
                  </div>
                  <button
                    onClick={() =>
                      handleAddToCart({
                        product_type: 'FLIGHT',
                        title: `${fl.airline} (${fl.flight_number}) ${fl.origin} -> ${fl.destination}`,
                        subtitle: `${fl.cabin_class} • ${fl.duration} • ${fl.departure_time}`,
                        dates: '2026-12-01',
                        quantity: 1,
                        unit_price: fl.price,
                        details: fl,
                      })
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-[#DFB76C] hover:bg-[#F2D59B] text-[#0B0C1E] font-cinzel text-xs tracking-wider uppercase font-bold rounded-[2px] transition shadow-md shadow-[#DFB76C]/20"
                  >
                    <Ticket className="w-4 h-4" /> Reserve Seat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 2: ESTATE HOTELS --- */}
      {activeTab === 'hotels' && (
        <div className="space-y-6">
          <div className="p-4 bg-[#1B1E3D] border border-[#2C315E] rounded-[4px] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-[#DFB76C]" />
              <div>
                <h4 className="font-semibold text-white">Direct PMS Estate Integration</h4>
                <p className="text-xs text-white/70">Live synchronization with PMS Folios, ARI inventory, and guaranteed member parity rates.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                id: 'HTL-001',
                name: 'Taj Falaknuma Palace',
                location: 'Hyderabad, Telangana',
                stars: 5.0,
                price: 38500.0,
                image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
                amenities: ['Royal Carriage Arrival', 'Nizami Butler Service', 'Heritage Palace Suites'],
              },
              {
                id: 'HTL-002',
                name: 'The Taj Mahal Palace & Tower',
                location: 'Colaba, Mumbai',
                stars: 4.9,
                price: 32000.0,
                image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80',
                amenities: ['Gateway of India View', 'Sea Lounge High Tea', 'Jiva Luxury Spa'],
              },
              {
                id: 'HTL-003',
                name: 'The Oberoi Amarvilas',
                location: 'Agra, Uttar Pradesh',
                stars: 5.0,
                price: 42000.0,
                image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
                amenities: ['Direct Taj Mahal Views', 'Private Terrace Dining', 'Royal Spa Sanctuary'],
              },
            ].map((htl) => (
              <div key={htl.id} className="bg-[#13152C] border border-[#2C315E] rounded-[4px] overflow-hidden flex flex-col justify-between h-full">
                <img src={htl.image} alt={htl.name} className="h-48 w-full object-cover" />
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#DFB76C]" /> {htl.location}</span>
                      <span className="text-amber-400 font-bold">★ {htl.stars}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{htl.name}</h3>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {htl.amenities.map((a, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#1B1E3D] text-white/80 text-xs rounded-md">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-[#2C315E] mt-auto">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-cinzel tracking-wider text-white/60 block">Nightly Rate</span>
                      <div className="text-xl font-bold text-white tracking-tight truncate">
                        ₹{Number(htl.price).toLocaleString('en-IN')}
                        <span className="text-xs font-sans font-normal text-white/60"> / night</span>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleAddToCart({
                          product_type: 'HOTEL',
                          title: htl.name,
                          subtitle: `${htl.location} • 3 Nights Estate Stay`,
                          dates: '2026-12-01 to 2026-12-04',
                          quantity: 1,
                          unit_price: htl.price * 3,
                          details: htl,
                        })
                      }
                      className="w-full sm:w-auto shrink-0 px-4 py-2 bg-[#DFB76C] hover:bg-[#F2D59B] text-[#0B0C1E] font-cinzel text-xs tracking-wider uppercase font-bold rounded-[2px] transition shadow-md shadow-[#DFB76C]/20 inline-flex items-center justify-center gap-1.5"
                    >
                      <span>Book Stay</span>
                      <ArrowRight size={13} className="shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: CAR RENTALS & CHAUFFEUR TAXIS --- */}
      {activeTab === 'cars' && (
        <div className="space-y-6">
          <div className="bg-[#13152C] p-5 rounded-[4px] border border-[#E5DDCF] grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                Pickup City / Airport
              </label>
              <input
                type="text"
                value={carLocation}
                onChange={(e) => setCarLocation(e.target.value)}
                placeholder="Hyderabad Airport / HITEC City / Mumbai Airport"
                className="w-full px-4 py-2.5 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] font-medium focus:ring-1 focus:ring-[#DFB76C] focus:border-[#DFB76C] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                Category
              </label>
              <GooeyMenu
                className="w-full"
                style={{ width: '100%' }}
                surfaceClassName="bg-[#13152C]"
                options={[
                  'All Categories & Chauffeurs',
                  'Luxury & Exotic',
                  'SUV & 4x4',
                  'Electric (EV)',
                  'Executive Sedan',
                ]}
                value={
                  carCategory === 'LUXURY'
                    ? 'Luxury & Exotic'
                    : carCategory === 'SUV'
                    ? 'SUV & 4x4'
                    : carCategory === 'ELECTRIC'
                    ? 'Electric (EV)'
                    : carCategory === 'SEDAN'
                    ? 'Executive Sedan'
                    : 'All Categories & Chauffeurs'
                }
                onSelect={(opt) => {
                  const map = {
                    'Luxury & Exotic': 'LUXURY',
                    'SUV & 4x4': 'SUV',
                    'Electric (EV)': 'ELECTRIC',
                    'Executive Sedan': 'SEDAN',
                    'All Categories & Chauffeurs': '',
                  };
                  setCarCategory(map[opt] ?? '');
                }}
                triggerClassName="h-[42px] w-full rounded-[2px] bg-[#1B1E3D] px-4 border border-[#2C315E] hover:border-[#DFB76C]/60 transition-colors flex items-center justify-between"
                trigger={
                  <div className="flex h-full w-full items-center justify-between text-left">
                    <span className="text-sm font-medium text-white truncate">
                      {carCategory === 'LUXURY'
                        ? 'Luxury & Exotic'
                        : carCategory === 'SUV'
                        ? 'SUV & 4x4'
                        : carCategory === 'ELECTRIC'
                        ? 'Electric (EV)'
                        : carCategory === 'SEDAN'
                        ? 'Executive Sedan'
                        : 'All Categories & Chauffeurs'}
                    </span>
                    <ChevronDown size={14} className="text-[#DFB76C]/70 shrink-0 ml-2" />
                  </div>
                }
              />
            </div>
            <div>
              <button
                onClick={fetchCars}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#DFB76C] hover:bg-[#F2D59B] text-[#0B0C1E] disabled:opacity-50 font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px] transition shadow-md shadow-[#DFB76C]/20 whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                {loading ? 'Searching Fleet...' : 'Search Chauffeur Fleets'}
              </button>
            </div>
          </div>

          {/* Balanced 2-Column Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cars.map((car) => (
              <div
                key={car.id}
                className="group bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/40 rounded-[4px] overflow-hidden flex flex-col justify-between transition shadow-lg hover:shadow-[#DFB76C]/10"
              >
                <div className="overflow-hidden h-52 w-full relative">
                  <img
                    src={car.image_url}
                    alt={car.model}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-[2px] bg-[#0B0C1E]/80 backdrop-blur-sm border border-[#2C315E] text-xs font-semibold text-[#DFB76C]">
                    {car.provider}
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-[2px] bg-[#0B0C1E]/80 backdrop-blur-sm border border-[#2C315E] text-xs font-mono font-bold text-white/90">
                    {car.category}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1.5">{car.model}</h3>
                    <p className="text-xs text-white/60 mb-3 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#DFB76C] flex-shrink-0" />
                      <span>{car.pickup_location}</span>
                    </p>

                    {/* Specifications Pill Bar */}
                    <div className="grid grid-cols-3 gap-2 py-2.5 px-3 mb-4 bg-[#1B1E3D]/60 rounded-[2px] border border-[#2C315E]/50 text-xs">
                      <div className="flex items-center gap-1.5 text-white/80">
                        <Users className="w-3.5 h-3.5 text-[#DFB76C] flex-shrink-0" />
                        <span className="truncate">{car.seats} Seats</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/80">
                        <Gauge className="w-3.5 h-3.5 text-[#DFB76C] flex-shrink-0" />
                        <span className="truncate">{car.transmission}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/80">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{car.unlimited_mileage ? 'Unlimited Mi' : 'Standard Mi'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Clean Bottom Price & Action Container */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#2C315E] gap-3">
                    <div>
                      <span className="text-xs text-white/60 block">Daily Rate: {formatPrice(car.daily_rate)}/day</span>
                      <div className="text-2xl font-bold text-white tracking-tight">
                        {formatPrice(car.total_price)}{' '}
                        <span className="text-xs font-normal text-white/50">(4-Day Trip)</span>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleAddToCart({
                          product_type: 'CAR',
                          title: `${car.model} (${car.provider})`,
                          subtitle: `${car.category} • ${car.transmission} • ${car.pickup_location}`,
                          dates: '2026-12-01 to 2026-12-05',
                          quantity: 1,
                          unit_price: car.total_price,
                          details: car,
                        })
                      }
                      className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-[#DFB76C] hover:bg-[#F2D59B] text-[#0B0C1E] font-cinzel text-xs tracking-wider uppercase font-bold rounded-[2px] transition shadow-md shadow-[#DFB76C]/20 whitespace-nowrap"
                    >
                      <Car className="w-4 h-4 flex-shrink-0" /> Reserve Fleet
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 4: TOURS & VIP EXPERIENCES --- */}
      {activeTab === 'activities' && (
        <div className="space-y-6">
          <div className="bg-[#13152C] p-5 rounded-[4px] border border-[#E5DDCF] grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                Destination City / Region
              </label>
              <input
                type="text"
                value={actDestination}
                onChange={(e) => setActDestination(e.target.value)}
                placeholder="Hyderabad / Jaipur / Agra / Kerala"
                className="w-full px-4 py-2.5 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] font-medium focus:ring-1 focus:ring-[#DFB76C] focus:border-[#DFB76C] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                Experience Category
              </label>
              <GooeyMenu
                className="w-full"
                style={{ width: '100%' }}
                surfaceClassName="bg-[#13152C]"
                options={[
                  'All VIP Experiences',
                  'Yacht & Private Catamaran',
                  'Private Helicopter & Air',
                  'Michelin-Starred Culinary',
                  'Safari & Desert Expeditions',
                ]}
                value={
                  actCategory === 'CRUISE'
                    ? 'Yacht & Private Catamaran'
                    : actCategory === 'EXCURSION'
                    ? 'Private Helicopter & Air'
                    : actCategory === 'CULINARY'
                    ? 'Michelin-Starred Culinary'
                    : actCategory === 'ADVENTURE'
                    ? 'Safari & Desert Expeditions'
                    : 'All VIP Experiences'
                }
                onSelect={(opt) => {
                  const map = {
                    'Yacht & Private Catamaran': 'CRUISE',
                    'Private Helicopter & Air': 'EXCURSION',
                    'Michelin-Starred Culinary': 'CULINARY',
                    'Safari & Desert Expeditions': 'ADVENTURE',
                    'All VIP Experiences': '',
                  };
                  setActCategory(map[opt] ?? '');
                }}
                triggerClassName="h-[42px] w-full rounded-[2px] bg-[#1B1E3D] px-4 border border-[#2C315E] hover:border-[#DFB76C]/60 transition-colors flex items-center justify-between"
                trigger={
                  <div className="flex h-full w-full items-center justify-between text-left">
                    <span className="text-sm font-medium text-white truncate">
                      {actCategory === 'CRUISE'
                        ? 'Yacht & Private Catamaran'
                        : actCategory === 'EXCURSION'
                        ? 'Private Helicopter & Air'
                        : actCategory === 'CULINARY'
                        ? 'Michelin-Starred Culinary'
                        : actCategory === 'ADVENTURE'
                        ? 'Safari & Desert Expeditions'
                        : 'All VIP Experiences'}
                    </span>
                    <ChevronDown size={14} className="text-[#DFB76C]/70 shrink-0 ml-2" />
                  </div>
                }
              />
            </div>
            <div>
              <button
                onClick={fetchActivities}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#DFB76C] hover:bg-[#F2D59B] text-[#0B0C1E] disabled:opacity-50 font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px] transition shadow-md shadow-[#DFB76C]/20 whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                {loading ? 'Searching Experiences...' : 'Search VIP Tours'}
              </button>
            </div>
          </div>

          {/* Balanced 2-Column Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activities.map((act) => (
              <div
                key={act.id}
                className="group bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/40 rounded-[4px] overflow-hidden flex flex-col justify-between transition shadow-lg hover:shadow-[#DFB76C]/10"
              >
                <div className="overflow-hidden h-52 w-full relative">
                  <img
                    src={act.image_url}
                    alt={act.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-[2px] bg-[#0B0C1E]/80 backdrop-blur-sm border border-[#2C315E] text-xs font-semibold text-emerald-400">
                    {act.category}
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-[2px] bg-[#0B0C1E]/80 backdrop-blur-sm border border-[#2C315E] text-xs font-bold text-amber-400">
                    ★ {act.rating} ({act.review_count} Reviews)
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{act.title}</h3>

                    {/* Metadata Badge Bar */}
                    <div className="grid grid-cols-3 gap-2 py-2 px-3 mb-3 bg-[#1B1E3D]/60 rounded-[2px] border border-[#2C315E]/50 text-xs">
                      <div className="flex items-center gap-1.5 text-white/80">
                        <Clock className="w-3.5 h-3.5 text-[#DFB76C] flex-shrink-0" />
                        <span className="truncate">{act.duration}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/80">
                        <MapPin className="w-3.5 h-3.5 text-[#DFB76C] flex-shrink-0" />
                        <span className="truncate">{act.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/80">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">Free Cancellation</span>
                      </div>
                    </div>

                    {/* Curated Inclusions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1.5 mb-4">
                      {act.highlights?.map((h, i) => (
                        <div key={i} className="text-xs text-white/75 flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Clean Bottom Price & Action Container */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#2C315E] gap-3">
                    <div>
                      <span className="text-xs text-white/60 block">Price Per Guest (All-Inclusive)</span>
                      <div className="text-2xl font-bold text-white tracking-tight">
                        ₹{act.price_per_person.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleAddToCart({
                          product_type: 'ACTIVITY',
                          title: act.title,
                          subtitle: `${act.duration} • ${act.location}`,
                          dates: '2026-12-02',
                          quantity: 1,
                          unit_price: act.price_per_person,
                          details: act,
                        })
                      }
                      className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-[#DFB76C] hover:bg-[#F2D59B] text-[#0B0C1E] font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px] transition shadow-md shadow-[#DFB76C]/20 whitespace-nowrap"
                    >
                      <Compass className="w-4 h-4 flex-shrink-0" /> Reserve Experience
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 5: DYNAMIC PACKAGES --- */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          {/* Packages Search Bar */}
          <div className="bg-[#13152C] p-5 rounded-[4px] border border-[#E5DDCF] flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                Destination / Vacation Region
              </label>
              <input
                type="text"
                value={pkgDestination}
                onChange={(e) => setPkgDestination(e.target.value)}
                placeholder="Kerala Backwaters / Rajasthan / Goa / Agra"
                className="w-full px-4 py-2.5 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] font-medium focus:ring-1 focus:ring-[#DFB76C] focus:border-[#DFB76C] focus:outline-none"
              />
            </div>
            <button
              onClick={fetchPackages}
              disabled={loading}
              className="py-2.5 px-6 bg-[#DFB76C] hover:bg-[#F2D59B] text-[#0B0C1E] disabled:opacity-50 font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px] transition shadow-md shadow-[#DFB76C]/20 flex items-center gap-2 whitespace-nowrap"
            >
              <Search className="w-4 h-4" /> {loading ? 'Searching Packages...' : 'Search Packages'}
            </button>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-[4px] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="w-8 h-8 text-emerald-400" />
              <div>
                <h3 className="font-bold text-white text-lg">Automated Bundle & Save Engine</h3>
                <p className="text-xs text-emerald-300">
                  Save 15% to 20% compared to purchasing flight, resort stay, and rental car individually. One certified confirmation voucher.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-[#DFB76C] text-[#0B0C1E] font-bold text-xs rounded-[2px] uppercase tracking-wider">
              20% Instant Savings
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="group bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/40 rounded-[4px] overflow-hidden flex flex-col justify-between shadow-xl transition hover:shadow-[#DFB76C]/10"
              >
                <div className="overflow-hidden h-52 w-full relative">
                  <img
                    src={pkg.image_url}
                    alt={pkg.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-[2px] bg-emerald-500/90 text-white text-xs font-bold uppercase tracking-wider">
                    Save {formatPrice(pkg.savings_amount)} ({pkg.savings_pct}%)
                  </div>
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-[2px] bg-[#0B0C1E]/80 backdrop-blur-sm border border-[#2C315E] text-xs text-white/90 font-medium">
                    {pkg.duration_days} Days / {pkg.duration_days - 1} Nights
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3">{pkg.title}</h3>

                    <div className="bg-[#1B1E3D]/70 p-3.5 rounded-[2px] space-y-2 mb-4 text-xs border border-[#2C315E]/40">
                      <div className="flex items-center gap-2 text-white/80">
                        <Building2 className="w-4 h-4 text-[#DFB76C] flex-shrink-0" />{' '}
                        <span><strong>Hotel:</strong> {pkg.hotel_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/80">
                        <Plane className="w-4 h-4 text-[#DFB76C] flex-shrink-0" />{' '}
                        <span><strong>Flight:</strong> Roundtrip via {pkg.flight_airline}</span>
                      </div>
                      {pkg.car_model && (
                        <div className="flex items-center gap-2 text-white/80">
                          <Car className="w-4 h-4 text-emerald-400 flex-shrink-0" />{' '}
                          <span><strong>Fleet:</strong> {pkg.car_model} included</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1.5 mb-4">
                      {pkg.inclusions?.map((inc, i) => (
                        <div key={i} className="text-xs text-white/70 flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />{' '}
                          <span>{inc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#2C315E] gap-3">
                    <div>
                      <div className="text-xs text-white/50 line-through">
                        Standard: {formatPrice(pkg.original_total)}
                      </div>
                      <div className="text-2xl font-extrabold text-emerald-400 tracking-tight">
                        {formatPrice(pkg.package_price)}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleAddToCart({
                          product_type: 'PACKAGE',
                          title: pkg.title,
                          subtitle: `${pkg.duration_days} Days Bundle • ${pkg.hotel_name} + ${pkg.flight_airline}`,
                          dates: '2026-12-05 to 2026-12-10',
                          quantity: 1,
                          unit_price: pkg.package_price,
                          details: pkg,
                        })
                      }
                      className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-[#DFB76C] hover:bg-[#F2D59B] text-[#0B0C1E] font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px] transition shadow-md shadow-[#DFB76C]/20 whitespace-nowrap"
                    >
                      <Luggage className="w-4 h-4 flex-shrink-0" /> Book Package
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 6: DISRUPTION SENTINEL --- */}
      {activeTab === 'disruptions' && (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-[2px] text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Disruption Sentinel & Auto-Rebooking</h2>
                <p className="text-xs text-white/70">
                  Simulate unforeseen airline delays, cancellations, or severe weather conditions to test automated cross-supplier trip rescheduling and guest credit protection.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                  Simulate Incident Type
                </label>
                <GooeyMenu
                  className="w-full"
                  style={{ width: '100%' }}
                  surfaceClassName="bg-[#13152C]"
                  options={[
                    'Flight Delay (+85 Minutes Arrival)',
                    'Flight Cancelled by Carrier',
                    'Severe Weather Warning (Airport Ground Stop)',
                  ]}
                  value={
                    disruptionType === 'FLIGHT_DELAY'
                      ? 'Flight Delay (+85 Minutes Arrival)'
                      : disruptionType === 'FLIGHT_CANCELLED'
                      ? 'Flight Cancelled by Carrier'
                      : 'Severe Weather Warning (Airport Ground Stop)'
                  }
                  onSelect={(opt) => {
                    const map = {
                      'Flight Delay (+85 Minutes Arrival)': 'FLIGHT_DELAY',
                      'Flight Cancelled by Carrier': 'FLIGHT_CANCELLED',
                      'Severe Weather Warning (Airport Ground Stop)': 'WEATHER_ALERT',
                    };
                    setDisruptionType(map[opt] ?? 'FLIGHT_DELAY');
                  }}
                  triggerClassName="h-[42px] w-full rounded-[2px] bg-[#1B1E3D] px-4 border border-[#2C315E] hover:border-[#DFB76C]/60 transition-colors flex items-center justify-between"
                  trigger={
                    <div className="flex h-full w-full items-center justify-between text-left">
                      <span className="text-sm font-medium text-white truncate">
                        {disruptionType === 'FLIGHT_DELAY'
                          ? 'Flight Delay (+85 Minutes Arrival)'
                          : disruptionType === 'FLIGHT_CANCELLED'
                          ? 'Flight Cancelled by Carrier'
                          : 'Severe Weather Warning (Airport Ground Stop)'}
                      </span>
                      <ChevronDown size={14} className="text-[#DFB76C]/70 shrink-0 ml-2" />
                    </div>
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                  Target Master PNR Reference
                </label>
                <input
                  type="text"
                  readOnly
                  value={checkoutSuccess?.master_booking_reference || 'PNR-202611-SAMPLE'}
                  className="w-full px-4 py-2.5 bg-[#1B1E3D]/70 border border-[#E5DDCF] rounded-[2px] text-white/80 font-mono text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleSimulateDisruption}
              disabled={disruptionLoading}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-[2px] shadow-lg shadow-amber-600/20 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${disruptionLoading ? 'animate-spin' : ''}`} />
              {disruptionLoading ? 'Processing Multi-Supplier Rebooking...' : 'Simulate & Auto-Resolve Disruption'}
            </button>
          </div>

          {/* Disruption Resolution Display */}
          {disruptionResult && (
            <div className="bg-[#13152C] border border-emerald-500/30 rounded-[4px] p-6 space-y-4 animate-fade-in shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-[#2C315E]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-white text-base">Disruption Resolved Proactively</span>
                </div>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 font-mono text-xs rounded-[2px]">
                  Case ID: {disruptionResult.disruption_case_id}
                </span>
              </div>

              <div className="p-4 bg-[#13152C] rounded-[2px] space-y-2 border border-[#E5DDCF]/50">
                <div className="text-xs text-white/70">Resolution Plan:</div>
                <div className="text-sm font-semibold text-emerald-300">{disruptionResult.rebooked_alternative}</div>
                <div className="text-xs text-white/80 pt-1">{disruptionResult.traveler_notification}</div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <ShieldCheck className="w-4 h-4 text-[#DFB76C]" />
                  <span>Resort Front Desk, Airport Transfer & Airline Notified</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-white/70">Guest Protection Credit</span>
                  <div className="text-lg font-bold text-emerald-400">+₹{disruptionResult.compensation_credit.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- UNIFIED CART DRAWER --- */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-[#0B0C1E]/80 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="w-full max-w-lg bg-[#1B1E3D] h-full border-l border-[#2C315E]/15 shadow-2xl flex flex-col justify-between">
            {/* Header */}
            <div className="p-5 border-b border-[#2C315E] pb-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Luggage className="w-5 h-5 text-[#DFB76C]" />
                <h2 className="font-bold text-lg text-white">Trip Itinerary Cart</h2>
                <span className="px-2 py-0.5 bg-[#DFB76C]/20 text-[#DFB76C] rounded text-xs font-semibold">
                  {cart?.items?.length || 0} Items
                </span>
              </div>
              <button
                onClick={() => setCartDrawerOpen(false)}
                className="p-1.5 rounded-[2px] bg-[#13152C] text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Line Items List */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {cart?.items?.length === 0 ? (
                <div className="text-center py-16 text-white/70">
                  <Luggage className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#DFB76C]" />
                  <p className="text-sm">Your trip itinerary is empty.</p>
                  <p className="text-xs text-white/50 mt-1">Add flights, hotels, chauffeur fleets, or tours above!</p>
                </div>
              ) : (
                cart?.items?.map((item) => (
                  <div key={item.item_id} className="bg-[#13152C] p-4 rounded-[2px] border border-[#E5DDCF] relative group">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/30">
                          {item.product_type}
                        </span>
                        <h4 className="font-semibold text-white text-sm mt-1">{item.title}</h4>
                        <p className="text-xs text-white/70">{item.subtitle}</p>
                        <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#DFB76C]" /> {item.dates}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white text-base">₹{item.total_price.toLocaleString('en-IN')}</div>
                        <button
                          onClick={() => handleRemoveFromCart(item.item_id)}
                          className="text-red-400 hover:text-red-300 text-xs mt-2 flex items-center gap-1 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Summary & Checkout Footer */}
            {cart?.items?.length > 0 && (
              <div className="p-5 bg-[#13152C]/50 border-t border-[#2C315E]/15 space-y-4">
                {/* Price Freeze Alert */}
                {cart?.status === 'HELD' ? (
                  <div className="p-3 bg-[#DFB76C]/10 border border-[#DFB76C]/30 rounded-[2px] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[#DFB76C]">
                      <Lock className="w-4 h-4" /> <span>Rates Frozen for 48 Hours</span>
                    </div>
                    <span className="text-white/70 font-mono">Protected</span>
                  </div>
                ) : (
                  <button
                    onClick={handleHoldPrice}
                    className="w-full py-2 bg-[#13152C] hover:bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/30 rounded-[2px] text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Lock className="w-3.5 h-3.5" /> Freeze Prices (48-Hour Guarantee)
                  </button>
                )}

                {/* Promo Code Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    placeholder="Coupon (e.g. TRAVAI20)"
                    className="flex-1 px-3 py-1.5 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-xs text-white uppercase font-mono"
                  />
                  <button
                    onClick={handleApplyPromo}
                    className="px-3 py-1.5 bg-[#13152C] hover:bg-[#1B1E3D] text-xs text-white rounded-[2px] font-medium"
                  >
                    Apply
                  </button>
                </div>
                {promoMessage && (
                  <p className={`text-xs ${promoMessage.valid ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {promoMessage.text}
                  </p>
                )}

                {/* Price Breakdown */}
                <div className="space-y-1.5 text-xs text-white/70 pt-2 border-t border-[#2C315E]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-white font-mono">{formatPrice(cart.subtotal)}</span>
                  </div>
                  {cart.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount ({cart.promo_code})</span>
                      <span className="font-mono">-{formatPrice(cart.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Supplier Taxes & Port Fees (12%)</span>
                    <span className="text-white font-mono">{formatPrice(cart.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-[#2C315E]">
                    <span>Total Amount</span>
                    <span className="text-[#DFB76C] font-mono text-base">{formatPrice(cart.total_amount)}</span>
                  </div>
                </div>

                {/* Checkout Trigger */}
                <button
                  onClick={() => {
                    setCartDrawerOpen(false);
                    setCheckoutModalOpen(true);
                  }}
                  className="w-full py-3 bg-[#DFB76C] hover:bg-[#F2D59B] text-[#0B0C1E] font-cinzel text-xs tracking-wider uppercase font-bold rounded-[2px] shadow-lg shadow-[#DFB76C]/20 transition flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" /> Proceed to One-Click Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- UNIFIED CHECKOUT MODAL --- */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setCheckoutModalOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-[#DFB76C]/10 rounded-[2px] text-[#DFB76C]">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">One-Click Unified Checkout</h3>
                <p className="text-xs text-white/70">Instant multi-supplier confirmation & digital vouchers</p>
              </div>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/80 uppercase mb-1">Lead Traveler Name</label>
                <input
                  type="text"
                  required
                  value={travelerName}
                  onChange={(e) => setTravelerName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 uppercase mb-1">Confirmation Email</label>
                <input
                  type="email"
                  required
                  value={travelerEmail}
                  onChange={(e) => setTravelerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 uppercase mb-2">Select Payment Gateway</label>
                <div className="grid grid-cols-1 gap-2.5">
                  {/* Razorpay */}
                  <div
                    onClick={() => setPaymentMethod('RAZORPAY')}
                    className={`flex cursor-pointer items-center justify-between rounded-[3px] border p-3 transition-all ${
                      paymentMethod === 'RAZORPAY'
                        ? 'border-[#DFB76C] bg-[#1B1E3D]'
                        : 'border-[#2C315E] bg-[#0E1022] hover:border-[#DFB76C]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-[#0C2340] border border-[#0C83FD]/40">
                        <RazorpayIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          Razorpay <span className="text-[9px] text-amber-400 font-mono">(Test)</span>
                        </p>
                        <p className="text-[10px] text-white/60 font-cinzel">UPI &bull; NetBanking &bull; Cards</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="multimodal_payment"
                      checked={paymentMethod === 'RAZORPAY'}
                      onChange={() => setPaymentMethod('RAZORPAY')}
                      className="accent-[#DFB76C]"
                    />
                  </div>

                  {/* PayPal */}
                  <div
                    onClick={() => setPaymentMethod('PAYPAL')}
                    className={`flex cursor-pointer items-center justify-between rounded-[3px] border p-3 transition-all ${
                      paymentMethod === 'PAYPAL'
                        ? 'border-[#DFB76C] bg-[#1B1E3D]'
                        : 'border-[#2C315E] bg-[#0E1022] hover:border-[#DFB76C]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-[#001c38] border border-[#0079C1]/40">
                        <PayPalIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                          PayPal <span className="text-[9px] text-amber-400 font-mono">(Sandbox)</span>
                        </p>
                        <p className="text-[10px] text-white/60 font-cinzel">PayPal Wallet &bull; Global Cards</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="multimodal_payment"
                      checked={paymentMethod === 'PAYPAL'}
                      onChange={() => setPaymentMethod('PAYPAL')}
                      className="accent-[#DFB76C]"
                    />
                  </div>

                  {/* Direct Simulation */}
                  <div
                    onClick={() => setPaymentMethod('DEMO_CARD')}
                    className={`flex cursor-pointer items-center justify-between rounded-[3px] border p-3 transition-all ${
                      paymentMethod === 'DEMO_CARD'
                        ? 'border-[#DFB76C] bg-[#1B1E3D]'
                        : 'border-[#2C315E] bg-[#0E1022] hover:border-[#DFB76C]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-[#0B0C1E] text-[#DFB76C] border border-[#2C315E]">
                        <CreditCard size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Direct Card Simulation</p>
                        <p className="text-[10px] text-white/60 font-cinzel">Instant 1-Click Sandbox</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="multimodal_payment"
                      checked={paymentMethod === 'DEMO_CARD'}
                      onChange={() => setPaymentMethod('DEMO_CARD')}
                      className="accent-[#DFB76C]"
                    />
                  </div>
                </div>
              </div>

              {checkoutError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-[2px]">
                  {checkoutError}
                </div>
              )}

              <div className="p-3.5 bg-[#1B1E3D] rounded-[2px] border border-[#2C315E] flex justify-between items-center text-sm">
                <span className="text-white/70">Amount Charged</span>
                <span className="font-bold text-lg text-emerald-400 font-mono">{formatPrice(cart?.total_amount || 0)}</span>
              </div>

              <button
                type="submit"
                disabled={checkoutLoading}
                className="w-full py-3 bg-[#DFB76C] hover:bg-[#F2D59B] text-[#0B0C1E] font-cinzel text-xs tracking-wider uppercase font-bold rounded-[2px] text-sm shadow-lg shadow-[#DFB76C]/20 transition cursor-pointer disabled:opacity-50"
              >
                {checkoutLoading
                  ? 'Securing Seats & Capturing Payment...'
                  : paymentMethod === 'RAZORPAY'
                  ? `PAY VIA RAZORPAY (${formatPrice(cart?.total_amount || 0)}) →`
                  : paymentMethod === 'PAYPAL'
                  ? `CONFIRM WITH PAYPAL (${formatPrice(cart?.total_amount || 0)}) →`
                  : `CONFIRM & ISSUE PASSES (${formatPrice(cart?.total_amount || 0)}) →`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- CONFIRMATION & DIGITAL VOUCHERS MODAL --- */}
      {checkoutSuccess && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#13152C] border border-emerald-500/40 rounded-[4px] max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setCheckoutSuccess(null)}
              className="absolute top-4 right-4 text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-6 border-b border-[#2C315E]">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-[2px] flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-white">Journey Confirmed!</h2>
              <p className="text-xs text-white/70 mt-1">{checkoutSuccess.confirmation_message}</p>
              <div className="mt-3 inline-block px-4 py-1 rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] text-white text-[#DFB76C] font-mono font-bold text-sm">
                Master PNR: {checkoutSuccess.master_booking_reference}
              </div>
            </div>

            {/* Issued Vouchers */}
            <div className="py-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/70">
                Issued Digital Vouchers ({checkoutSuccess.vouchers?.length})
              </h3>

              {checkoutSuccess.vouchers?.map((v) => (
                <div key={v.id} className="bg-[#13152C] border border-[#2C315E] p-4 rounded-[2px] flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#DFB76C]/20 text-[#DFB76C] border border-[#DFB76C]/30">
                      {v.product_type}
                    </span>
                    <h4 className="font-semibold text-white text-sm">{v.title}</h4>
                    <p className="text-xs text-white/70">Supplier: {v.supplier_name} • Ref: {v.supplier_confirmation_code}</p>
                    <p className="text-xs font-mono text-emerald-400">Voucher Code: {v.voucher_code}</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 bg-[#13152C] rounded-[2px]">
                    <QrCode className="w-12 h-12 text-black" />
                    <span className="text-[9px] text-white/60 font-mono mt-0.5">SCAN PASS</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2.5 mt-4">
              <Link
                to="/my-trips"
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#DFB76C] hover:bg-[#F2D59B] text-[#0B0C1E] font-cinzel text-xs tracking-wider uppercase font-bold rounded-[2px] transition shadow-md shadow-[#DFB76C]/20"
              >
                <Luggage className="w-4 h-4" /> View in My Trips & Digital Passes &rarr;
              </Link>
              <button
                onClick={() => setCheckoutSuccess(null)}
                className="w-full py-2.5 bg-[#1B1E3D] hover:bg-[#2C315E] text-white/80 rounded-[2px] text-xs font-cinzel font-semibold transition cursor-pointer"
              >
                Done & Return to Travel Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
