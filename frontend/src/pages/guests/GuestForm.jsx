import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, AlertCircle, User } from 'lucide-react';
import { guestService } from '../../services/guestService';

export const GuestForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    nationality: 'Indian',
    gender: 'Other',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postal_code: '',
    identity_type: 'PASSPORT',
    identity_number: '',
    preferences: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      const loadGuest = async () => {
        try {
          setLoading(true);
          const data = await guestService.getGuestById(id);
          setFormData({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: data.email || '',
            phone: data.phone || '',
            date_of_birth: data.date_of_birth || '',
            nationality: data.nationality || 'Indian',
            gender: data.gender || 'Other',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            country: data.country || 'India',
            postal_code: data.postal_code || '',
            identity_type: data.identity_type || 'PASSPORT',
            identity_number: data.identity_number || '',
            preferences: data.preferences || '',
            notes: data.notes || '',
          });
        } catch (err) {
          setError('Failed to load guest details.');
        } finally {
          setLoading(false);
        }
      };
      loadGuest();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError('First name, last name, email, and phone number are required.');
      return;
    }

    try {
      setSubmitting(true);
      if (isEdit) {
        await guestService.updateGuest(id, formData);
        navigate(`/guests/${id}`);
      } else {
        const created = await guestService.createGuest(formData);
        navigate(`/guests/${created.id || created._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save guest profile.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-[#13152C]">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#DFB76C] mb-2" />
        <p className="font-editorial text-sm">Consulting guest archives...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-[#DFB76C]/30">
        <div className="flex items-center gap-4">
          <Link
            to="/guests"
            className="p-2.5 rounded-[3px] border border-[#DFB76C]/40 bg-[#FAF6F0] text-[#13152C] hover:bg-[#F4EFE6] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#B88E43]" />
          </Link>
          <div>
            <span className="eyebrow-label text-[#B88E43]">01 / OPERATIONS &middot; GUEST REGISTRY</span>
            <h1 className="text-3xl font-editorial font-bold text-[#13152C] tracking-tight">
              {isEdit ? 'Edit Guest Profile' : 'Register VIP Guest'}
            </h1>
            <p className="text-xs text-[#13152C]/70 mt-1">
              Maintain guest CRM preferences, identity records, and contact details.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-[4px] bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Details */}
        <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-7 shadow-sm space-y-5">
          <div className="border-b border-[#DFB76C]/20 pb-3">
            <span className="eyebrow-label text-[#B88E43]">Section 01</span>
            <h2 className="text-lg font-editorial font-semibold text-[#13152C]">
              Personal & Communication Records
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block eyebrow-label text-[#13152C]/80 mb-2">
                First Name *
              </label>
              <input
                type="text"
                name="first_name"
                required
                value={formData.first_name}
                onChange={handleChange}
                placeholder="e.g. John"
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-sm text-[#13152C] placeholder-[#13152C]/40 focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
              />
            </div>

            <div>
              <label className="block eyebrow-label text-[#13152C]/80 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                required
                value={formData.last_name}
                onChange={handleChange}
                placeholder="e.g. Doe"
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-sm text-[#13152C] placeholder-[#13152C]/40 focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
              />
            </div>

            <div>
              <label className="block eyebrow-label text-[#13152C]/80 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-sm text-[#13152C] placeholder-[#13152C]/40 focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
              />
            </div>

            <div>
              <label className="block eyebrow-label text-[#13152C]/80 mb-2">
                Phone Number *
              </label>
              <input
                type="text"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+91 9876543210"
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-sm text-[#13152C] placeholder-[#13152C]/40 focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
              />
            </div>

            <div>
              <label className="block eyebrow-label text-[#13152C]/80 mb-2">
                Nationality
              </label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleChange}
                placeholder="Indian"
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-sm text-[#13152C] placeholder-[#13152C]/40 focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
              />
            </div>

            <div>
              <label className="block eyebrow-label text-[#13152C]/80 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-sm text-[#13152C] focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Identification & Address */}
        <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-7 shadow-sm space-y-5">
          <div className="border-b border-[#DFB76C]/20 pb-3">
            <span className="eyebrow-label text-[#B88E43]">Section 02</span>
            <h2 className="text-lg font-editorial font-semibold text-[#13152C]">
              Identity & Address Verification
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block eyebrow-label text-[#13152C]/80 mb-2">
                Identity Document Type
              </label>
              <select
                name="identity_type"
                value={formData.identity_type}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-sm text-[#13152C] focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
              >
                <option value="PASSPORT">Passport</option>
                <option value="NATIONAL_ID">National ID / Aadhaar</option>
                <option value="DRIVING_LICENSE">Driving License</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block eyebrow-label text-[#13152C]/80 mb-2">
                Identity Document Number
              </label>
              <input
                type="text"
                name="identity_number"
                value={formData.identity_number}
                onChange={handleChange}
                placeholder="e.g. Z1234567"
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-sm text-[#13152C] placeholder-[#13152C]/40 focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all font-mono"
              />
            </div>

            <div>
              <label className="block eyebrow-label text-[#13152C]/80 mb-2">
                City / Region
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Mumbai"
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-sm text-[#13152C] placeholder-[#13152C]/40 focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
              />
            </div>

            <div>
              <label className="block eyebrow-label text-[#13152C]/80 mb-2">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="e.g. India"
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-sm text-[#13152C] placeholder-[#13152C]/40 focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
              />
            </div>
          </div>
        </div>

        {/* Preferences & Notes */}
        <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 rounded-[4px] p-7 shadow-sm space-y-5">
          <div className="border-b border-[#DFB76C]/20 pb-3">
            <span className="eyebrow-label text-[#B88E43]">Section 03</span>
            <h2 className="text-lg font-editorial font-semibold text-[#13152C]">
              Guest Preferences & Concierge Notes
            </h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block eyebrow-label text-[#13152C]/80 mb-2">
                Stay Preferences
              </label>
              <textarea
                name="preferences"
                rows={2}
                value={formData.preferences}
                onChange={handleChange}
                placeholder="e.g. Quiet wing, king bed, vegetarian cuisine, late departure..."
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-sm text-[#13152C] placeholder-[#13152C]/40 focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
              ></textarea>
            </div>

            <div>
              <label className="block eyebrow-label text-[#13152C]/80 mb-2">
                Internal Concierge Notes
              </label>
              <textarea
                name="notes"
                rows={2}
                value={formData.notes}
                onChange={handleChange}
                placeholder="VIP status, executive corporate affiliation, historical preferences..."
                className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[3px] text-sm text-[#13152C] placeholder-[#13152C]/40 focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#DFB76C]/30">
          <Link
            to="/guests"
            className="btn-luxury-secondary text-xs"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="btn-luxury-primary text-xs inline-flex items-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin text-[#DFB76C]" /> : <Save className="w-4 h-4 text-[#DFB76C]" />}
            <span>{isEdit ? 'Save Folio Changes' : 'Register VIP Guest'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
