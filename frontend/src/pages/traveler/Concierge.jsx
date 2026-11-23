import React, { useState, useEffect, useRef } from 'react';
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
  ShieldCheck,
  Crown,
  AlertCircle,
  RefreshCw,
  Bell,
  Utensils,
  MapPin,
  Compass,
  Luggage,
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
      sender: 'traveler',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsThinking(true);

    try {
      const historyPayload = updatedMessages.map((m) => ({
        role: m.sender === 'traveler' ? 'user' : 'assistant',
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
          text: 'Concierge is temporarily unavailable. You can still manage your reservation and requests from your trips dashboard.',
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
          details: payload.details || 'Guest requested via AI Concierge',
          reservation_id: payload.reservation_id || stay?.reservation_id,
          property_id: payload.property_id || stay?.property_id,
          room_number: payload.room_number || stay?.room_number,
        });

        setServiceNotification(`Your request for "${payload.item || 'Service'}" has been successfully submitted!`);
        setTimeout(() => setServiceNotification(null), 4500);

        // Add confirmation reply from concierge
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-conf-${Date.now()}`,
            sender: 'concierge',
            text: `✓ I have registered your **${payload.item}** request with the estate desk for **Room ${payload.room_number || stay?.room_number || 'Suite'}**. Our staff has been notified.`,
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
      } else if (action.action_type === 'BROWSE_MARKETPLACE') {
        navigate('/marketplace');
      }
    } catch (err) {
      console.error('Failed to execute concierge action:', err);
      alert('Unable to process the request right now. Please try again or contact the front desk.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleQuickActionClick = (prompt) => {
    handleSendMessage(prompt);
  };

  const stay = welcomeData?.active_stay;

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto pb-4 text-[#FAF6F0]">
      {/* Toast Notification */}
      {serviceNotification && (
        <div className="mb-3 p-4 rounded-[4px] bg-[#13152C] border border-[#DFB76C] text-white flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 text-xs font-cinzel font-semibold">
            <CheckCircle2 className="w-4 h-4 text-[#DFB76C] shrink-0" />
            <span>{serviceNotification}</span>
          </div>
          <button
            onClick={() => setServiceNotification(null)}
            className="text-xs text-white/60 hover:text-white"
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
                NEXGILE CONCIERGE
              </h1>
            </div>
            <p className="font-editorial text-xs sm:text-sm text-[#DFB76C]/80 mt-0.5 tracking-wide">
              Personal Travel Assistant &middot; 24/7 Bespoke Resident Care
            </p>
            {/* Small gold accent line */}
            <div className="w-16 h-[1.5px] bg-gradient-to-r from-[#DFB76C] to-transparent mt-2"></div>
          </div>

          {/* Loyalty & Guest Badge */}
          <div className="flex items-center gap-3 self-start sm:self-center">
            {welcomeData?.loyalty_tier && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[2px] bg-[#1B1E3D] border border-[#DFB76C]/30 text-[10px] font-cinzel text-[#DFB76C] font-semibold">
                <Crown size={12} className="text-[#DFB76C]" />
                <span>{welcomeData.loyalty_tier}</span>
                <span className="text-white/60">&middot; {welcomeData.loyalty_points} pts</span>
              </span>
            )}
            <button
              onClick={fetchWelcome}
              title="Refresh Concierge Context"
              className="p-1.5 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C]/80 hover:text-[#DFB76C] border border-[#2C315E] transition-colors"
            >
              <RefreshCw size={13} />
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
                Concierge is temporarily unavailable. You can still manage your reservation and requests from the dashboard.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Link to="/my-trips" className="px-4 py-2 rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] font-cinzel text-xs text-white/80 hover:text-white uppercase">
                  MY TRIPS
                </Link>
                <Link to="/marketplace" className="px-4 py-2 rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-[#13152C] font-cinzel text-xs uppercase font-bold">
                  BROWSE HOTELS
                </Link>
              </div>
            </div>
          )}

          {/* Welcome Card & Active Stay Card */}
          <div className="space-y-4">
            <div className="p-6 rounded-[4px] bg-[#13152C] border border-[#2C315E] text-[#FAF6F0] shadow-sm">
              <span className="font-cinzel text-[10px] tracking-widest uppercase text-[#DFB76C] font-semibold block mb-1">NEXGILE CONCIERGE</span>
              <h2 className="font-editorial text-2xl sm:text-3xl text-white font-bold">
                How can I help you today?
              </h2>
              <p className="text-xs font-sans text-white/75 mt-1 max-w-xl leading-relaxed">
                Welcome, {user?.name ? user.name.replace(/\s*\(.*?\)\s*/g, '').trim() : 'Guest'}. Ask me anything about your room, hotel amenities, dining, or request room service.
              </p>

              {/* Personalized Stay Card (Where available) */}
              {stay && (
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

            {/* Quick Actions Ribbon (Below Welcome) */}
            <div className="space-y-2">
              <span className="font-cinzel text-[10px] tracking-widest uppercase text-white/60 block px-1 font-semibold">
                DISCOVERY &amp; CONCIERGE ASSISTANCE
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { title: 'MY RESERVATION', sub: 'Dates & Room', prompt: 'What is my booking reference and stay details?' },
                  { title: 'MY REQUESTS', sub: 'Status & Towels', prompt: 'Show my service requests and their live status.' },
                  { title: 'HOTEL INFORMATION', sub: 'Amenities & Pool', prompt: 'What amenities and dining does my hotel offer?' },
                  { title: 'PLAN MY TRIP', sub: 'Day Itineraries', prompt: 'Plan a 3-day trip to Hyderabad.' },
                  { title: 'ROOM RECOMMENDATION', sub: 'Tailored Suites', prompt: 'Recommend something for me based on my preferences.' },
                  { title: 'ASK CONCIERGE', sub: 'Towel & Clean', prompt: 'Can I request extra towels for my room?' }
                ].map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickActionClick(action.prompt)}
                    className="p-3 text-left rounded-[3px] bg-[#13152C] border border-[#2C315E] hover:border-[#DFB76C]/70 hover:bg-[#1B1E3D] transition-all group cursor-pointer shadow-sm"
                  >
                    <span className="font-cinzel text-[10px] font-bold text-white group-hover:text-[#DFB76C] block">
                      {action.title}
                    </span>
                    <span className="text-[10px] text-white/50 block mt-0.5">{action.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Conversation Bubble Stream */}
          {messages.map((msg) => {
            const isTraveler = msg.sender === 'traveler';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isTraveler ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                <span className="text-[10px] font-cinzel text-white/50 px-1">
                  {isTraveler ? user?.name || 'You' : 'NEXGILE CONCIERGE'} &middot; {msg.timestamp}
                </span>

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-[4px] p-4 text-xs font-sans leading-relaxed shadow-sm ${
                    isTraveler
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
                            <strong key={cIdx} className={isTraveler ? 'text-[#13152C] font-bold' : 'text-[#DFB76C] font-semibold'}>
                              {chunk}
                            </strong>
                          ) : (
                            chunk
                          )
                        )}
                      </p>
                    ))}
                  </div>

                  {/* Interactive Action Button (e.g. REQUEST EXTRA TOWELS, VIEW RESERVATION) */}
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
                NEXGILE CONCIERGE
              </span>
              <div className="p-4 rounded-[4px] rounded-bl-none bg-[#1B1E3D] border border-[#2C315E] text-[#DFB76C] text-xs font-cinzel tracking-wider flex items-center gap-2 shadow-sm animate-pulse">
                <Sparkles size={14} className="text-[#DFB76C] animate-spin" />
                <span>CONCIERGE IS THINKING...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Sticky Mobile & Desktop Message Input */}
        <div className="p-4 bg-[#13152C] border-t border-[#2C315E]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Inquire about your reservation, hotel amenities, towels, or trip planning..."
              disabled={isThinking}
              className="flex-1 px-4 py-3 bg-[#1B1E3D] border border-[#2C315E] rounded-[3px] text-xs font-sans text-white placeholder-white/40 focus:outline-none focus:border-[#DFB76C] transition-all"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isThinking}
              className="px-5 py-3 rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-[#13152C] font-cinzel text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 transition"
            >
              <span>SEND</span>
              <Send size={13} className="text-[#13152C]" />
            </button>
          </form>
          <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-white/40 font-sans">
            <span>Real-time hotel PMS &amp; concierge synchronization</span>
            <span className="font-cinzel text-[#DFB76C]">Nexgile-TravAI Bespoke AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
