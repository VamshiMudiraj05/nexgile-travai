import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Calendar,
  Building2,
  BedDouble,
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  X,
  ShieldCheck,
  Crown,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Receipt,
  Layers,
  Wrench,
  Users,
  Compass,
  Briefcase,
  DollarSign
} from 'lucide-react';
import { conciergeService } from '../../services/conciergeService';
import { useAuth } from '../../hooks/useAuth';

export default function Concierge() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialReservationId = searchParams.get('reservation_id');

  const [welcomeData, setWelcomeData] = useState(null);
  const [loadingWelcome, setLoadingWelcome] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [serviceNotification, setServiceNotification] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [isErrorState, setIsErrorState] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const userRole = (welcomeData?.role || user?.role || 'TRAVELER').toUpperCase();

  const roleHome = useMemo(() => {
    switch (userRole) {
      case 'FRONT_DESK':
        return { path: '/frontdesk/dashboard', label: 'Front Desk Hub' };
      case 'ADMIN':
        return { path: '/dashboard', label: 'Executive Dashboard' };
      case 'REVENUE_MANAGER':
        return { path: '/revenue/recommendations', label: 'Revenue Hub' };
      case 'FINANCE':
        return { path: '/finance', label: 'Finance Hub' };
      case 'HOUSEKEEPING':
        return { path: '/housekeeping', label: 'Housekeeping Board' };
      default:
        return { path: '/traveler/dashboard', label: 'Traveler Dashboard' };
    }
  }, [userRole]);

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(roleHome.path);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roleHome]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchWelcome();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const fetchWelcome = async () => {
    try {
      setLoadingWelcome(true);
      setIsErrorState(false);
      const data = await conciergeService.getWelcome();
      setWelcomeData(data);
    } catch (err) {
      console.error('Failed to load concierge welcome:', err);
      setIsErrorState(true);
    } finally {
      setLoadingWelcome(false);
    }
  };

  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isThinking) return;

    setInputValue('');
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsThinking(true);

    try {
      const historyPayload = updatedMessages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const res = await conciergeService.chat(
        text,
        initialReservationId || welcomeData?.active_stay?.reservation_id,
        historyPayload
      );

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'concierge',
        text: res.message,
        action: res.suggested_action,
        poweredBy: res.powered_by,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Concierge chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'concierge',
          text: 'AI Copilot is currently recalibrating. You can continue managing your properties and operations through the menu.',
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleExecuteAction = async (action) => {
    if (!action || actionInProgress) return;
    setActionInProgress(true);

    try {
      if (action.action_type === 'CREATE_SERVICE_REQUEST') {
        const payload = action.payload || {};
        const stay = welcomeData?.active_stay;
        await conciergeService.createServiceRequest({
          category: payload.category || 'CONCIERGE',
          item: payload.item || 'Special Request',
          details: payload.details || 'Guest requested via ASK NEXGILE',
          reservation_id: payload.reservation_id || stay?.reservation_id,
          property_id: payload.property_id || stay?.property_id,
          room_number: payload.room_number || stay?.room_number,
        });

        setServiceNotification(`Your request for "${payload.item || 'Service'}" has been submitted!`);
        setTimeout(() => setServiceNotification(null), 4500);

        setMessages((prev) => [
          ...prev,
          {
            id: `bot-conf-${Date.now()}`,
            sender: 'concierge',
            text: `✓ Registered **${payload.item}** for **Room ${payload.room_number || stay?.room_number || 'Suite'}**. Hotel desk has been notified.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else if (action.action_type === 'VIEW_RESERVATION') {
        const resId = action.payload?.reservation_id || welcomeData?.active_stay?.reservation_id;
        if (resId) {
          navigate(`/my-trips/${resId}`);
        } else {
          navigate('/my-trips');
        }
      } else if (action.action_type === 'VIEW_MODULE' && action.payload?.route) {
        navigate(action.payload.route);
      } else if (action.action_type === 'BROWSE_MARKETPLACE') {
        navigate('/marketplace');
      }
    } catch (err) {
      console.error('Failed to execute action:', err);
      alert('Unable to process the request right now. Please try again or use the main dashboard.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleQuickActionClick = (prompt) => {
    handleSendMessage(prompt);
  };

  // Role Profile Configuration
  const roleProfile = useMemo(() => {
    switch (userRole) {
      case 'ADMIN':
        return {
          badge: 'EXECUTIVE OPERATIONS COPILOT',
          title: 'Executive Operations Command',
          subtitle: 'Enterprise Portfolio Analytics · Cross-Property Oversight across 21 Luxury Estates',
          welcomeMsg: 'Connected to live enterprise MongoDB. Query portfolio occupancy, property capacity, executive revenue, or operational maintenance.',
          assistantName: 'ASK NEXGILE · EXECUTIVE COPILOT',
          quickActions: [
            { title: 'PORTFOLIO SUMMARY', sub: '21 Estates Overview', prompt: 'Summarize portfolio occupancy and arrivals across all 21 properties.' },
            { title: 'OCCUPANCY DRIFT', sub: 'Low Capacity Watch', prompt: 'Which properties currently have the lowest occupancy rate?' },
            { title: 'MAINTENANCE QUEUE', sub: 'Work Orders', prompt: 'List any unresolved critical maintenance work orders.' },
            { title: 'OPERATIONAL BRIEF', sub: 'Front Desk Sync', prompt: "Give me an executive briefing on today's front desk operations." },
            { title: 'CHANNEL REVENUE', sub: 'Direct vs OTAs', prompt: 'How is direct website revenue performing compared to OTAs?' },
            { title: 'RATE DIRECTIVES', sub: 'Yield Strategy', prompt: 'What are the active dynamic rate recommendations for our suites?' }
          ]
        };
      case 'FRONT_DESK':
        return {
          badge: 'FRONT DESK COMMAND COPILOT',
          title: 'Front Desk Operations & Guest Dispatch',
          subtitle: 'Live Arrivals & Departures · In-House Folios · Turnaround Readiness',
          welcomeMsg: 'Front Desk Command is live. Query scheduled guest arrivals, departures, available clean suites, or key billing folios.',
          assistantName: 'ASK NEXGILE · FRONT DESK COPILOT',
          quickActions: [
            { title: "TODAY'S ARRIVALS", sub: 'Expected Check-ins', prompt: 'Who are the expected arrivals scheduled for today?' },
            { title: 'READY SUITES', sub: 'Clean & Inspected', prompt: 'Which suites are clean, inspected, and ready for walk-ins?' },
            { title: 'DEPARTURES TODAY', sub: 'Pending Check-outs', prompt: 'Which in-house guests are scheduled for check-out today?' },
            { title: 'FOLIO BILLING', sub: 'Balance & Settle', prompt: 'How do I look up and settle a guest billing folio?' },
            { title: 'ROOM TURNAROUND', sub: 'Dirty & In Progress', prompt: 'How many suites are currently dirty or in turnaround?' },
            { title: 'GUEST TICKETS', sub: 'Towels & Requests', prompt: 'List active guest service requests for towels or amenities.' }
          ]
        };
      case 'REVENUE_MANAGER':
        return {
          badge: 'REVENUE & YIELD COPILOT',
          title: 'Revenue Strategy & Dynamic Yield Intelligence',
          subtitle: 'Algorithmic Pricing Directives · ADR/RevPAR · Demand Velocity',
          welcomeMsg: 'Algorithmic yield optimization engine is active. Query ADR, RevPAR, dynamic pricing recommendations, or rate restrictions.',
          assistantName: 'ASK NEXGILE · REVENUE COPILOT',
          quickActions: [
            { title: 'YIELD DIRECTIVES', sub: '41 Recommendations', prompt: 'Explain the current dynamic rate recommendations for our luxury suites.' },
            { title: 'DEMAND SURGE', sub: 'Weekend Optimization', prompt: 'Which properties should we apply weekend demand surge pricing to?' },
            { title: 'VELOCITY TRENDS', sub: 'Booking Pace', prompt: 'Compare weekday vs weekend booking velocity trends.' },
            { title: 'RATE PARITY', sub: 'OTA Surveillance', prompt: 'What is our current rate parity status across Booking.com and Expedia?' },
            { title: 'DIRECT RATIO', sub: 'Commission Savings', prompt: 'What is our direct booking revenue ratio vs OTA commissions?' },
            { title: 'ADR & REVPAR', sub: 'Estate Performance', prompt: 'Summarize our average daily rate across resort and palace properties.' }
          ]
        };
      case 'FINANCE':
        return {
          badge: 'FINANCE & AUDIT COPILOT',
          title: 'Hospitality Finance & Folio Audit Intelligence',
          subtitle: 'Razorpay Gateway · Unsettled Folios · Corporate Ledger Accounting',
          welcomeMsg: 'Financial auditing and folio reconciliation engine is online. Query transaction logs, pending folios, or corporate billing accounts.',
          assistantName: 'ASK NEXGILE · FINANCE COPILOT',
          quickActions: [
            { title: 'GATEWAY SETTLEMENT', sub: 'Razorpay Connect', prompt: "Summarize today's Razorpay payment transactions and settlement status." },
            { title: 'UNSETTLED FOLIOS', sub: 'Pending Balances', prompt: 'List active in-house reservations with pending folio balances.' },
            { title: 'CORPORATE BILLING', sub: 'Invoices & Ledger', prompt: 'Show corporate billing contracts and expense invoice reconciliation.' },
            { title: 'REVENUE AUDIT', sub: 'RevPAR Accounting', prompt: 'Explain our month-to-date RevPAR and room revenue performance.' },
            { title: 'DISPUTE PROTOCOL', sub: 'Billing Chargebacks', prompt: 'What are the protocol guidelines for uncollected room balances?' },
            { title: 'TAX COMPLIANCE', sub: 'GST & Hospitality', prompt: 'How are GST and luxury hospitality taxes calculated on folios?' }
          ]
        };
      case 'HOUSEKEEPING':
        return {
          badge: 'HOUSEKEEPING COPILOT',
          title: 'Room Turnaround & Inspection Dispatch',
          subtitle: 'Cleaning Queues · Inspection Readiness · Amenity Replenishment',
          welcomeMsg: 'Housekeeping turnaround dispatch is online. Query room cleaning priorities, inspection readiness, or guest amenity requests.',
          assistantName: 'ASK NEXGILE · HOUSEKEEPING COPILOT',
          quickActions: [
            { title: 'DIRTY QUEUE', sub: 'Floor Turnaround', prompt: 'Which suites are currently marked DIRTY on Floor 1 and Floor 2?' },
            { title: 'READY TO INSPECT', sub: 'Supervisor Queue', prompt: 'Show suites in turnaround ready for supervisor inspection.' },
            { title: 'AMENITY REQUESTS', sub: 'Towels & Pillows', prompt: 'List all active guest requests for extra towels, linens, or amenities.' },
            { title: 'VIP PROTOCOLS', sub: 'Presidential Suites', prompt: 'What are the standard turnover protocols for Presidential Suites?' },
            { title: 'TURNAROUND PACE', sub: 'Cleaning Efficiency', prompt: 'How can we optimize suite turnaround velocity between check-outs?' },
            { title: 'MAINTENANCE BLOCK', sub: 'Work Order Sync', prompt: 'Are there any suites with active maintenance blockers?' }
          ]
        };
      default: // TRAVELER
        return {
          badge: 'BESPOKE 5-STAR CONCIERGE',
          title: 'Personal Luxury Travel Concierge',
          subtitle: '24/7 Bespoke Resident Care · Curated Dining & VIP Experiences',
          welcomeMsg: `Welcome, ${user?.name ? user.name.replace(/\s*\(.*?\)\s*/g, '').trim() : 'Valued Resident'}. Ask me anything about your room, complimentary amenities, fine dining, or request room service.`,
          assistantName: 'ASK NEXGILE · LUXURY CONCIERGE',
          quickActions: [
            { title: 'MY RESERVATION', sub: 'Dates & Room', prompt: 'What is my booking reference and stay details?' },
            { title: 'MY REQUESTS', sub: 'Status & Towels', prompt: 'Show my service requests and their live status.' },
            { title: 'HOTEL INFORMATION', sub: 'Amenities & Pool', prompt: 'What amenities and dining does my hotel offer?' },
            { title: 'PLAN MY TRIP', sub: 'Day Itineraries', prompt: 'Plan a 3-day luxury trip itinerary.' },
            { title: 'DINING & TOURS', sub: 'Curated Experiences', prompt: 'Recommend fine dining restaurants and VIP tours near my hotel.' },
            { title: 'ROOM SERVICE', sub: 'Towel & Linens', prompt: 'Can I request extra bath towels and pillows for my room?' }
          ]
        };
    }
  }, [userRole, user?.name]);

  const stay = welcomeData?.active_stay;
  const staffMetrics = welcomeData?.staff_metrics;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto pb-4 text-[#FAF6F0]">
      {/* Top Navigation & Return Action */}
      <div className="flex items-center justify-between mb-2.5 px-1 shrink-0">
        <button
          onClick={handleClose}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[2px] bg-[#13152C] hover:bg-[#1B1E3D] border border-[#2C315E] hover:border-[#DFB76C]/60 text-xs text-white/90 hover:text-white font-cinzel uppercase tracking-wider transition-all cursor-pointer shadow-sm group"
        >
          <ArrowLeft size={13} className="text-[#DFB76C] transition-transform group-hover:-translate-x-1" />
          <span>Back to {roleHome.label}</span>
        </button>

        <span className="text-[10px] font-sans text-white/40 hidden sm:flex items-center gap-1.5">
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[#1B1E3D] border border-[#2C315E] text-white/70 font-mono text-[9px]">Esc</kbd>
          <span>to return</span>
        </span>
      </div>

      {/* Toast Notification */}
      {serviceNotification && (
        <div className="mb-3 p-4 rounded-[4px] bg-[#13152C] border border-[#DFB76C] text-white flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-xs font-cinzel font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#DFB76C] shrink-0" />
            <span>{serviceNotification}</span>
          </div>
          <button
            onClick={() => setServiceNotification(null)}
            className="text-xs text-white/60 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Luxury Concierge Box */}
      <div className="flex-1 flex flex-col overflow-hidden rounded-[4px] border border-[#2C315E] bg-[#13152C] shadow-xl">
        {/* Header */}
        <div className="bg-[#13152C] px-6 py-5 border-b border-[#2C315E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#DFB76C]" />
              <h1 className="font-cinzel text-sm sm:text-base font-bold uppercase tracking-[0.25em] text-white">
                ASK NEXGILE
              </h1>
              <span className="font-cinzel text-[9px] font-bold text-[#DFB76C] bg-[#1B1E3D] px-2 py-0.5 rounded-[2px] border border-[#2C315E] uppercase tracking-wider ml-1">
                {roleProfile.badge}
              </span>
            </div>
            <p className="font-editorial text-xs sm:text-sm text-[#DFB76C]/80 mt-0.5 tracking-wide">
              {roleProfile.subtitle}
            </p>
            <div className="w-16 h-[1.5px] bg-gradient-to-r from-[#DFB76C] to-transparent mt-2"></div>
          </div>

          {/* Role Status or Loyalty Badge */}
          <div className="flex items-center gap-3 self-start sm:self-center">
            {userRole === 'TRAVELER' && welcomeData?.loyalty_tier && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] bg-[#1B1E3D] border border-[#DFB76C]/30 text-[10px] font-cinzel text-[#DFB76C] font-semibold">
                <Crown size={12} className="text-[#DFB76C]" />
                <span>{welcomeData.loyalty_tier}</span>
                <span className="text-white/60">&middot; {welcomeData.loyalty_points} pts</span>
              </span>
            )}
            {userRole !== 'TRAVELER' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] bg-[#1B1E3D] border border-emerald-500/30 text-[10px] font-cinzel text-emerald-400 font-semibold uppercase">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span>PMS Live Connect</span>
              </span>
            )}
            <button
              onClick={fetchWelcome}
              title="Refresh AI Context"
              className="p-1.5 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C]/80 hover:text-[#DFB76C] border border-[#2C315E] transition-colors cursor-pointer"
            >
              <RefreshCw size={13} />
            </button>
            <button
              onClick={handleClose}
              title={`Close Ask Nexgile and return to ${roleHome.label}`}
              className="px-2.5 py-1.5 rounded-[2px] bg-[#1B1E3D] hover:bg-rose-950/60 text-white/70 hover:text-rose-300 border border-[#2C315E] hover:border-rose-500/40 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <X size={14} />
              <span className="text-[10px] font-cinzel font-semibold uppercase hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* Scrollable Conversation Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#0B0C1E]/80">
          {/* Fallback Error Banner */}
          {isErrorState && (
            <div className="p-6 rounded-[4px] bg-[#13152C] border border-amber-500/40 text-center space-y-3">
              <AlertCircle size={28} className="text-[#DFB76C] mx-auto" />
              <p className="text-xs font-sans text-white/80 max-w-md mx-auto leading-relaxed">
                Copilot is temporarily reconnecting to backend intelligence. All navigation modules remain fully operational.
              </p>
            </div>
          )}

          {/* Welcome Card & Role-Tailored Operational Context */}
          <div className="space-y-4">
            <div className="p-6 rounded-[4px] bg-[#13152C] border border-[#2C315E] text-[#FAF6F0] shadow-sm">
              <span className="font-cinzel text-[10px] tracking-widest uppercase text-[#DFB76C] font-semibold block mb-1">
                {roleProfile.badge}
              </span>
              <h2 className="font-editorial text-2xl sm:text-3xl text-white font-bold">
                {roleProfile.title}
              </h2>
              <p className="text-xs font-sans text-white/75 mt-1 max-w-2xl leading-relaxed">
                {roleProfile.welcomeMsg}
              </p>

              {/* 1. Staff Live KPI Ribbon (For Admin, Front Desk, Revenue, Finance, Housekeeping) */}
              {userRole !== 'TRAVELER' && staffMetrics && (
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-[3px] bg-[#1B1E3D] border border-[#2C315E]">
                    <span className="font-cinzel text-[8.5px] uppercase tracking-wider text-white/50 block">
                      {staffMetrics.kpi_1_title}
                    </span>
                    <span className="font-editorial text-2xl text-white font-normal mt-0.5 block">
                      {staffMetrics.kpi_1_value}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-[3px] bg-[#1B1E3D] border border-[#2C315E]">
                    <span className="font-cinzel text-[8.5px] uppercase tracking-wider text-white/50 block">
                      {staffMetrics.kpi_2_title}
                    </span>
                    <span className="font-editorial text-2xl text-white font-normal mt-0.5 block">
                      {staffMetrics.kpi_2_value}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-[3px] bg-[#1B1E3D] border border-[#2C315E]">
                    <span className="font-cinzel text-[8.5px] uppercase tracking-wider text-white/50 block">
                      {staffMetrics.kpi_3_title}
                    </span>
                    <span className="font-editorial text-2xl text-white font-normal mt-0.5 block">
                      {staffMetrics.kpi_3_value}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-[3px] bg-[#1B1E3D] border border-[#2C315E]">
                    <span className="font-cinzel text-[8.5px] uppercase tracking-wider text-[#DFB76C] font-bold block">
                      {staffMetrics.kpi_4_title}
                    </span>
                    <span className="font-editorial text-2xl text-[#DFB76C] font-normal mt-0.5 block">
                      {staffMetrics.kpi_4_value}
                    </span>
                  </div>
                </div>
              )}

              {/* 2. Personalized Traveler Stay Card (For Guests) */}
              {userRole === 'TRAVELER' && stay && (
                <div className="mt-5 p-4 rounded-[3px] bg-[#1B1E3D] border border-[#DFB76C]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-cinzel text-[9px] tracking-widest uppercase text-[#DFB76C] font-semibold block">YOUR STAY</span>
                    <h3 className="font-editorial text-xl font-bold text-white tracking-tight">
                      {stay.property_name.toUpperCase()}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-white/80 font-sans">
                      <span className="inline-flex items-center gap-1 text-[#DFB76C]">
                        <Calendar size={13} />
                        {stay.check_in_date} &rarr; {stay.check_out_date}
                      </span>
                      <span className="text-[#DFB76C]/40">&bull;</span>
                      <span className="inline-flex items-center gap-1">
                        <BedDouble size={13} className="text-[#DFB76C]" />
                        ROOM {stay.room_number || '101'} ({stay.room_type_name})
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/my-trips/${stay.reservation_id}`}
                    className="px-4 py-2 rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-[#13152C] font-cinzel text-xs font-bold uppercase shrink-0 self-start md:self-center inline-flex items-center gap-1.5 transition"
                  >
                    <span>VIEW RESERVATION</span>
                    <ArrowRight size={13} className="text-[#13152C]" />
                  </Link>
                </div>
              )}
            </div>

            {/* Role-Tailored Quick Action Prompts */}
            <div className="space-y-2">
              <span className="font-cinzel text-[10px] tracking-widest uppercase text-white/60 block px-1 font-semibold">
                ROLE-TAILORED QUICK QUERIES
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {roleProfile.quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickActionClick(action.prompt)}
                    className="p-3 text-left rounded-[3px] bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/70 hover:bg-[#1B1E3D] transition-all group cursor-pointer shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <span className="font-cinzel text-[10px] font-bold text-white group-hover:text-[#DFB76C] block leading-tight">
                        {action.title}
                      </span>
                      <span className="text-[10px] text-white/50 block mt-1">{action.sub}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Conversation Bubble Stream */}
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                <span className="text-[10px] font-cinzel text-white/50 px-1">
                  {isUser ? user?.name || 'You' : roleProfile.assistantName} &middot; {msg.timestamp}
                </span>

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-[4px] p-4 text-xs font-sans leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-[#DFB76C] text-[#13152C] border border-[#DFB76C] rounded-br-none font-medium'
                      : 'bg-[#1B1E3D] text-[#FAF6F0] border border-[#2C315E] rounded-bl-none'
                  }`}
                >
                  {/* Message body with Markdown format support */}
                  <div className="whitespace-pre-line space-y-2">
                    {msg.text.split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx}>
                        {paragraph.split('**').map((chunk, cIdx) =>
                          cIdx % 2 === 1 ? (
                            <strong key={cIdx} className={isUser ? 'text-[#13152C] font-bold' : 'text-[#DFB76C] font-semibold'}>
                              {chunk}
                            </strong>
                          ) : (
                            chunk
                          )
                        )}
                      </p>
                    ))}
                  </div>

                  {/* Interactive Action Button */}
                  {msg.action && (
                    <div className="mt-4 pt-3 border-t border-[#2C315E] flex flex-wrap gap-2">
                      <button
                        onClick={() => handleExecuteAction(msg.action)}
                        disabled={actionInProgress}
                        className="px-3.5 py-1.5 rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-[#13152C] font-cinzel text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles size={12} className="text-[#13152C]" />
                        <span>{msg.action.action_label}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Thinking State */}
          {isThinking && (
            <div className="flex flex-col items-start space-y-1.5">
              <span className="text-[10px] font-cinzel text-white/50 px-1">
                {roleProfile.assistantName}
              </span>
              <div className="p-4 rounded-[4px] rounded-bl-none bg-[#1B1E3D] border border-[#2C315E] text-[#DFB76C] text-xs font-cinzel tracking-wider flex items-center gap-2 shadow-sm animate-pulse">
                <Sparkles size={14} className="text-[#DFB76C] animate-spin" />
                <span>CONSULTING DATABASE & REASONING...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sticky Message Input */}
        <div className="p-4 bg-[#13152C] border-t border-[#2C315E]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Ask ${roleProfile.badge.toLowerCase()} anything...`}
              disabled={isThinking}
              className="flex-1 !pl-4 pr-4 py-2.5 bg-[#1B1E3D] border border-[#2C315E] rounded-[3px] text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#DFB76C] focus:bg-[#13152C] transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isThinking}
              className="btn-luxury-primary text-xs py-2.5 px-5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              <Send size={13} />
              <span>Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
