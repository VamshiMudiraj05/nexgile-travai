import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Star, 
  Clock, 
  BedDouble, 
  Layers, 
  Plus, 
  Edit3, 
  ArrowLeft,
  CheckCircle2,
  CalendarCheck,
  Sparkles
} from 'lucide-react';
import { propertyService } from '../../services/propertyService';
import { roomTypeService } from '../../services/roomTypeService';
import { roomService } from '../../services/roomService';
import { reservationService } from '../../services/reservationService';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { RoomTypeModal } from '../room-types/RoomTypeModal';
import { RoomModal } from '../rooms/RoomModal';
import { RoomStatusModal } from '../rooms/RoomStatusModal';
import { useAuth } from '../../hooks/useAuth';

export const PropertyDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Modals
  const [isRoomTypeModalOpen, setIsRoomTypeModalOpen] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [statusModalRoom, setStatusModalRoom] = useState(null);

  const fetchPropertyData = async () => {
    try {
      setLoading(true);
      const propData = await propertyService.getPropertyById(id);
      setProperty(propData);

      const [rTypes, rList, resList] = await Promise.all([
        roomTypeService.getRoomTypesByProperty(id),
        roomService.getRoomsByProperty(id, { limit: 100 }),
        reservationService.getReservations({ property_id: id, limit: 10 }),
      ]);

      setRoomTypes(rTypes || []);
      setRooms(rList.items || []);
      setReservations(resList.items || []);
    } catch (err) {
      console.error('Failed to load property details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPropertyData();
  }, [id]);

  const isAdmin = user?.role === 'ADMIN';

  if (loading) return <LoadingSpinner message="Curating property dossier..." />;
  if (!property) return <EmptyState title="Estate not found in portfolio" />;

  const images = property.images && property.images.length > 0 ? property.images : [];
  const heroImage = images.length > 0 ? images[0].url : 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="space-y-8 pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/properties"
          className="inline-flex items-center gap-2 text-xs font-cinzel tracking-wider uppercase text-[#13152C]/60 hover:text-[#13152C] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Portfolio</span>
        </Link>

        {isAdmin && (
          <Link
            to={`/properties/${id}/edit`}
            className="btn-luxury-secondary text-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Property</span>
          </Link>
        )}
      </div>

      {/* Hero Header */}
      <div className="relative rounded-[4px] overflow-hidden border border-[#DFB76C]/35 bg-[#FFFFFF] shadow-sm">
        <div className="h-72 sm:h-96 w-full relative">
          <img src={heroImage} alt={property.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0E20] via-[#0D0E20]/50 to-transparent"></div>

          <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-white">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-cinzel text-[9px] text-[#DFB76C] bg-[#13152C]/80 px-2 py-0.5 rounded-[2px] border border-[#DFB76C]/40 tracking-widest uppercase">
                  {property.property_code}
                </span>
                <StatusBadge status={property.status} size="sm" />
                <span className="text-xs text-[#DFB76C] flex items-center gap-1 font-semibold font-sans">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {property.star_rating} Star {property.property_type}
                </span>
              </div>
              <h1 className="font-editorial text-3xl sm:text-5xl font-normal tracking-tight text-white">{property.name}</h1>
              <p className="text-xs text-[#FAF6F0]/80 flex items-center gap-1.5 mt-1.5 font-sans">
                <MapPin className="w-3.5 h-3.5 text-[#DFB76C]" />
                <span>{property.address}, {property.city}, {property.country}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-5 py-2.5 rounded-[2px] bg-[#13152C]/80 backdrop-blur-md border border-[#DFB76C]/30 text-center">
                <span className="font-editorial text-2xl font-normal text-white block">{property.total_rooms || 0}</span>
                <span className="font-cinzel text-[8.5px] text-[#DFB76C] uppercase tracking-widest font-semibold">Total Suites</span>
              </div>
              <div className="px-5 py-2.5 rounded-[2px] bg-[#13152C]/80 backdrop-blur-md border border-[#DFB76C]/30 text-center">
                <span className="font-editorial text-2xl font-normal text-[#DFB76C] block">{roomTypes.length}</span>
                <span className="font-cinzel text-[8.5px] text-[#DFB76C] uppercase tracking-widest font-semibold">Categories</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-t border-[#DFB76C]/25 bg-[#FAF6F0] flex items-center gap-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Building2 },
            { id: 'room-types', label: `Categories (${roomTypes.length})`, icon: Layers },
            { id: 'rooms', label: `Suites & Units (${rooms.length})`, icon: BedDouble },
            { id: 'reservations', label: `Reservations (${reservations.length})`, icon: CalendarCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 inline-flex items-center gap-2 font-cinzel text-[10.5px] font-bold uppercase tracking-[0.16em] border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'border-[#13152C] text-[#13152C]'
                    : 'border-transparent text-[#13152C]/50 hover:text-[#13152C]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-8 shadow-sm space-y-3">
              <span className="font-cinzel text-[9.5px] font-bold uppercase tracking-[0.24em] text-[#B88E43]">
                EDITORIAL STATEMENT
              </span>
              <h2 className="font-editorial text-2xl text-[#13152C] font-normal">About the Property</h2>
              <p className="font-sans text-xs sm:text-sm text-[#13152C]/75 leading-relaxed">
                {property.description || 'A distinguished sanctuary reflecting world-class European hospitality and refined comfort.'}
              </p>
            </div>

            <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-8 shadow-sm space-y-4">
              <span className="font-cinzel text-[9.5px] font-bold uppercase tracking-[0.24em] text-[#B88E43]">
                HOSPITALITY SERVICES
              </span>
              <h2 className="font-editorial text-2xl text-[#13152C] font-normal">Amenities & Concierge Offerings</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {property.amenities && property.amenities.length > 0 ? (
                  property.amenities.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/25 font-sans text-xs font-medium text-[#13152C]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2D5A40]" />
                      <span>{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#13152C]/50 col-span-3 font-sans">No amenities recorded for this property.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-6 shadow-sm space-y-4">
              <span className="font-cinzel text-[9px] font-bold uppercase tracking-[0.2em] text-[#B88E43]">
                SCHEDULE & POLICIES
              </span>
              <div className="space-y-3 font-sans text-xs">
                <div className="flex items-center justify-between py-2 border-b border-[#DFB76C]/20">
                  <span className="text-[#13152C]/60 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#B88E43]" />
                    Check-in Time
                  </span>
                  <span className="font-semibold text-[#13152C] font-cinzel">{property.check_in_time}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[#DFB76C]/20">
                  <span className="text-[#13152C]/60 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#B88E43]" />
                    Check-out Time
                  </span>
                  <span className="font-semibold text-[#13152C] font-cinzel">{property.check_out_time}</span>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-[#DFB76C]/20">
                  <span className="text-[#13152C]/60">Settlement Currency</span>
                  <span className="font-semibold text-[#13152C] font-cinzel">{property.currency}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <span className="text-[#13152C]/60">Operational Timezone</span>
                  <span className="font-semibold text-[#13152C]">{property.timezone}</span>
                </div>
              </div>
            </div>

            <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-6 shadow-sm space-y-4">
              <span className="font-cinzel text-[9px] font-bold uppercase tracking-[0.2em] text-[#B88E43]">
                CONCIERGE CONTACT
              </span>
              <div className="space-y-3 font-sans text-xs">
                {property.phone && (
                  <div className="flex items-center gap-2.5 text-[#13152C]">
                    <Phone className="w-3.5 h-3.5 text-[#B88E43]" />
                    <span>{property.phone}</span>
                  </div>
                )}
                {property.email && (
                  <div className="flex items-center gap-2.5 text-[#13152C]">
                    <Mail className="w-3.5 h-3.5 text-[#B88E43]" />
                    <span>{property.email}</span>
                  </div>
                )}
                {property.website && (
                  <div className="flex items-center gap-2.5 text-[#13152C]">
                    <Globe className="w-3.5 h-3.5 text-[#B88E43]" />
                    <a href={property.website} target="_blank" rel="noreferrer" className="hover:underline truncate text-[#B88E43] font-medium">
                      {property.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Room Types */}
      {activeTab === 'room-types' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-2xl text-[#13152C] font-normal">Room Categories</h2>
            {isAdmin && (
              <button
                onClick={() => {
                  setSelectedRoomType(null);
                  setIsRoomTypeModalOpen(true);
                }}
                className="btn-luxury-primary text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            )}
          </div>

          {roomTypes.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No categories configured"
              description="Establish luxury suites like Deluxe Suite, Grand Penthouse, or Garden Villa."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roomTypes.map((rt) => {
                const rtImg = rt.images && rt.images.length > 0 ? rt.images[0].url : null;
                return (
                  <div
                    key={rt.id || rt._id}
                    className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] overflow-hidden shadow-sm flex flex-col justify-between group hover:border-[#DFB76C] transition-all"
                  >
                    <div className="h-48 bg-[#FAF6F0] relative overflow-hidden">
                      {rtImg ? (
                        <img src={rtImg} alt={rt.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#13152C]/30">
                          <BedDouble className="w-8 h-8 stroke-[1.25]" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-[2px] bg-[#13152C]/90 text-xs font-semibold text-[#DFB76C] border border-[#DFB76C]/40">
                        ₹{rt.base_price?.toLocaleString('en-IN')} <span className="text-[10px] text-[#FAF6F0]/70 font-normal">/ night</span>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <h3 className="font-editorial text-xl font-normal text-[#13152C]">{rt.name}</h3>
                          <span className="font-cinzel text-[8.5px] text-[#B88E43] bg-[#FAF6F0] px-1.5 py-0.5 rounded-[2px] border border-[#DFB76C]/30 tracking-widest uppercase">
                            {rt.code}
                          </span>
                        </div>
                        <p className="font-sans text-xs text-[#13152C]/65 line-clamp-2 mb-4 leading-relaxed">{rt.description}</p>

                        <div className="grid grid-cols-2 gap-2 font-sans text-xs text-[#13152C]/75 py-3 border-y border-[#DFB76C]/20 mb-4">
                          <div>Max Capacity: <strong className="text-[#13152C]">{rt.max_occupancy} Guests</strong></div>
                          <div>Bedding: <strong className="text-[#13152C]">{rt.bed_type}</strong></div>
                          <div>Inventory: <strong className="text-[#13152C]">{rt.total_rooms || 0} Units</strong></div>
                          <div>Suite Size: <strong className="text-[#13152C]">{rt.size || '450 sq ft'}</strong></div>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            onClick={() => {
                              setSelectedRoomType(rt);
                              setIsRoomTypeModalOpen(true);
                            }}
                            className="btn-luxury-secondary text-[11px] py-1.5 px-3"
                          >
                            Edit Category
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Rooms */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-2xl text-[#13152C] font-normal">Individual Suites & Status</h2>
            {isAdmin && (
              <button
                onClick={() => {
                  setSelectedRoom(null);
                  setIsRoomModalOpen(true);
                }}
                className="btn-luxury-primary text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Suite</span>
              </button>
            )}
          </div>

          {rooms.length === 0 ? (
            <EmptyState
              icon={BedDouble}
              title="No physical suites configured"
              description="Register suite numbers and assign them to your room categories."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id || room._id}
                  className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-5 shadow-sm hover:border-[#DFB76C] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="font-cinzel text-[8.5px] text-[#13152C]/50 uppercase tracking-widest font-semibold block">Floor {room.floor}</span>
                        <h3 className="font-editorial text-2xl font-normal text-[#13152C] tracking-tight">Suite #{room.room_number}</h3>
                        <p className="font-sans text-xs text-[#13152C]/65 mt-0.5">{room.room_type_name || 'Standard'}</p>
                      </div>

                      <button
                        onClick={() => setStatusModalRoom(room)}
                        title="Click to update status"
                        className="cursor-pointer hover:opacity-85 transition-opacity"
                      >
                        <StatusBadge status={room.status} size="sm" />
                      </button>
                    </div>

                    {room.current_guest_name && (
                      <div className="p-2.5 rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/25 mb-3 text-xs font-sans">
                        <span className="font-cinzel text-[8px] text-[#B88E43] uppercase tracking-wider block font-bold">Occupied By</span>
                        <span className="font-semibold text-[#13152C] truncate block">{room.current_guest_name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#DFB76C]/20 text-xs">
                    <button
                      onClick={() => setStatusModalRoom(room)}
                      className="font-cinzel text-[9.5px] uppercase tracking-wider text-[#B88E43] hover:text-[#13152C] font-semibold cursor-pointer"
                    >
                      Update Status
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setSelectedRoom(room);
                          setIsRoomModalOpen(true);
                        }}
                        className="font-sans text-xs text-[#13152C]/60 hover:text-[#13152C] font-medium cursor-pointer"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Reservations */}
      {activeTab === 'reservations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-editorial text-2xl text-[#13152C] font-normal">Recent Property Bookings</h2>
            <Link
              to="/reservations/new"
              className="btn-luxury-primary text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Booking</span>
            </Link>
          </div>

          {reservations.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="No reservations on record"
              description="Bookings for this hotel property will appear here in the registry."
            />
          ) : (
            <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF6F0] font-cinzel text-[9px] uppercase font-bold text-[#13152C]/70 border-b border-[#DFB76C]/25 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Booking Ref</th>
                    <th className="py-3 px-4">Guest</th>
                    <th className="py-3 px-4">Suite</th>
                    <th className="py-3 px-4">Itinerary</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Folio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFB76C]/15 font-sans">
                  {reservations.map((res) => (
                    <tr key={res.id || res._id} className="hover:bg-[#FAF6F0]/60">
                      <td className="py-3 px-4 font-cinzel font-bold text-[#B88E43]">
                        #{res.booking_reference}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#13152C]">{res.guest_name || 'Guest'}</td>
                      <td className="py-3 px-4 text-[#13152C]/70">Suite #{res.room_number || '-'}</td>
                      <td className="py-3 px-4 text-[#13152C]/60 font-mono text-[11px]">
                        {res.check_in_date} → {res.check_out_date}
                      </td>
                      <td className="py-3 px-4 font-editorial text-sm font-semibold text-[#13152C]">
                        ₹{res.total_amount?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={res.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/reservations/${res.id || res._id}`}
                          className="font-cinzel text-[10px] text-[#B88E43] hover:text-[#13152C] uppercase font-semibold"
                        >
                          View Folio →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <RoomTypeModal
        isOpen={isRoomTypeModalOpen}
        onClose={() => setIsRoomTypeModalOpen(false)}
        propertyId={id}
        roomType={selectedRoomType}
        onSuccess={fetchPropertyData}
      />

      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        propertyId={id}
        roomTypes={roomTypes}
        room={selectedRoom}
        onSuccess={fetchPropertyData}
      />

      <RoomStatusModal
        isOpen={!!statusModalRoom}
        onClose={() => setStatusModalRoom(null)}
        room={statusModalRoom}
        onSuccess={fetchPropertyData}
      />
    </div>
  );
};
