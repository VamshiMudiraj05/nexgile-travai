import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Compass,
  Building2,
  Plane,
  Car,
  Shield,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Receipt,
  Globe,
  Radio,
  FileText
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getRoleHomePath } from '../utils/roleRouting';
import { Meteors } from '@/components/ui/meteors';
import CurrencySelector from '../components/CurrencySelector';

export default function LandingPage() {
  const navigate = useNavigate();
  const { login, logout, isAuthenticated } = useAuth();
  const [loggingInRole, setLoggingInRole] = useState(null);

  // Quick 1-click persona login handler
  const handleQuickLogin = async (email, rolePath) => {
    setLoggingInRole(email);
    try {
      const loggedUser = await login(email, 'password123');
      const targetPath = rolePath || getRoleHomePath(loggedUser?.role);
      navigate(targetPath, { replace: true });
    } catch (err) {
      console.warn('Direct login fallback, navigating to login page:', err.message);
      navigate('/login', { state: { prefillEmail: email, prefillPassword: 'password123' } });
    } finally {
      setLoggingInRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C1E] text-[#FAF6F0] font-sans selection:bg-[#DFB76C]/30 selection:text-white">

      {/* ========================================================
          1. TOP NAVIGATION BAR (Fixed, Compact & Connected)
         ======================================================== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0C1E]/95 backdrop-blur-md border-b border-[#2C315E]/70 px-6 lg:px-12 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-[2px] bg-[#1B1E3D] border border-[#DFB76C]/40 group-hover:border-[#DFB76C] flex items-center justify-center text-[#DFB76C] transition-colors shadow-sm">
              <Compass className="w-4 h-4 stroke-[1.5] group-hover:rotate-45 transition-transform duration-500 ease-out" />
            </div>
            <span className="font-cinzel text-base font-bold tracking-[0.2em] text-white group-hover:text-[#DFB76C] transition-colors">
              NEXGILE<span className="text-[#DFB76C]">-TRAVAI</span>
            </span>
          </Link>

          {/* Simple Navigation Links */}
          <div className="hidden md:flex items-center gap-8 font-cinzel text-[11px] tracking-[0.2em] text-[#FAF6F0]/80 uppercase">
            <a href="#features" className="hover:text-[#DFB76C] transition-colors">Features</a>
            <a href="#personas" className="hover:text-[#DFB76C] transition-colors">Demo Roles</a>
          </div>

          {/* User Auth CTAs */}
          <div className="flex items-center gap-3">
            <CurrencySelector />
            {isAuthenticated ? (
              <>
                <Link
                  to="/app"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-[#13152C] font-cinzel text-[11px] font-bold tracking-[0.16em] uppercase shadow-sm transition"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => logout()}
                  className="px-2.5 py-1 text-white/60 hover:text-white font-cinzel text-[10px] tracking-wider uppercase transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-white/80 hover:text-[#DFB76C] font-cinzel text-[11px] tracking-[0.16em] uppercase transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-[#13152C] font-cinzel text-[10px] font-bold tracking-[0.16em] uppercase shadow-sm transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ========================================================
          2. HERO SECTION (Connected to Navbar, Tight Spacing)
         ======================================================== */}
      <header className="relative pt-24 pb-14 sm:pt-28 sm:pb-16 px-6 lg:px-12 border-b border-[#2C315E]/60 overflow-hidden">
        {/* Subtle Celestial Meteors Effect */}
        <Meteors number={22} color="#DFB76C" trailColor="#B88E43" tailLength={75} className="opacity-40" />

        <div className="max-w-4xl mx-auto relative z-10 text-center">

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[2px] bg-[#1B1E3D] border border-[#DFB76C]/30 shadow-sm mb-4">
            <Sparkles className="w-3 h-3 text-[#DFB76C]" />
            <span className="font-cinzel text-[10px] tracking-[0.25em] text-[#DFB76C] uppercase font-semibold">
              All-In-One Hotel & Travel System
            </span>
          </div>

          {/* Simple, Clear Headline */}
          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-white font-bold tracking-tight leading-[1.18]">
            Hotel Operations & Travel Booking, Simplified.
          </h1>

          {/* Short Plain-English Subtitle */}
          <p className="mt-4 font-sans text-sm sm:text-base text-white/70 max-w-2xl mx-auto leading-relaxed">
            Manage your front desk, synchronize room inventory across OTAs in real time, automate corporate travel billing, and serve guests effortlessly.
          </p>

          {/* Clear Actions */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
            <a
              href="#personas"
              className="flex items-center gap-2 px-5 py-2.5 rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-[#13152C] font-cinzel text-xs font-bold tracking-[0.16em] uppercase shadow-sm transition"
            >
              <span>Try Demo Personas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            <Link
              to="/marketplace/multimodal"
              className="flex items-center gap-2 px-5 py-2.5 rounded-[2px] bg-[#1B1E3D] hover:bg-[#24284F] text-[#DFB76C] border border-[#2C315E] font-cinzel text-xs font-semibold tracking-[0.16em] uppercase transition"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Explore Marketplace</span>
            </Link>
          </div>

          {/* Key Operational Metrics */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-[4px] bg-[#13152C] border border-[#2C315E] text-center">
            <div>
              <div className="font-editorial text-2xl font-bold text-[#DFB76C]">99.9%</div>
              <div className="font-cinzel text-[9px] tracking-wider uppercase text-white/60 mt-0.5">Rate Parity Accuracy</div>
            </div>
            <div className="border-l border-[#2C315E]/60">
              <div className="font-editorial text-2xl font-bold text-[#DFB76C]">&lt;400ms</div>
              <div className="font-cinzel text-[9px] tracking-wider uppercase text-white/60 mt-0.5">Real-Time Sync</div>
            </div>
            <div className="border-l border-[#2C315E]/60">
              <div className="font-editorial text-2xl font-bold text-[#DFB76C]">10,000+</div>
              <div className="font-cinzel text-[9px] tracking-wider uppercase text-white/60 mt-0.5">Rooms Managed</div>
            </div>
            <div className="border-l border-[#2C315E]/60">
              <div className="font-editorial text-2xl font-bold text-[#DFB76C]">60+</div>
              <div className="font-cinzel text-[9px] tracking-wider uppercase text-white/60 mt-0.5">Currencies Supported</div>
            </div>
          </div>

        </div>
      </header>

      {/* ========================================================
          3. 1-CLICK INTERACTIVE DEMO PERSONAS
         ======================================================== */}
      <section id="personas" className="py-14 sm:py-16 px-6 lg:px-12 border-b border-[#2C315E]/60 bg-[#090A17]/70">
        <div className="max-w-7xl mx-auto">

          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-cinzel text-xs tracking-[0.25em] text-[#DFB76C] uppercase font-semibold">
              Instant Hands-On Evaluation
            </span>
            <h2 className="mt-1 font-editorial text-2xl sm:text-3xl text-white font-bold tracking-tight">
              Test Any Role in 1 Click
            </h2>
            <p className="mt-2 font-sans text-xs sm:text-sm text-white/70">
              Click any persona below to immediately log in and explore their tailored workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                role: 'ADMIN',
                badge: 'System Admin',
                title: 'Master Administrator',
                email: 'admin@nexgile.com',
                desc: 'Manage properties, user permissions, multi-currency settings, and audit logs.',
                path: '/dashboard',
                btn: 'Launch Admin Console',
                Icon: Shield,
              },
              {
                role: 'FRONT_DESK',
                badge: 'Front Office',
                title: 'Front Desk Agent',
                email: 'frontdesk@nexgile.com',
                desc: 'Check guests in and out, assign clean rooms, and split folio bills easily.',
                path: '/frontdesk/dashboard',
                btn: 'Launch Front Desk',
                Icon: Building2,
              },
              {
                role: 'REVENUE_MANAGER',
                badge: 'Revenue Strategy',
                title: 'Revenue Director',
                email: 'revenue@nexgile.com',
                desc: 'Update room rate plans, set channel markups, and protect direct rate parity.',
                path: '/revenue/recommendations',
                btn: 'Launch Revenue Suite',
                Icon: TrendingUp,
              },
              {
                role: 'FINANCE',
                badge: 'Accounting',
                title: 'Finance Controller',
                email: 'finance@nexgile.com',
                desc: 'Review corporate direct billing, invoice payments, and tax-exempt folios.',
                path: '/finance',
                btn: 'Launch Finance Portal',
                Icon: Receipt,
              },
              {
                role: 'TRAVELER',
                badge: 'Guest Experience',
                title: 'VIP Guest',
                email: 'traveler@nexgile.com',
                desc: 'Search hotel rooms, book flights and chauffeur transfers, and manage stays.',
                path: '/traveler/dashboard',
                btn: 'Launch Guest Hub',
                Icon: Globe,
              },
              {
                role: 'HOUSEKEEPING',
                badge: 'Turnover Operations',
                title: 'Housekeeping Lead',
                email: 'housekeeping@nexgile.com',
                desc: 'Track room cleaning priority, report maintenance repairs, and release rooms.',
                path: '/housekeeping',
                btn: 'Launch Housekeeping',
                Icon: Sparkles,
              },
            ].map((p) => {
              const IconComp = p.Icon;
              const isLoading = loggingInRole === p.email;
              return (
                <div
                  key={p.email}
                  className="bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/60 rounded-[4px] p-5 shadow-sm transition-all hover:-translate-y-0.5 flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Uniform Luxury Badge & Framed Icon */}
                    <div className="flex items-center justify-between mb-3.5">
                      <span className="font-cinzel text-[9px] tracking-[0.18em] uppercase font-semibold px-2.5 py-1 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] border border-[#2C315E]">
                        {p.badge}
                      </span>
                      <div className="w-7 h-7 rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] group-hover:border-[#DFB76C]/40 flex items-center justify-center text-[#DFB76C] transition-colors">
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    <h3 className="font-editorial text-lg font-bold text-white">
                      {p.title}
                    </h3>
                    <p className="mt-0.5 font-mono text-[11px] text-[#DFB76C]/70">
                      {p.email}
                    </p>
                    <p className="mt-2.5 font-sans text-xs text-white/70 leading-relaxed min-h-[40px]">
                      {p.desc}
                    </p>
                  </div>

                  <button
                    onClick={() => handleQuickLogin(p.email, p.path)}
                    disabled={isLoading}
                    className="mt-5 w-full flex items-center justify-center gap-2 py-2 rounded-[2px] bg-[#1B1E3D] hover:bg-[#DFB76C] text-[#DFB76C] hover:text-[#13152C] border border-[#DFB76C]/30 font-cinzel text-[11px] tracking-[0.16em] uppercase font-bold transition cursor-pointer disabled:opacity-50"
                  >
                    <span>{isLoading ? 'Signing In...' : p.btn}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================
          4. CORE PLATFORM CAPABILITIES
         ======================================================== */}
      <section id="features" className="py-14 sm:py-16 px-6 lg:px-12 border-b border-[#2C315E]/60">
        <div className="max-w-7xl mx-auto">

          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="font-cinzel text-xs tracking-[0.25em] text-[#DFB76C] uppercase font-semibold">
              Essential Tools
            </span>
            <h2 className="mt-1 font-editorial text-2xl sm:text-3xl text-white font-bold tracking-tight">
              Everything Needed to Run Your Property
            </h2>
            <p className="mt-2 font-sans text-xs sm:text-sm text-white/70">
              Reliable modules designed to handle everyday hotel front office, distribution, and corporate travel tasks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Feature 1: PMS Multi-Folio */}
            <div className="bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/50 rounded-[4px] p-6 transition">
              <div className="w-9 h-9 rounded-[2px] bg-[#1B1E3D] border border-[#DFB76C]/30 text-[#DFB76C] flex items-center justify-center mb-4">
                <Receipt className="w-4 h-4" />
              </div>
              <h3 className="font-editorial text-xl font-bold text-white">
                Front Desk & Split-Folio Billing
              </h3>
              <p className="mt-2 font-sans text-xs text-white/70 leading-relaxed">
                Check in guests, issue digital room keys, and split bills seamlessly between room charges, incidentals, and corporate direct billing accounts.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Link
                  to="/reservations"
                  className="font-cinzel text-[11px] tracking-wider uppercase text-[#DFB76C] hover:text-[#F2D59B] inline-flex items-center gap-1.5 font-semibold"
                >
                  <span>View Reservations</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Feature 2: ARI Channel Manager */}
            <div className="bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/50 rounded-[4px] p-6 transition">
              <div className="w-9 h-9 rounded-[2px] bg-[#1B1E3D] border border-[#DFB76C]/30 text-[#DFB76C] flex items-center justify-center mb-4">
                <Radio className="w-4 h-4" />
              </div>
              <h3 className="font-editorial text-xl font-bold text-white">
                Two-Way Channel Manager
              </h3>
              <p className="mt-2 font-sans text-xs text-white/70 leading-relaxed">
                Automatically push room availability, pricing rules, and stop-sells to Booking.com and Expedia. Eliminate double bookings with sub-second sync.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Link
                  to="/distribution/channels"
                  className="font-cinzel text-[11px] tracking-wider uppercase text-[#DFB76C] hover:text-[#F2D59B] inline-flex items-center gap-1.5 font-semibold"
                >
                  <span>View Channel Sync</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Feature 3: Multimodal Travel */}
            <div className="bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/50 rounded-[4px] p-6 transition">
              <div className="w-9 h-9 rounded-[2px] bg-[#1B1E3D] border border-[#DFB76C]/30 text-[#DFB76C] flex items-center justify-center mb-4">
                <Plane className="w-4 h-4" />
              </div>
              <h3 className="font-editorial text-xl font-bold text-white">
                Multimodal Travel Marketplace
              </h3>
              <p className="mt-2 font-sans text-xs text-white/70 leading-relaxed">
                Let guests reserve luxury hotel rooms, flights, and chauffeur cars in a single checkout cart with transparent, multi-currency pricing.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Link
                  to="/marketplace/multimodal"
                  className="font-cinzel text-[11px] tracking-wider uppercase text-[#DFB76C] hover:text-[#F2D59B] inline-flex items-center gap-1.5 font-semibold"
                >
                  <span>Open Travel Hub</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Feature 4: Corporate Expenses */}
            <div className="bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/50 rounded-[4px] p-6 transition">
              <div className="w-9 h-9 rounded-[2px] bg-[#1B1E3D] border border-[#DFB76C]/30 text-[#DFB76C] flex items-center justify-center mb-4">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="font-editorial text-xl font-bold text-white">
                Corporate Expense OCR Engine
              </h3>
              <p className="mt-2 font-sans text-xs text-white/70 leading-relaxed">
                Auto-scan travel receipts, extract line items and taxes with automated OCR, and verify company policy compliance before invoice submission.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Link
                  to="/corporate/expenses"
                  className="font-cinzel text-[11px] tracking-wider uppercase text-[#DFB76C] hover:text-[#F2D59B] inline-flex items-center gap-1.5 font-semibold"
                >
                  <span>View Expense Portal</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          5. MARKETPLACE SERVICE PREVIEWS
         ======================================================== */}
      <section className="py-14 sm:py-16 px-6 lg:px-12 border-b border-[#2C315E]/60 bg-[#090A17]/70">
        <div className="max-w-7xl mx-auto">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="font-cinzel text-xs tracking-[0.25em] text-[#DFB76C] uppercase font-semibold">
                Guest Experience
              </span>
              <h2 className="mt-1 font-editorial text-2xl sm:text-3xl text-white font-bold tracking-tight">
                Curated Travel Services
              </h2>
            </div>
            <Link
              to="/marketplace/multimodal"
              className="font-cinzel text-xs tracking-wider uppercase text-[#DFB76C] hover:underline inline-flex items-center gap-1.5 font-semibold"
            >
              <span>View All Inventory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="bg-[#13152C] border border-[#2C315E] rounded-[3px] p-4.5 hover:border-[#DFB76C]/60 transition">
              <div className="w-8 h-8 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] flex items-center justify-center mb-3">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-cinzel text-[9px] tracking-widest text-[#DFB76C] uppercase font-semibold">Luxury Stays</span>
              <h4 className="mt-1 font-editorial text-base font-bold text-white">Deluxe Royal Suite</h4>
              <p className="text-[11px] text-white/60 mt-1">King Bed, Sea View, Lounge Access</p>
              <div className="mt-3 pt-3 border-t border-[#2C315E]/60 flex justify-between items-center text-xs">
                <span className="font-bold text-[#DFB76C]">₹220<span className="text-[10px] text-white/40 font-normal">/night</span></span>
                <Link to="/marketplace/multimodal" className="font-cinzel text-[10px] uppercase text-[#DFB76C] hover:underline font-semibold">Book →</Link>
              </div>
            </div>

            <div className="bg-[#13152C] border border-[#2C315E] rounded-[3px] p-4.5 hover:border-[#DFB76C]/60 transition">
              <div className="w-8 h-8 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] flex items-center justify-center mb-3">
                <Plane className="w-4 h-4" />
              </div>
              <span className="font-cinzel text-[9px] tracking-widest text-[#DFB76C] uppercase font-semibold">Direct Flights</span>
              <h4 className="mt-1 font-editorial text-base font-bold text-white">Business Class Ticket</h4>
              <p className="text-[11px] text-white/60 mt-1">Direct Flight, Fast-Track Security</p>
              <div className="mt-3 pt-3 border-t border-[#2C315E]/60 flex justify-between items-center text-xs">
                <span className="font-bold text-[#DFB76C]">₹480<span className="text-[10px] text-white/40 font-normal">/trip</span></span>
                <Link to="/marketplace/multimodal" className="font-cinzel text-[10px] uppercase text-[#DFB76C] hover:underline font-semibold">Book →</Link>
              </div>
            </div>

            <div className="bg-[#13152C] border border-[#2C315E] rounded-[3px] p-4.5 hover:border-[#DFB76C]/60 transition">
              <div className="w-8 h-8 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] flex items-center justify-center mb-3">
                <Car className="w-4 h-4" />
              </div>
              <span className="font-cinzel text-[9px] tracking-widest text-[#DFB76C] uppercase font-semibold">Chauffeur</span>
              <h4 className="mt-1 font-editorial text-base font-bold text-white">Mercedes-Benz S-Class</h4>
              <p className="text-[11px] text-white/60 mt-1">VIP Airport Meet & Transfer</p>
              <div className="mt-3 pt-3 border-t border-[#2C315E]/60 flex justify-between items-center text-xs">
                <span className="font-bold text-[#DFB76C]">₹95<span className="text-[10px] text-white/40 font-normal">/transfer</span></span>
                <Link to="/marketplace/multimodal" className="font-cinzel text-[10px] uppercase text-[#DFB76C] hover:underline font-semibold">Book →</Link>
              </div>
            </div>

            <div className="bg-[#13152C] border border-[#2C315E] rounded-[3px] p-4.5 hover:border-[#DFB76C]/60 transition">
              <div className="w-8 h-8 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] flex items-center justify-center mb-3">
                <Compass className="w-4 h-4" />
              </div>
              <span className="font-cinzel text-[9px] tracking-widest text-[#DFB76C] uppercase font-semibold">Experiences</span>
              <h4 className="mt-1 font-editorial text-base font-bold text-white">Scenic Helicopter Tour</h4>
              <p className="text-[11px] text-white/60 mt-1">45-min Coastal Flight Experience</p>
              <div className="mt-3 pt-3 border-t border-[#2C315E]/60 flex justify-between items-center text-xs">
                <span className="font-bold text-[#DFB76C]">₹210<span className="text-[10px] text-white/40 font-normal">/guest</span></span>
                <Link to="/marketplace/multimodal" className="font-cinzel text-[10px] uppercase text-[#DFB76C] hover:underline font-semibold">Book →</Link>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          6. INSTITUTIONAL SECURITY STANDARDS (Reference Design)
         ======================================================== */}
      <section className="relative overflow-hidden py-14 sm:py-16 px-6 lg:px-12 bg-[#0D0E20] border-b border-[#2C315E]">
        {/* Subtle Meteors Background Streak Effect */}
        <Meteors number={18} color="#DFB76C" trailColor="#F2D59B" tailLength={60} className="opacity-30" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

          <div className="max-w-xl">
            <span className="font-cinzel text-xs tracking-[0.25em] text-[#DFB76C] uppercase font-semibold">
              MISSION-CRITICAL TRUST & GOVERNANCE
            </span>
            <h3 className="mt-1.5 font-editorial text-2xl sm:text-3xl text-white font-bold tracking-tight">
              Institutional Security Standards
            </h3>
            <p className="mt-2 font-sans text-xs sm:text-sm text-white/70 leading-relaxed">
              Nexgile-TravAI adheres to strict enterprise encryption, PCI-DSS Level 1 payment compliance, and regional data residency across all managed hotel properties.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 max-w-lg">
            {[
              'SOC2 TYPE II CERTIFIED',
              'PCI-DSS LEVEL 1 VALIDATED',
              'ISO 27001 CERTIFIED',
              'GDPR & DPDP 2023 COMPLIANT',
              '99.99% GUARANTEED SLA'
            ].map((badge, idx) => (
              <span
                key={idx}
                className="font-cinzel text-[10px] tracking-[0.16em] uppercase px-3 py-1.5 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] border border-[#2C315E] shadow-sm font-semibold"
              >
                {badge}
              </span>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================
          7. MINIMAL ENTERPRISE FOOTER
         ======================================================== */}
      <footer className="bg-[#080915] text-white/60 py-12 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">

          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[2px] bg-[#1B1E3D] border border-[#DFB76C]/40 flex items-center justify-center text-[#DFB76C]">
                <Compass className="w-3.5 h-3.5" />
              </div>
              <span className="font-cinzel text-sm font-bold tracking-[0.18em] text-white">
                NEXGILE<span className="text-[#DFB76C]">-TRAVAI</span>
              </span>
            </div>
            <p className="mt-3 font-sans text-xs text-white/60 leading-relaxed">
              Unified hospitality management and travel booking system built for hotel teams and guests.
            </p>
            <p className="mt-3 font-mono text-[10px] text-white/40">
              © {new Date().getFullYear()} Nexgile Technologies. All rights reserved.
            </p>
          </div>

          <div>
            <h4 className="font-cinzel text-[11px] tracking-wider uppercase font-bold text-white mb-3">
              Platform Features
            </h4>
            <ul className="space-y-2 font-sans text-xs text-white/60">
              <li><Link to="/reservations" className="hover:text-[#DFB76C] transition-colors">Front Desk & Reservations</Link></li>
              <li><Link to="/distribution/channels" className="hover:text-[#DFB76C] transition-colors">Channel Manager (ARI)</Link></li>
              <li><Link to="/marketplace/multimodal" className="hover:text-[#DFB76C] transition-colors">Travel Marketplace</Link></li>
              <li><Link to="/corporate/expenses" className="hover:text-[#DFB76C] transition-colors">Corporate Travel Expenses</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-cinzel text-[11px] tracking-wider uppercase font-bold text-white mb-3">
              Quick Links
            </h4>
            <ul className="space-y-2 font-sans text-xs text-white/60">
              <li><a href="#features" className="hover:text-[#DFB76C] transition-colors">Core Capabilities</a></li>
              <li><a href="#personas" className="hover:text-[#DFB76C] transition-colors">Interactive Demo Roles</a></li>
              <li><a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="hover:text-[#DFB76C] transition-colors">Backend API Specs</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-cinzel text-[11px] tracking-wider uppercase font-bold text-white mb-3">
              Access Gateway
            </h4>
            <p className="font-sans text-xs text-white/60 mb-3">
              Sign in with your email or test any role in 1 click.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full text-center py-2 rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-[#13152C] font-cinzel text-[11px] font-bold tracking-wider uppercase transition shadow-sm"
              >
                Sign In
              </Link>
              <a
                href="#personas"
                className="w-full text-center py-2 rounded-[2px] bg-[#1B1E3D] hover:bg-[#24284F] text-[#DFB76C] border border-[#2C315E] font-cinzel text-[11px] tracking-wider uppercase transition"
              >
                Test Demo Roles
              </a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
