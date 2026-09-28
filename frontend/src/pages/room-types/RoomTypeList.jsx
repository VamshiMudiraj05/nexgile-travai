import React, { useState, useEffect } from 'react';
import { Layers, Plus, Building2, BedDouble, Trash2, Edit3, Sparkles } from 'lucide-react';
import { propertyService } from '../../services/propertyService';
import { roomTypeService } from '../../services/roomTypeService';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { EmptyState } from '../../components/EmptyState';
import { RoomTypeModal } from './RoomTypeModal';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { useAuth } from '../../hooks/useAuth';

export const RoomTypeList = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
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
      } finally {
        setLoading(false);
      }
    };
    loadProperties();
  }, []);

  const fetchRoomTypes = async () => {
    if (!selectedPropertyId) return;
    try {
      setLoading(true);
      const data = await roomTypeService.getRoomTypesByProperty(selectedPropertyId);
      setRoomTypes(data || []);
    } catch (err) {
      console.error('Failed to load room types:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      fetchRoomTypes();
    }
  }, [selectedPropertyId]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      setIsDeleting(true);
      await roomTypeService.deleteRoomType(deleteId);
      setDeleteId(null);
      fetchRoomTypes();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete room type');
    } finally {
      setIsDeleting(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-8">
      {/* Editorial Header */}
      <div className="rounded-[4px] border border-[#DFB76C]/35 bg-[#FFFFFF] p-8 md:p-10 shadow-[0_4px_24px_rgba(19,21,44,0.03)]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 font-cinzel text-[10px] font-bold uppercase tracking-[0.26em] text-[#B88E43]">
              <Sparkles size={14} className="text-[#DFB76C]" /> 01 / PORTFOLIO CONFIGURATION
            </div>
            <h1 className="font-editorial text-3xl sm:text-4xl text-[#13152C] font-normal tracking-tight">
              Suite & Room Categories
            </h1>
            <p className="mt-2 font-sans text-xs sm:text-sm text-[#13152C]/65 max-w-xl leading-relaxed">
              Design bespoke suite tiers, base tariffs, bedding configurations, and curated room amenity packages.
            </p>
          </div>

          {isAdmin && selectedPropertyId && (
            <button
              onClick={() => {
                setSelectedRoomType(null);
                setIsModalOpen(true);
              }}
              className="btn-luxury-primary text-xs self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
            </button>
          )}
        </div>
        <div className="mt-6 gold-hairline"></div>
      </div>

      {/* Property Selector */}
      <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 p-4 rounded-[4px] shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <label className="font-cinzel text-[9.5px] font-bold uppercase tracking-wider text-[#B88E43] flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#DFB76C]" />
          <span>Selected Estate:</span>
        </label>
        <select
          value={selectedPropertyId}
          onChange={(e) => setSelectedPropertyId(e.target.value)}
          className="luxury-input text-xs font-semibold bg-[#FAF6F0] min-w-[280px] cursor-pointer"
        >
          {properties.map((p) => (
            <option key={p.id || p._id} value={p.id || p._id}>
              {p.name} ({p.property_code})
            </option>
          ))}
        </select>
      </div>

      {/* List / Cards */}
      {loading ? (
        <LoadingSpinner text="Retrieving category classifications..." />
      ) : roomTypes.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No suite categories registered"
          description="Create classifications like Deluxe Suite, Grand Penthouse, or Beach Villa."
          action={
            isAdmin && (
              <button
                onClick={() => {
                  setSelectedRoomType(null);
                  setIsModalOpen(true);
                }}
                className="btn-luxury-primary text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Suite Category</span>
              </button>
            )
          }
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
                    <img
                      src={rtImg}
                      alt={rt.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
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
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-[2px] text-[#13152C]/60 hover:text-[#13152C] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                        title="Edit Room Type"
                      >
                        <Edit3 className="w-4 h-4 stroke-[1.5]" />
                      </button>

                      <button
                        onClick={() => setDeleteId(rt.id || rt._id)}
                        className="p-1.5 rounded-[2px] text-[#13152C]/60 hover:text-[#993A3A] hover:bg-[#FAF6F0] transition-colors cursor-pointer"
                        title="Delete Room Type"
                      >
                        <Trash2 className="w-4 h-4 stroke-[1.5]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Room Type Modal */}
      <RoomTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        propertyId={selectedPropertyId}
        roomType={selectedRoomType}
        onSuccess={fetchRoomTypes}
      />

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Are you sure you wish to delete this suite category? Ensure no physical units or active reservations are linked."
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default RoomTypeList;
