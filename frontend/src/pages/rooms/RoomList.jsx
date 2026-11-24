import React, { useState, useEffect } from 'react';
import { 
  BedDouble, 
  Plus, 
  Search, 
  Building2, 
  Filter, 
  Edit3, 
  Trash2, 
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  Sparkles
} from 'lucide-react';
import { propertyService } from '../../services/propertyService';
import { roomService } from '../../services/roomService';
import { roomTypeService } from '../../services/roomTypeService';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { Pagination } from '../../components/Pagination';
import { RoomModal } from './RoomModal';
import { RoomStatusModal } from './RoomStatusModal';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { useAuth } from '../../hooks/useAuth';
import { GooeyMenu } from '@/components/ui/gooey-menu';

export const RoomList = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [roomTypes, setRoomTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [statusModalRoom, setStatusModalRoom] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const data = await propertyService.getProperties({ limit: 100 });
        setProperties(data.items || []);
        if (data.items && data.items.length > 0) {
          setSelectedPropertyId(data.items[0].id || data.items[0]._id);
        }
      } catch (err) {
        console.error('Failed to load properties:', err);
      }
    };
    loadProperties();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await roomService.getRooms({
        property_id: selectedPropertyId || undefined,
        status: statusFilter || undefined,
        search: search.trim() || undefined,
        page,
        limit: 24,
      });
      setRooms(data.items || []);
      setTotalPages(data.total_pages || 1);
      setTotal(data.total || 0);

      if (selectedPropertyId) {
        const rTypes = await roomTypeService.getRoomTypesByProperty(selectedPropertyId);
        setRoomTypes(rTypes || []);
      }
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [selectedPropertyId, statusFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchRooms();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await roomService.deleteRoom(deleteId);
      setDeleteId(null);
      fetchRooms();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete room');
    } finally {
      setIsDeleting(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-8 md:p-10 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 font-cinzel text-[10px] font-bold uppercase tracking-[0.26em] text-[#DFB76C]">
              <Sparkles size={14} className="text-[#DFB76C]" /> OPERATIONS
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl text-white font-normal tracking-tight">
              Suites & Unit Inventory
            </h1>
            <p className="mt-2 font-sans text-xs sm:text-sm text-white/65 max-w-xl leading-relaxed">
              Track live occupancy, guest assignments, turn-down cleanliness, and room maintenance status in real time.
            </p>
          </div>

          {isAdmin && selectedPropertyId && (
            <button
              onClick={() => {
                setSelectedRoom(null);
                setIsRoomModalOpen(true);
              }}
              className="btn-luxury-primary text-xs self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Suite</span>
            </button>
          )}
        </div>
        <div className="mt-6 gold-hairline"></div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#13152C] border border-[#2C315E] p-4 rounded-[4px] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Property Selector */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#DFB76C] flex-shrink-0" />
            <select
              value={selectedPropertyId}
              onChange={(e) => {
                setSelectedPropertyId(e.target.value);
                setPage(1);
              }}
              className="luxury-input text-xs font-semibold bg-[#1B1E3D] cursor-pointer"
            >
              <option value="">All Managed Properties</option>
              {properties.map((p) => (
                <option key={p.id || p._id} value={p.id || p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 z-20">
            <Filter className="w-4 h-4 text-[#DFB76C] flex-shrink-0" />
            <GooeyMenu
              width={200}
              options={[
                'All Statuses',
                'Available',
                'Occupied',
                'Reserved',
                'Cleaning',
                'Maintenance',
                'Out of Order',
              ]}
              value={
                statusFilter === 'AVAILABLE'
                  ? 'Available'
                  : statusFilter === 'OCCUPIED'
                  ? 'Occupied'
                  : statusFilter === 'RESERVED'
                  ? 'Reserved'
                  : statusFilter === 'CLEANING'
                  ? 'Cleaning'
                  : statusFilter === 'MAINTENANCE'
                  ? 'Maintenance'
                  : statusFilter === 'OUT_OF_ORDER'
                  ? 'Out of Order'
                  : 'All Statuses'
              }
              triggerStyle={{ height: 38, paddingLeft: 12, paddingRight: 12, borderRadius: 2 }}
              surfaceClassName="bg-[#1B1E3D]"
              onSelect={(opt) => {
                const statusMap = {
                  'Available': 'AVAILABLE',
                  'Occupied': 'OCCUPIED',
                  'Reserved': 'RESERVED',
                  'Cleaning': 'CLEANING',
                  'Maintenance': 'MAINTENANCE',
                  'Out of Order': 'OUT_OF_ORDER',
                };
                setStatusFilter(statusMap[opt] || '');
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-60 group">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#DFB76C]/80 stroke-[2.2] group-focus-within:text-[#DFB76C] transition-colors pointer-events-none z-10" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search suite #..."
              className="w-full !pl-10 pr-3 py-1.5 luxury-input text-xs font-sans placeholder-white/40"
            />
          </form>

          {/* View toggle */}
          <div className="flex items-center rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-[2px] cursor-pointer transition-all ${viewMode === 'grid' ? 'bg-[#13152C] text-[#DFB76C]' : 'text-white/50 hover:text-white'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4 stroke-[1.5]" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-[2px] cursor-pointer transition-all ${viewMode === 'table' ? 'bg-[#13152C] text-[#DFB76C]' : 'text-white/50 hover:text-white'}`}
              title="Table View"
            >
              <ListIcon className="w-4 h-4 stroke-[1.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Retrieving unit register..." />
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={BedDouble}
          title="No suites found in inventory"
          description="There are no rooms matching the selected estate and status filters."
          action={
            isAdmin && selectedPropertyId && (
              <button
                onClick={() => {
                  setSelectedRoom(null);
                  setIsRoomModalOpen(true);
                }}
                className="btn-luxury-primary text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Suite</span>
              </button>
            )
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rooms.map((room) => (
            <div
              key={room.id || room._id}
              className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-5 shadow-sm hover:border-[#DFB76C] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-cinzel text-[8.5px] text-white/50 uppercase tracking-widest font-semibold block">
                      Floor {room.floor} • {room.property_name || 'Estate'}
                    </span>
                    <h3 className="font-editorial text-2xl font-normal text-white tracking-tight">Suite #{room.room_number}</h3>
                    <p className="font-sans text-xs text-white/70 mt-0.5">{room.room_type_name || 'Category'}</p>
                  </div>

                  <button
                    onClick={() => setStatusModalRoom(room)}
                    title="Change Status"
                    className="cursor-pointer hover:opacity-85 transition-opacity"
                  >
                    <StatusBadge status={room.status} size="sm" />
                  </button>
                </div>

                {room.current_guest_name ? (
                  <div className="p-2.5 rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] mb-3 text-xs font-sans">
                    <span className="font-cinzel text-[8px] text-[#DFB76C] uppercase tracking-wider block font-bold">Occupied By</span>
                    <span className="font-semibold text-white truncate block">{room.current_guest_name}</span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-[2px] bg-[#1B1E3D]/50 border border-[#2C315E] mb-3 text-[11px] font-sans text-white/40 italic">
                    Ready for assignment
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#2C315E] text-xs">
                <button
                  onClick={() => setStatusModalRoom(room)}
                  className="inline-flex items-center gap-1.5 font-cinzel text-[9.5px] uppercase tracking-wider text-[#DFB76C] hover:text-white font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Update Status</span>
                </button>

                {isAdmin && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedRoom(room);
                        setIsRoomModalOpen(true);
                      }}
                      className="p-1 rounded-[2px] text-white/60 hover:text-white hover:bg-[#1B1E3D] transition-colors cursor-pointer"
                      title="Edit Room"
                    >
                      <Edit3 className="w-3.5 h-3.5 stroke-[1.5]" />
                    </button>
                    <button
                      onClick={() => setDeleteId(room.id || room._id)}
                      className="p-1 rounded-[2px] text-white/60 hover:text-rose-400 hover:bg-[#1B1E3D] transition-colors cursor-pointer"
                      title="Delete Room"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#1B1E3D] font-cinzel text-[9px] uppercase font-bold text-white/70 border-b border-[#2C315E] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Suite #</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Floor</th>
                <th className="py-3.5 px-4">Estate Property</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Occupant</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFB76C]/15 font-sans">
              {rooms.map((room) => (
                <tr key={room.id || room._id} className="hover:bg-[#1B1E3D]/60">
                  <td className="py-3.5 px-4 font-editorial text-base font-normal text-white">Suite #{room.room_number}</td>
                  <td className="py-3.5 px-4 text-white/80 font-medium">{room.room_type_name}</td>
                  <td className="py-3.5 px-4 text-white/60">Floor {room.floor}</td>
                  <td className="py-3.5 px-4 text-white">{room.property_name}</td>
                  <td className="py-3.5 px-4">
                    <button onClick={() => setStatusModalRoom(room)} className="cursor-pointer">
                      <StatusBadge status={room.status} size="sm" />
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-white/70">{room.current_guest_name || '—'}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setStatusModalRoom(room)}
                      className="btn-luxury-secondary text-[10px] py-1 px-2.5"
                    >
                      Status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={24}
        onPageChange={(p) => setPage(p)}
      />

      {/* Room Form Modal */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        propertyId={selectedPropertyId}
        roomTypes={roomTypes}
        room={selectedRoom}
        onSuccess={fetchRooms}
      />

      {/* Status Transition Modal */}
      <RoomStatusModal
        isOpen={!!statusModalRoom}
        onClose={() => setStatusModalRoom(null)}
        room={statusModalRoom}
        onSuccess={fetchRooms}
      />

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Suite"
        message="Are you sure you wish to delete this suite? It must not have active or upcoming reservations."
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default RoomList;
