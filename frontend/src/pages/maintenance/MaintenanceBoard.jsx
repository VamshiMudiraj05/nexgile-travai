import React, { useState, useEffect } from 'react';
import {
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Building2,
  Layers,
  BedDouble,
  Sparkles,
  Search,
  Check,
  Ban,
  ShieldAlert,
  Flame,
  FileText
} from 'lucide-react';
import { propertyService } from '../../services/propertyService';
import { roomService } from '../../services/roomService';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';

export const MaintenanceBoard = () => {
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ACTIVE_ISSUES'); // 'ACTIVE_ISSUES' | 'MAINTENANCE' | 'OUT_OF_ORDER' | 'ALL' | 'RESOLVED'
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Issue reporting state
  const [issueNote, setIssueNote] = useState('');
  const [reportingRoomId, setReportingRoomId] = useState(null);

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
      console.error('Failed to load properties for maintenance:', err);
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
      console.error('Failed to load rooms for maintenance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchRooms();
    }
  }, [selectedPropertyId]);

  const handleStatusUpdate = async (room, newStatus, reason) => {
    try {
      setUpdatingId(room.id || room._id);
      await roomService.updateRoomStatus(room.id || room._id, {
        status: newStatus,
        reason: reason || 'Maintenance status updated',
      });
      
      setNotification(`Room #${room.room_number} status updated to ${newStatus}!`);
      setTimeout(() => setNotification(null), 4000);
      setReportingRoomId(null);
      setIssueNote('');

      await fetchRooms();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update maintenance status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Metrics
  const totalRooms = rooms.length;
  const maintenanceRooms = rooms.filter((r) => r.status === 'MAINTENANCE').length;
  const outOfOrderRooms = rooms.filter((r) => r.status === 'OUT_OF_ORDER').length;
  const totalIssues = maintenanceRooms + outOfOrderRooms;
  const operationalRooms = rooms.filter((r) => r.status === 'AVAILABLE' || r.status === 'OCCUPIED' || r.status === 'RESERVED').length;
  const healthRate = totalRooms > 0 ? Math.round((operationalRooms / totalRooms) * 100) : 100;

  // Filtered rooms
  const filteredRooms = rooms.filter((room) => {
    if (search && !room.room_number?.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedFloor !== 'ALL' && String(room.floor) !== String(selectedFloor)) return false;

    if (statusFilter === 'ACTIVE_ISSUES') {
      return room.status === 'MAINTENANCE' || room.status === 'OUT_OF_ORDER';
    }
    if (statusFilter === 'MAINTENANCE') return room.status === 'MAINTENANCE';
    if (statusFilter === 'OUT_OF_ORDER') return room.status === 'OUT_OF_ORDER';
    if (statusFilter === 'RESOLVED') return room.status === 'AVAILABLE' || room.status === 'CLEANING';
    return true;
  });

  const availableFloors = Array.from(new Set(rooms.map((r) => r.floor).filter(Boolean))).sort((a, b) => a - b);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#DFB76C]/30">
        <div>
          <span className="eyebrow-label text-[#B88E43]">01 / OPERATIONS &middot; ENGINEERING &amp; INTEGRITY</span>
          <h1 className="text-3xl font-editorial font-bold text-[#13152C] tracking-tight mt-1">
            Maintenance &amp; Engineering Work Orders
          </h1>
          <p className="text-xs text-[#13152C]/70 mt-1">
            Track repairs, equipment diagnostics, HVAC/plumbing work orders, and quarantine statuses.
          </p>
        </div>

        <button
          onClick={fetchRooms}
          className="btn-luxury-secondary text-xs inline-flex items-center gap-2 self-start cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#B88E43]" />
          <span>Refresh Orders</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#FFFFFF] border border-rose-300 rounded-[4px] p-5 shadow-sm">
          <span className="eyebrow-label text-rose-800 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Active Orders
          </span>
          <p className="text-3xl font-editorial font-bold text-rose-900 mt-1">{totalIssues}</p>
          <span className="text-[11px] text-rose-800/80">Require engineering resolution</span>
        </div>

        <div className="bg-[#FFFFFF] border border-amber-300 rounded-[4px] p-5 shadow-sm">
          <span className="eyebrow-label text-amber-800 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-amber-600" /> In Repair
          </span>
          <p className="text-3xl font-editorial font-bold text-amber-900 mt-1">{maintenanceRooms}</p>
          <span className="text-[11px] text-amber-800/80">Active maintenance</span>
        </div>

        <div className="bg-[#FFFFFF] border border-[#2C315E]/40 rounded-[4px] p-5 shadow-sm">
          <span className="eyebrow-label text-[#13152C]/80 flex items-center gap-1.5">
            <Ban className="w-3.5 h-3.5 text-[#B88E43]" /> Out of Order
          </span>
          <p className="text-3xl font-editorial font-bold text-[#13152C] mt-1">{outOfOrderRooms}</p>
          <span className="text-[11px] text-[#13152C]/60">Quarantine blocked</span>
        </div>

        <div className="bg-[#FFFFFF] border border-emerald-300 rounded-[4px] p-5 shadow-sm">
          <span className="eyebrow-label text-emerald-800 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Facility Health
          </span>
          <p className="text-3xl font-editorial font-bold text-emerald-900 mt-1">{healthRate}%</p>
          <span className="text-[11px] text-emerald-800/80">{operationalRooms} of {totalRooms} operational</span>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="p-4 rounded-[4px] bg-[#FAF6F0] border border-[#DFB76C]/60 flex items-center gap-2 text-xs font-cinzel text-[#13152C] shadow-sm">
          <CheckCircle className="w-4 h-4 text-[#B88E43] shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Filter Bar */}
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

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {[
            { id: 'ACTIVE_ISSUES', label: 'Active Orders', count: totalIssues },
            { id: 'MAINTENANCE', label: 'In Repair', count: maintenanceRooms },
            { id: 'OUT_OF_ORDER', label: 'Out of Order', count: outOfOrderRooms },
            { id: 'ALL', label: 'All Units', count: totalRooms },
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

      {/* Work Orders Grid */}
      {loading ? (
        <LoadingSpinner message="Scanning facility engineering diagnostics..." />
      ) : filteredRooms.length === 0 ? (
        <div className="rounded-[4px] border border-[#DFB76C]/30 bg-[#FFFFFF] p-12 text-center shadow-sm">
          <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
          <h3 className="font-editorial text-xl font-bold text-[#13152C] mt-3">All Facility Units Operational</h3>
          <p className="text-xs text-[#13152C]/70 mt-1">
            No active maintenance work orders or out-of-order quarantine rooms found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredRooms.map((room) => {
            const isUpdating = updatingId === (room.id || room._id);
            const isMaintenance = room.status === 'MAINTENANCE';
            const isOutOfOrder = room.status === 'OUT_OF_ORDER';
            const isIssue = isMaintenance || isOutOfOrder;

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

                  {/* Issue Log / Status Overview */}
                  {isOutOfOrder && (
                    <div className="p-3 rounded-[3px] bg-rose-50 border border-rose-200 mb-5 text-xs">
                      <span className="eyebrow-label text-rose-800 block flex items-center gap-1">
                        <Ban className="w-3 h-3" /> Critical Quarantine
                      </span>
                      <span className="text-rose-900 text-[11px] block mt-1">
                        Deep infrastructure repair. Suite is blocked from reservations.
                      </span>
                    </div>
                  )}

                  {isMaintenance && (
                    <div className="p-3 rounded-[3px] bg-amber-50 border border-amber-200 mb-5 text-xs">
                      <span className="eyebrow-label text-amber-800 block flex items-center gap-1">
                        <Wrench className="w-3 h-3" /> Repair In Progress
                      </span>
                      <span className="text-amber-900 text-[11px] block mt-1">
                        Technician dispatched. Fix in progress.
                      </span>
                    </div>
                  )}

                  {!isIssue && (
                    <div className="p-3 rounded-[3px] bg-[#FAF6F0] border border-[#ECE5DA] mb-5 text-xs text-[#13152C]/70 font-editorial">
                      Operational condition: Normal
                    </div>
                  )}
                </div>

                {/* Maintenance Actions */}
                <div className="space-y-2 pt-4 border-t border-[#DFB76C]/20">
                  {isIssue ? (
                    <>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusUpdate(room, 'CLEANING', 'Repairs completed by technician. Handover to housekeeping.')}
                        className="btn-luxury-gold w-full text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-[#13152C]" />
                        <span>{isUpdating ? 'Updating...' : 'Repairs Fixed &rarr; Clean'}</span>
                      </button>

                      {isMaintenance && (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleStatusUpdate(room, 'OUT_OF_ORDER', 'Escalated to Out of Order quarantine')}
                          className="w-full py-1.5 text-center text-xs text-rose-700 hover:text-rose-900 transition-colors cursor-pointer"
                        >
                          Escalate to Out of Order
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusUpdate(room, 'MAINTENANCE', 'Work order logged by engineering specialist')}
                        className="btn-luxury-secondary w-full text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Wrench className="w-3.5 h-3.5 text-[#B88E43]" />
                        <span>Open Work Order (Repair)</span>
                      </button>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusUpdate(room, 'OUT_OF_ORDER', 'Flagged Out of Order for major maintenance')}
                        className="w-full py-1.5 text-center text-xs text-rose-700 hover:text-rose-900 transition-colors cursor-pointer"
                      >
                        Flag Out of Order
                      </button>
                    </>
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

export default MaintenanceBoard;
