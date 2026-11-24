import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  FileText,
  DollarSign,
  Scan,
  Users,
  AlertTriangle,
  Send,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Receipt,
  Building,
  Plane,
  Clock,
  MapPin,
  Check,
  ChevronRight,
  TrendingUp,
  Percent,
  X,
  ChevronDown,
} from 'lucide-react';
import { GooeyMenu } from '@/components/ui/gooey-menu';
import { corporateExpenseService } from '../../services/corporateExpenseService';

export default function CorporateExpenseManager() {
  const [activeTab, setActiveTab] = useState('approvals');

  // Policy & compliance states
  const [policy, setPolicy] = useState(null);
  const [simHotelRate, setSimHotelRate] = useState(380);
  const [simFlightHours, setSimFlightHours] = useState(4.5);
  const [simFlightCabin, setSimFlightCabin] = useState('BUSINESS');
  const [simAdvanceDays, setSimAdvanceDays] = useState(4);
  const [simCost, setSimCost] = useState(2400);
  const [simDestination, setSimDestination] = useState('Mumbai, India');
  const [complianceResult, setComplianceResult] = useState(null);

  // Approvals states
  const [approvals, setApprovals] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [approverComments, setApproverComments] = useState('');

  // New approval request modal
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [reqEmployeeName, setReqEmployeeName] = useState('Julian Mercer');
  const [reqEmployeeEmail, setReqEmployeeEmail] = useState('julian.mercer@enterprise.com');
  const [reqDepartment, setReqDepartment] = useState('Sales');
  const [reqDestination, setReqDestination] = useState('Bengaluru, India');
  const [reqDepDate, setReqDepDate] = useState('2026-12-15');
  const [reqRetDate, setReqRetDate] = useState('2026-12-22');
  const [reqTotal, setReqTotal] = useState(3800);
  const [reqJustification, setReqJustification] = useState('Key Client Enterprise Expansion & Contract Signing');

  // Expense reports & OCR states
  const [expenses, setExpenses] = useState([]);
  const [vatSummary, setVatSummary] = useState(null);
  const [ocrFilename, setOcrFilename] = useState('hotel_tax_invoice_mumbai.pdf');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  // Duty of Care states
  const [travelers, setTravelers] = useState([]);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastSeverity, setBroadcastSeverity] = useState('HIGH');
  const [broadcastSubject, setBroadcastSubject] = useState('Airport Weather & Ground Stop Advisory');
  const [broadcastMessage, setBroadcastMessage] = useState(
    'Monsoon weather ground stop at Mumbai Chhatrapati Shivaji Airport. Hotel reservations extended with zero penalty.'
  );
  const [broadcastStatus, setBroadcastStatus] = useState(null);

  useEffect(() => {
    fetchPolicy();
    fetchApprovals();
    fetchExpenses();
    fetchVatSummary();
    fetchTravelers();
  }, []);

  const fetchPolicy = async () => {
    try {
      const data = await corporateExpenseService.getPolicy();
      setPolicy(data);
    } catch (err) {
      console.error('Error fetching corporate policy', err);
    }
  };

  const fetchApprovals = async () => {
    setApprovalsLoading(true);
    try {
      const data = await corporateExpenseService.getApprovals();
      setApprovals(data || []);
    } catch (err) {
      console.error('Error fetching approvals', err);
    } finally {
      setApprovalsLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const data = await corporateExpenseService.getExpenseReports();
      setExpenses(data || []);
    } catch (err) {
      console.error('Error fetching expenses', err);
    }
  };

  const fetchVatSummary = async () => {
    try {
      const data = await corporateExpenseService.getVATSummary();
      setVatSummary(data);
    } catch (err) {
      console.error('Error fetching VAT summary', err);
    }
  };

  const fetchTravelers = async () => {
    try {
      const data = await corporateExpenseService.getTravelers();
      setTravelers(data || []);
    } catch (err) {
      console.error('Error fetching duty of care travelers', err);
    }
  };

  // Policy check handler
  const handleCheckCompliance = async () => {
    try {
      const res = await corporateExpenseService.checkCompliance({
        hotel_rate_per_night: Number(simHotelRate),
        flight_duration_hours: Number(simFlightHours),
        flight_cabin: simFlightCabin,
        days_in_advance: Number(simAdvanceDays),
        total_cost: Number(simCost),
        destination: simDestination,
      });
      setComplianceResult(res);
    } catch (err) {
      alert('Error running compliance check: ' + err.message);
    }
  };

  // Approval actions
  const handleTakeAction = async (action) => {
    if (!selectedReq) return;
    try {
      await corporateExpenseService.takeApprovalAction(
        selectedReq.id,
        action,
        approverComments,
        'Executive Director'
      );
      setApprovalModalOpen(false);
      setSelectedReq(null);
      setApproverComments('');
      fetchApprovals();
    } catch (err) {
      alert('Approval error: ' + err.message);
    }
  };

  const handleSubmitNewRequest = async (e) => {
    e.preventDefault();
    try {
      await corporateExpenseService.submitApproval({
        employee_name: reqEmployeeName,
        employee_email: reqEmployeeEmail,
        department: reqDepartment,
        destination: reqDestination,
        departure_date: reqDepDate,
        return_date: reqRetDate,
        estimated_total: Number(reqTotal),
        business_justification: reqJustification,
      });
      setNewRequestOpen(false);
      fetchApprovals();
    } catch (err) {
      alert('Failed to submit travel request: ' + err.message);
    }
  };

  // OCR scan handler
  const handleRunOcr = async () => {
    setOcrLoading(true);
    try {
      const res = await corporateExpenseService.scanReceiptOCR(ocrFilename);
      setOcrResult(res);
    } catch (err) {
      alert('OCR error: ' + err.message);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleAddOcrToReport = async () => {
    if (!ocrResult?.suggested_line_item) return;
    try {
      await corporateExpenseService.createExpenseReport({
        employee_name: 'Julian Mercer',
        title: `Expense - ${ocrResult.merchant_name}`,
        department: 'Corporate Sales',
        cost_center: 'CC-302',
        period: 'November 2026',
        line_items: [ocrResult.suggested_line_item],
      });
      setOcrResult(null);
      fetchExpenses();
      fetchVatSummary();
      alert('Receipt digitized and added to expense ledger!');
    } catch (err) {
      alert('Failed to add to report: ' + err.message);
    }
  };

  const handleUpdateReportStatus = async (reportId, status) => {
    try {
      await corporateExpenseService.updateReportStatus(reportId, status);
      fetchExpenses();
    } catch (err) {
      alert('Status update error: ' + err.message);
    }
  };

  // Broadcast alert handler
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    try {
      const res = await corporateExpenseService.sendBroadcastAlert({
        severity: broadcastSeverity,
        subject: broadcastSubject,
        message: broadcastMessage,
      });
      setBroadcastStatus(res);
      setTimeout(() => {
        setBroadcastModalOpen(false);
        setBroadcastStatus(null);
      }, 2500);
    } catch (err) {
      alert('Broadcast dispatch error: ' + err.message);
    }
  };

  return (
    <div className="space-y-8 pb-16 font-sans text-[#FAF6F0]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#2C315E] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-0.5 rounded-[2px] text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Phase 4 Live
            </span>
            <span className="px-3 py-0.5 rounded-[2px] text-xs font-semibold bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/30">
              Corporate Travel & Expense Management
            </span>
          </div>
          <h1 className="font-editorial text-3xl md:text-4xl text-white tracking-tight font-bold flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-[#DFB76C]" />
            Enterprise Travel Policy, Approvals & Expenses
          </h1>
          <p className="text-white/70 text-sm mt-1 max-w-2xl">
            Enforce corporate policy thresholds, route multi-tier manager travel approvals, digitize receipts via AI OCR, and protect deployed employees with real-time Duty of Care.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setNewRequestOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#DFB76C] hover:bg-[#F2D59B] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px] shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Request Business Travel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-[#2C315E] pb-6">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'approvals' ? 'bg-[#DFB76C] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px]' : 'bg-[#1B1E3D] text-white/70 hover:text-white font-cinzel text-xs tracking-wider uppercase rounded-[2px] border border-[#2C315E]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" /> Travel Approvals Queue ({approvals.length})
        </button>

        <button
          onClick={() => setActiveTab('policy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'policy' ? 'bg-[#DFB76C] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px]' : 'bg-[#1B1E3D] text-white/70 hover:text-white font-cinzel text-xs tracking-wider uppercase rounded-[2px] border border-[#2C315E]'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Travel Policy & Compliance Engine
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'expenses' ? 'bg-[#DFB76C] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px]' : 'bg-[#1B1E3D] text-white/70 hover:text-white font-cinzel text-xs tracking-wider uppercase rounded-[2px] border border-[#2C315E]'
          }`}
        >
          <Receipt className="w-4 h-4" /> OCR Expense Scanner & VAT ({expenses.length})
        </button>

        <button
          onClick={() => setActiveTab('duty-of-care')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'duty-of-care' ? 'bg-[#DFB76C] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px]' : 'bg-[#1B1E3D] text-white/70 hover:text-white font-cinzel text-xs tracking-wider uppercase rounded-[2px] border border-[#2C315E]'
          }`}
        >
          <Users className="w-4 h-4 text-amber-300" /> Duty of Care Sentinel ({travelers.length})
        </button>
      </div>

      {/* --- TAB 1: APPROVALS QUEUE --- */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Managerial Travel Authorization Queue</h3>
                <p className="text-xs text-white/70">Review employee itinerary requests, check out-of-policy exceptions, and approve or reject.</p>
              </div>
              <button
                onClick={fetchApprovals}
                className="p-2 rounded-[2px] bg-[#1B1E3D] hover:bg-[#1B1E3D] text-white/80"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#2C315E] text-xs text-white/70 uppercase tracking-wider">
                    <th className="py-3 px-4">Request #</th>
                    <th className="py-3 px-4">Traveler & Dept</th>
                    <th className="py-3 px-4">Destination & Dates</th>
                    <th className="py-3 px-4">Est. Total</th>
                    <th className="py-3 px-4">Policy Status</th>
                    <th className="py-3 px-4">Approval State</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C315E] font-medium">
                  {approvals.map((req) => (
                    <tr key={req.id} className="hover:bg-[#1B1E3D] transition">
                      <td className="py-3.5 px-4 font-mono text-xs text-[#DFB76C]">{req.request_number}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{req.employee_name}</div>
                        <div className="text-xs text-white/70">{req.department}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-white">{req.destination}</div>
                        <div className="text-xs text-white/70">{req.departure_date} to {req.return_date}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white font-mono">₹{req.estimated_total.toFixed(2)}</td>
                      <td className="py-3.5 px-4">
                        {req.is_in_policy ? (
                          <span className="px-2.5 py-0.5 rounded-[2px] text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            In-Policy
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-[2px] text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> Policy Flag
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-[2px] text-xs font-bold ${
                            req.status === 'APPROVED' || req.status === 'AUTO_APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : req.status === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {req.status === 'PENDING_APPROVAL' ? (
                          <button
                            onClick={() => {
                              setSelectedReq(req);
                              setApprovalModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-[#13152C] hover:bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/40 font-cinzel text-xs tracking-wider uppercase font-bold rounded-[2px] text-xs font-semibold transition"
                          >
                            Review & Decide
                          </button>
                        ) : (
                          <span className="text-xs text-white/50">{req.approver_name || 'Processed'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: POLICY & COMPLIANCE --- */}
      {activeTab === 'policy' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Policy Parameters Card */}
          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#DFB76C]" /> Active Enterprise Policy Rules
            </h3>
            <p className="text-xs text-white/70">
              Enforced automatically on all traveler reservations and corporate negotiated rates.
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 bg-[#1B1E3D] rounded-[2px] border border-[#2C315E] flex justify-between items-center">
                <span className="text-white/70">Max Hotel Nightly Rate</span>
                <span className="font-bold text-white font-mono text-sm">₹{policy?.max_hotel_rate_per_night || 300}.00 / night</span>
              </div>
              <div className="p-3 bg-[#1B1E3D] rounded-[2px] border border-[#2C315E] flex justify-between items-center">
                <span className="text-white/70">Daily Meal Per-Diem</span>
                <span className="font-bold text-white font-mono text-sm">₹{policy?.daily_meal_per_diem || 85}.00 / day</span>
              </div>
              <div className="p-3 bg-[#1B1E3D] rounded-[2px] border border-[#2C315E] flex justify-between items-center">
                <span className="text-white/70">Flight Cabin Rule</span>
                <span className="font-bold text-white font-mono text-sm">Economy &lt; {policy?.max_flight_duration_for_economy || 6}h</span>
              </div>
              <div className="p-3 bg-[#1B1E3D] rounded-[2px] border border-[#2C315E] flex justify-between items-center">
                <span className="text-white/70">Advance Purchase Window</span>
                <span className="font-bold text-white font-mono text-sm">&gt;= {policy?.advance_booking_days || 7} Days</span>
              </div>
              <div className="p-3 bg-[#1B1E3D] rounded-[2px] border border-[#2C315E] flex justify-between items-center">
                <span className="text-white/70">Manager Approval Threshold</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">&gt; ₹{policy?.approval_threshold_amount || 1000}.00</span>
              </div>
            </div>
          </div>

          {/* Interactive Compliance Validator */}
          <div className="md:col-span-2 bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6">
            <h3 className="font-bold text-white text-base mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Real-Time Policy Validator Simulator
            </h3>
            <p className="text-xs text-white/70 mb-5">
              Test itinerary variables to verify whether a proposed booking complies with corporate policy or triggers manager escalations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase mb-1">Nightly Hotel Rate (₹)</label>
                <input
                  type="number"
                  value={simHotelRate}
                  onChange={(e) => setSimHotelRate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#E5DDCF] rounded-[2px] text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase mb-1">Flight Duration (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  value={simFlightHours}
                  onChange={(e) => setSimFlightHours(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#E5DDCF] rounded-[2px] text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase mb-1">Flight Cabin Class</label>
                <GooeyMenu
                  className="w-full"
                  style={{ width: '100%' }}
                  surfaceClassName="bg-[#13152C]"
                  options={['Economy', 'Business Class', 'First Class']}
                  value={
                    simFlightCabin === 'FIRST'
                      ? 'First Class'
                      : simFlightCabin === 'BUSINESS'
                      ? 'Business Class'
                      : 'Economy'
                  }
                  onSelect={(opt) => {
                    if (opt === 'First Class') setSimFlightCabin('FIRST');
                    else if (opt === 'Business Class') setSimFlightCabin('BUSINESS');
                    else setSimFlightCabin('ECONOMY');
                  }}
                  triggerClassName="h-[40px] w-full rounded-[2px] bg-[#1B1E3D] px-3 border border-[#E5DDCF] text-white text-sm flex items-center justify-between"
                  trigger={
                    <div className="flex h-full w-full items-center justify-between text-left">
                      <span className="text-sm font-medium text-white truncate">
                        {simFlightCabin === 'FIRST'
                          ? 'First Class'
                          : simFlightCabin === 'BUSINESS'
                          ? 'Business Class'
                          : 'Economy'}
                      </span>
                      <ChevronDown size={14} className="text-[#DFB76C]/70 shrink-0 ml-2" />
                    </div>
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase mb-1">Days in Advance</label>
                <input
                  type="number"
                  value={simAdvanceDays}
                  onChange={(e) => setSimAdvanceDays(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#E5DDCF] rounded-[2px] text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase mb-1">Total Trip Cost (₹)</label>
                <input
                  type="number"
                  value={simCost}
                  onChange={(e) => setSimCost(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#E5DDCF] rounded-[2px] text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase mb-1">Destination City</label>
                <input
                  type="text"
                  value={simDestination}
                  onChange={(e) => setSimDestination(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#E5DDCF] rounded-[2px] text-white text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleCheckCompliance}
              className="w-full py-2.5 bg-[#13152C] hover:bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/40 font-cinzel text-xs tracking-wider uppercase font-bold font-bold rounded-[2px] text-sm transition shadow-md shadow-indigo-600/30"
            >
              Execute Policy Audit
            </button>

            {/* Compliance Result Box */}
            {complianceResult && (
              <div
                className={`mt-4 p-4 rounded-[2px] border ${
                  complianceResult.is_compliant
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold flex items-center gap-2 text-sm">
                    {complianceResult.is_compliant ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                    )}
                    {complianceResult.is_compliant ? 'Booking Passes Corporate Guidelines' : 'Policy Violations Detected'}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-[#1B1E3D] text-white">
                    {complianceResult.requires_approval ? 'APPROVAL REQUIRED' : 'AUTO-APPROVE ELIGIBLE'}
                  </span>
                </div>
                <p className="text-xs mb-2 text-white/80">{complianceResult.policy_notes}</p>
                {complianceResult.violations?.length > 0 && (
                  <ul className="list-disc pl-5 text-xs space-y-1 text-rose-300">
                    {complianceResult.violations.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 3: EXPENSES & AI OCR --- */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#13152C] border border-[#2C315E] p-5 rounded-[4px] flex items-center justify-between">
              <div>
                <span className="text-xs text-white/70 font-semibold uppercase">Total Tracked Expenses</span>
                <div className="text-2xl font-bold text-white font-mono mt-1">
                  ₹{vatSummary?.total_expense ? vatSummary.total_expense.toFixed(2) : '1,215.00'}
                </div>
                <span className="text-xs text-white/50">{vatSummary?.eligible_transactions_count || 3} line items filed</span>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-[2px] text-blue-400">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#13152C] border border-[#2C315E] p-5 rounded-[4px] flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-400 font-semibold uppercase">Recoverable Cross-Border VAT</span>
                <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
                  ₹{vatSummary?.total_reclaimable_vat ? vatSummary.total_reclaimable_vat.toFixed(2) : '145.80'}
                </div>
                <span className="text-xs text-white/50">Eligible for international tax reclamation</span>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-[2px] text-emerald-400">
                <Percent className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#13152C] border border-[#2C315E] p-5 rounded-[4px] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#DFB76C] font-semibold uppercase">AI OCR Extraction Accuracy</span>
                <div className="text-2xl font-bold text-[#DFB76C] font-mono mt-1">98.5%</div>
                <span className="text-xs text-white/50">Autonomous tax & folio decomposition</span>
              </div>
              <div className="p-3 bg-[#1B1E3D] rounded-[2px] text-[#DFB76C]">
                <Scan className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* OCR Simulator & Expense Table */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* OCR Scanner Card */}
            <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Scan className="w-5 h-5 text-[#DFB76C]" /> AI OCR Receipt Scanner
              </h3>
              <p className="text-xs text-white/70">
                Simulate uploading paper or digital hotel folios, airline tickets, or dining receipts for automated parsing.
              </p>

              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase mb-1">Simulate Receipt Image</label>
                <select
                  value={ocrFilename}
                  onChange={(e) => setOcrFilename(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#E5DDCF] rounded-[2px] text-white text-xs font-medium"
                >
                  <option value="hotel_folio_geneva.jpg">Hotel Folio (The Grand Savoy - ₹873.60)</option>
                  <option value="flight_ticket_ba.jpg">Airline Ticket (British Airways - ₹688.00)</option>
                  <option value="executive_chauffeur.jpg">Ground Transfer (Blacklane - ₹123.20)</option>
                  <option value="client_dinner.jpg">Executive Dining (Bistro Le Gabriel - ₹162.40)</option>
                </select>
              </div>

              <button
                onClick={handleRunOcr}
                disabled={ocrLoading}
                className="w-full py-2.5 bg-[#13152C] hover:bg-[#1B1E3D] disabled:opacity-50 text-[#DFB76C] border border-[#DFB76C]/40 font-cinzel text-xs uppercase tracking-wider font-bold font-bold rounded-[2px] text-xs transition flex items-center justify-center gap-2"
              >
                <Scan className="w-4 h-4" /> {ocrLoading ? 'Scanning Document...' : 'Run AI OCR Extraction'}
              </button>

              {/* OCR Extracted Output */}
              {ocrResult && (
                <div className="p-4 bg-[#13152C] rounded-[2px] border border-[#DFB76C]/30 space-y-2 text-xs animate-fade-in">
                  <div className="flex justify-between items-center text-white/70 pb-1 border-b border-[#2C315E] pb-6">
                    <span>Confidence Score</span>
                    <span className="text-emerald-400 font-bold">{(ocrResult.confidence_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Merchant:</span>
                    <span className="font-semibold text-white">{ocrResult.merchant_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Category:</span>
                    <span className="font-semibold text-[#DFB76C]">{ocrResult.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Subtotal:</span>
                    <span className="font-mono text-white/80">₹{ocrResult.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">VAT (12%):</span>
                    <span className="font-mono text-emerald-400">₹{ocrResult.vat_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#2C315E]/15 font-bold">
                    <span className="text-white">Total:</span>
                    <span className="font-mono text-white text-sm">₹{ocrResult.total_amount.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={handleAddOcrToReport}
                    className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2px] font-semibold transition"
                  >
                    Add Line Item to Report
                  </button>
                </div>
              )}
            </div>

            {/* Expense Reports Table */}
            <div className="md:col-span-2 bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6">
              <h3 className="font-bold text-white text-base mb-4">Digitized Employee Expense Reports</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#2C315E] text-xs text-white/70 uppercase tracking-wider">
                      <th className="py-3 px-3">Report #</th>
                      <th className="py-3 px-3">Employee & Title</th>
                      <th className="py-3 px-3">Subtotal</th>
                      <th className="py-3 px-3">VAT</th>
                      <th className="py-3 px-3">Total</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2C315E] font-medium">
                    {expenses.map((rep) => (
                      <tr key={rep.id} className="hover:bg-[#1B1E3D] transition">
                        <td className="py-3 px-3 font-mono text-xs text-[#DFB76C]">{rep.report_number}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{rep.title}</div>
                          <div className="text-xs text-white/70">{rep.employee_name} • {rep.department}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-white/80 text-xs">₹{rep.subtotal.toFixed(2)}</td>
                        <td className="py-3 px-3 font-mono text-emerald-400 text-xs">₹{rep.vat_amount.toFixed(2)}</td>
                        <td className="py-3 px-3 font-mono text-white font-bold">₹{rep.total_amount.toFixed(2)}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-[2px] text-xs font-bold ${
                              rep.status === 'REIMBURSED'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : rep.status === 'APPROVED'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {rep.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1">
                          {rep.status === 'SUBMITTED' && (
                            <button
                              onClick={() => handleUpdateReportStatus(rep.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold"
                            >
                              Approve
                            </button>
                          )}
                          {rep.status === 'APPROVED' && (
                            <button
                              onClick={() => handleUpdateReportStatus(rep.id, 'REIMBURSED')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                            >
                              Reimburse
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: DUTY OF CARE SENTINEL --- */}
      {activeTab === 'duty-of-care' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 bg-amber-500/10 border border-amber-500/20 rounded-[4px]">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-amber-400 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-white text-lg">Duty of Care Traveler Tracking</h3>
                <p className="text-xs text-amber-300">
                  Global situational monitoring for all employees traveling domestically and internationally. Instant emergency alert broadcast.
                </p>
              </div>
            </div>
            <button
              onClick={() => setBroadcastModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-[2px] text-sm transition shadow-lg shadow-amber-600/30 whitespace-nowrap"
            >
              <Send className="w-4 h-4" /> Dispatch Emergency Broadcast
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {travelers.map((trv) => (
              <div key={trv.id} className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-base">{trv.employee_name}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-[2px] text-xs font-bold ${
                      trv.safety_status === 'CHECKED_IN_SAFE'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {trv.safety_status}
                  </span>
                </div>

                <div className="p-3 bg-[#13152C] rounded-[2px] space-y-1.5 text-xs text-white/80">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    <span><strong>Location:</strong> {trv.current_city}, {trv.destination_country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-blue-400" />
                    <span><strong>Lodging:</strong> {trv.hotel_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Plane className="w-3.5 h-3.5 text-[#DFB76C]" />
                    <span><strong>Flight PNR:</strong> {trv.flight_pnr}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span><strong>Dates:</strong> {trv.start_date} to {trv.end_date}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-white/70">Emergency Contact:</span>
                  <span className="font-mono text-white">{trv.emergency_phone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- REVIEW & DECIDE APPROVAL MODAL --- */}
      {approvalModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 bg-[#0B0C1E]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setApprovalModalOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Review Travel Request</h3>
            <p className="text-xs text-white/70 mb-4">{selectedReq.request_number} • {selectedReq.employee_name}</p>

            <div className="space-y-3 bg-[#1B1E3D]/70 p-4 rounded-[2px] text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-white/70">Destination:</span>
                <span className="font-semibold text-white">{selectedReq.destination}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Estimated Total:</span>
                <span className="font-bold text-emerald-400 font-mono">₹{selectedReq.estimated_total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Business Justification:</span>
                <span className="text-white max-w-[60%] text-right">{selectedReq.business_justification}</span>
              </div>
              {selectedReq.policy_violations?.length > 0 && (
                <div className="pt-2 border-t border-[#2C315E]/15">
                  <span className="text-rose-400 font-semibold">Policy Violations:</span>
                  <ul className="list-disc pl-4 mt-1 text-rose-300">
                    {selectedReq.policy_violations.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-white/70 uppercase mb-1">Approver Comments</label>
              <textarea
                value={approverComments}
                onChange={(e) => setApproverComments(e.target.value)}
                placeholder="Enter justification or approval reasoning..."
                rows={3}
                className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#E5DDCF] rounded-[2px] text-white text-xs"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleTakeAction('REJECT')}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-[2px] text-xs transition"
              >
                Reject Request
              </button>
              <button
                onClick={() => handleTakeAction('APPROVE')}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-[2px] text-xs transition"
              >
                Approve Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- NEW TRAVEL REQUEST MODAL --- */}
      {newRequestOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B0C1E]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setNewRequestOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-2">Request Business Travel</h3>
            <p className="text-xs text-white/70 mb-4">Submit itinerary for policy evaluation & management approval.</p>

            <form onSubmit={handleSubmitNewRequest} className="space-y-3 text-xs">
              <div>
                <label className="block text-white/70 uppercase font-semibold mb-1">Employee Name</label>
                <input
                  type="text"
                  required
                  value={reqEmployeeName}
                  onChange={(e) => setReqEmployeeName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#E5DDCF] rounded-[2px] text-white"
                />
              </div>

              <div>
                <label className="block text-white/70 uppercase font-semibold mb-1">Employee Email</label>
                <input
                  type="email"
                  required
                  value={reqEmployeeEmail}
                  onChange={(e) => setReqEmployeeEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#E5DDCF] rounded-[2px] text-white"
                />
              </div>

              <div>
                <label className="block text-white/70 uppercase font-semibold mb-1">Destination City</label>
                <input
                  type="text"
                  required
                  value={reqDestination}
                  onChange={(e) => setReqDestination(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#E5DDCF] rounded-[2px] text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 uppercase font-semibold mb-1">Departure</label>
                  <input
                    type="date"
                    required
                    value={reqDepDate}
                    onChange={(e) => setReqDepDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#E5DDCF] rounded-[2px] text-white"
                  />
                </div>
                <div>
                  <label className="block text-white/70 uppercase font-semibold mb-1">Return</label>
                  <input
                    type="date"
                    required
                    value={reqRetDate}
                    onChange={(e) => setReqRetDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#E5DDCF] rounded-[2px] text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/70 uppercase font-semibold mb-1">Estimated Budget (₹)</label>
                <input
                  type="number"
                  required
                  value={reqTotal}
                  onChange={(e) => setReqTotal(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#E5DDCF] rounded-[2px] text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-white/70 uppercase font-semibold mb-1">Business Purpose</label>
                <textarea
                  required
                  rows={2}
                  value={reqJustification}
                  onChange={(e) => setReqJustification(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#E5DDCF] rounded-[2px] text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#13152C] hover:bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/40 font-cinzel text-xs tracking-wider uppercase font-bold font-bold rounded-[2px] text-xs transition"
              >
                Submit Itinerary for Review
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- EMERGENCY BROADCAST MODAL --- */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B0C1E]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#13152C] border border-amber-500/40 rounded-[4px] max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setBroadcastModalOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-[2px]">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Duty of Care Alert</h3>
                <p className="text-xs text-white/70">Broadcast to {travelers.length} active travelers</p>
              </div>
            </div>

            {broadcastStatus ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-[2px] text-emerald-300 text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="font-bold text-sm">Emergency Alert Dispatched</div>
                <div className="text-xs">Sent to {broadcastStatus.recipients_count} deployed personnel.</div>
              </div>
            ) : (
              <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
                <div>
                  <label className="block text-white/70 uppercase font-semibold mb-1">Severity Level</label>
                  <select
                    value={broadcastSeverity}
                    onChange={(e) => setBroadcastSeverity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#E5DDCF] rounded-[2px] text-white font-medium"
                  >
                    <option value="LOW">Low (Informational Advisory)</option>
                    <option value="MEDIUM">Medium (Travel Delay Warning)</option>
                    <option value="HIGH">High (Airport Ground Stop / Security)</option>
                    <option value="CRITICAL">Critical (Immediate Shelter / Evacuate)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/70 uppercase font-semibold mb-1">Subject Header</label>
                  <input
                    type="text"
                    required
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#E5DDCF] rounded-[2px] text-white"
                  />
                </div>

                <div>
                  <label className="block text-white/70 uppercase font-semibold mb-1">Message Content</label>
                  <textarea
                    required
                    rows={4}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#E5DDCF] rounded-[2px] text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-[2px] text-xs transition"
                >
                  Broadcast Security Alert Now
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
