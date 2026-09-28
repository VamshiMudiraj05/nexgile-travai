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
} from 'lucide-react';
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
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Editorial Header */}
      <div className="border-b border-[#DFB76C]/20 pb-6">
        <span className="font-cinzel text-[10px] tracking-[0.25em] text-[#B88E43] uppercase flex items-center gap-1.5">
          <Sparkles size={14} /> 05 / Traveler Dossier
        </span>
        <h1 className="mt-1 font-editorial text-3xl md:text-4xl text-[#13152C] tracking-tight">
          Resident Profile & Preferences
        </h1>
        <p className="mt-1 font-sans text-xs md:text-sm text-[#13152C]/70">
          Your travel profile guides our proprietary recommendation model to curate bespoke suites and seamless check-in arrivals.
        </p>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-3 rounded-[2px] border border-emerald-300 bg-emerald-50 p-4 font-sans text-xs font-semibold text-emerald-800">
          <CheckCircle size={18} className="text-emerald-700 shrink-0" />
          <span>{savedSuccess}</span>
        </div>
      )}

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-[4px] border border-[#2C315E]/15 bg-[#FFFFFF] p-5 shadow-sm">
          <span className="font-cinzel text-[9px] font-bold text-[#B88E43] uppercase tracking-widest block">
            Loyalty Tier
          </span>
          <p className="mt-1 font-editorial text-2xl font-bold text-[#13152C] flex items-center gap-1.5">
            <Crown size={18} className="text-[#DFB76C]" /> {profile?.loyalty_tier || 'MEMBER'}
          </p>
        </div>

        <div className="rounded-[4px] border border-[#2C315E]/15 bg-[#FFFFFF] p-5 shadow-sm">
          <span className="font-cinzel text-[9px] font-bold text-[#13152C]/60 uppercase tracking-widest block">
            Honor Points
          </span>
          <p className="mt-1 font-editorial text-2xl font-bold text-[#13152C]">
            {profile?.loyalty_points?.toLocaleString() || 0}{' '}
            <span className="font-sans text-xs font-normal text-[#13152C]/60">pts</span>
          </p>
        </div>

        <div className="rounded-[4px] border border-[#2C315E]/15 bg-[#FFFFFF] p-5 shadow-sm">
          <span className="font-cinzel text-[9px] font-bold text-[#13152C]/60 uppercase tracking-widest block">
            Total Journeys
          </span>
          <p className="mt-1 font-editorial text-2xl font-bold text-[#13152C]">
            {profile?.total_trips || 0}{' '}
            <span className="font-sans text-xs font-normal text-[#13152C]/60">Stays</span>
          </p>
        </div>

        <div className="rounded-[4px] border border-[#2C315E]/15 bg-[#FFFFFF] p-5 shadow-sm">
          <span className="font-cinzel text-[9px] font-bold text-[#13152C]/60 uppercase tracking-widest block">
            Active Bookings
          </span>
          <p className="mt-1 font-editorial text-2xl font-bold text-[#B88E43]">
            {profile?.upcoming_trips || 0}{' '}
            <span className="font-sans text-xs font-normal text-[#13152C]/60">Reserved</span>
          </p>
        </div>
      </div>

      {/* Main Profile & Preferences Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Details */}
        <div className="rounded-[4px] border border-[#2C315E]/15 bg-[#FFFFFF] p-6 md:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-[#2C315E]/10 pb-3">
            <User size={16} className="text-[#B88E43]" />
            <h2 className="font-cinzel text-xs tracking-wider uppercase text-[#13152C] font-bold">
              Personal Information & Identity
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block font-cinzel text-[10px] tracking-wider text-[#13152C] uppercase mb-1.5 font-bold">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-[2px] border border-[#2C315E]/20 bg-[#FAF6F0] px-4 py-2.5 font-sans text-xs text-[#13152C] focus:border-[#DFB76C] focus:bg-[#FFFFFF] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block font-cinzel text-[10px] tracking-wider text-[#13152C]/60 uppercase mb-1.5 font-bold">
                Registered Email (Verified)
              </label>
              <input
                type="email"
                disabled
                value={profile?.email}
                className="w-full rounded-[2px] border border-[#2C315E]/10 bg-[#FAF6F0]/60 px-4 py-2.5 font-sans text-xs text-[#13152C]/50 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-cinzel text-[10px] tracking-wider text-[#13152C] uppercase mb-1.5 font-bold">
                Telephone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-[2px] border border-[#2C315E]/20 bg-[#FAF6F0] px-4 py-2.5 font-sans text-xs text-[#13152C] focus:border-[#DFB76C] focus:bg-[#FFFFFF] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block font-cinzel text-[10px] tracking-wider text-[#13152C]/60 uppercase mb-1.5 font-bold">
                System Role & Privilege
              </label>
              <input
                type="text"
                disabled
                value={profile?.role}
                className="w-full rounded-[2px] border border-[#2C315E]/10 bg-[#FAF6F0]/60 px-4 py-2.5 font-sans text-xs text-[#13152C]/50 cursor-not-allowed uppercase"
              />
            </div>
          </div>
        </div>

        {/* Travel Preferences */}
        <div className="rounded-[4px] border border-[#2C315E]/15 bg-[#FFFFFF] p-6 md:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-[#2C315E]/10 pb-3">
            <Heart size={16} className="text-[#B88E43]" />
            <h2 className="font-cinzel text-xs tracking-wider uppercase text-[#13152C] font-bold">
              Travel & Hospitality Preferences
            </h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block font-cinzel text-[10px] tracking-wider text-[#13152C] uppercase mb-1.5 font-bold">
                Preferred Destinations (Comma-Separated)
              </label>
              <input
                type="text"
                value={favoriteDestinations}
                onChange={(e) => setFavoriteDestinations(e.target.value)}
                placeholder="e.g. Udaipur, Goa, Paris, Swiss Alps, Kyoto, Dubai"
                className="w-full rounded-[2px] border border-[#2C315E]/20 bg-[#FAF6F0] px-4 py-2.5 font-sans text-xs text-[#13152C] focus:border-[#DFB76C] focus:bg-[#FFFFFF] focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block font-cinzel text-[10px] tracking-wider text-[#13152C] uppercase mb-1.5 font-bold">
                  Preferred Suite Architecture
                </label>
                <select
                  value={preferredRoomType}
                  onChange={(e) => setPreferredRoomType(e.target.value)}
                  className="w-full rounded-[2px] border border-[#2C315E]/20 bg-[#FAF6F0] px-4 py-2.5 font-sans text-xs text-[#13152C] focus:border-[#DFB76C] focus:bg-[#FFFFFF] focus:outline-none transition-all cursor-pointer"
                >
                  <option value="Deluxe Ocean Suite">Deluxe Ocean Suite</option>
                  <option value="Executive Penthouse">Executive Penthouse</option>
                  <option value="Standard King Room">Standard King Room</option>
                  <option value="Family Villa">Family Villa</option>
                </select>
              </div>

              <div>
                <label className="block font-cinzel text-[10px] tracking-wider text-[#13152C] uppercase mb-1.5 font-bold">
                  Residency Budget Pacing
                </label>
                <select
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="w-full rounded-[2px] border border-[#2C315E]/20 bg-[#FAF6F0] px-4 py-2.5 font-sans text-xs text-[#13152C] focus:border-[#DFB76C] focus:bg-[#FFFFFF] focus:outline-none transition-all cursor-pointer"
                >
                  <option value="BUDGET">Classic Heritage</option>
                  <option value="MODERATE">Moderate Comfort</option>
                  <option value="LUXURY">Luxury & Fine Hospitality</option>
                  <option value="ULTRA_LUXURY">Ultra Luxury Private Penthouse</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-cinzel text-[10px] tracking-wider text-[#13152C] uppercase mb-3 font-bold">
                Preferred Resort Amenities & Lifestyle Accents
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
                          ? 'bg-[#13152C] text-[#DFB76C] border-[#DFB76C]'
                          : 'bg-[#FAF6F0] text-[#13152C]/70 border-[#2C315E]/15 hover:border-[#DFB76C]/60 hover:text-[#13152C]'
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
            className="flex items-center gap-2 rounded-[2px] bg-[#13152C] border border-[#DFB76C]/40 px-8 py-3 font-cinzel text-xs tracking-widest uppercase text-[#DFB76C] hover:bg-[#1B1E3D] hover:border-[#DFB76C] shadow-sm disabled:opacity-50 cursor-pointer transition-all"
          >
            <Save size={14} className="text-[#DFB76C]" /> {saving ? 'Saving Preferences...' : 'Save Preferences →'}
          </button>
        </div>
      </form>
    </div>
  );
}
