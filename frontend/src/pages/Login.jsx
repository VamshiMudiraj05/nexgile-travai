import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Compass, Mail, Lock, ArrowRight, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

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
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle luxury architectural background accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#DFB76C]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#13152C]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-[2px] bg-[#13152C] border border-[#DFB76C]/40 text-[#DFB76C] shadow-md mb-4">
          <Compass className="w-7 h-7" />
        </div>
        <span className="block font-cinzel text-[11px] tracking-[0.25em] text-[#B88E43] uppercase">
          Nexgile-TravAI
        </span>
        <h1 className="mt-1 font-editorial text-3xl md:text-4xl text-[#13152C] tracking-tight">
          Hospitality Gateway
        </h1>
        <p className="mt-1 font-sans text-xs text-[#13152C]/70">
          Sign in to access property management, AI revenue intelligence, or traveler bookings.
        </p>
      </div>

      {/* Auth Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#FFFFFF] border border-[#2C315E]/15 rounded-[4px] p-8 sm:p-10 shadow-sm">
          {error && (
            <div className="mb-6 p-4 rounded-[2px] bg-rose-50 border border-rose-300 flex items-start gap-3 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block font-cinzel text-[10px] tracking-wider text-[#13152C] uppercase font-bold mb-2">
                Registered Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#13152C]/40">
                  <Mail className="w-4 h-4 text-[#B88E43]" />
                </div>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="executive@hotelgroup.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF6F0] border border-[#2C315E]/20 rounded-[2px] text-[#13152C] placeholder-[#13152C]/40 text-xs font-sans focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-cinzel text-[10px] tracking-wider text-[#13152C] uppercase font-bold mb-2">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#13152C]/40">
                  <Lock className="w-4 h-4 text-[#B88E43]" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF6F0] border border-[#2C315E]/20 rounded-[2px] text-[#13152C] placeholder-[#13152C]/40 text-xs font-sans focus:outline-none focus:border-[#DFB76C] focus:bg-[#FFFFFF] transition-all"
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 border border-[#DFB76C]/40 rounded-[2px] shadow-sm text-xs font-cinzel tracking-widest uppercase text-[#DFB76C] bg-[#13152C] hover:bg-[#1B1E3D] hover:border-[#DFB76C] focus:outline-none focus:ring-1 focus:ring-[#DFB76C] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#DFB76C]" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In &rarr;</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#2C315E]/10 text-center">
            <p className="font-sans text-xs text-[#13152C]/70">
              Need a platform account?{' '}
              <Link to="/register" className="font-bold text-[#B88E43] hover:text-[#13152C] transition-colors">
                Register here &rarr;
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
