import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  LogOut as LogOutIcon,
  LogIn as LogInIcon,
  BedDouble,
  Users,
  Building2,
  CheckCircle2,
  Search,
  Plus,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { reservationService } from '../../services/reservationService';
import { roomService } from '../../services/roomService';
import { propertyService } from '../../services/propertyService';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const FrontDeskDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [search, setSearch] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const data = await propertyService.getProperties({ limit: 100 });
      const items = data.items || [];
      setProperties(items);
      if (items.length > 0) {
        setSelectedPropertyId(items[0].id || items[0]._id);
      }
    } catch (err) {
      console.error('Failed to load properties for front desk:', err);
    }
  };

  const loadDashboardData = async () => {
    if (!selectedPropertyId) return;
    try {
      setLoading(true);
      const [resData, roomData] = await Promise.all([
        reservationService.getReservations({ property_id: selectedPropertyId, limit: 100 }),
        roomService.getRooms({ property_id: selectedPropertyId, limit: 100 }),
      ]);
      setReservations(resData.items || []);
      setRooms(roomData.items || []);
    } catch (err) {
      console.error('Failed to load front desk data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedPropertyId]);

  const handleCheckIn = async (resId, guestName) => {
    try {
      setActionLoadingId(resId);
      await reservationService.checkIn(resId);
      setNotification(`Guest ${guestName} checked in successfully! Key card issued.`);
      setTimeout(() => setNotification(null), 3500);
      await loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to check in guest');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCheckOut = async (resId, guestName) => {
    try {
      setActionLoadingId(resId);
      await reservationService.checkOut(resId);
      setNotification(`Guest ${guestName} checked out successfully! Housekeeping notified.`);
      setTimeout(() => setNotification(null), 3500);
      await loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to check out guest');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Metrics
  const arrivalsToday = reservations.filter(
    (r) => r.check_in_date === todayStr && (r.status === 'CONFIRMED' || r.status === 'PENDING')
  );
  const departuresToday = reservations.filter(
    (r) => r.check_out_date === todayStr && r.status === 'CHECKED_IN'
  );
  const inHouseGuests = reservations.filter((r) => r.status === 'CHECKED_IN');
  const availableCleanRooms = rooms.filter((r) => r.status === 'AVAILABLE').length;
  const dirtyRooms = rooms.filter((r) => r.status === 'CLEANING').length;
  const totalRooms = rooms.length;

  // Search filtered reservations
  const filteredArrivals = arrivalsToday.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.guest_name || '').toLowerCase().includes(q) ||
      (r.booking_reference || '').toLowerCase().includes(q) ||
      (r.room_number || '').toLowerCase().includes(q)
    );
  });

  const filteredDepartures = departuresToday.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.guest_name || '').toLowerCase().includes(q) ||
      (r.booking_reference || '').toLowerCase().includes(q) ||
      (r.room_number || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Editorial Header Banner */}
      <div className="rounded-[4px] border border-[#DFB76C]/35 bg-[#FFFFFF] p-8 md:p-10 shadow-[0_4px_24px_rgba(19,21,44,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 font-cinzel text-[10px] font-bold uppercase tracking-[0.26em] text-[#B88E43]">
              <Building2 className="w-3.5 h-3.5 text-[#DFB76C]" /> 01 / OPERATIONS
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl text-[#13152C] font-normal tracking-tight">
              Front Desk Command
            </h1>
            <p className="mt-2 font-sans text-xs sm:text-sm text-[#13152C]/65 max-w-xl leading-relaxed">
              Real-time guest arrivals, concierge check-in verification, scheduled departures, and immediate key folios.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Property Selector */}
            <div className="relative">
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="luxury-input text-xs font-semibold pr-8 bg-[#FAF6F0] cursor-pointer"
              >
                {properties.map((p) => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <Link
              to="/reservations/new"
              className="btn-luxury-primary text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Walk-In Reservation</span>
            </Link>
          </div>
        </div>
        <div className="mt-6 gold-hairline"></div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-4 rounded-[3px] bg-[#F2F8F4] border border-[#2D5A40]/30 flex items-center gap-3 text-xs font-sans text-[#2D5A40] shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#2D5A40] shrink-0" />
          <span className="font-medium">{notification}</span>
        </div>
      )}

      {/* Fast Operational KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-5 shadow-sm">
          <span className="font-cinzel text-[9px] uppercase tracking-[0.2em] font-bold text-[#13152C]/60 flex items-center gap-1.5">
            <LogInIcon className="w-3 h-3 text-[#DFB76C]" /> Expected Arrivals
          </span>
          <p className="font-editorial text-3xl font-normal text-[#13152C] mt-2">{arrivalsToday.length}</p>
          <span className="font-sans text-[11px] text-[#13152C]/50 mt-1 block">Scheduled for today</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-5 shadow-sm">
          <span className="font-cinzel text-[9px] uppercase tracking-[0.2em] font-bold text-[#B88E43] flex items-center gap-1.5">
            <LogOutIcon className="w-3 h-3 text-[#B88E43]" /> Expected Departures
          </span>
          <p className="font-editorial text-3xl font-normal text-[#13152C] mt-2">{departuresToday.length}</p>
          <span className="font-sans text-[11px] text-[#13152C]/50 mt-1 block">Departures pending check-out</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-5 shadow-sm">
          <span className="font-cinzel text-[9px] uppercase tracking-[0.2em] font-bold text-[#13152C]/60 flex items-center gap-1.5">
            <Users className="w-3 h-3 text-[#DFB76C]" /> In-House Guests
          </span>
          <p className="font-editorial text-3xl font-normal text-[#13152C] mt-2">{inHouseGuests.length}</p>
          <span className="font-sans text-[11px] text-[#13152C]/50 mt-1 block">Currently occupied suites</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-5 shadow-sm">
          <span className="font-cinzel text-[9px] uppercase tracking-[0.2em] font-bold text-[#2D5A40] flex items-center gap-1.5">
            <BedDouble className="w-3 h-3 text-[#2D5A40]" /> Clean & Inspected
          </span>
          <p className="font-editorial text-3xl font-normal text-[#13152C] mt-2">
            {availableCleanRooms} <span className="font-sans text-xs text-[#13152C]/40 font-normal">/ {totalRooms}</span>
          </p>
          <span className="font-sans text-[11px] text-[#A0702A] mt-1 block">{dirtyRooms} suites in turnaround</span>
        </div>
      </div>

      {/* Luxury Search Bar */}
      <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 p-3.5 rounded-[4px] shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-[#DFB76C]" />
        <input
          type="text"
          placeholder="Search guest folio, reservation reference #, or suite number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-xs text-[#13152C] placeholder-[#13152C]/40 focus:outline-none w-full font-sans"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="font-cinzel text-[10px] text-[#13152C]/60 hover:text-[#13152C] uppercase tracking-wider cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Two Column Operational Queues */}
      {loading ? (
        <LoadingSpinner text="Retrieving property occupancy register..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Arrivals Queue */}
          <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DFB76C]/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/30 text-[#2D5A40] flex items-center justify-center font-bold">
                  <LogInIcon className="w-4 h-4 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="font-editorial text-lg text-[#13152C]">Arrivals Register</h3>
                  <p className="font-sans text-[11px] text-[#13152C]/50">Guests arriving today</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-[2px] bg-[#F2F8F4] text-[#2D5A40] text-[10px] font-cinzel font-bold border border-[#2D5A40]/25 uppercase tracking-wider">
                {filteredArrivals.length} Arrivals
              </span>
            </div>

            {filteredArrivals.length === 0 ? (
              <div className="text-center py-10 text-[#13152C]/40 text-xs font-sans">
                No pending arrivals matching criteria for today.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {filteredArrivals.map((res) => {
                  const isActionLoading = actionLoadingId === (res.id || res._id);
                  return (
                    <div
                      key={res.id || res._id}
                      className="p-3.5 rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/20 hover:border-[#DFB76C] transition-all flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-xs font-bold text-[#13152C] truncate">{res.guest_name || 'Valued Guest'}</span>
                          <span className="font-cinzel text-[9px] text-[#B88E43] bg-[#FFFFFF] px-1.5 py-0.5 rounded-[2px] border border-[#DFB76C]/30 tracking-wider">
                            #{res.booking_reference || (res.id || res._id).substring(0, 6)}
                          </span>
                        </div>
                        <div className="font-sans text-[11px] text-[#13152C]/60 mt-1 flex items-center gap-2 flex-wrap">
                          <span>Room #{res.room_number || 'Auto-assign'}</span>
                          <span>•</span>
                          <span>{res.room_type_name || 'Standard'}</span>
                          <span>•</span>
                          <span className="font-semibold text-[#13152C]">₹{res.total_amount?.toLocaleString() || 0}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCheckIn(res.id || res._id, res.guest_name)}
                        disabled={isActionLoading}
                        className="btn-luxury-primary text-[10px] py-1.5 px-3 flex-shrink-0"
                      >
                        <LogInIcon className="w-3 h-3" />
                        <span>{isActionLoading ? 'Processing...' : 'Check In'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Departures Queue */}
          <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DFB76C]/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/30 text-[#B88E43] flex items-center justify-center font-bold">
                  <LogOutIcon className="w-4 h-4 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="font-editorial text-lg text-[#13152C]">Departures Register</h3>
                  <p className="font-sans text-[11px] text-[#13152C]/50">Guests scheduled for check-out</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-[2px] bg-[#FBF6ED] text-[#A0702A] text-[10px] font-cinzel font-bold border border-[#DFB76C]/30 uppercase tracking-wider">
                {filteredDepartures.length} Departures
              </span>
            </div>

            {filteredDepartures.length === 0 ? (
              <div className="text-center py-10 text-[#13152C]/40 text-xs font-sans">
                No scheduled departures for today.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {filteredDepartures.map((res) => {
                  const isActionLoading = actionLoadingId === (res.id || res._id);
                  return (
                    <div
                      key={res.id || res._id}
                      className="p-3.5 rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/20 hover:border-[#DFB76C] transition-all flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-xs font-bold text-[#13152C] truncate">{res.guest_name || 'Valued Guest'}</span>
                          <span className="font-cinzel text-[9px] text-[#B88E43] bg-[#FFFFFF] px-1.5 py-0.5 rounded-[2px] border border-[#DFB76C]/30 tracking-wider">
                            #{res.booking_reference || (res.id || res._id).substring(0, 6)}
                          </span>
                        </div>
                        <div className="font-sans text-[11px] text-[#13152C]/60 mt-1 flex items-center gap-2 flex-wrap">
                          <span>Room #{res.room_number || 'N/A'}</span>
                          <span>•</span>
                          <span>{res.room_type_name || 'Standard'}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCheckOut(res.id || res._id, res.guest_name)}
                        disabled={isActionLoading}
                        className="btn-luxury-secondary text-[10px] py-1.5 px-3 flex-shrink-0"
                      >
                        <LogOutIcon className="w-3 h-3" />
                        <span>{isActionLoading ? 'Processing...' : 'Check Out'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FrontDeskDashboard;
