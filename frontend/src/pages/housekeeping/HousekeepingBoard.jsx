import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BedDouble,
  Building2,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Check,
  Wrench,
  Ban,
  Layers,
  ArrowRight,
  Sparkle
} from 'lucide-react';
import { propertyService } from '../../services/propertyService';
import { roomService } from '../../services/roomService';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';

export const HousekeepingBoard = () => {
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'CLEANING' | 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [notification, setNotification] = useState(null);

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
      console.error('Failed to load properties:', err);
    }
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await roomService.getRooms({
        property_id: selectedPropertyId || undefined,
        limit: 100,
      });
      setRooms(data.items || []);
    } catch (err) {
      console.error('Failed to load rooms for housekeeping:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchRooms();
    }
  }, [selectedPropertyId]);

  const handleQuickStatusChange = async (room, newStatus, reason) => {
    try {
      setUpdatingId(room.id || room._id);
      await roomService.updateRoomStatus(room.id || room._id, {
        status: newStatus,
        reason: reason || 'Updated via Housekeeping Board',
      });
      
      setNotification(`Room #${room.room_number} status updated to ${newStatus}!`);
      setTimeout(() => setNotification(null), 4000);
      
      // Refresh rooms list
      await fetchRooms();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update room status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Compute metrics
  const totalRooms = rooms.length;
  const cleanRooms = rooms.filter((r) => r.status === 'AVAILABLE').length;
  const dirtyRooms = rooms.filter((r) => r.status === 'CLEANING').length;
  const occupiedRooms = rooms.filter((r) => r.status === 'OCCUPIED' || r.status === 'RESERVED').length;
  const maintenanceRooms = rooms.filter((r) => r.status === 'MAINTENANCE' || r.status === 'OUT_OF_ORDER').length;
  const cleanRate = totalRooms > 0 ? Math.round((cleanRooms / totalRooms) * 100) : 100;

  // Filter rooms by search, floor, and status
  const filteredRooms = rooms.filter((room) => {
    if (search && !room.room_number?.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedFloor !== 'ALL' && String(room.floor) !== String(selectedFloor)) return false;
    if (statusFilter === 'CLEANING' && room.status !== 'CLEANING') return false;
    if (statusFilter === 'AVAILABLE' && room.status !== 'AVAILABLE') return false;
    if (statusFilter === 'OCCUPIED' && (room.status !== 'OCCUPIED' && room.status !== 'RESERVED')) return false;
    if (statusFilter === 'MAINTENANCE' && (room.status !== 'MAINTENANCE' && room.status !== 'OUT_OF_ORDER')) return false;
    return true;
  });

  const availableFloors = Array.from(new Set(rooms.map((r) => r.floor).filter(Boolean))).sort((a, b) => a - b);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#DFB76C]/30">
        <div>
          <span className="eyebrow-label text-[#B88E43]">01 / OPERATIONS &middot; HOUSEKEEPING & LOGISTICS</span>
          <h1 className="text-3xl font-editorial font-bold text-[#13152C] tracking-tight mt-1">
            Housekeeping &amp; Suite Turnaround
          </h1>
          <p className="text-xs text-[#13152C]/70 mt-1">
            Real-time suite readiness, turnarounds, inspection controls, and maintenance reporting.
          </p>
        </div>

        <button
          onClick={fetchRooms}
          className="btn-luxury-secondary text-xs inline-flex items-center gap-2 self-start cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#B88E43]" />
          <span>Refresh Operations</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-5 shadow-sm">
          <span className="eyebrow-label text-[#13152C]/70">Total Inventory</span>
          <p className="text-3xl font-editorial font-bold text-[#13152C] mt-1">{totalRooms}</p>
          <span className="text-[11px] text-[#13152C]/60">Physical units</span>
        </div>

        <div className="bg-[#FFFFFF] border border-amber-300 rounded-[4px] p-5 shadow-sm">
          <span className="eyebrow-label text-amber-800 flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-amber-600" /> Turnaround
          </span>
          <p className="text-3xl font-editorial font-bold text-amber-900 mt-1">{dirtyRooms}</p>
          <span className="text-[11px] text-amber-800/80">Pending sanitization</span>
        </div>

        <div className="bg-[#FFFFFF] border border-emerald-300 rounded-[4px] p-5 shadow-sm">
          <span className="eyebrow-label text-emerald-800 flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3 text-emerald-600" /> Ready Suites
          </span>
          <p className="text-3xl font-editorial font-bold text-emerald-900 mt-1">{cleanRooms}</p>
          <span className="text-[11px] text-emerald-800/80">{cleanRate}% floor readiness</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#2C315E]/40 rounded-[4px] p-5 shadow-sm">
          <span className="eyebrow-label text-[#13152C]/80">Occupied Stays</span>
          <p className="text-3xl font-editorial font-bold text-[#13152C] mt-1">{occupiedRooms}</p>
          <span className="text-[11px] text-[#13152C]/60">Stayover servicing</span>
        </div>

        <div className="bg-[#FFFFFF] border border-rose-300 rounded-[4px] p-5 shadow-sm">
          <span className="eyebrow-label text-rose-800 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-rose-600" /> Maintenance
          </span>
          <p className="text-3xl font-editorial font-bold text-rose-900 mt-1">{maintenanceRooms}</p>
          <span className="text-[11px] text-rose-800/80">Engineering works</span>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="p-4 rounded-[4px] bg-[#FAF6F0] border border-[#DFB76C]/60 flex items-center gap-2 text-xs font-cinzel text-[#13152C] shadow-sm">
          <CheckCircle className="w-4 h-4 text-[#B88E43] shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter & Property Bar */}
      <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 p-5 rounded-[4px] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Property Selector */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#B88E43]" />
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="px-3.5 py-2 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-xs font-semibold text-[#13152C] focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF]"
            >
              {properties.map((p) => (
                <option key={p.id || p._id} value={p.id || p._id}>
                  {p.name} ({p.city})
                </option>
              ))}
            </select>
          </div>

          {/* Floor Selector */}
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#B88E43]" />
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="px-3.5 py-2 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-xs font-semibold text-[#13152C] focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF]"
            >
              <option value="ALL">All Levels</option>
              {availableFloors.map((fl) => (
                <option key={fl} value={fl}>
                  Level {fl}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All Units', count: totalRooms },
            { id: 'CLEANING', label: 'Turnaround', count: dirtyRooms },
            { id: 'AVAILABLE', label: 'Clean & Ready', count: cleanRooms },
            { id: 'OCCUPIED', label: 'In-House', count: occupiedRooms },
            { id: 'MAINTENANCE', label: 'Maintenance', count: maintenanceRooms },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-[3px] text-xs font-cinzel tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#13152C] text-[#FAF6F0] border border-[#DFB76C]'
                  : 'bg-[#FAF6F0] border border-[#DFB76C]/30 text-[#13152C]/70 hover:text-[#13152C]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === tab.id ? 'bg-[#DFB76C] text-[#13152C]' : 'bg-[#ECE5DA] text-[#13152C]'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Room Grid */}
      {loading ? (
        <LoadingSpinner message="Consulting suite inspection log..." />
      ) : filteredRooms.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="No suites located"
          description="There are no suites matching the selected operational filter criteria."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredRooms.map((room) => {
            const isUpdating = updatingId === (room.id || room._id);
            const isDirty = room.status === 'CLEANING';
            const isClean = room.status === 'AVAILABLE';
            const isOccupied = room.status === 'OCCUPIED';
            const isMaintenance = room.status === 'MAINTENANCE' || room.status === 'OUT_OF_ORDER';

            return (
              <div
                key={room.id || room._id}
                className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="eyebrow-label text-[#B88E43]">
                        Level {room.floor || 1} &bull; {room.room_type_name || 'Standard'}
                      </span>
                      <h3 className="text-3xl font-editorial font-bold text-[#13152C] tracking-tight">
                        #{room.room_number}
                      </h3>
                    </div>

                    <StatusBadge status={room.status} size="sm" />
                  </div>

                  {/* Occupant / Turnaround status */}
                  {room.current_guest_name ? (
                    <div className="p-3 rounded-[3px] bg-[#FAF6F0] border border-[#DFB76C]/30 mb-5 text-xs">
                      <span className="eyebrow-label text-[#B88E43] block">Resident In-House</span>
                      <span className="font-editorial text-base font-bold text-[#13152C] truncate block">{room.current_guest_name}</span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-[3px] bg-[#FAF6F0]/50 border border-[#ECE5DA] mb-5 text-xs text-[#13152C]/60 italic font-editorial">
                      Vacant &bull; Ready for turnaround
                    </div>
                  )}
                </div>

                {/* 1-Click Fast Housekeeping Actions */}
                <div className="space-y-2 pt-4 border-t border-[#DFB76C]/20">
                  {isDirty && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleQuickStatusChange(room, 'AVAILABLE', 'Cleaned and sanitized by housekeeping')}
                      className="btn-luxury-gold w-full text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#13152C]" />
                      <span>{isUpdating ? 'Updating...' : 'Mark Clean & Ready'}</span>
                    </button>
                  )}

                  {isClean && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleQuickStatusChange(room, 'CLEANING', 'Housekeeping turnaround initiated')}
                      className="btn-luxury-secondary w-full text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Clock className="w-3.5 h-3.5 text-[#B88E43]" />
                      <span>{isUpdating ? 'Updating...' : 'Initiate Turnaround'}</span>
                    </button>
                  )}

                  {isMaintenance && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleQuickStatusChange(room, 'CLEANING', 'Maintenance cleared; cleaning needed')}
                      className="btn-luxury-secondary w-full text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5 text-[#B88E43]" />
                      <span>{isUpdating ? 'Updating...' : 'Repairs Cleared &rarr; Turnaround'}</span>
                    </button>
                  )}

                  {/* Secondary Report Action */}
                  {!isMaintenance && (
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleQuickStatusChange(room, 'MAINTENANCE', 'Issue reported by housekeeping staff')}
                      className="w-full py-1.5 text-center text-xs text-rose-700 hover:text-rose-900 transition-colors cursor-pointer"
                    >
                      Report Maintenance Issue
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HousekeepingBoard;
