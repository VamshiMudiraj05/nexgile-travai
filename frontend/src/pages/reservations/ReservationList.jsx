import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CalendarCheck, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  List as ListIcon,
  CalendarDays,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { reservationService } from '../../services/reservationService';
import { propertyService } from '../../services/propertyService';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { Pagination } from '../../components/Pagination';
import { ReservationCalendar } from './ReservationCalendar';

export const ReservationList = () => {
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const data = await propertyService.getProperties({ limit: 100 });
        setProperties(data.items || []);
      } catch (err) {
        console.error('Failed to load properties:', err);
      }
    };
    loadProperties();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const data = await reservationService.getReservations({
        property_id: selectedPropertyId || undefined,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        page,
        limit: 15,
      });
      setReservations(data.items || []);
      setTotalPages(data.total_pages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'list') {
      fetchReservations();
    }
  }, [selectedPropertyId, statusFilter, page, viewMode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReservations();
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="rounded-[4px] border border-[#DFB76C]/35 bg-[#FFFFFF] p-8 md:p-10 shadow-[0_4px_24px_rgba(19,21,44,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 font-cinzel text-[10px] font-bold uppercase tracking-[0.26em] text-[#B88E43]">
              <Sparkles size={14} className="text-[#DFB76C]" /> 01 / OPERATIONS
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl text-[#13152C] font-normal tracking-tight">
              Reservations & Folios
            </h1>
            <p className="mt-2 font-sans text-xs sm:text-sm text-[#13152C]/65 max-w-xl leading-relaxed">
              Oversee the complete booking lifecycle, VIP guest itineraries, deposit balances, and room arrivals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Toggle */}
            <div className="flex items-center rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/30 p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] font-cinzel text-[9.5px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#13152C] text-[#DFB76C] shadow-sm'
                    : 'text-[#13152C]/60 hover:text-[#13152C]'
                }`}
              >
                <ListIcon className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Register</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] font-cinzel text-[9.5px] uppercase font-bold tracking-wider transition-all cursor-pointer ${
                  viewMode === 'calendar'
                    ? 'bg-[#13152C] text-[#DFB76C] shadow-sm'
                    : 'text-[#13152C]/60 hover:text-[#13152C]'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Calendar</span>
              </button>
            </div>

            <Link
              to="/reservations/new"
              className="btn-luxury-primary text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Booking</span>
            </Link>
          </div>
        </div>
        <div className="mt-6 gold-hairline"></div>
      </div>

      {viewMode === 'calendar' ? (
        <ReservationCalendar />
      ) : (
        <>
          {/* Filters */}
          <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 p-4 rounded-[4px] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Property Selector */}
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#DFB76C]" />
                <select
                  value={selectedPropertyId}
                  onChange={(e) => {
                    setSelectedPropertyId(e.target.value);
                    setPage(1);
                  }}
                  className="luxury-input text-xs font-semibold bg-[#FAF6F0] cursor-pointer"
                >
                  <option value="">All Managed Estates</option>
                  {properties.map((p) => (
                    <option key={p.id || p._id} value={p.id || p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#DFB76C]" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="luxury-input text-xs font-semibold bg-[#FAF6F0] cursor-pointer"
                >
                  <option value="">All Reservation Statuses</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CHECKED_IN">Checked In</option>
                  <option value="CHECKED_OUT">Checked Out</option>
                  <option value="PENDING">Pending</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#DFB76C]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reference # or guest name..."
                className="w-full pl-9 pr-3 py-1.5 luxury-input text-xs font-sans placeholder-[#13152C]/40"
              />
            </form>
          </div>

          {/* Table / Register */}
          {loading ? (
            <LoadingSpinner text="Consulting reservation folios..." />
          ) : reservations.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No reservations found in register"
              description="Create a guest reservation or adjust filter criteria above."
              action={
                <Link
                  to="/reservations/new"
                  className="btn-luxury-primary text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Booking</span>
                </Link>
              }
            />
          ) : (
            <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF6F0] font-cinzel text-[9px] uppercase font-bold text-[#13152C]/70 border-b border-[#DFB76C]/25 tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Booking Ref</th>
                      <th className="py-3.5 px-4">Guest</th>
                      <th className="py-3.5 px-4">Estate Property</th>
                      <th className="py-3.5 px-4">Suite / Unit</th>
                      <th className="py-3.5 px-4">Itinerary</th>
                      <th className="py-3.5 px-4">Folio Total</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFB76C]/15 font-sans">
                    {reservations.map((res) => (
                      <tr key={res.id || res._id} className="hover:bg-[#FAF6F0]/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <Link
                            to={`/reservations/${res.id || res._id}`}
                            className="font-cinzel font-bold text-[#B88E43] hover:text-[#13152C] tracking-wide"
                          >
                            #{res.booking_reference}
                          </Link>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-[#13152C] block font-sans">{res.guest_name || 'Valued Guest'}</span>
                          <span className="text-[11px] text-[#13152C]/50">{res.guest_phone || res.guest_email}</span>
                        </td>

                        <td className="py-3.5 px-4 text-[#13152C]/80 font-medium">
                          {res.property_name || 'Estate'}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#13152C]">#{res.room_number || 'Auto-assign'}</span>
                          <span className="text-[11px] text-[#13152C]/60 block">{res.room_type_name || 'Standard'}</span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-[#13152C]/80">
                          <div>{res.check_in_date}</div>
                          <div className="text-[10px] text-[#13152C]/50">to {res.check_out_date}</div>
                        </td>

                        <td className="py-3.5 px-4 font-editorial text-sm font-semibold text-[#13152C]">
                          ₹{res.total_amount?.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3.5 px-4">
                          <StatusBadge status={res.status} size="sm" />
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            to={`/reservations/${res.id || res._id}`}
                            className="btn-luxury-secondary text-[10px] py-1 px-3"
                          >
                            Manage →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-4 bg-[#FAF6F0]">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  total={total}
                  limit={15}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReservationList;
