import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  AlertCircle, 
  Building2, 
  BedDouble, 
  Plus, 
  Trash2, 
  Sparkles, 
  Layers, 
  CheckCircle,
  Hash,
  ChevronDown,
  ChevronUp,
  Wand2
} from 'lucide-react';
import { propertyService } from '../../services/propertyService';
import { ImageUploader } from '../../components/ImageUploader';
import { LoadingSpinner } from '../../components/LoadingSpinner';

const AMENITY_OPTIONS = [
  'Free WiFi',
  'Swimming Pool',
  'Spa & Wellness',
  'Fitness Center',
  'Restaurant & Dining',
  'Bar / Lounge',
  'Valet Parking',
  'Room Service',
  'Beachfront Access',
  'Airport Shuttle',
  'Business Center',
  'Pet Friendly',
];

const ROOM_AMENITY_OPTIONS = [
  'Free WiFi',
  'Air Conditioning',
  'Smart TV',
  'Mini Bar',
  'Balcony / Terrace',
  'Room Service',
  'Bathtub & Rain Shower',
  'Coffee / Tea Maker',
  'Work Desk & Ergonomic Chair',
  'In-room Safe',
];

const PRESET_TEMPLATES = [
  {
    label: '✨ Luxury Resort & Spa',
    name: 'The Azure Coast Luxury Resort',
    property_code: 'AZR-01',
    property_type: 'RESORT',
    star_rating: 5,
    city: 'Goa',
    state: 'Goa',
    country: 'India',
    address: 'Candolim Beach Boulevard',
    description: 'An elite beachside sanctuary offering world-class dining, direct ocean access, and signature Ayurvedic wellness facilities.',
    amenities: ['Free WiFi', 'Swimming Pool', 'Spa & Wellness', 'Fitness Center', 'Restaurant & Dining', 'Bar / Lounge', 'Beachfront Access'],
    images: [
      { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', public_id: 'preset_1', resource_type: 'image' },
      { url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80', public_id: 'preset_2', resource_type: 'image' }
    ]
  },
  {
    label: '🏙️ Urban Boutique Hotel',
    name: 'The Meridian Grand Hotel',
    property_code: 'MRD-01',
    property_type: 'HOTEL',
    star_rating: 4,
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    address: 'Financial District, Gachibowli',
    description: 'A contemporary business hotel situated in the heart of the tech corridor with ultra-fast connectivity and modern amenities.',
    amenities: ['Free WiFi', 'Fitness Center', 'Restaurant & Dining', 'Valet Parking', 'Business Center', 'Room Service'],
    images: [
      { url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80', public_id: 'preset_3', resource_type: 'image' },
      { url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80', public_id: 'preset_4', resource_type: 'image' }
    ]
  },
  {
    label: '🏡 Royal Heritage Palace',
    name: 'Villa Royale Heritage Palms',
    property_code: 'VRH-01',
    property_type: 'VILLA',
    star_rating: 5,
    city: 'Jaipur',
    state: 'Rajasthan',
    country: 'India',
    address: 'Amer Palace Road',
    description: 'A bespoke palatial villa preserving authentic royal architectural craftsmanship with private plunge pool and dedicated butler service.',
    amenities: ['Free WiFi', 'Swimming Pool', 'Spa & Wellness', 'Valet Parking', 'Room Service', 'Pet Friendly'],
    images: [
      { url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80', public_id: 'preset_5', resource_type: 'image' },
      { url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80', public_id: 'preset_6', resource_type: 'image' }
    ]
  }
];

const DEFAULT_ROOM_TYPES = [
  {
    name: 'Deluxe King Room',
    code: 'DLX',
    description: 'Spacious modern room with premium king-size bedding and plush amenities.',
    base_price: 3500,
    max_occupancy: 2,
    adults_capacity: 2,
    children_capacity: 1,
    bed_type: 'KING',
    bed_count: 1,
    amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Room Service'],
    number_of_rooms: 3,
    starting_room_number: 101,
    floor: 1,
  },
  {
    name: 'Executive Royal Suite',
    code: 'STE',
    description: 'Top-tier executive suite featuring a separate lounge area, soaking tub, and balcony views.',
    base_price: 6500,
    max_occupancy: 4,
    adults_capacity: 3,
    children_capacity: 2,
    bed_type: 'KING',
    bed_count: 2,
    amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Balcony / Terrace'],
    number_of_rooms: 2,
    starting_room_number: 201,
    floor: 2,
  }
];

export const PropertyForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    property_code: '',
    property_type: 'HOTEL',
    description: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: '',
    phone: '',
    email: '',
    website: '',
    star_rating: 4,
    check_in_time: '14:00',
    check_out_time: '11:00',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    status: 'ACTIVE',
    amenities: ['Free WiFi', 'Room Service'],
    images: [],
  });

  // Unified Room Types state (only active during property creation)
  const [includeInventory, setIncludeInventory] = useState(true);
  const [roomTypes, setRoomTypes] = useState(DEFAULT_ROOM_TYPES);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      const loadProperty = async () => {
        try {
          setLoading(true);
          const data = await propertyService.getPropertyById(id);
          setFormData({
            name: data.name || '',
            property_code: data.property_code || '',
            property_type: data.property_type || 'HOTEL',
            description: data.description || '',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            country: data.country || 'India',
            postal_code: data.postal_code || '',
            phone: data.phone || '',
            email: data.email || '',
            website: data.website || '',
            star_rating: data.star_rating || 4,
            check_in_time: data.check_in_time || '14:00',
            check_out_time: data.check_out_time || '11:00',
            currency: data.currency || 'INR',
            timezone: data.timezone || 'Asia/Kolkata',
            status: data.status || 'ACTIVE',
            amenities: data.amenities || [],
            images: data.images || [],
          });
        } catch (err) {
          setError('Failed to load property details.');
        } finally {
          setLoading(false);
        }
      };
      loadProperty();
    }
  }, [id, isEdit]);

  const autoGenerateCode = (name) => {
    if (!name) return '';
    const initials = name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 4);
    return `${initials || 'PROP'}-${Math.floor(10 + Math.random() * 90)}`;
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'number' ? Number(value) : value,
      };
      if (name === 'name' && !isEdit && (!prev.property_code || prev.property_code.startsWith('PROP') || prev.property_code.includes('-'))) {
        updated.property_code = autoGenerateCode(value);
      }
      return updated;
    });
  };

  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      name: preset.name,
      property_code: preset.property_code,
      property_type: preset.property_type,
      star_rating: preset.star_rating,
      city: preset.city,
      state: preset.state,
      country: preset.country,
      address: preset.address,
      description: preset.description,
      amenities: preset.amenities,
      images: preset.images,
    }));
  };

  const handleAmenityToggle = (amenity) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  // Room type handlers for unified onboarding
  const handleAddRoomType = () => {
    const nextIdx = roomTypes.length + 1;
    setRoomTypes((prev) => [
      ...prev,
      {
        name: `Room Type ${nextIdx}`,
        code: `RT${nextIdx}`,
        description: 'Standard guest room accommodation with premium amenities.',
        base_price: 3000,
        max_occupancy: 2,
        adults_capacity: 2,
        children_capacity: 1,
        bed_type: 'KING',
        bed_count: 1,
        amenities: ['Free WiFi', 'Air Conditioning', 'Smart TV'],
        number_of_rooms: 2,
        starting_room_number: nextIdx * 100 + 1,
        floor: nextIdx,
      },
    ]);
  };

  const handleRemoveRoomType = (index) => {
    setRoomTypes((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRoomTypeChange = (index, field, value) => {
    setRoomTypes((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: field === 'base_price' || field === 'number_of_rooms' || field === 'starting_room_number' || field === 'floor' || field === 'max_occupancy' || field === 'adults_capacity' || field === 'children_capacity' || field === 'bed_count'
          ? Number(value)
          : value,
      };
      return updated;
    });
  };

  const handleRoomTypeAmenityToggle = (rtIndex, amenity) => {
    setRoomTypes((prev) => {
      const updated = [...prev];
      const rt = updated[rtIndex];
      const exists = rt.amenities?.includes(amenity);
      rt.amenities = exists
        ? rt.amenities.filter((a) => a !== amenity)
        : [...(rt.amenities || []), amenity];
      return updated;
    });
  };

  const totalInventoryRooms = roomTypes.reduce((acc, rt) => acc + (Number(rt.number_of_rooms) || 0), 0);

  const handleImageUpload = async (file) => {
    try {
      setUploadingImage(true);
      if (isEdit) {
        const updated = await propertyService.uploadImage(id, file);
        setFormData((prev) => ({ ...prev, images: updated.images || [] }));
      } else {
        const uploaded = await propertyService.uploadStandaloneImage(file);
        setFormData((prev) => ({
          ...prev,
          images: [
            ...prev.images,
            {
              url: uploaded.url,
              public_id: uploaded.public_id || `img_${Date.now()}`,
              resource_type: uploaded.resource_type || 'image',
            },
          ],
        }));
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      alert(err.response?.data?.detail || 'Failed to process image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageAddUrl = (url) => {
    setFormData((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        {
          url: url,
          public_id: `url_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          resource_type: 'image',
        },
      ],
    }));
  };

  const handleImageDelete = async (publicId) => {
    if (isEdit) {
      try {
        const updated = await propertyService.deleteImage(id, publicId);
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

    if (!formData.name.trim() || !formData.property_code.trim() || !formData.address.trim() || !formData.city.trim()) {
      setError('Please provide all mandatory property details (Name, Code, Address, City).');
      return;
    }

    try {
      setSubmitting(true);
      
      const cleanedData = {
        ...formData,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        website: formData.website?.trim() || undefined,
        state: formData.state?.trim() || undefined,
        postal_code: formData.postal_code?.trim() || undefined,
        description: formData.description?.trim() || undefined,
      };

      if (isEdit) {
        await propertyService.updateProperty(id, cleanedData);
        navigate(`/properties/${id}`);
      } else {
        const payload = {
          ...cleanedData,
          room_types: includeInventory ? roomTypes : [],
        };
        const created = await propertyService.onboardProperty(payload);
        const propId = created.id || created.property_id || created.property?.id || created.property?._id;
        navigate(`/properties/${propId}`);
      }
    } catch (err) {
      console.error('Error saving property:', err);
      setError(err.response?.data?.detail || 'Failed to save property and room inventory.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving property dossier..." />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DFB76C]/30">
        <div className="flex items-center gap-4">
          <Link
            to="/properties"
            className="p-2 rounded-[2px] text-[#13152C]/60 hover:text-[#13152C] hover:bg-[#FAF6F0] transition-colors border border-[#13152C]/10"
          >
            <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cinzel text-[9.5px] uppercase font-bold tracking-[0.24em] text-[#B88E43]">
                01 / ESTATE CONFIGURATION
              </span>
            </div>
            <h1 className="font-editorial text-3xl font-normal text-[#13152C] tracking-tight mt-0.5">
              {isEdit ? `Edit ${formData.name || 'Property'}` : 'Register New Hotel Property'}
            </h1>
            <p className="font-sans text-xs text-[#13152C]/60 mt-0.5">
              {isEdit 
                ? 'Update estate profile, location metadata, and guest operational policies.'
                : 'Configure Property metadata, Room Categories, and Physical Inventory in a unified workflow.'}
            </p>
          </div>
        </div>
      </div>

      {/* Preset Quick Fill Templates for New Properties */}
      {!isEdit && (
        <div className="bg-[#FFFFFF] border border-[#DFB76C]/40 rounded-[4px] p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2 font-cinzel text-[9.5px] font-bold text-[#B88E43] uppercase tracking-wider">
            <Wand2 className="w-3.5 h-3.5 text-[#DFB76C]" /> Curated Hospitality Archetypes (1-Click Populate)
          </div>
          <p className="font-sans text-xs text-[#13152C]/65">
            Select an archetype below to pre-populate luxury hospitality details, photography, and room categories:
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {PRESET_TEMPLATES.map((tpl, i) => (
              <button
                type="button"
                key={i}
                onClick={() => handleApplyPreset(tpl)}
                className="btn-luxury-secondary text-[11px] py-1.5 px-3"
              >
                <span>{tpl.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-[3px] bg-[#FDF2F2] border border-[#993A3A]/30 flex items-center gap-3 text-[#993A3A] text-xs font-sans">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Property Information */}
        <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#DFB76C]/20 pb-3">
            <h2 className="font-editorial text-xl font-normal text-[#13152C] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#DFB76C]" /> 1. Property Identity & Branding
            </h2>
            <span className="font-cinzel text-[9px] uppercase tracking-wider text-[#B88E43] font-semibold">* Required</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-cinzel text-[9px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1.5">
                Property Name *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. The Grand Nexgile Palace & Spa"
                className="w-full luxury-input text-xs font-sans"
              />
            </div>

            <div>
              <label className="font-cinzel text-[9px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1.5">
                Property Code * (Unique Identifier)
              </label>
              <input
                type="text"
                name="property_code"
                required
                value={formData.property_code}
                onChange={handleChange}
                placeholder="e.g. GNP-01"
                className="w-full luxury-input text-xs font-cinzel uppercase"
              />
            </div>

            <div>
              <label className="font-cinzel text-[9px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1.5">
                Property Archetype
              </label>
              <select
                name="property_type"
                value={formData.property_type}
                onChange={handleChange}
                className="w-full luxury-input text-xs font-semibold bg-[#FAF6F0]"
              >
                <option value="HOTEL">Hotel</option>
                <option value="RESORT">Resort</option>
                <option value="HOSTEL">Hostel</option>
                <option value="APARTMENT">Apartment</option>
                <option value="VILLA">Villa</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="font-cinzel text-[9px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1.5">
                Star Rating
              </label>
              <select
                name="star_rating"
                value={formData.star_rating}
                onChange={handleChange}
                className="w-full luxury-input text-xs font-semibold bg-[#FAF6F0]"
              >
                <option value={1}>⭐ 1 Star</option>
                <option value={2}>⭐⭐ 2 Star</option>
                <option value={3}>⭐⭐⭐ 3 Star</option>
                <option value={4}>⭐⭐⭐⭐ 4 Star (Premium)</option>
                <option value={5}>⭐⭐⭐⭐⭐ 5 Star (Luxury Palace)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-cinzel text-[9px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1.5">
                Editorial Description
              </label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Overview of the estate, panoramic views, signature services, and guest experience..."
                className="w-full luxury-input text-xs font-sans leading-relaxed"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Section 2: Location & Address */}
        <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="font-editorial text-xl font-normal text-[#13152C] border-b border-[#DFB76C]/20 pb-3">
            2. Location & Geographic Address
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="font-cinzel text-[9px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1.5">
                Street Address *
              </label>
              <input
                type="text"
                name="address"
                required
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. 15 Candolim Beach Boulevard"
                className="w-full luxury-input text-xs font-sans"
              />
            </div>

            <div>
              <label className="font-cinzel text-[9px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1.5">
                City *
              </label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. North Goa"
                className="w-full luxury-input text-xs font-sans"
              />
            </div>

            <div>
              <label className="font-cinzel text-[9px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1.5">
                State / Province
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="e.g. Goa"
                className="w-full luxury-input text-xs font-sans"
              />
            </div>

            <div>
              <label className="font-cinzel text-[9px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1.5">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="e.g. India"
                className="w-full luxury-input text-xs font-sans"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Property Amenities */}
        <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="font-editorial text-xl font-normal text-[#13152C] border-b border-[#DFB76C]/20 pb-3">
            3. Curated Estate Amenities
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {AMENITY_OPTIONS.map((item) => {
              const checked = formData.amenities.includes(item);
              return (
                <button
                  type="button"
                  key={item}
                  onClick={() => handleAmenityToggle(item)}
                  className={`p-3 rounded-[2px] border text-left text-xs font-sans transition-all flex items-center justify-between cursor-pointer ${
                    checked
                      ? 'bg-[#FAF6F0] border-[#DFB76C] text-[#13152C] font-semibold shadow-sm'
                      : 'bg-[#FFFFFF] border-[#13152C]/15 text-[#13152C]/60 hover:border-[#DFB76C]/40'
                  }`}
                >
                  <span>{item}</span>
                  {checked && <CheckCircle className="w-3.5 h-3.5 text-[#B88E43]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Property Photos */}
        <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="font-editorial text-xl font-normal text-[#13152C] border-b border-[#DFB76C]/20 pb-3">
            4. Editorial Photography & Gallery
          </h2>

          <ImageUploader
            images={formData.images}
            onUpload={handleImageUpload}
            onAddUrl={handleImageAddUrl}
            onDelete={handleImageDelete}
            isLoading={uploadingImage}
          />
        </div>

        {/* Section 5: Unified Room Types & Live Units Setup (Only during Property Creation) */}
        {!isEdit && (
          <div className="bg-[#FFFFFF] border border-[#DFB76C]/40 rounded-[4px] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DFB76C]/20 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-[2px] bg-[#FAF6F0] text-[#B88E43] border border-[#DFB76C]/30">
                    <Layers className="w-4 h-4 stroke-[1.5]" />
                  </span>
                  <h2 className="font-editorial text-2xl font-normal text-[#13152C]">
                    5. Room Categories & Initial Inventory
                  </h2>
                </div>
                <p className="font-sans text-xs text-[#13152C]/60 mt-1">
                  Define your suite categories and unit ranges — all rooms are minted automatically upon launch.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddRoomType}
                className="btn-luxury-secondary text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Category</span>
              </button>
            </div>

            {/* Room Type Cards */}
            <div className="space-y-6">
              {roomTypes.map((rt, rtIdx) => {
                const roomCount = Number(rt.number_of_rooms) || 0;
                const startNum = Number(rt.starting_room_number) || 101;
                const generatedRoomPreview = Array.from({ length: Math.min(roomCount, 8) }, (_, i) => startNum + i);

                return (
                  <div
                    key={rtIdx}
                    className="bg-[#FAF6F0] border border-[#DFB76C]/30 rounded-[3px] p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-[2px] bg-[#13152C] text-[#DFB76C] font-cinzel text-[10px] font-bold flex items-center justify-center">
                          {rtIdx + 1}
                        </span>
                        <h3 className="font-editorial text-lg text-[#13152C]">
                          {rt.name || `Room Type #${rtIdx + 1}`}
                        </h3>
                        <span className="font-cinzel text-[8.5px] bg-[#FFFFFF] text-[#B88E43] px-2 py-0.5 rounded-[2px] border border-[#DFB76C]/30 tracking-wider">
                          {rt.code || 'CODE'}
                        </span>
                      </div>

                      {roomTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRoomType(rtIdx)}
                          className="p-1 rounded-[2px] text-[#13152C]/50 hover:text-[#993A3A] transition-colors cursor-pointer"
                          title="Remove Category"
                        >
                          <Trash2 className="w-4 h-4 stroke-[1.5]" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      {/* Name */}
                      <div className="sm:col-span-2">
                        <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1">
                          Category Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={rt.name}
                          onChange={(e) => handleRoomTypeChange(rtIdx, 'name', e.target.value)}
                          placeholder="e.g. Deluxe Ocean View Suite"
                          className="w-full luxury-input text-xs font-sans bg-[#FFFFFF]"
                        />
                      </div>

                      {/* Code */}
                      <div>
                        <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1">
                          Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={rt.code}
                          onChange={(e) => handleRoomTypeChange(rtIdx, 'code', e.target.value.toUpperCase())}
                          placeholder="e.g. DLX"
                          className="w-full luxury-input text-xs font-cinzel uppercase bg-[#FFFFFF]"
                        />
                      </div>

                      {/* Price / Night */}
                      <div>
                        <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1">
                          Base Room Rate (₹) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={rt.base_price}
                          onChange={(e) => handleRoomTypeChange(rtIdx, 'base_price', e.target.value)}
                          placeholder="3500"
                          className="w-full luxury-input text-xs font-sans font-bold bg-[#FFFFFF]"
                        />
                      </div>

                      {/* Bedding */}
                      <div>
                        <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1">
                          Bedding
                        </label>
                        <select
                          value={rt.bed_type}
                          onChange={(e) => handleRoomTypeChange(rtIdx, 'bed_type', e.target.value)}
                          className="w-full luxury-input text-xs font-semibold bg-[#FFFFFF]"
                        >
                          <option value="KING">1 King Bed</option>
                          <option value="QUEEN">1 Queen Bed</option>
                          <option value="TWIN">2 Twin Beds</option>
                          <option value="DOUBLE">2 Double Beds</option>
                        </select>
                      </div>

                      {/* Max Occupancy */}
                      <div>
                        <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#B88E43] font-bold block mb-1">
                          Max Capacity
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={rt.max_occupancy}
                          onChange={(e) => handleRoomTypeChange(rtIdx, 'max_occupancy', e.target.value)}
                          className="w-full luxury-input text-xs font-sans bg-[#FFFFFF]"
                        />
                      </div>

                      {/* Units to Create */}
                      <div>
                        <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#2D5A40] font-bold block mb-1">
                          Units to Mint
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={rt.number_of_rooms}
                          onChange={(e) => handleRoomTypeChange(rtIdx, 'number_of_rooms', e.target.value)}
                          className="w-full luxury-input text-xs font-sans font-bold bg-[#FFFFFF]"
                        />
                      </div>

                      {/* Starting Room Number */}
                      <div>
                        <label className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#2D5A40] font-bold block mb-1">
                          Starting Unit #
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={rt.starting_room_number}
                          onChange={(e) => handleRoomTypeChange(rtIdx, 'starting_room_number', e.target.value)}
                          placeholder="101"
                          className="w-full luxury-input text-xs font-sans font-bold bg-[#FFFFFF]"
                        />
                      </div>
                    </div>

                    {/* Room Units Preview */}
                    <div className="bg-[#FFFFFF] border border-[#DFB76C]/25 p-3 rounded-[2px] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#13152C]/60 font-semibold">
                          Generated Suites (Floor {rt.floor || 1}):
                        </span>
                        <span className="font-sans text-xs font-bold text-[#2D5A40]">
                          {roomCount} available suites
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {generatedRoomPreview.map((num) => (
                          <span
                            key={num}
                            className="bg-[#FAF6F0] border border-[#DFB76C]/30 text-[#13152C] text-[10px] font-cinzel font-semibold px-2 py-0.5 rounded-[2px]"
                          >
                            Suite #{num}
                          </span>
                        ))}
                        {roomCount > 8 && (
                          <span className="text-[10px] text-[#13152C]/40 self-center font-sans">
                            +{roomCount - 8} more units...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Form Actions Footer */}
        <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 p-4 rounded-[4px] shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 z-20">
          <div>
            {!isEdit && (
              <p className="font-sans text-xs text-[#13152C]/70">
                Summary: <strong className="text-[#13152C]">1 Property</strong> • <strong className="text-[#B88E43]">{roomTypes.length} Categories</strong> • <strong className="text-[#2D5A40]">{totalInventoryRooms} Total Suites</strong>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/properties"
              className="btn-luxury-secondary text-xs"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="btn-luxury-primary text-xs w-full sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-current" />
                  <span>Submitting Estate Registry...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#DFB76C]" />
                  <span>
                    {isEdit 
                      ? 'Update Property Dossier' 
                      : `Enroll Property & Mint ${totalInventoryRooms} Suites →`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PropertyForm;
