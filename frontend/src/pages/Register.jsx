import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  User,
  Mail,
  Lock,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Shield
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ROLE_OPTIONS, USER_ROLES } from '../utils/constants';
import { getRoleHomePath } from '../utils/roleRouting';
import { Meteors } from '@/components/ui/meteors';

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

  const { register, login } = useAuth();
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

      setSuccess('Account created successfully! Logging you in...');

      // Immediately log the newly created user in and route to their persona workspace
      try {
        const loggedUser = await login(formData.email.trim(), formData.password);
        const targetPath = getRoleHomePath(loggedUser?.role);

        setTimeout(() => {
          navigate(targetPath, { replace: true });
        }, 600);
      } catch {
        setTimeout(() => {
          navigate('/login', {
            state: {
              prefillEmail: formData.email.trim(),
              prefillPassword: formData.password,
            },
          });
        }, 1000);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Registration failed. Please verify your details or use a different email.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C1E] text-[#FAF6F0] flex flex-col justify-center pt-20 pb-12 px-6 lg:px-12 relative overflow-hidden">
      {/* Subtle Celestial Meteors Effect */}
      <Meteors number={16} color="#DFB76C" trailColor="#B88E43" tailLength={60} className="opacity-25" />

      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-30 px-6 lg:px-12 py-3 flex items-center justify-between border-b border-[#2C315E]/70 bg-[#0B0C1E]/95 backdrop-blur-md">
        <Link
          to="/"
          className="flex items-center gap-2 group font-cinzel text-xs tracking-[0.2em] uppercase font-bold text-white hover:text-[#DFB76C] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#DFB76C] group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </Link>

        <Link
          to="/login"
          className="px-3.5 py-1.5 rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] hover:border-[#DFB76C]/60 text-[#DFB76C] font-cinzel text-[10px] tracking-wider uppercase transition shadow-sm font-semibold"
        >
          Sign In
        </Link>
      </header>

      {/* Main 2-Column Balanced Layout */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* Left Column: Registration Card (5 cols on lg) */}
        <div className="lg:col-span-6 xl:col-span-5 order-2 lg:order-1">
          {/* Brand Header */}
          <div className="mb-5">
            <Link to="/" className="inline-flex items-center gap-2.5 group cursor-pointer mb-2">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-[2px] bg-[#1B1E3D] border border-[#DFB76C]/40 group-hover:border-[#DFB76C] text-[#DFB76C] shadow-sm transition-colors">
                <Compass className="w-4 h-4 stroke-[1.5]" />
              </div>
              <span className="font-cinzel text-xs tracking-[0.2em] text-[#DFB76C] uppercase font-bold">
                Nexgile-TravAI
              </span>
            </Link>
            <h1 className="font-editorial text-2xl sm:text-3xl text-white font-bold tracking-tight">
              Create Your Account
            </h1>
            <p className="mt-1 font-sans text-xs text-white/70">
              Register for immediate access to property operations or guest travel services.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 sm:p-7 shadow-lg">
            {error && (
              <div className="mb-4 p-3 rounded-[2px] bg-rose-950/40 border border-rose-500/40 flex items-start gap-2.5 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-[2px] bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-2.5 text-emerald-300 text-xs">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                <span className="leading-relaxed">{success}</span>
              </div>
            )}

            <form className="space-y-3" onSubmit={handleSubmit}>
              <div>
                <label className="block font-cinzel text-[10px] tracking-wider text-[#DFB76C] uppercase font-bold mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                    <User className="w-4 h-4 text-[#DFB76C]" />
                  </div>
                  <input
                    id="register-name"
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Aarav Sharma"
                    className="w-full pl-10 pr-4 py-2 bg-[#1B1E3D] border border-[#2C315E] rounded-[2px] text-white placeholder-white/30 text-xs font-sans focus:outline-none focus:border-[#DFB76C] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-cinzel text-[10px] tracking-wider text-[#DFB76C] uppercase font-bold mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                    <Mail className="w-4 h-4 text-[#DFB76C]" />
                  </div>
                  <input
                    id="register-email"
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="aarav.sharma@example.com"
                    className="w-full pl-10 pr-4 py-2 bg-[#1B1E3D] border border-[#2C315E] rounded-[2px] text-white placeholder-white/30 text-xs font-sans focus:outline-none focus:border-[#DFB76C] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-cinzel text-[10px] tracking-wider text-[#DFB76C] uppercase font-bold mb-1">
                  Designated Role
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                    <Shield className="w-4 h-4 text-[#DFB76C]" />
                  </div>
                  <select
                    id="register-role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-[#1B1E3D] border border-[#2C315E] rounded-[2px] text-white text-xs font-sans focus:outline-none focus:border-[#DFB76C] transition-all appearance-none cursor-pointer"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#13152C] text-white">
                        {opt.label} ({opt.value})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-cinzel text-[10px] tracking-wider text-[#DFB76C] uppercase font-bold mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                      <Lock className="w-3.5 h-3.5 text-[#DFB76C]" />
                    </div>
                    <input
                      id="register-password"
                      type="password"
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min 6 chars"
                      className="w-full pl-9 pr-3 py-2 bg-[#1B1E3D] border border-[#2C315E] rounded-[2px] text-white placeholder-white/30 text-xs font-sans focus:outline-none focus:border-[#DFB76C] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-cinzel text-[10px] tracking-wider text-[#DFB76C] uppercase font-bold mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-white/40">
                      <Lock className="w-3.5 h-3.5 text-[#DFB76C]" />
                    </div>
                    <input
                      id="register-confirm-password"
                      type="password"
                      name="confirmPassword"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat password"
                      className="w-full pl-9 pr-3 py-2 bg-[#1B1E3D] border border-[#2C315E] rounded-[2px] text-white placeholder-white/30 text-xs font-sans focus:outline-none focus:border-[#DFB76C] transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                id="register-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 rounded-[2px] text-xs font-cinzel tracking-wider uppercase font-bold text-[#13152C] bg-[#DFB76C] hover:bg-[#F2D59B] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#13152C]" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Account &rarr;</span>
                )}
              </button>
            </form>

            <div className="mt-4 pt-3.5 border-t border-[#2C315E]/60 text-center">
              <p className="font-sans text-xs text-white/70">
                Already registered?{' '}
                <Link to="/login" className="font-bold text-[#DFB76C] hover:text-white transition-colors">
                  Sign in here &rarr;
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Institutional Security Panel (Matching Reference UI) */}
        <div className="lg:col-span-6 xl:col-span-7 order-1 lg:order-2 space-y-6">
          <div>
            <span className="font-cinzel text-xs tracking-[0.25em] text-[#DFB76C] uppercase font-semibold">
              MISSION-CRITICAL TRUST & GOVERNANCE
            </span>
            <h2 className="mt-1.5 font-editorial text-2xl sm:text-3xl text-white font-bold tracking-tight">
              Institutional Security Standards
            </h2>
            <p className="mt-2 font-sans text-xs sm:text-sm text-white/70 leading-relaxed">
              Nexgile-TravAI adheres to strict enterprise encryption, PCI-DSS Level 1 payment compliance, and regional data residency across all managed hotel properties.
            </p>
          </div>

          {/* 3 Core System Assurances */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3.5 rounded-[3px] bg-[#13152C] border border-[#2C315E]">
              <div className="w-7 h-7 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-editorial text-sm font-bold text-white">Automated Account Provisioning</h4>
                <p className="font-sans text-[11px] text-white/60 mt-0.5">
                  Instant role-based authorization linking your profile directly to property operational tools.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-[3px] bg-[#13152C] border border-[#2C315E]">
              <div className="w-7 h-7 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-editorial text-sm font-bold text-white">Central Ledger Protection</h4>
                <p className="font-sans text-[11px] text-white/60 mt-0.5">
                  Encrypted transaction verification ensuring complete auditability of all reservations and charges.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-[3px] bg-[#13152C] border border-[#2C315E]">
              <div className="w-7 h-7 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-editorial text-sm font-bold text-white">Enterprise Data Residency</h4>
                <p className="font-sans text-[11px] text-white/60 mt-0.5">
                  Full compliance with international GDPR, DPDP 2023, and localized guest data governance laws.
                </p>
              </div>
            </div>
          </div>

          {/* Compliance & Security Tags (From Reference Design) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {[
              'SOC2 TYPE II CERTIFIED',
              'PCI-DSS LEVEL 1 VALIDATED',
              'ISO 27001 CERTIFIED',
              'GDPR & DPDP 2023 COMPLIANT',
              '99.99% GUARANTEED SLA'
            ].map((badge, idx) => (
              <span
                key={idx}
                className="font-cinzel text-[10px] tracking-[0.16em] uppercase px-3 py-1.5 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] border border-[#2C315E] font-semibold shadow-xs"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
