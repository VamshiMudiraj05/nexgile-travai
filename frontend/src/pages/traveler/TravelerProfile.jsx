import React, { useState, useEffect } from 'react';
import {
  User,
  MapPin,
  Heart,
  Sparkles,
  Luggage,
  Crown,
  CheckCircle,
  Save,
  Phone,
  Mail,
  Shield,
  Compass,
  ChevronDown,
} from 'lucide-react';
import { GooeyMenu } from '@/components/ui/gooey-menu';
import { travelerService } from '../../services/travelerService';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function TravelerProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [favoriteDestinations, setFavoriteDestinations] = useState('');
  const [preferredRoomType, setPreferredRoomType] = useState('Deluxe Ocean Suite');
  const [budgetRange, setBudgetRange] = useState('LUXURY');
  const [dietaryPreferences, setDietaryPreferences] = useState('None');
  const [preferredAmenities, setPreferredAmenities] = useState([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await travelerService.getProfile();
      setProfile(res);
      setName(res.name || '');
      setPhone(res.phone || '');
      const prefs = res.preferences || {};
      setFavoriteDestinations((prefs.favorite_destinations || []).join(', '));
      setPreferredRoomType(prefs.preferred_room_type || 'Deluxe Ocean Suite');
      setBudgetRange(prefs.budget_range || 'LUXURY');
      setDietaryPreferences(prefs.dietary_preferences || 'None');
      setPreferredAmenities(prefs.preferred_amenities || ['WiFi', 'Pool', 'Breakfast']);
    } catch (err) {
      console.error('Failed to load traveler profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const destArray = favoriteDestinations
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);

      const payload = {
        name,
        phone,
        preferences: {
          favorite_destinations: destArray,
          preferred_room_type: preferredRoomType,
          budget_range: budgetRange,
          dietary_preferences: dietaryPreferences,
          preferred_amenities: preferredAmenities,
          special_interests: ['Beachfront Relaxation', 'Fine Dining', 'Wellness Retreats'],
        },
      };

      const updated = await travelerService.updateProfile(payload);
      setProfile(updated);
      setSavedSuccess('Traveler profile & AI preferences successfully updated!');
      setTimeout(() => setSavedSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      alert('Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const toggleAmenity = (amenity) => {
    if (preferredAmenities.includes(amenity)) {
      setPreferredAmenities(preferredAmenities.filter((a) => a !== amenity));
    } else {
      setPreferredAmenities([...preferredAmenities, amenity]);
    }
  };

  const availableAmenities = [
    'WiFi',
    'Swimming Pool',
    'Spa & Wellness',
    'Ocean View',
    'Complimentary Breakfast',
    'Fitness Center',
    'Airport Shuttle',
    'Pet Friendly',
    'Fine Dining Restaurant',
  ];

  if (loading) {
    return <LoadingSpinner text="Retrieving traveler dossier & preference models..." />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12 text-[#FAF6F0]">
      {/* Editorial Header */}
      <div className="border-b border-[#2C315E] pb-6">
        <span className="font-cinzel text-[10px] tracking-[0.25em] text-[#DFB76C] uppercase flex items-center gap-1.5 font-semibold">
          <Sparkles size={14} /> GUEST PROFILE
        </span>
        <h1 className="mt-1 font-editorial text-3xl md:text-4xl text-white tracking-tight font-bold">
          Profile & Preferences
        </h1>
        <p className="mt-1 font-sans text-xs md:text-sm text-white/70">
          Save your contact information and hotel stay preferences to make future bookings effortless.
        </p>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-3 rounded-[2px] border border-emerald-500/40 bg-emerald-950/40 p-4 font-sans text-xs font-semibold text-emerald-300">
          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-5 shadow-sm">
          <span className="font-cinzel text-[9px] font-bold text-[#DFB76C] uppercase tracking-widest block">
            Membership Tier
          </span>
          <p className="mt-1 font-editorial text-2xl font-bold text-white flex items-center gap-1.5">
            <Crown size={18} className="text-[#DFB76C]" /> {profile?.loyalty_tier || 'MEMBER'}
          </p>
        </div>

        <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-5 shadow-sm">
          <span className="font-cinzel text-[9px] font-bold text-white/60 uppercase tracking-widest block">
            Reward Points
          </span>
          <p className="mt-1 font-editorial text-2xl font-bold text-white">
            {profile?.loyalty_points?.toLocaleString() || 0}{' '}
            <span className="font-sans text-xs font-normal text-[#DFB76C]">pts</span>
          </p>
        </div>

        <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-5 shadow-sm">
          <span className="font-cinzel text-[9px] font-bold text-white/60 uppercase tracking-widest block">
            Total Stays
          </span>
          <p className="mt-1 font-editorial text-2xl font-bold text-white">
            {profile?.total_trips || 0}{' '}
            <span className="font-sans text-xs font-normal text-white/60">Stays</span>
          </p>
        </div>

        <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-5 shadow-sm">
          <span className="font-cinzel text-[9px] font-bold text-[#DFB76C] uppercase tracking-widest block">
            Upcoming Trips
          </span>
          <p className="mt-1 font-editorial text-2xl font-bold text-[#DFB76C]">
            {profile?.upcoming_trips || 0}{' '}
            <span className="font-sans text-xs font-normal text-white/60">Reserved</span>
          </p>
        </div>
      </div>

      {/* Main Profile & Preferences Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Details */}
        <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-6 md:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-[#2C315E] pb-3">
            <User size={16} className="text-[#DFB76C]" />
            <h2 className="font-cinzel text-xs tracking-wider uppercase text-white font-bold">
              Contact Information
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block font-cinzel text-[10px] tracking-wider text-white uppercase mb-1.5 font-bold">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-[2px] border border-[#2C315E] bg-[#1B1E3D] px-4 py-2.5 font-sans text-xs text-white focus:border-[#DFB76C] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block font-cinzel text-[10px] tracking-wider text-white/60 uppercase mb-1.5 font-bold">
                Registered Email (Verified)
              </label>
              <input
                type="email"
                disabled
                value={profile?.email}
                className="w-full rounded-[2px] border border-[#2C315E]/60 bg-[#1B1E3D]/50 px-4 py-2.5 font-sans text-xs text-white/50 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-cinzel text-[10px] tracking-wider text-white uppercase mb-1.5 font-bold">
                Telephone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-[2px] border border-[#2C315E] bg-[#1B1E3D] px-4 py-2.5 font-sans text-xs text-white focus:border-[#DFB76C] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block font-cinzel text-[10px] tracking-wider text-white/60 uppercase mb-1.5 font-bold">
                System Role & Privilege
              </label>
              <input
                type="text"
                disabled
                value={profile?.role}
                className="w-full rounded-[2px] border border-[#2C315E]/60 bg-[#1B1E3D]/50 px-4 py-2.5 font-sans text-xs text-white/50 cursor-not-allowed uppercase"
              />
            </div>
          </div>
        </div>

        {/* Travel Preferences */}
        <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-6 md:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-[#2C315E] pb-3">
            <Heart size={16} className="text-[#DFB76C]" />
            <h2 className="font-cinzel text-xs tracking-wider uppercase text-white font-bold">
              Stay Preferences
            </h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block font-cinzel text-[10px] tracking-wider text-white uppercase mb-1.5 font-bold">
                Preferred Cities & Destinations (Comma-Separated)
              </label>
              <input
                type="text"
                value={favoriteDestinations}
                onChange={(e) => setFavoriteDestinations(e.target.value)}
                placeholder="e.g. Udaipur, Goa, Jaipur, Kerala, Mumbai, Bengaluru"
                className="w-full rounded-[2px] border border-[#2C315E] bg-[#1B1E3D] px-4 py-2.5 font-sans text-xs text-white placeholder-white/40 focus:border-[#DFB76C] focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block font-cinzel text-[10px] tracking-wider text-white uppercase mb-1.5 font-bold">
                  Preferred Room Type
                </label>
                <GooeyMenu
                  className="w-full"
                  style={{ width: '100%' }}
                  surfaceClassName="bg-[#13152C]"
                  options={[
                    'Deluxe Ocean Suite',
                    'Executive Penthouse',
                    'Standard King Room',
                    'Family Villa',
                  ]}
                  value={preferredRoomType}
                  onSelect={(opt) => setPreferredRoomType(opt)}
                  triggerClassName="h-[42px] w-full rounded-[2px] bg-[#1B1E3D] px-4 border border-[#2C315E] hover:border-[#DFB76C]/60 transition-colors flex items-center justify-between"
                  trigger={
                    <div className="flex h-full w-full items-center justify-between text-left">
                      <span className="text-xs font-sans text-white truncate">{preferredRoomType}</span>
                      <ChevronDown size={14} className="text-[#DFB76C]/70 shrink-0 ml-2" />
                    </div>
                  }
                />
              </div>

              <div>
                <label className="block font-cinzel text-[10px] tracking-wider text-white uppercase mb-1.5 font-bold">
                  Typical Nightly Budget
                </label>
                <GooeyMenu
                  className="w-full"
                  style={{ width: '100%' }}
                  surfaceClassName="bg-[#13152C]"
                  options={[
                    'Budget (Up to ₹5,000/night)',
                    'Standard (₹5,000 – ₹12,000/night)',
                    'Luxury (₹12,000 – ₹25,000/night)',
                    'Premium Suite (₹25,000+/night)',
                  ]}
                  value={
                    budgetRange === 'BUDGET'
                      ? 'Budget (Up to ₹5,000/night)'
                      : budgetRange === 'MODERATE'
                      ? 'Standard (₹5,000 – ₹12,000/night)'
                      : budgetRange === 'LUXURY'
                      ? 'Luxury (₹12,000 – ₹25,000/night)'
                      : 'Premium Suite (₹25,000+/night)'
                  }
                  onSelect={(opt) => {
                    const map = {
                      'Budget (Up to ₹5,000/night)': 'BUDGET',
                      'Standard (₹5,000 – ₹12,000/night)': 'MODERATE',
                      'Luxury (₹12,000 – ₹25,000/night)': 'LUXURY',
                      'Premium Suite (₹25,000+/night)': 'ULTRA_LUXURY',
                    };
                    setBudgetRange(map[opt] ?? 'LUXURY');
                  }}
                  triggerClassName="h-[42px] w-full rounded-[2px] bg-[#1B1E3D] px-4 border border-[#2C315E] hover:border-[#DFB76C]/60 transition-colors flex items-center justify-between"
                  trigger={
                    <div className="flex h-full w-full items-center justify-between text-left">
                      <span className="text-xs font-sans text-white truncate">
                        {budgetRange === 'BUDGET'
                          ? 'Budget (Up to ₹5,000/night)'
                          : budgetRange === 'MODERATE'
                          ? 'Standard (₹5,000 – ₹12,000/night)'
                          : budgetRange === 'LUXURY'
                          ? 'Luxury (₹12,000 – ₹25,000/night)'
                          : 'Premium Suite (₹25,000+/night)'}
                      </span>
                      <ChevronDown size={14} className="text-[#DFB76C]/70 shrink-0 ml-2" />
                    </div>
                  }
                />
              </div>
            </div>

            <div>
              <label className="block font-cinzel text-[10px] tracking-wider text-white uppercase mb-3 font-bold">
                Favorite Amenities
              </label>
              <div className="flex flex-wrap gap-2.5">
                {availableAmenities.map((amenity) => {
                  const isSelected = preferredAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`rounded-[2px] px-4 py-2 font-cinzel text-[11px] tracking-wider uppercase transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#DFB76C] text-[#13152C] border-[#DFB76C] font-bold'
                          : 'bg-[#1B1E3D] text-white/70 border-[#2C315E] hover:border-[#DFB76C]/60 hover:text-white'
                      }`}
                    >
                      {isSelected && '✓ '}
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-[#13152C] px-8 py-3 font-cinzel text-xs tracking-widest uppercase font-bold shadow-sm disabled:opacity-50 cursor-pointer transition-all"
          >
            <Save size={14} className="text-[#13152C]" /> {saving ? 'Saving Preferences...' : 'Save Preferences →'}
          </button>
        </div>
      </form>
    </div>
  );
}
