import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, Loader2, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ROLE_OPTIONS, USER_ROLES } from '../utils/constants';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: USER_ROLES.TRAVELER,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validations
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError('Please fill out all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
      });

      setSuccess('Account created successfully! Redirecting to sign in...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Registration failed. Please try again.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#DFB76C]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#13152C]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-[2px] bg-[#13152C] border border-[#DFB76C]/40 text-[#DFB76C] shadow-md mb-4">
          <Compass className="w-7 h-7" />
        </div>
        <span className="block font-cinzel text-[11px] tracking-[0.25em] text-[#B88E43] uppercase">
          Nexgile-TravAI
        </span>
        <h1 className="mt-1 font-editorial text-3xl md:text-4xl text-[#13152C] tracking-tight">
          Create Account
        </h1>
        <p className="mt-1 font-sans text-xs text-[#13152C]/70">
          Join the premier enterprise hospitality and luxury travel platform.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#FFFFFF] border border-[#2C315E]/15 rounded-[4px] p-8 sm:p-10 shadow-sm">
          {error && (
            <div className="mb-6 p-4 rounded-[2px] bg-rose-50 border border-rose-300 flex items-start gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-[2px] bg-emerald-50 border border-emerald-300 flex items-start gap-3 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
              <span className="leading-relaxed">{success}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block font-cinzel text-[10px] tracking-wider text-[#13152C] uppercase font-bold mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#13152C]/40">
                  <User className="w-4 h-4 text-[#B88E43]" />
                </div>
                <input
                  id="register-name"
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Eleanor Vance"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF6F0] border border-[#2C315E]/20 rounded-[2px] text-[#13152C] placeholder-[#13152C]/40 text-xs font-sans focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-cinzel text-[10px] tracking-wider text-[#13152C] uppercase font-bold mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#13152C]/40">
                  <Mail className="w-4 h-4 text-[#B88E43]" />
                </div>
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="eleanor@luxurytravel.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF6F0] border border-[#2C315E]/20 rounded-[2px] text-[#13152C] placeholder-[#13152C]/40 text-xs font-sans focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-cinzel text-[10px] tracking-wider text-[#13152C] uppercase font-bold mb-1.5">
                Designated Role
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#13152C]/40">
                  <Shield className="w-4 h-4 text-[#B88E43]" />
                </div>
                <select
                  id="register-role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF6F0] border border-[#2C315E]/20 rounded-[2px] text-[#13152C] text-xs font-sans focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all appearance-none cursor-pointer"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} ({opt.value})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-cinzel text-[10px] tracking-wider text-[#13152C] uppercase font-bold mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#13152C]/40">
                  <Lock className="w-4 h-4 text-[#B88E43]" />
                </div>
                <input
                  id="register-password"
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF6F0] border border-[#2C315E]/20 rounded-[2px] text-[#13152C] placeholder-[#13152C]/40 text-xs font-sans focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-cinzel text-[10px] tracking-wider text-[#13152C] uppercase font-bold mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#13152C]/40">
                  <Lock className="w-4 h-4 text-[#B88E43]" />
                </div>
                <input
                  id="register-confirm-password"
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF6F0] border border-[#2C315E]/20 rounded-[2px] text-[#13152C] placeholder-[#13152C]/40 text-xs font-sans focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
                />
              </div>
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 border border-[#DFB76C]/40 rounded-[2px] shadow-sm text-xs font-cinzel tracking-widest uppercase text-[#DFB76C] bg-[#13152C] hover:bg-[#1B1E3D] hover:border-[#DFB76C] focus:outline-none focus:ring-1 focus:ring-[#DFB76C] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#DFB76C]" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account &rarr;</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#2C315E]/10 text-center">
            <p className="font-sans text-xs text-[#13152C]/70">
              Already registered?{' '}
              <Link to="/login" className="font-bold text-[#B88E43] hover:text-[#13152C] transition-colors">
                Sign in &rarr;
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
