import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Briefcase,
  Plus,
  Calendar,
  Percent,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search,
  FileText,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Unlock,
} from 'lucide-react';
import { corporateService } from '../../services/corporateService';
import { propertyService } from '../../services/propertyService';
import { roomTypeService } from '../../services/roomTypeService';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const CorporateAccounts = () => {
  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts' | 'group_blocks'
  const [accounts, setAccounts] = useState([]);
  const [groupBlocks, setGroupBlocks] = useState([]);
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Corporate Account Form
  const [compName, setCompName] = useState('');
  const [compCode, setCompCode] = useState('');
  const [compIndustry, setCompIndustry] = useState('TECHNOLOGY');
  const [compContact, setCompContact] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compAddress, setCompAddress] = useState('');
  const [compDiscount, setCompDiscount] = useState(15.0);
  const [compCreditLimit, setCompCreditLimit] = useState(50000.0);
  const [compPaymentTerms, setCompPaymentTerms] = useState('DIRECT_BILL');

  // Group Block Form
  const [grpName, setGrpName] = useState('');
  const [grpCode, setGrpCode] = useState('');
  const [grpCheckIn, setGrpCheckIn] = useState('');
  const [grpCheckOut, setGrpCheckOut] = useState('');
  const [grpCutoff, setGrpCutoff] = useState('');
  const [grpRoomTypeId, setGrpRoomTypeId] = useState('');
  const [grpTotalRooms, setGrpTotalRooms] = useState(15);
  const [grpRate, setGrpRate] = useState(195.0);
  const [grpCoordinator, setGrpCoordinator] = useState('');
  const [grpCoordEmail, setGrpCoordEmail] = useState('');
  const [grpNotes, setGrpNotes] = useState('');

  // Code Verifier Widget
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      const [accData, propData] = await Promise.all([
        corporateService.getCorporateAccounts(),
        propertyService.getProperties({ limit: 100 }),
      ]);
      setAccounts(accData || []);
      const props = propData.items || [];
      setProperties(props);
      if (props.length > 0) {
        const firstPropId = props[0].id || props[0]._id;
        setSelectedPropertyId(firstPropId);
        loadGroupBlocks(firstPropId);
        loadRoomTypes(firstPropId);
      }
    } catch (err) {
      console.error('Failed to load corporate data:', err);
      setError('Failed to retrieve corporate accounts and group blocks.');
    } finally {
      setLoading(false);
    }
  };

  const loadGroupBlocks = async (propId) => {
    try {
      const data = await corporateService.getGroupBlocks({ property_id: propId });
      setGroupBlocks(data || []);
    } catch (err) {
      console.error('Failed to load group blocks:', err);
    }
  };

  const loadRoomTypes = async (propId) => {
    try {
      const data = await roomTypeService.getRoomTypes({ property_id: propId });
      const items = data.items || [];
      setRoomTypes(items);
      if (items.length > 0) {
        setGrpRoomTypeId(items[0].id || items[0]._id);
      }
    } catch (err) {
      console.error('Failed to load room types:', err);
    }
  };

  const handlePropertyChange = (e) => {
    const pId = e.target.value;
    setSelectedPropertyId(pId);
    loadGroupBlocks(pId);
    loadRoomTypes(pId);
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!compName.trim() || !compCode.trim() || !compEmail.trim()) {
      setError('Please provide company name, corporate code, and primary contact email.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const created = await corporateService.createCorporateAccount({
        company_name: compName.trim(),
        corporate_code: compCode.toUpperCase().trim(),
        industry: compIndustry,
        contact_name: compContact.trim(),
        contact_email: compEmail.trim(),
        contact_phone: compPhone.trim(),
        billing_address: compAddress.trim(),
        contracted_discount_pct: parseFloat(compDiscount),
        credit_limit: parseFloat(compCreditLimit),
        payment_terms: compPaymentTerms,
      });

      setSuccessMsg(`Corporate account '${created.company_name}' registered successfully.`);
      setAccountModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 4000);
      const accs = await corporateService.getCorporateAccounts();
      setAccounts(accs || []);
    } catch (err) {
      console.error('Failed to create corporate account:', err);
      setError(err.response?.data?.detail || 'Failed to create corporate account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateGroupBlock = async (e) => {
    e.preventDefault();
    if (!grpName.trim() || !grpCode.trim() || !grpCheckIn || !grpCheckOut || !grpCutoff) {
      setError('Please provide event name, group code, and stay/cutoff dates.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const created = await corporateService.createGroupBlock({
        property_id: selectedPropertyId,
        group_name: grpName.trim(),
        group_code: grpCode.toUpperCase().trim(),
        check_in_date: grpCheckIn,
        check_out_date: grpCheckOut,
        cutoff_date: grpCutoff,
        room_type_id: grpRoomTypeId,
        total_rooms_blocked: parseInt(grpTotalRooms, 10),
        agreed_rate: parseFloat(grpRate),
        coordinator_name: grpCoordinator.trim(),
        coordinator_email: grpCoordEmail.trim(),
        notes: grpNotes.trim(),
      });

      setSuccessMsg(`Group block '${created.group_name}' booked successfully.`);
      setGroupModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadGroupBlocks(selectedPropertyId);
    } catch (err) {
      console.error('Failed to create group block:', err);
      setError(err.response?.data?.detail || 'Failed to create group block.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReleaseBlock = async (blockId, groupName) => {
    if (!window.confirm(`Release unpicked rooms for '${groupName}' back to hotel inventory?`)) return;
    try {
      await corporateService.releaseUnpickedRooms(blockId);
      setSuccessMsg(`Unpicked rooms released back to inventory for '${groupName}'.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadGroupBlocks(selectedPropertyId);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to release rooms.');
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!verifyInput.trim()) return;
    try {
      setVerifying(true);
      const res = await corporateService.verifyCorporateCode(verifyInput.trim());
      setVerifyResult(res);
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 font-sans text-[#FAF6F0]">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#DFB76C]/30">
        <div>
          <span className="font-cinzel text-[10px] tracking-[0.25em] text-[#DFB76C] uppercase font-bold">
            B2B & Group Inventory Management
          </span>
          <h1 className="mt-1 font-editorial text-3xl md:text-4xl text-white tracking-tight font-bold">
            Corporate Accounts & Group Blocks
          </h1>
          <p className="mt-1 text-xs text-white/70 max-w-xl">
            Negotiated enterprise rate agreements, corporate credit limits, and conference group room blocks with inventory release cutoffs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'group_blocks' && (
            <select
              value={selectedPropertyId}
              onChange={handlePropertyChange}
              className="bg-[#1B1E3D] border border-[#2C315E] px-3 py-2 text-xs font-cinzel rounded-[2px] text-white focus:border-[#DFB76C] focus:outline-none"
            >
              {properties.map((p) => (
                <option key={p.id || p._id} value={p.id || p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          {activeTab === 'accounts' ? (
            <button
              onClick={() => setAccountModalOpen(true)}
              className="px-4 py-2 bg-[#DFB76C] hover:bg-[#F2D59B] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px] transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Corporate Account</span>
            </button>
          ) : (
            <button
              onClick={() => setGroupModalOpen(true)}
              className="px-4 py-2 bg-[#DFB76C] hover:bg-[#F2D59B] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px] transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Group Block</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-[2px] text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-[2px] text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#13152C] border border-[#2C315E] p-5 rounded-[4px] shadow-sm">
          <span className="font-cinzel text-[9px] uppercase tracking-wider text-white/70 block font-bold">
            Corporate Clients
          </span>
          <p className="font-editorial text-3xl text-white font-bold mt-2">{accounts.length}</p>
          <span className="text-[11px] text-white/50 mt-1 block">Contracted enterprise partners</span>
        </div>

        <div className="bg-[#13152C] border border-[#2C315E] p-5 rounded-[4px] shadow-sm">
          <span className="font-cinzel text-[9px] uppercase tracking-wider text-white/70 block font-bold">
            Average Discount Tier
          </span>
          <p className="font-editorial text-3xl text-[#DFB76C] font-bold mt-2">
            {accounts.length > 0
              ? (
                  accounts.reduce((acc, a) => acc + a.contracted_discount_pct, 0) /
                  accounts.length
                ).toFixed(1) + '%'
              : '0%'}
          </p>
          <span className="text-[11px] text-white/50 mt-1 block">Negotiated off standard BAR rate</span>
        </div>

        <div className="bg-[#13152C] border border-[#2C315E] p-5 rounded-[4px] shadow-sm">
          <span className="font-cinzel text-[9px] uppercase tracking-wider text-[#DFB76C] block font-bold">
            Active Group Blocks
          </span>
          <p className="font-editorial text-3xl text-[#DFB76C] font-bold mt-2">{groupBlocks.length}</p>
          <span className="text-[11px] text-white/50 mt-1 block">Conferences, retreats & summits</span>
        </div>

        <div className="bg-[#13152C] border border-[#2C315E] p-5 rounded-[4px] shadow-sm">
          <span className="font-cinzel text-[9px] uppercase tracking-wider text-white/70 block font-bold">
            Total Blocked Rooms
          </span>
          <p className="font-editorial text-3xl text-white font-bold mt-2">
            {groupBlocks.reduce((acc, b) => acc + (b.total_rooms_blocked || 0), 0)}
          </p>
          <span className="text-[11px] text-white/50 mt-1 block">
            {groupBlocks.reduce((acc, b) => acc + (b.rooms_picked_up || 0), 0)} picked up by attendees
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-[#2C315E] pb-2">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 text-xs font-cinzel font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'accounts'
              ? 'bg-[#DFB76C] text-white font-bold border border-[#DFB76C]'
              : 'bg-[#1B1E3D] text-white/70 hover:text-white border border-[#2C315E]'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Contracted Corporate Accounts ({accounts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('group_blocks')}
          className={`px-4 py-2 text-xs font-cinzel font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'group_blocks'
              ? 'bg-[#DFB76C] text-white font-bold border border-[#DFB76C]'
              : 'bg-[#1B1E3D] text-white/70 hover:text-white border border-[#2C315E]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Group Room Blocks & Cutoffs ({groupBlocks.length})</span>
        </button>
      </div>

      {/* TAB 1: CORPORATE ACCOUNTS DIRECTORY */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <LoadingSpinner text="Retrieving corporate accounts registry..." />
            ) : accounts.length === 0 ? (
              <div className="p-12 text-center text-xs text-white/50 bg-[#13152C] border border-[#2C315E] rounded">
                No corporate accounts registered yet. Click "New Corporate Account" to register one.
              </div>
            ) : (
              <div className="space-y-4">
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-5 shadow-sm hover:border-[#DFB76C]/60 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="font-editorial text-lg font-bold text-white">{acc.company_name}</h3>
                          <span className="px-2 py-0.5 rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] font-cinzel text-[9px] font-bold text-[#DFB76C]">
                            {acc.corporate_code}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-[2px] font-cinzel text-[9px] font-bold border ${
                              acc.status === 'ACTIVE'
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                                : 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                            }`}
                          >
                            {acc.status}
                          </span>
                        </div>
                        <p className="text-xs text-white/70 mt-1">
                          Contact: {acc.contact_name} ({acc.contact_email}) • {acc.contact_phone || 'No phone'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-editorial text-2xl font-bold text-[#DFB76C]">
                          {acc.contracted_discount_pct}% OFF
                        </span>
                        <span className="block text-[10px] text-white/50 font-cinzel font-bold">
                          Negotiated Contract
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#2C315E] flex items-center justify-between text-xs text-white/70 flex-wrap gap-3">
                      <div className="flex items-center gap-4">
                        <span>
                          Terms: <strong className="text-white">{acc.payment_terms.replace(/_/g, ' ')}</strong>
                        </span>
                        <span>
                          Credit Limit:{' '}
                          <strong className="text-white">₹{acc.credit_limit?.toLocaleString()}</strong>
                        </span>
                        <span>
                          Current Balance:{' '}
                          <strong className={acc.current_balance > 0 ? 'text-[#DFB76C]' : 'text-[#2D5A40]'}>
                            ₹{acc.current_balance?.toLocaleString()}
                          </strong>
                        </span>
                      </div>
                      <span className="text-[11px] font-sans text-white/50 truncate max-w-xs">
                        {acc.billing_address || 'Address on file'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Corporate Code Validator Widget */}
          <div className="space-y-4">
            <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#DFB76C]/20">
                <div className="w-8 h-8 rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] text-[#DFB76C] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-editorial text-lg text-white">Corporate Rate Validator</h3>
                  <p className="text-[11px] text-white/50">Audit promo code validity and contracted terms</p>
                </div>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase tracking-wider mb-1">
                    Corporate Promo Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CORP-GOOG, CORP-DELOITTE"
                    value={verifyInput}
                    onChange={(e) => setVerifyInput(e.target.value)}
                    className="w-full bg-[#1B1E3D] border border-[#2C315E] text-white placeholder-white/40 px-3 py-2 text-xs rounded uppercase font-cinzel font-bold focus:border-[#DFB76C] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={verifying}
                  className="w-full px-4 py-2 bg-[#DFB76C] hover:bg-[#F2D59B] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px] transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>{verifying ? 'Verifying...' : 'Validate Corporate Rate'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {verifyResult && (
                <div
                  className={`p-4 rounded-[2px] border text-xs space-y-2 ${
                    verifyResult.is_valid
                      ? 'bg-[#EBF7EE] border-[#2D5A40]/30 text-[#2D5A40]'
                      : 'bg-[#FDF2F2] border-red-200 text-red-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-cinzel font-bold">
                    {verifyResult.is_valid ? (
                      <CheckCircle2 className="w-4 h-4 text-[#2D5A40]" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span>{verifyResult.company_name || 'Verification Result'}</span>
                  </div>
                  <p className="text-[11px] font-sans">{verifyResult.message}</p>
                  {verifyResult.is_valid && (
                    <div className="pt-2 border-t border-[#2D5A40]/20 flex justify-between font-bold text-[11px]">
                      <span>Contracted Discount:</span>
                      <span>{verifyResult.contracted_discount_pct}% OFF</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GROUP BLOCKS & CUTOFFS */}
      {activeTab === 'group_blocks' && (
        <div className="space-y-4">
          {groupBlocks.length === 0 ? (
            <div className="p-12 text-center text-xs text-white/50 bg-[#13152C] border border-[#2C315E] rounded">
              No active group blocks for the selected estate. Click "Create Group Block" to book an event block.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {groupBlocks.map((block) => {
                const pickupPct =
                  block.total_rooms_blocked > 0
                    ? Math.round((block.rooms_picked_up / block.total_rooms_blocked) * 100)
                    : 100;
                const isReleased = block.status === 'RELEASED';

                return (
                  <div
                    key={block.id}
                    className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 shadow-sm space-y-4 hover:border-[#DFB76C]/60 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] font-cinzel text-[9px] font-bold text-[#DFB76C]">
                            {block.group_code}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-[2px] font-cinzel text-[9px] font-bold border ${
                              isReleased
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                            }`}
                          >
                            {block.status}
                          </span>
                        </div>
                        <h3 className="font-editorial text-xl font-bold text-white mt-1">
                          {block.group_name}
                        </h3>
                        <p className="text-xs text-white/70 mt-0.5">
                          Coordinator: {block.coordinator_name} ({block.coordinator_email})
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-editorial text-2xl font-bold text-[#DFB76C]">
                          ₹{block.agreed_rate}
                        </span>
                        <span className="block text-[10px] text-white/50 font-cinzel">agreed rate / night</span>
                      </div>
                    </div>

                    {/* Stay & Cutoff Dates */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-[#1B1E3D] border border-[#2C315E] rounded text-xs">
                      <div>
                        <span className="font-cinzel text-[9px] uppercase font-bold text-white/50 block">
                          Event Stay Period
                        </span>
                        <span className="font-bold text-white">
                          {block.check_in_date} to {block.check_out_date}
                        </span>
                      </div>
                      <div>
                        <span className="font-cinzel text-[9px] uppercase font-bold text-[#DFB76C] block">
                          Release Cutoff Date
                        </span>
                        <span className="font-bold text-[#DFB76C]">{block.cutoff_date}</span>
                      </div>
                    </div>

                    {/* Pickup Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-cinzel">
                        <span className="text-white/70">Room Pickup Absorption</span>
                        <span className="font-bold text-white">
                          {block.rooms_picked_up} / {block.total_rooms_blocked} Suites ({pickupPct}%)
                        </span>
                      </div>
                      <div className="w-full bg-[#1B1E3D] h-2.5 rounded-full overflow-hidden border border-[#2C315E]">
                        <div
                          className="bg-gradient-to-r from-[#DFB76C] to-[#B88E43] h-full transition-all"
                          style={{ width: `${Math.min(pickupPct, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-2 border-t border-[#2C315E] flex items-center justify-between">
                      <span className="text-[11px] text-white/70">
                        {block.rooms_remaining} rooms remaining in block
                      </span>
                      {!isReleased && block.rooms_remaining > 0 && (
                        <button
                          onClick={() => handleReleaseBlock(block.id, block.group_name)}
                          className="px-3 py-1.5 bg-[#1B1E3D] border border-amber-500/40 text-amber-300 hover:bg-amber-950/40 font-cinzel text-[10px] font-bold tracking-wider uppercase rounded-[2px] transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Release Unpicked Rooms</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE CORPORATE ACCOUNT MODAL */}
      {accountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0C1E]/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-[#FAF6F0] my-auto">
            <div className="px-6 py-4 bg-[#1B1E3D] border-b border-[#2C315E] flex items-center justify-between">
              <h2 className="font-editorial text-xl font-bold text-white">Register Corporate Account</h2>
              <button
                onClick={() => setAccountModalOpen(false)}
                className="text-xs font-cinzel text-white/70 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase tracking-wider mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apple Inc, Amazon"
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    className="w-full bg-[#1B1E3D] border border-[#2C315E] text-white placeholder-white/40 px-3 py-2 rounded focus:border-[#DFB76C] focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase tracking-wider mb-1">
                    Corporate Promo Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CORP-APPLE"
                    value={compCode}
                    onChange={(e) => setCompCode(e.target.value)}
                    className="w-full bg-[#1B1E3D] border border-[#2C315E] text-white placeholder-white/40 px-3 py-2 rounded uppercase font-cinzel font-bold focus:border-[#DFB76C] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase tracking-wider mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eleanor Vance"
                    value={compContact}
                    onChange={(e) => setCompContact(e.target.value)}
                    className="w-full bg-[#1B1E3D] border border-[#2C315E] text-white placeholder-white/40 px-3 py-2 rounded focus:border-[#DFB76C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase tracking-wider mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="travel@company.com"
                    value={compEmail}
                    onChange={(e) => setCompEmail(e.target.value)}
                    className="w-full bg-[#1B1E3D] border border-[#2C315E] text-white placeholder-white/40 px-3 py-2 rounded focus:border-[#DFB76C] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-[#1B1E3D]/60 border border-[#2C315E] rounded">
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase mb-1">
                    Contracted Discount (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="90"
                    required
                    value={compDiscount}
                    onChange={(e) => setCompDiscount(e.target.value)}
                    className="w-full bg-[#1B1E3D] border border-[#2C315E] text-white px-2.5 py-1.5 rounded font-bold focus:border-[#DFB76C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase mb-1">
                    Credit Limit (₹)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    required
                    value={compCreditLimit}
                    onChange={(e) => setCompCreditLimit(e.target.value)}
                    className="w-full bg-[#1B1E3D] border border-[#2C315E] text-white px-2.5 py-1.5 rounded font-bold focus:border-[#DFB76C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase mb-1">
                    Billing Terms
                  </label>
                  <select
                    value={compPaymentTerms}
                    onChange={(e) => setCompPaymentTerms(e.target.value)}
                    className="w-full bg-[#1B1E3D] border border-[#2C315E] text-white px-2 py-1.5 rounded text-xs focus:border-[#DFB76C] focus:outline-none"
                  >
                    <option value="DIRECT_BILL">Direct Bill Master Folio</option>
                    <option value="CREDIT_CARD">Credit Card on File</option>
                    <option value="PRE_PAID">Pre-Paid Deposit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase tracking-wider mb-1">
                  Billing Address & Headquarters
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1 Infinite Loop, Cupertino, CA"
                  value={compAddress}
                  onChange={(e) => setCompAddress(e.target.value)}
                  className="w-full bg-[#1B1E3D] border border-[#2C315E] text-white placeholder-white/40 px-3 py-2 rounded focus:border-[#DFB76C] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DFB76C]/20">
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(false)}
                  className="px-4 py-2 rounded-[2px] border border-[#2C315E] bg-[#1B1E3D] text-white/80 hover:text-white font-cinzel text-xs uppercase cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-white font-cinzel text-xs font-bold uppercase tracking-wider cursor-pointer transition"
                >
                  {submitting ? 'Registering...' : 'Register Corporate Contract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE GROUP BLOCK MODAL */}
      {groupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B0C1E]/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden text-[#FAF6F0] my-auto">
            <div className="px-6 py-4 bg-[#1B1E3D] border-b border-[#2C315E] flex items-center justify-between">
              <h2 className="font-editorial text-xl font-bold text-white">Create Event Group Block</h2>
              <button
                onClick={() => setGroupModalOpen(false)}
                className="text-xs font-cinzel text-white/70 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateGroupBlock} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase tracking-wider mb-1">
                    Event / Group Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Global Tech Summit 2026"
                    value={grpName}
                    onChange={(e) => setGrpName(e.target.value)}
                    className="w-full bg-[#1B1E3D] border border-[#2C315E] text-white placeholder-white/40 px-3 py-2 rounded focus:border-[#DFB76C] focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase tracking-wider mb-1">
                    Group Booking Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GRP-SUMMIT"
                    value={grpCode}
                    onChange={(e) => setGrpCode(e.target.value)}
                    className="w-full bg-[#1B1E3D] border border-[#2C315E] text-white placeholder-white/40 px-3 py-2 rounded uppercase font-cinzel font-bold focus:border-[#DFB76C] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase tracking-wider mb-1">
                    Event Check-In
                  </label>
                  <input
                    type="date"
                    required
                    value={grpCheckIn}
                    onChange={(e) => setGrpCheckIn(e.target.value)}
                    className="w-full bg-[#1B1E3D] border border-[#2C315E] text-white px-2 py-1.5 rounded focus:border-[#DFB76C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase tracking-wider mb-1">
                    Event Check-Out
                  </label>
                  <input
                    type="date"
                    required
                    value={grpCheckOut}
                    onChange={(e) => setGrpCheckOut(e.target.value)}
                    className="w-full bg-[#1B1E3D] border border-[#2C315E] text-white px-2 py-1.5 rounded focus:border-[#DFB76C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-[#DFB76C] uppercase tracking-wider mb-1">
                    Cutoff Release Date
                  </label>
                  <input
                    type="date"
                    required
                    value={grpCutoff}
                    onChange={(e) => setGrpCutoff(e.target.value)}
                    className="w-full bg-[#1B1E3D] border border-[#2C315E] text-white px-2 py-1.5 rounded focus:border-[#DFB76C] focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-[#1B1E3D]/60 border border-[#2C315E] rounded">
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase mb-1">
                    Target Suite Unit
                  </label>
                  <select
                    value={grpRoomTypeId}
                    onChange={(e) => setGrpRoomTypeId(e.target.value)}
                    className="w-full bg-[#1B1E3D] border border-[#2C315E] text-white px-2 py-1.5 rounded text-xs focus:border-[#DFB76C] focus:outline-none"
                  >
                    {roomTypes.map((rt) => (
                      <option key={rt.id || rt._id} value={rt.id || rt._id}>
                        {rt.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase mb-1">
                    Total Rooms Blocked
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    required
                    value={grpTotalRooms}
                    onChange={(e) => setGrpTotalRooms(e.target.value)}
                    className="w-full bg-[#1B1E3D] border border-[#2C315E] text-white px-2.5 py-1.5 rounded font-bold focus:border-[#DFB76C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase mb-1">
                    Agreed Group Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={grpRate}
                    onChange={(e) => setGrpRate(e.target.value)}
                    className="w-full bg-[#1B1E3D] border border-[#2C315E] text-white px-2.5 py-1.5 rounded font-bold focus:border-[#DFB76C] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase tracking-wider mb-1">
                    Coordinator Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Marcus Vance"
                    value={grpCoordinator}
                    onChange={(e) => setGrpCoordinator(e.target.value)}
                    className="w-full bg-[#1B1E3D] border border-[#2C315E] text-white placeholder-white/40 px-3 py-2 rounded focus:border-[#DFB76C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase tracking-wider mb-1">
                    Coordinator Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="events@company.com"
                    value={grpCoordEmail}
                    onChange={(e) => setGrpCoordEmail(e.target.value)}
                    className="w-full bg-[#1B1E3D] border border-[#2C315E] text-white placeholder-white/40 px-3 py-2 rounded focus:border-[#DFB76C] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DFB76C]/20">
                <button
                  type="button"
                  onClick={() => setGroupModalOpen(false)}
                  className="px-4 py-2 rounded-[2px] border border-[#2C315E] bg-[#1B1E3D] text-white/80 hover:text-white font-cinzel text-xs uppercase cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-white font-cinzel text-xs font-bold uppercase tracking-wider cursor-pointer transition"
                >
                  {submitting ? 'Creating Block...' : 'Confirm Room Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorporateAccounts;
