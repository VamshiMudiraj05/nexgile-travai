import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  PhoneCall,
  Mail,
  Send,
  Users,
  Star,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  Building,
  RefreshCw,
  Plus,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Check,
  X
} from 'lucide-react';
import { omnichannelService } from '../../services/omnichannelService';

export default function OmnichannelDispatchHub() {
  const [activeTab, setActiveTab] = useState('messaging');

  // Omnichannel messaging states
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [simChannel, setSimChannel] = useState('WHATSAPP');
  const [simGuestName, setSimGuestName] = useState('Eleanor Vance');
  const [simRoomNumber, setSimRoomNumber] = useState('501');
  const [simText, setSimText] = useState('Could we get 3 fresh plush towels and hypoallergenic pillows delivered to 501?');
  const [simLoading, setSimLoading] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [staffNote, setStaffNote] = useState('');

  // Post-stay surveys & sentiment states
  const [sentimentSummary, setSentimentSummary] = useState(null);
  const [surveyNps, setSurveyNps] = useState(10);
  const [surveyCsat, setSurveyCsat] = useState(5);
  const [surveyGuestName, setSurveyGuestName] = useState('Julian Mercer');
  const [surveyComments, setSurveyComments] = useState('The estate service was breathtaking. The AI concierge and culinary team are world class.');
  const [surveySubmitting, setSurveySubmitting] = useState(false);
  const [surveyResult, setSurveyResult] = useState(null);

  // Housekeeping optimizer states
  const [hkSchedule, setHkSchedule] = useState(null);
  const [hkLoading, setHkLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchSentiment();
    fetchHkSchedule();
  }, []);

  const fetchMessages = async () => {
    setMessagesLoading(true);
    try {
      const data = await omnichannelService.getMessages();
      setMessages(data || []);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchSentiment = async () => {
    try {
      const data = await omnichannelService.getSentimentSummary();
      setSentimentSummary(data);
    } catch (err) {
      console.error('Failed to fetch sentiment', err);
    }
  };

  const fetchHkSchedule = async () => {
    setHkLoading(true);
    try {
      const data = await omnichannelService.getOptimizedHousekeeping();
      setHkSchedule(data);
    } catch (err) {
      console.error('Failed to fetch HK schedule', err);
    } finally {
      setHkLoading(false);
    }
  };

  const handleSimulateInbound = async (e) => {
    e.preventDefault();
    setSimLoading(true);
    try {
      await omnichannelService.inboundMessage({
        channel: simChannel,
        guest_name: simGuestName,
        room_number: simRoomNumber,
        message_text: simText,
      });
      fetchMessages();
      setSimText('');
    } catch (err) {
      alert('Failed to simulate message: ' + err.message);
    } finally {
      setSimLoading(false);
    }
  };

  const handleResolveMessage = async () => {
    if (!selectedMsg) return;
    try {
      await omnichannelService.resolveMessage(selectedMsg.id, {
        action: 'RESOLVE',
        staff_name: 'Lead Supervisor Anna',
        staff_notes: staffNote || 'Completed and verified directly with guest.',
      });
      setResolveModalOpen(false);
      setSelectedMsg(null);
      setStaffNote('');
      fetchMessages();
    } catch (err) {
      alert('Resolve error: ' + err.message);
    }
  };

  const handleSubmitSurvey = async (e) => {
    e.preventDefault();
    setSurveySubmitting(true);
    try {
      const res = await omnichannelService.submitSurvey({
        reservation_id: `RES-${Date.now().toString().slice(-4)}`,
        guest_name: surveyGuestName,
        guest_email: `${surveyGuestName.toLowerCase().replace(' ', '.')}@example.com`,
        nps_score: Number(surveyNps),
        csat_score: Number(surveyCsat),
        comments: surveyComments,
      });
      setSurveyResult(res);
      fetchSentiment();
    } catch (err) {
      alert('Survey submission failed: ' + err.message);
    } finally {
      setSurveySubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 font-sans text-[#FAF6F0]">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#2C315E] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-0.5 rounded-[2px] text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Phase 5 Live
            </span>
            <span className="px-3 py-0.5 rounded-[2px] text-xs font-semibold bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/40">
              Advanced AI Concierge & Omnichannel Operations
            </span>
          </div>
          <h1 className="font-editorial text-3xl md:text-4xl text-white tracking-tight font-bold flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-[#DFB76C]" />
            Omnichannel Dispatch & Guest Operations Hub
          </h1>
          <p className="text-white/70 text-sm mt-1 max-w-2xl">
            Inbound WhatsApp/SMS NLP routing with staff dispatch escalation, automated post-stay NPS/CSAT surveys with instant service recovery, and VIP housekeeping turnaround scheduling.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-[#2C315E] pb-6">
        <button
          onClick={() => setActiveTab('messaging')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'messaging' ? 'bg-[#DFB76C] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px]' : 'bg-[#1B1E3D] text-white/70 hover:text-white font-cinzel text-xs tracking-wider uppercase rounded-[2px] border border-[#2C315E]'
          }`}
        >
          <PhoneCall className="w-4 h-4" /> Omnichannel Guest Dispatch ({messages.length})
        </button>

        <button
          onClick={() => setActiveTab('sentiment')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'sentiment' ? 'bg-[#DFB76C] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px]' : 'bg-[#1B1E3D] text-white/70 hover:text-white font-cinzel text-xs tracking-wider uppercase rounded-[2px] border border-[#2C315E]'
          }`}
        >
          <Star className="w-4 h-4 text-amber-300" /> Post-Stay NPS & Sentiment Analytics
        </button>

        <button
          onClick={() => setActiveTab('housekeeping')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'housekeeping' ? 'bg-[#DFB76C] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px]' : 'bg-[#1B1E3D] text-white/70 hover:text-white font-cinzel text-xs tracking-wider uppercase rounded-[2px] border border-[#2C315E]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#DFB76C]" /> Smart Housekeeping Turnaround Optimizer
        </button>
      </div>

      {/* --- TAB 1: OMNICHANNEL MESSAGING --- */}
      {activeTab === 'messaging' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Inbound Simulator Form */}
          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-[#DFB76C]" /> Simulate Guest Inbound Message
            </h3>
            <p className="text-xs text-white/70">
              Simulate messages arriving from WhatsApp, SMS, or transactional email to test automated intent routing and staff dispatch.
            </p>

            <form onSubmit={handleSimulateInbound} className="space-y-3 text-xs">
              <div>
                <label className="block text-white/70 uppercase font-semibold mb-1">Inbound Channel</label>
                <select
                  value={simChannel}
                  onChange={(e) => setSimChannel(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white font-medium"
                >
                  <option value="WHATSAPP">WhatsApp (+44 7911 123456)</option>
                  <option value="SMS">SMS Cellular (+1 415-555-0199)</option>
                  <option value="EMAIL">Email (guest@domain.com)</option>
                  <option value="IN_APP_CHAT">In-App Mobile Concierge</option>
                </select>
              </div>

              <div>
                <label className="block text-white/70 uppercase font-semibold mb-1">Guest Name</label>
                <input
                  type="text"
                  required
                  value={simGuestName}
                  onChange={(e) => setSimGuestName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white"
                />
              </div>

              <div>
                <label className="block text-white/70 uppercase font-semibold mb-1">Room / Suite Number</label>
                <input
                  type="text"
                  required
                  value={simRoomNumber}
                  onChange={(e) => setSimRoomNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white"
                />
              </div>

              <div>
                <label className="block text-white/70 uppercase font-semibold mb-1">Message Text</label>
                <textarea
                  required
                  rows={3}
                  value={simText}
                  onChange={(e) => setSimText(e.target.value)}
                  placeholder="e.g. Could we get 2 extra towels? Or AC leaking in bathroom..."
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white"
                />
              </div>

              <button
                type="submit"
                disabled={simLoading}
                className="w-full py-2.5 bg-[#13152C] hover:bg-[#1B1E3D] disabled:opacity-50 text-[#DFB76C] border border-[#DFB76C]/40 font-cinzel text-xs uppercase tracking-wider font-bold font-bold rounded-[2px] text-xs transition flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                {simLoading ? 'Routing Inbound Message...' : 'Send Simulated Message'}
              </button>
            </form>
          </div>

          {/* Active Dispatches Feed */}
          <div className="md:col-span-2 bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-base">Active Omnichannel Guest Inquiries & Dispatches</h3>
              <button
                onClick={fetchMessages}
                className="p-1.5 rounded-[2px] bg-[#1B1E3D] text-white/80 hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className="bg-[#13152C] border border-[#2C315E] p-4 rounded-[2px] space-y-2.5 hover:border-[#DFB76C] transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/40 font-bold uppercase tracking-wider text-[10px]">
                        {m.channel}
                      </span>
                      <span className="font-bold text-white">{m.guest_name}</span>
                      <span className="text-white/70">Room {m.room_number}</span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-[2px] font-bold text-[10px] ${
                        m.priority === 'URGENT'
                          ? 'bg-rose-500/20 text-rose-300'
                          : m.priority === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {m.priority} PRIORITY
                    </span>
                  </div>

                  <p className="text-xs text-white bg-[#13152C] p-2.5 rounded-[2px] border border-[#2C315E]/15">
                    "{m.incoming_message}"
                  </p>

                  <div className="p-2.5 bg-[#13152C] border border-[#DFB76C]/30 text-[#FAF6F0] rounded-[2px] text-xs space-y-1">
                    <div className="text-[#DFB76C] font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> AI Reply:
                    </div>
                    <p className="text-white/80 italic">{m.ai_automated_reply}</p>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <div className="text-white/70">
                      Dispatched: <strong className="text-[#DFB76C]">{m.assigned_department}</strong>
                    </div>

                    {m.status === 'STAFF_RESOLVED' ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Resolved by Staff
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedMsg(m);
                          setResolveModalOpen(true);
                        }}
                        className="px-3 py-1 bg-[#13152C] hover:bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/40 font-cinzel text-xs tracking-wider uppercase font-bold rounded-[2px] text-xs font-semibold transition"
                      >
                        Acknowledge & Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: POST-STAY SENTIMENT --- */}
      {activeTab === 'sentiment' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#13152C] border border-[#2C315E] p-5 rounded-[4px]">
              <span className="text-xs text-white/70 font-semibold uppercase">Net Promoter Score (NPS)</span>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">
                +{sentimentSummary?.nps_score ? sentimentSummary.nps_score.toFixed(0) : '85'}
              </div>
              <span className="text-xs text-white/50">World-Class Guest Benchmark</span>
            </div>

            <div className="bg-[#13152C] border border-[#2C315E] p-5 rounded-[4px]">
              <span className="text-xs text-white/70 font-semibold uppercase">Average CSAT Score</span>
              <div className="text-3xl font-extrabold text-[#DFB76C] font-mono mt-1">
                {sentimentSummary?.average_csat ? sentimentSummary.average_csat.toFixed(1) : '4.9'} / 5.0
              </div>
              <span className="text-xs text-white/50">Across verified stays</span>
            </div>

            <div className="bg-[#13152C] border border-[#2C315E] p-5 rounded-[4px]">
              <span className="text-xs text-white/70 font-semibold uppercase">Promoters vs Detractors</span>
              <div className="text-2xl font-bold text-white mt-1">
                {sentimentSummary?.promoters_count || 12} Promoters
              </div>
              <span className="text-xs text-rose-400 font-semibold">
                {sentimentSummary?.detractors_count || 1} Detractor flagged
              </span>
            </div>

            <div className="bg-[#13152C] border border-[#2C315E] p-5 rounded-[4px]">
              <span className="text-xs text-rose-400 font-semibold uppercase">Active Recovery Tickets</span>
              <div className="text-3xl font-extrabold text-rose-400 font-mono mt-1">
                {sentimentSummary?.active_recovery_tickets_count || 1}
              </div>
              <span className="text-xs text-white/70">Compensatory outreach triggered</span>
            </div>
          </div>

          {/* Survey Submission & Detractor Recovery Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" /> Submit Post-Stay Guest Survey
              </h3>
              <p className="text-xs text-white/70">
                Experience how ratings $\le 6$ (Detractors) immediately auto-create an executive Service Recovery ticket with loyalty points compensation.
              </p>

              <form onSubmit={handleSubmitSurvey} className="space-y-3 text-xs">
                <div>
                  <label className="block text-white/70 uppercase font-semibold mb-1">Guest Name</label>
                  <input
                    type="text"
                    required
                    value={surveyGuestName}
                    onChange={(e) => setSurveyGuestName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/70 uppercase font-semibold mb-1">NPS (0 to 10)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      required
                      value={surveyNps}
                      onChange={(e) => setSurveyNps(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 uppercase font-semibold mb-1">CSAT (1 to 5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      required
                      value={surveyCsat}
                      onChange={(e) => setSurveyCsat(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/70 uppercase font-semibold mb-1">Feedback Comments</label>
                  <textarea
                    required
                    rows={3}
                    value={surveyComments}
                    onChange={(e) => setSurveyComments(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={surveySubmitting}
                  className="w-full py-2.5 bg-[#13152C] hover:bg-[#1B1E3D] disabled:opacity-50 text-[#DFB76C] border border-[#DFB76C]/40 font-cinzel text-xs uppercase tracking-wider font-bold font-bold rounded-[2px] text-xs transition"
                >
                  {surveySubmitting ? 'Evaluating Survey...' : 'Submit Feedback & Analyze Sentiment'}
                </button>
              </form>
            </div>

            {/* Service Recovery Alert Box */}
            <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white text-base mb-2 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" /> Automated Service Recovery Sentinel
                </h3>
                <p className="text-xs text-white/70 mb-4">
                  Detractors with NPS scores of 0–6 automatically trigger a VIP Service Recovery Ticket, notifying the General Manager and proposing compensatory remedies.
                </p>

                {surveyResult && surveyResult.service_recovery_ticket_id ? (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-[2px] space-y-2 text-xs">
                    <div className="flex items-center justify-between text-rose-400 font-bold">
                      <span>⚠️ DETRACTOR INCIDENT OPENED</span>
                      <span className="font-mono">{surveyResult.service_recovery_ticket_id}</span>
                    </div>
                    <p className="text-white/80">
                      Guest <strong>{surveyResult.guest_name}</strong> submitted an NPS rating of <strong>{surveyResult.nps_score}/10</strong>.
                    </p>
                    <div className="p-2.5 bg-[#1B1E3D] rounded-[2px] text-emerald-300 font-mono text-[11px]">
                      Remedy Dispatched: 10,000 Points + Personal GM Apology + ₹5,000 Dining Credit
                    </div>
                  </div>
                ) : surveyResult ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-[2px] space-y-1 text-xs text-emerald-300">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Guest Feedback Classified as PROMOTER
                    </div>
                    <p className="text-white/80">NPS score of {surveyResult.nps_score}/10 recorded. Thank-you note sent.</p>
                  </div>
                ) : (
                  <div className="p-4 bg-[#13152C] rounded-[2px] border border-[#2C315E]/15 text-xs text-white/70 text-center py-8">
                    Submit a rating of 6 or below to test automated recovery ticket triggering.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#E5DDCF] flex items-center justify-between text-xs text-white/70">
                <span>Top Sentiment Keywords:</span>
                <span className="text-white font-medium">Immaculate, AI Concierge, Luxurious</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: HOUSEKEEPING OPTIMIZER --- */}
      {activeTab === 'housekeeping' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 bg-[#1B1E3D] border border-[#DFB76C]/30 rounded-[4px]">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-[#DFB76C] flex-shrink-0" />
              <div>
                <h3 className="font-bold text-white text-lg">Intelligent Housekeeping Auto-Scheduler</h3>
                <p className="text-xs text-[#DFB76C]">
                  Dynamic algorithm balancing room turnarounds by loyalty status (Diamond/Platinum first), guaranteed early arrivals, and housekeeper shift load.
                </p>
              </div>
            </div>
            <button
              onClick={fetchHkSchedule}
              disabled={hkLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#13152C] hover:bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/40 font-cinzel text-xs tracking-wider uppercase font-bold font-bold rounded-[2px] text-sm transition shadow-sm whitespace-nowrap"
            >
              <RefreshCw className={`w-4 h-4 ${hkLoading ? 'animate-spin' : ''}`} />
              Re-Run Schedule Optimization
            </button>
          </div>

          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#2C315E] text-xs text-white/70 uppercase tracking-wider">
                    <th className="py-3 px-4">Priority Rank</th>
                    <th className="py-3 px-4">Room & Type</th>
                    <th className="py-3 px-4">Guest Tier & Arrival</th>
                    <th className="py-3 px-4">Priority Rationale</th>
                    <th className="py-3 px-4">Assigned Attendant</th>
                    <th className="py-3 px-4">Scheduled Start</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C315E] font-medium">
                  {hkSchedule?.schedule?.map((task) => (
                    <tr key={task.id} className="hover:bg-[#1B1E3D] transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#DFB76C]">
                        #{task.priority_rank}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{task.room_number}</div>
                        <div className="text-xs text-white/70">{task.room_type}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            task.guest_loyalty_tier === 'DIAMOND'
                              ? 'bg-blue-500/20 text-blue-300'
                              : task.guest_loyalty_tier === 'PLATINUM'
                              ? 'bg-[#13152C] text-[#DFB76C] border border-[#DFB76C]/40'
                              : 'bg-[#1B1E3D] text-white/80'
                          }`}
                        >
                          {task.guest_loyalty_tier}
                        </span>
                        <div className="text-xs text-white/70 mt-1">Arrival: {task.guest_arrival_time}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-white/80">{task.priority_reason}</td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-white">{task.assigned_housekeeper}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-white/80">{task.scheduled_start_time}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-[2px] text-xs font-bold bg-amber-500/20 text-amber-300">
                          {task.cleaning_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- ACKNOWLEDGE & RESOLVE DISPATCH MODAL --- */}
      {resolveModalOpen && selectedMsg && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setResolveModalOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Acknowledge & Resolve</h3>
            <p className="text-xs text-white/70 mb-4">{selectedMsg.guest_name} • Room {selectedMsg.room_number}</p>

            <div className="p-3 bg-[#1B1E3D] rounded-[2px] text-xs text-white/80 mb-4 border border-[#2C315E]/15">
              "{selectedMsg.incoming_message}"
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-white/70 uppercase mb-1">Staff Resolution Notes</label>
              <textarea
                rows={3}
                value={staffNote}
                onChange={(e) => setStaffNote(e.target.value)}
                placeholder="e.g. Delivered 3 feather pillows, confirmed guest satisfaction..."
                className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white text-xs"
              />
            </div>

            <button
              onClick={handleResolveMessage}
              className="w-full py-2.5 bg-[#13152C] hover:bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/40 font-cinzel text-xs tracking-wider uppercase font-bold font-bold rounded-[2px] text-xs transition"
            >
              Mark Completed & Notify Guest
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
