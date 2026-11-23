import React, { useState, useEffect } from 'react';
import {
  Plane,
  Building2,
  Car,
  Compass,
  Gift,
  AlertTriangle,
  ShoppingCart,
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
  X
} from 'lucide-react';
import { multimodalService } from '../../services/multimodalService';

export default function MultimodalMarketplace() {
  const [activeTab, setActiveTab] = useState('flights');

  // Inventory states
  const [flights, setFlights] = useState([]);
  const [cars, setCars] = useState([]);
  const [activities, setActivities] = useState([]);
  const [packages, setPackages] = useState([]);

  // Search parameters
  const [flightOrigin, setFlightOrigin] = useState('NYC');
  const [flightDest, setFlightDest] = useState('LON');
  const [flightCabin, setFlightCabin] = useState('ECONOMY');

  const [carLocation, setCarLocation] = useState('Miami');
  const [carCategory, setCarCategory] = useState('');

  const [actDestination, setActDestination] = useState('Paris');
  const [pkgDestination, setPkgDestination] = useState('Cancun');

  // Loading & cart states
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('TRAVAI20');
  const [promoMessage, setPromoMessage] = useState(null);

  // Checkout modal
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [travelerName, setTravelerName] = useState('Eleanor Vance');
  const [travelerEmail, setTravelerEmail] = useState('eleanor.vance@nexgile.com');
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);

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
    try {
      const res = await multimodalService.checkout({
        traveler_name: travelerName,
        traveler_email: travelerEmail,
        payment_method: paymentMethod,
      });
      setCheckoutSuccess(res);
      setCheckoutModalOpen(false);
      fetchCart();
    } catch (err) {
      alert('Checkout error: ' + (err.response?.data?.detail || err.message));
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
            <span className="px-3 py-0.5 rounded-[2px] text-xs font-semibold bg-blue-500/10 text-[#DFB76C] border border-blue-500/30">
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
            className="relative flex items-center gap-2.5 px-5 py-2.5 bg-[#DFB76C] hover:bg-[#F2D59B] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px] shadow-sm transition"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Unified Basket</span>
            {totalCartItems > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-[2px] bg-[#DFB76C] text-white text-xs font-bold animate-pulse">
                {totalCartItems}
              </span>
            )}
            {cart?.total_amount > 0 && (
              <span className="font-semibold text-blue-100 border-l border-blue-400/40 pl-2">
                ₹{cart.total_amount.toFixed(2)}
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
            activeTab === 'flights' ? 'bg-[#DFB76C] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px]' : 'bg-[#1B1E3D] text-white/70 hover:text-white font-cinzel text-xs tracking-wider uppercase rounded-[2px] border border-[#2C315E]'
          }`}
        >
          <Plane className="w-4 h-4" /> Flights & Airline Networks
        </button>

        <button
          onClick={() => handleTabChange('hotels')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'hotels' ? 'bg-[#DFB76C] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px]' : 'bg-[#1B1E3D] text-white/70 hover:text-white font-cinzel text-xs tracking-wider uppercase rounded-[2px] border border-[#2C315E]'
          }`}
        >
          <Building2 className="w-4 h-4" /> Estate Hotels & Suites
        </button>

        <button
          onClick={() => handleTabChange('cars')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'cars' ? 'bg-[#DFB76C] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px]' : 'bg-[#1B1E3D] text-white/70 hover:text-white font-cinzel text-xs tracking-wider uppercase rounded-[2px] border border-[#2C315E]'
          }`}
        >
          <Car className="w-4 h-4" /> Car Rentals & Chauffeur
        </button>

        <button
          onClick={() => handleTabChange('activities')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'activities' ? 'bg-[#DFB76C] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px]' : 'bg-[#1B1E3D] text-white/70 hover:text-white font-cinzel text-xs tracking-wider uppercase rounded-[2px] border border-[#2C315E]'
          }`}
        >
          <Compass className="w-4 h-4" /> Tours & VIP Experiences
        </button>

        <button
          onClick={() => handleTabChange('packages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'packages' ? 'bg-[#DFB76C] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px]' : 'bg-[#1B1E3D] text-white/70 hover:text-white font-cinzel text-xs tracking-wider uppercase rounded-[2px] border border-[#2C315E]'
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
                placeholder="NYC / JFK"
                className="w-full px-4 py-2.5 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                placeholder="LON / LHR"
                className="w-full px-4 py-2.5 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                Cabin Class
              </label>
              <select
                value={flightCabin}
                onChange={(e) => setFlightCabin(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ECONOMY">Economy</option>
                <option value="BUSINESS">Business Class</option>
                <option value="FIRST">First Class Suite</option>
              </select>
            </div>
            <div>
              <button
                onClick={fetchFlights}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-[2px] font-medium transition"
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
                className="bg-[#13152C] border border-[#2C315E] hover:border-blue-500/50 p-5 rounded-[4px] transition shadow-lg hover:shadow-blue-500/10 flex flex-col justify-between"
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

                  <div className="flex items-center justify-between my-4 px-3 py-2 bg-[#13152C] rounded-[2px]">
                    <div>
                      <div className="text-lg font-bold text-white">{fl.departure_time}</div>
                      <div className="text-xs text-white/70">{fl.origin}</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-white/50">{fl.duration}</span>
                      <div className="w-24 h-0.5 bg-[#1B1E3D] my-1 relative">
                        <div className="w-2 h-2 rounded-[2px] bg-blue-500 absolute -top-0.5 left-1/2 -translate-x-1/2" />
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
                    <span className="text-xs text-white/70">Total Per Traveler</span>
                    <div className="text-2xl font-bold text-white">₹{fl.price.toFixed(2)}</div>
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
                    className="flex items-center gap-2 px-4 py-2 bg-[#13152C] hover:bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/40 font-cinzel text-xs tracking-wider uppercase font-bold rounded-[2px] text-sm font-semibold transition shadow-md shadow-blue-600/30"
                  >
                    <ShoppingCart className="w-4 h-4" /> Add to Basket
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
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-[4px] flex items-center justify-between">
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
                name: 'The Grand Savoy Estate & Alpine Spa',
                location: 'Geneva, Switzerland',
                stars: 5.0,
                price: 480.0,
                image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
                amenities: ['Private Chalet Butler', 'Michelin Dining', 'Thermal Hydrotherapy'],
              },
              {
                id: 'HTL-002',
                name: 'Azure Palms Overwater Sanctuary',
                location: 'Bora Bora, French Polynesia',
                stars: 4.9,
                price: 720.0,
                image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
                amenities: ['Glass Lagoon Floor', 'Champagne Breakfast', 'Coral Reef Excursions'],
              },
              {
                id: 'HTL-003',
                name: 'Manhattan Skyline Penthouse Suites',
                location: 'New York City, USA',
                stars: 4.8,
                price: 540.0,
                image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
                amenities: ['Central Park Views', 'Rolls Royce House Car', 'Rooftop Lounge'],
              },
            ].map((htl) => (
              <div key={htl.id} className="bg-[#13152C] border border-[#2C315E] rounded-[4px] overflow-hidden flex flex-col justify-between">
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

                  <div className="flex items-center justify-between pt-4 border-t border-[#2C315E]">
                    <div>
                      <span className="text-xs text-white/70">Nightly Rate</span>
                      <div className="text-2xl font-bold text-white">₹{htl.price.toFixed(2)}</div>
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
                      className="px-4 py-2 bg-[#13152C] hover:bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/40 font-cinzel text-xs tracking-wider uppercase font-bold rounded-[2px] text-sm font-semibold transition"
                    >
                      Book Stay
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: CAR RENTALS --- */}
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
                placeholder="Miami / Los Angeles"
                className="w-full px-4 py-2.5 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                Category
              </label>
              <select
                value={carCategory}
                onChange={(e) => setCarCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">All Fleets</option>
                <option value="LUXURY">Luxury & Exotic</option>
                <option value="SUV">SUV & 4x4</option>
                <option value="ELECTRIC">Electric (EV)</option>
                <option value="SEDAN">Executive Sedan</option>
              </select>
            </div>
            <div>
              <button
                onClick={fetchCars}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#13152C] hover:bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/40 font-cinzel text-xs tracking-wider uppercase font-bold rounded-[2px] font-medium transition"
              >
                <Search className="w-4 h-4" />
                {loading ? 'Searching Fleet...' : 'Search Fleets'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cars.map((car) => (
              <div key={car.id} className="bg-[#13152C] border border-[#2C315E] rounded-[4px] overflow-hidden flex flex-col justify-between">
                <img src={car.image_url} alt={car.model} className="h-44 w-full object-cover" />
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                      <span className="font-semibold text-[#DFB76C]">{car.provider}</span>
                      <span className="px-2 py-0.5 rounded bg-[#1B1E3D] text-white/80 font-mono text-xs">{car.category}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{car.model}</h3>
                    <div className="flex items-center gap-4 text-xs text-white/80 mb-4">
                      <span>👤 {car.seats} Seats</span>
                      <span>⚙️ {car.transmission}</span>
                      <span>{car.unlimited_mileage ? '🛣️ Unlimited Miles' : 'Limited Miles'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#2C315E]">
                    <div>
                      <span className="text-xs text-white/70">Total ({car.pickup_location})</span>
                      <div className="text-2xl font-bold text-white">₹{car.total_price.toFixed(2)}</div>
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
                      className="px-4 py-2 bg-[#13152C] hover:bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/40 font-cinzel text-xs tracking-wider uppercase font-bold rounded-[2px] text-sm font-semibold transition"
                    >
                      Rent Vehicle
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 4: TOURS & EXPERIENCES --- */}
      {activeTab === 'activities' && (
        <div className="space-y-6">
          <div className="bg-[#13152C] p-5 rounded-[4px] border border-[#E5DDCF] flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-white/70 mb-1">
                Destination City
              </label>
              <input
                type="text"
                value={actDestination}
                onChange={(e) => setActDestination(e.target.value)}
                placeholder="Paris / Tokyo / Maui"
                className="w-full px-4 py-2.5 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={fetchActivities}
              disabled={loading}
              className="py-2.5 px-6 bg-[#13152C] hover:bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/40 font-cinzel text-xs tracking-wider uppercase font-bold rounded-[2px] font-medium transition flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Search Tours
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activities.map((act) => (
              <div key={act.id} className="bg-[#13152C] border border-[#2C315E] rounded-[4px] overflow-hidden flex flex-col justify-between">
                <img src={act.image_url} alt={act.title} className="h-44 w-full object-cover" />
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                      <span className="font-semibold text-emerald-400">{act.category}</span>
                      <span className="text-amber-400 font-bold">★ {act.rating} ({act.review_count})</span>
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">{act.title}</h3>
                    <p className="text-xs text-white/70 mb-3 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> {act.duration} • <MapPin className="w-3.5 h-3.5" /> {act.location}
                    </p>
                    <div className="space-y-1 mb-4">
                      {act.highlights?.map((h, i) => (
                        <div key={i} className="text-xs text-white/80 flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#2C315E]">
                    <div>
                      <span className="text-xs text-white/70">Price Per Guest</span>
                      <div className="text-2xl font-bold text-white">₹{act.price_per_person.toFixed(2)}</div>
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
                      className="px-4 py-2 bg-[#13152C] hover:bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/40 font-cinzel text-xs tracking-wider uppercase font-bold rounded-[2px] text-sm font-semibold transition"
                    >
                      Add Activity
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
            <span className="px-3 py-1 bg-[#DFB76C] text-white font-bold text-xs rounded-[2px] uppercase tracking-wider">
              20% Instant Savings
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.id} className="bg-[#13152C] border border-[#2C315E] rounded-[4px] overflow-hidden flex flex-col justify-between shadow-xl">
                <img src={pkg.image_url} alt={pkg.title} className="h-52 w-full object-cover" />
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-[2px] text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Save ₹{pkg.savings_amount.toFixed(0)} ({pkg.savings_pct}%)
                      </span>
                      <span className="text-xs text-white/70">{pkg.duration_days} Days / {pkg.duration_days - 1} Nights</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{pkg.title}</h3>

                    <div className="bg-[#1B1E3D]/70 p-3.5 rounded-[2px] space-y-2 mb-4 text-xs">
                      <div className="flex items-center gap-2 text-white/80">
                        <Building2 className="w-4 h-4 text-[#DFB76C]" /> <strong>Hotel:</strong> {pkg.hotel_name}
                      </div>
                      <div className="flex items-center gap-2 text-white/80">
                        <Plane className="w-4 h-4 text-[#DFB76C]" /> <strong>Flight:</strong> Roundtrip via {pkg.flight_airline}
                      </div>
                      {pkg.car_model && (
                        <div className="flex items-center gap-2 text-white/80">
                          <Car className="w-4 h-4 text-emerald-400" /> <strong>Fleet:</strong> {pkg.car_model} included
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 mb-4">
                      {pkg.inclusions?.map((inc, i) => (
                        <div key={i} className="text-xs text-white/70 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> {inc}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#2C315E]">
                    <div>
                      <div className="text-xs text-white/70 line-through">₹{pkg.original_total.toFixed(2)}</div>
                      <div className="text-3xl font-extrabold text-emerald-400">₹{pkg.package_price.toFixed(2)}</div>
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
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-[2px] text-sm transition shadow-lg shadow-emerald-600/30"
                    >
                      Book Complete Package
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
                <select
                  value={disruptionType}
                  onChange={(e) => setDisruptionType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="FLIGHT_DELAY">Flight Delay (+85 Minutes Arrival)</option>
                  <option value="FLIGHT_CANCELLED">Flight Cancelled by Carrier</option>
                  <option value="WEATHER_ALERT">Severe Weather Warning (Airport Ground Stop)</option>
                </select>
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
                <ShoppingCart className="w-5 h-5 text-[#DFB76C]" />
                <h2 className="font-bold text-lg text-white">Unified Travel Basket</h2>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs font-semibold">
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
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Your multimodal cart is empty.</p>
                  <p className="text-xs text-white/50 mt-1">Add flights, hotels, car rentals, or tours above!</p>
                </div>
              ) : (
                cart?.items?.map((item) => (
                  <div key={item.item_id} className="bg-[#13152C] p-4 rounded-[2px] border border-[#E5DDCF] relative group">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#1B1E3D] text-blue-300">
                          {item.product_type}
                        </span>
                        <h4 className="font-semibold text-white text-sm mt-1">{item.title}</h4>
                        <p className="text-xs text-white/70">{item.subtitle}</p>
                        <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {item.dates}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white text-base">₹{item.total_price.toFixed(2)}</div>
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
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-[2px] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-blue-300">
                      <Lock className="w-4 h-4" /> <span>Rates Frozen for 48 Hours</span>
                    </div>
                    <span className="text-white/70 font-mono">Protected</span>
                  </div>
                ) : (
                  <button
                    onClick={handleHoldPrice}
                    className="w-full py-2 bg-[#13152C] hover:bg-[#1B1E3D] text-blue-300 border border-blue-500/30 rounded-[2px] text-xs font-semibold flex items-center justify-center gap-1.5 transition"
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
                    <span className="text-white font-mono">₹{cart.subtotal.toFixed(2)}</span>
                  </div>
                  {cart.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Discount ({cart.promo_code})</span>
                      <span className="font-mono">-₹{cart.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Supplier Taxes & Port Fees (12%)</span>
                    <span className="text-white font-mono">${cart.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-[#2C315E]">
                    <span>Total Amount</span>
                    <span className="text-[#DFB76C] font-mono text-base">₹{cart.total_amount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Trigger */}
                <button
                  onClick={() => {
                    setCartDrawerOpen(false);
                    setCheckoutModalOpen(true);
                  }}
                  className="w-full py-3 bg-[#13152C] hover:bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/40 font-cinzel text-xs tracking-wider uppercase font-bold font-bold rounded-[2px] text-sm shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2"
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
              <div className="p-3 bg-blue-500/10 rounded-[2px] text-[#DFB76C]">
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
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 uppercase mb-1">Confirmation Email</label>
                <input
                  type="email"
                  required
                  value={travelerEmail}
                  onChange={(e) => setTravelerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/80 uppercase mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-sm text-white"
                >
                  <option value="CARD">Credit / Debit Card (Visa, MC, Amex)</option>
                  <option value="CORPORATE_ACCOUNT">Direct Corporate Master Account</option>
                  <option value="LOYALTY_POINTS">TravAI Loyalty Points + Cash</option>
                </select>
              </div>

              <div className="p-3.5 bg-[#1B1E3D] rounded-[2px] border border-[#2C315E] flex justify-between items-center text-sm">
                <span className="text-white/70">Amount Charged</span>
                <span className="font-bold text-lg text-emerald-400 font-mono">${cart?.total_amount.toFixed(2)}</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#13152C] hover:bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/40 font-cinzel text-xs tracking-wider uppercase font-bold font-bold rounded-[2px] text-sm shadow-lg shadow-blue-500/30 transition"
              >
                Confirm & Issue Multi-Supplier Vouchers
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
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300">
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

            <button
              onClick={() => setCheckoutSuccess(null)}
              className="w-full py-2.5 bg-[#1B1E3D] hover:bg-[#1B1E3D] text-white rounded-[2px] text-sm font-semibold transition"
            >
              Done & Return to Travel Hub
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
