import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { roomService } from '../../services/roomService';
import { Loader2, AlertCircle } from 'lucide-react';

export const RoomModal = ({ isOpen, onClose, propertyId, roomTypes = [], room, onSuccess }) => {
  const isEdit = Boolean(room);

  const [formData, setFormData] = useState({
    room_number: '',
    room_type_id: '',
    floor: 1,
    status: 'AVAILABLE',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (room) {
      setFormData({
        room_number: room.room_number || '',
        room_type_id: room.room_type_id || (roomTypes[0]?.id || roomTypes[0]?._id || ''),
        floor: room.floor || 1,
        status: room.status || 'AVAILABLE',
        notes: room.notes || '',
      });
    } else {
      setFormData({
        room_number: '',
        room_type_id: roomTypes[0]?.id || roomTypes[0]?._id || '',
        floor: 1,
        status: 'AVAILABLE',
        notes: '',
      });
    }
    setError('');
  }, [room, roomTypes, isOpen]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.room_number.trim() || !formData.room_type_id) {
      setError('Please provide room number and select a room category.');
      return;
    }

    try {
      setSubmitting(true);
      if (isEdit) {
        await roomService.updateRoom(room.id || room._id, formData);
      } else {
        await roomService.createRoom(propertyId, { ...formData, property_id: propertyId });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save room.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Suite #${room?.room_number}` : 'Enroll Suite Unit'}
      subtitle="Assign physical unit identifier, floor level, and luxury room category."
      maxWidth="max-w-md"
    >
      {error && (
        <div className="mb-4 p-3 rounded-[2px] bg-[#FDF2F2] border border-[#993A3A]/30 flex items-center gap-2 text-xs text-[#993A3A] font-sans">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1">
            Suite Number / Identifier *
          </label>
          <input
            type="text"
            name="room_number"
            required
            value={formData.room_number}
            onChange={handleChange}
            placeholder="e.g. 101, 204, PH-A"
            className="w-full luxury-input text-xs font-cinzel uppercase"
          />
        </div>

        <div>
          <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1">
            Suite Category *
          </label>
          <select
            name="room_type_id"
            required
            value={formData.room_type_id}
            onChange={handleChange}
            className="w-full luxury-input text-xs font-semibold bg-[#FFFFFF]"
          >
            <option value="">-- Select Category --</option>
            {roomTypes.map((rt) => (
              <option key={rt.id || rt._id} value={rt.id || rt._id}>
                {rt.name} ({rt.code}) - ₹{rt.base_price?.toLocaleString('en-IN')}/night
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1">
              Floor Level
            </label>
            <input
              type="number"
              name="floor"
              min={1}
              value={formData.floor}
              onChange={handleChange}
              className="w-full luxury-input text-xs font-sans"
            />
          </div>

          {!isEdit && (
            <div>
              <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1">
                Initial State
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full luxury-input text-xs font-semibold bg-[#FFFFFF]"
              >
                <option value="AVAILABLE">Available</option>
                <option value="CLEANING">Cleaning</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OUT_OF_ORDER">Out of Order</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1">
            Curated Notes / Distinct Features
          </label>
          <textarea
            name="notes"
            rows={2}
            value={formData.notes}
            onChange={handleChange}
            placeholder="e.g. Panoramic sea view, private elevator vestibule..."
            className="w-full luxury-input text-xs font-sans"
          ></textarea>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DFB76C]/20">
          <button
            type="button"
            onClick={onClose}
            className="btn-luxury-secondary text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-luxury-primary text-xs"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : null}
            <span>{isEdit ? 'Save Changes' : 'Enroll Suite'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
