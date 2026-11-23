import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  Mail,
  Lock,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Meteors } from '@/components/ui/meteors';

export const Login = () => {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.prefillEmail || '');
  const [password, setPassword] = useState(
    location.state?.prefillPassword || (location.state?.prefillEmail ? 'password123' : '')
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleQuickDemoLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
    setIsSubmitting(true);
    try {
      const loggedUser = await login(demoEmail, 'password123');
      let targetPath = from;
      if (from === '/dashboard' || !location.state?.from) {
        if (loggedUser?.role === 'FRONT_DESK') targetPath = '/frontdesk/dashboard';
        else if (loggedUser?.role === 'FINANCE') targetPath = '/finance';
        else if (loggedUser?.role === 'MAINTENANCE') targetPath = '/maintenance';
        else if (loggedUser?.role === 'HOUSEKEEPING') targetPath = '/housekeeping';
        else if (loggedUser?.role === 'TRAVELER') targetPath = '/marketplace';
        else if (loggedUser?.role === 'REVENUE_MANAGER') targetPath = '/revenue/recommendations';
        else targetPath = '/dashboard';
      }
      navigate(targetPath, { replace: true });
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Unable to sign in. Please verify credentials.';
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await login(email, password);
      let targetPath = from;
      if (from === '/dashboard' || !location.state?.from) {
        if (loggedUser?.role === 'FRONT_DESK') targetPath = '/frontdesk/dashboard';
        else if (loggedUser?.role === 'FINANCE') targetPath = '/finance';
        else if (loggedUser?.role === 'MAINTENANCE') targetPath = '/maintenance';
        else if (loggedUser?.role === 'HOUSEKEEPING') targetPath = '/housekeeping';
        else if (loggedUser?.role === 'TRAVELER') targetPath = '/marketplace';
        else if (loggedUser?.role === 'REVENUE_MANAGER') targetPath = '/revenue/recommendations';
        else targetPath = '/dashboard';
      }
      navigate(targetPath, { replace: true });
    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Unable to sign in. Please verify your credentials and ensure backend is running.';
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
          to="/register"
          className="px-3.5 py-1.5 rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] hover:border-[#DFB76C]/60 text-[#DFB76C] font-cinzel text-[10px] tracking-wider uppercase transition shadow-sm font-semibold"
        >
          Create Account
        </Link>
      </header>

      {/* Main 2-Column Balanced Layout */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* Left Column: Login Card (5 cols on lg) */}
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
              Sign In to Platform
            </h1>
            <p className="mt-1 font-sans text-xs text-white/70">
              Enter your credentials to access your management dashboard or traveler bookings.
            </p>
          </div>

          {/* Auth Card */}
          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 sm:p-7 shadow-lg">
            {error && (
              <div className="mb-4 p-3 rounded-[2px] bg-rose-950/40 border border-rose-500/40 flex items-start gap-2.5 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form className="space-y-3.5" onSubmit={handleSubmit}>
              <div>
                <label className="block font-cinzel text-[10px] tracking-wider text-[#DFB76C] uppercase font-bold mb-1">
                  Registered Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                    <Mail className="w-4 h-4 text-[#DFB76C]" />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@nexgile.com"
                    className="w-full pl-10 pr-4 py-2 bg-[#1B1E3D] border border-[#2C315E] rounded-[2px] text-white placeholder-white/30 text-xs font-sans focus:outline-none focus:border-[#DFB76C] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-cinzel text-[10px] tracking-wider text-[#DFB76C] uppercase font-bold mb-1">
                  Security Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                    <Lock className="w-4 h-4 text-[#DFB76C]" />
                  </div>
                  <input
                    id="login-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2 bg-[#1B1E3D] border border-[#2C315E] rounded-[2px] text-white placeholder-white/30 text-xs font-sans focus:outline-none focus:border-[#DFB76C] transition-all"
                  />
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-[2px] text-xs font-cinzel tracking-wider uppercase font-bold text-[#13152C] bg-[#DFB76C] hover:bg-[#F2D59B] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#13152C]" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Sign In &rarr;</span>
                )}
              </button>
            </form>

            {/* Quick 1-Click Demo Evaluation */}
            <div className="mt-5 pt-4 border-t border-[#2C315E]/60">
              <span className="block font-cinzel text-[10px] tracking-widest text-[#DFB76C] uppercase text-center font-bold mb-2.5">
                Quick 1-Click Demo Logins
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { label: 'Admin', email: 'admin@nexgile.com' },
                  { label: 'Front Desk', email: 'frontdesk@nexgile.com' },
                  { label: 'Revenue', email: 'revenue@nexgile.com' },
                  { label: 'Finance', email: 'finance@nexgile.com' },
                  { label: 'VIP Guest', email: 'traveler@nexgile.com' },
                  { label: 'Housekeeping', email: 'housekeeping@nexgile.com' },
                ].map((p) => (
                  <button
                    key={p.email}
                    type="button"
                    onClick={() => handleQuickDemoLogin(p.email)}
                    disabled={isSubmitting}
                    className="px-2.5 py-1.5 rounded-[2px] bg-[#1B1E3D] hover:bg-[#24284F] border border-[#2C315E] hover:border-[#DFB76C]/60 text-white/90 font-cinzel text-[9px] tracking-wider uppercase font-semibold transition text-center truncate cursor-pointer disabled:opacity-50"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-[10px] text-white/40 font-sans">
                Click any role to sign in instantly with pre-seeded demo access
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
                <h4 className="font-editorial text-sm font-bold text-white">Role-Based Access Control</h4>
                <p className="font-sans text-[11px] text-white/60 mt-0.5">
                  Partitioned permissions for front desk clerks, revenue managers, controllers, and guests.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-[3px] bg-[#13152C] border border-[#2C315E]">
              <div className="w-7 h-7 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-editorial text-sm font-bold text-white">Real-Time Channel Synchronization</h4>
                <p className="font-sans text-[11px] text-white/60 mt-0.5">
                  Sub-second rate and room availability parity with major online travel agencies.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-[3px] bg-[#13152C] border border-[#2C315E]">
              <div className="w-7 h-7 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-editorial text-sm font-bold text-white">Audited Financial Folios</h4>
                <p className="font-sans text-[11px] text-white/60 mt-0.5">
                  Immutable double-entry guest billing with automated tax segregation and split invoicing.
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
