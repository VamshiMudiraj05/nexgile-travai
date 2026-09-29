import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';
import { roomTypeService } from '../../services/roomTypeService';
import { ImageUploader } from '../../components/ImageUploader';
import { Loader2, AlertCircle } from 'lucide-react';

export const RoomTypeModal = ({ isOpen, onClose, propertyId, roomType, onSuccess }) => {
  const isEdit = Boolean(roomType);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    max_occupancy: 2,
    adults_capacity: 2,
    children_capacity: 1,
    bed_type: 'KING',
    bed_count: 1,
    base_price: 5000,
    size: '350 sq ft',
    amenities: [],
    images: [],
  });

  const [amenityInput, setAmenityInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (roomType) {
      setFormData({
        name: roomType.name || '',
        code: roomType.code || '',
        description: roomType.description || '',
        max_occupancy: roomType.max_occupancy || 2,
        adults_capacity: roomType.adults_capacity || 2,
        children_capacity: roomType.children_capacity || 1,
        bed_type: roomType.bed_type || 'KING',
        bed_count: roomType.bed_count || 1,
        base_price: roomType.base_price || 5000,
        size: roomType.size || '350 sq ft',
        amenities: roomType.amenities || [],
        images: roomType.images || [],
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        max_occupancy: 2,
        adults_capacity: 2,
        children_capacity: 1,
        bed_type: 'KING',
        bed_count: 1,
        base_price: 5000,
        size: '350 sq ft',
        amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV'],
        images: [],
      });
    }
    setError('');
  }, [roomType, isOpen]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleAddAmenity = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()],
      }));
      setAmenityInput('');
    }
  };

  const handleRemoveAmenity = (item) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((a) => a !== item),
    }));
  };

  const handleImageUpload = async (file) => {
    if (isEdit && roomType?.id) {
      try {
        setUploadingImage(true);
        const updated = await roomTypeService.uploadImage(roomType.id || roomType._id, file);
        setFormData((prev) => ({ ...prev, images: updated.images || [] }));
      } catch (err) {
        alert('Failed to upload image');
      } finally {
        setUploadingImage(false);
      }
    } else {
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        images: [
          ...prev.images,
          { url: previewUrl, public_id: `pending_${Date.now()}`, resource_type: 'image' },
        ],
      }));
    }
  };

  const handleImageDelete = async (publicId) => {
    if (isEdit && roomType?.id) {
      try {
        const updated = await roomTypeService.deleteImage(roomType.id || roomType._id, publicId);
        setFormData((prev) => ({ ...prev, images: updated.images || [] }));
      } catch (err) {
        alert('Failed to delete image');
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((img) => img.public_id !== publicId),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.code.trim()) {
      setError('Please provide room category name and code.');
      return;
    }

    try {
      setSubmitting(true);
      if (isEdit) {
        await roomTypeService.updateRoomType(roomType.id || roomType._id, formData);
      } else {
        await roomTypeService.createRoomType(propertyId, { ...formData, property_id: propertyId });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save room type.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Suite Category' : 'Create Suite Category'}
      subtitle="Define nightly rate, guest capacity, and bespoke amenities."
    >
      {error && (
        <div className="mb-4 p-3 rounded-[2px] bg-[#FDF2F2] border border-[#993A3A]/30 flex items-center gap-2 text-xs text-[#993A3A] font-sans">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1">
              Category Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Deluxe Ocean View Suite"
              className="w-full luxury-input text-xs font-sans"
            />
          </div>

          <div>
            <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1">
              Category Code *
            </label>
            <input
              type="text"
              name="code"
              required
              value={formData.code}
              onChange={handleChange}
              placeholder="e.g. DLX-OCN"
              className="w-full luxury-input text-xs font-cinzel uppercase"
            />
          </div>

          <div>
            <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1">
              Base Rate / Night (₹) *
            </label>
            <input
              type="number"
              name="base_price"
              required
              min={0}
              value={formData.base_price}
              onChange={handleChange}
              className="w-full luxury-input text-xs font-sans font-bold"
            />
          </div>

          <div>
            <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1">
              Suite Floor Area
            </label>
            <input
              type="text"
              name="size"
              value={formData.size}
              onChange={handleChange}
              placeholder="e.g. 450 sq ft"
              className="w-full luxury-input text-xs font-sans"
            />
          </div>

          <div>
            <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1">
              Bedding Type
            </label>
            <select
              name="bed_type"
              value={formData.bed_type}
              onChange={handleChange}
              className="w-full luxury-input text-xs font-semibold bg-[#FFFFFF]"
            >
              <option value="KING">King Bed</option>
              <option value="QUEEN">Queen Bed</option>
              <option value="TWIN">Twin Beds</option>
              <option value="DOUBLE">Double Bed</option>
              <option value="SINGLE">Single Bed</option>
            </select>
          </div>

          <div>
            <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1">
              Bed Count
            </label>
            <input
              type="number"
              name="bed_count"
              min={1}
              value={formData.bed_count}
              onChange={handleChange}
              className="w-full luxury-input text-xs font-sans"
            />
          </div>

          <div>
            <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1">
              Adults Capacity
            </label>
            <input
              type="number"
              name="adults_capacity"
              min={1}
              value={formData.adults_capacity}
              onChange={handleChange}
              className="w-full luxury-input text-xs font-sans"
            />
          </div>

          <div>
            <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1">
              Children Capacity
            </label>
            <input
              type="number"
              name="children_capacity"
              min={0}
              value={formData.children_capacity}
              onChange={handleChange}
              className="w-full luxury-input text-xs font-sans"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1">
              Category Description
            </label>
            <textarea
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
              placeholder="Suite ambiance and panoramic vantage..."
              className="w-full luxury-input text-xs font-sans leading-relaxed"
            ></textarea>
          </div>
        </div>

        {/* Amenities */}
        <div>
          <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1.5">
            Category Amenities
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
              placeholder="Add feature (e.g. Marble Bath, Deep Soaking Tub)..."
              className="flex-1 luxury-input text-xs font-sans"
            />
            <button
              type="button"
              onClick={handleAddAmenity}
              className="btn-luxury-secondary text-xs py-1.5 px-3"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {formData.amenities.map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/30 text-xs font-sans text-[#13152C]"
              >
                <span>{a}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAmenity(a)}
                  className="text-[#13152C]/40 hover:text-[#993A3A] font-bold cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Category Images */}
        <div className="pt-2">
          <ImageUploader
            images={formData.images}
            onUpload={handleImageUpload}
            onDelete={handleImageDelete}
            isLoading={uploadingImage}
            label="Suite Photography"
          />
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
            <span>{isEdit ? 'Save Changes' : 'Commit Category'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RoomTypeModal;
