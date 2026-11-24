import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  TrendingUp,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  Building2,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Printer,
  ChevronRight,
  Eye,
  ArrowUpRight,
  X,
  Sparkles,
  RefreshCw,
  Wallet,
  ShieldCheck
} from 'lucide-react';
import { reservationService } from '../../services/reservationService';
import { propertyService } from '../../services/propertyService';
import { analyticsService } from '../../services/analyticsService';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { FolioModal } from '../../components/FolioModal';

export const FinanceOverview = () => {
  const [reservations, setReservations] = useState([]);
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL'); // 'ALL' | 'PAID' | 'PENDING' | 'CONFIRMED'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeFolio, setActiveFolio] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [resData, propData] = await Promise.all([
        reservationService.getReservations({ limit: 100 }),
        propertyService.getProperties({ limit: 100 }),
      ]);
      setReservations(resData.items || []);
      setProperties(propData.items || []);
    } catch (err) {
      console.error('Failed to load finance ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const filteredReservations = reservations.filter((res) => {
    if (selectedPropertyId !== 'ALL' && res.property_id !== selectedPropertyId) return false;
    
    const isPaid = res.payment_status === 'PAID';
    if (paymentFilter === 'PAID' && !isPaid) return false;
    if (paymentFilter === 'PENDING' && isPaid) return false;
    if (paymentFilter === 'CONFIRMED' && res.status !== 'CONFIRMED') return false;

    if (search) {
      const q = search.toLowerCase();
      const ref = (res.booking_reference || '').toLowerCase();
      const guest = (res.guest_name || '').toLowerCase();
      const room = (res.room_number || '').toLowerCase();
      if (!ref.includes(q) && !guest.includes(q) && !room.includes(q)) return false;
    }
    return true;
  });

  const grossBilled = filteredReservations.reduce((acc, r) => acc + (Number(r.total_amount) || 0), 0);
  const totalPaid = filteredReservations
    .filter((r) => r.payment_status === 'PAID')
    .reduce((acc, r) => acc + (Number(r.total_amount) || 0), 0);
  const totalPending = grossBilled - totalPaid;
  const totalTaxes = filteredReservations.reduce((acc, r) => acc + (Number(r.taxes) || (Number(r.total_amount) * 0.12) || 0), 0);
  const totalFolios = filteredReservations.length;
  const collectionRate = grossBilled > 0 ? Math.round((totalPaid / grossBilled) * 100) : 100;

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Booking Ref', 'Guest', 'Property', 'Check In', 'Check Out', 'Subtotal (₹)', 'GST (₹)', 'Total Amount (₹)', 'Payment Status', 'Reservation Status'];
    const rows = filteredReservations.map((r) => [
      r.booking_reference || r.id,
      `"${r.guest_name || 'Guest'}"`,
      `"${r.property_name || 'Property'}"`,
      r.check_in_date || '',
      r.check_out_date || '',
      (r.subtotal || (r.total_amount * 0.88)).toFixed(2),
      (r.taxes || (r.total_amount * 0.12)).toFixed(2),
      (r.total_amount || 0).toFixed(2),
      r.payment_status || 'PENDING',
      r.status || 'CONFIRMED'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Nexgile_Financial_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotification('Financial journal exported successfully!');
    setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2C315E]">
        <div>
          <span className="eyebrow-label text-[#DFB76C]">REVENUE &amp; FINANCE &middot; TREASURY LEDGER</span>
          <h1 className="text-3xl font-editorial font-bold text-white tracking-tight mt-1">
            Financial Folios &amp; Ledger Audit
          </h1>
          <p className="text-xs text-white/70 mt-1">
            Audit settled payments, outstanding receivables, tax accruals, and guest folio statements.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start">
          <button
            onClick={loadInitialData}
            className="btn-luxury-secondary text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#DFB76C]" />
            <span>Sync Ledger</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="btn-luxury-primary text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#DFB76C]" />
            <span>Export CSV Folio</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-4 rounded-[4px] bg-[#1B1E3D] border border-[#DFB76C]/60 flex items-center gap-2 text-xs font-cinzel text-white shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-[#DFB76C] shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-5 shadow-sm">
          <span className="eyebrow-label text-white/70 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-[#DFB76C]" /> Gross Billed
          </span>
          <p className="text-3xl font-editorial font-bold text-white mt-1">
            ₹{grossBilled.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-white/60">{totalFolios} total folios</span>
        </div>

        <div className="bg-[#13152C] border border-emerald-300 rounded-[4px] p-5 shadow-sm">
          <span className="eyebrow-label text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Settled Revenue
          </span>
          <p className="text-3xl font-editorial font-bold text-emerald-900 mt-1">
            ₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-emerald-800/80">{collectionRate}% collection rate</span>
        </div>

        <div className="bg-[#13152C] border border-amber-300 rounded-[4px] p-5 shadow-sm">
          <span className="eyebrow-label text-amber-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Accounts Receivable
          </span>
          <p className="text-3xl font-editorial font-bold text-amber-900 mt-1">
            ₹{totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-amber-800/80">Pending checkout / desk bill</span>
        </div>

        <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-5 shadow-sm">
          <span className="eyebrow-label text-white/80 flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-[#DFB76C]" /> GST Accruals (12%)
          </span>
          <p className="text-3xl font-editorial font-bold text-white mt-1">
            ₹{totalTaxes.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-white/60">GST (Goods &amp; Services Tax)</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#13152C] border border-[#2C315E] p-5 rounded-[4px] shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Property Selector */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#DFB76C]" />
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="px-3.5 py-2 bg-[#1B1E3D] border border-[#2C315E] rounded-[3px] text-xs font-semibold text-white focus:outline-none focus:border-[#DFB76C] focus:bg-[#13152C]"
            >
              <option value="ALL">All Hotel Estates</option>
              {properties.map((p) => (
                <option key={p.id || p._id} value={p.id || p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative group">
            <Search className="w-3.5 h-3.5 text-[#DFB76C]/80 stroke-[2.2] group-focus-within:text-[#DFB76C] transition-colors pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reference, guest, suite..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 bg-[#1B1E3D] border border-[#2C315E] rounded-[3px] text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#DFB76C] focus:bg-[#13152C] w-64"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Folios', count: reservations.length },
            { id: 'PAID', label: 'Settled', count: reservations.filter((r) => r.payment_status === 'PAID').length },
            { id: 'PENDING', label: 'Unsettled', count: reservations.filter((r) => r.payment_status !== 'PAID').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPaymentFilter(tab.id)}
              className={`px-3 py-1.5 rounded-[3px] text-xs font-cinzel tracking-wider transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                paymentFilter === tab.id
                  ? 'bg-[#13152C] text-[#FAF6F0] border border-[#DFB76C]'
                  : 'bg-[#1B1E3D] border border-[#2C315E] text-white/70 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${paymentFilter === tab.id ? 'bg-[#DFB76C] text-white' : 'bg-[#2C315E] text-white'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <LoadingSpinner message="Auditing financial folios and ledger entries..." />
      ) : filteredReservations.length === 0 ? (
        <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-12 text-center shadow-sm">
          <Receipt className="w-12 h-12 text-[#DFB76C] mx-auto" />
          <h3 className="font-editorial text-xl font-bold text-white mt-3">No Folios Matching Query</h3>
          <p className="text-xs text-white/70 mt-1">
            Try adjusting your property selector or search term.
          </p>
        </div>
      ) : (
        <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1B1E3D] border-b border-[#2C315E] text-white/70">
                <tr>
                  <th className="py-3.5 px-4 eyebrow-label">Booking Ref / Invoice</th>
                  <th className="py-3.5 px-4 eyebrow-label">Guest &amp; Suite</th>
                  <th className="py-3.5 px-4 eyebrow-label">Stay Window</th>
                  <th className="py-3.5 px-4 text-right eyebrow-label">Subtotal</th>
                  <th className="py-3.5 px-4 text-right eyebrow-label">Taxes</th>
                  <th className="py-3.5 px-4 text-right eyebrow-label">Total Folio</th>
                  <th className="py-3.5 px-4 text-center eyebrow-label">Payment Status</th>
                  <th className="py-3.5 px-4 text-right eyebrow-label">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE5DA]/60">
                {filteredReservations.map((res) => {
                  const isPaid = res.payment_status === 'PAID';
                  const hasRazorpay = res.payment_details?.gateway === 'RAZORPAY';
                  const total = Number(res.total_amount) || 0;
                  const tax = Number(res.taxes) || (total * 0.12);
                  const sub = Number(res.subtotal) || (total - tax);

                  return (
                    <tr key={res.id || res._id} className="hover:bg-[#1B1E3D]/60 transition-colors">
                      <td className="py-3.5 px-4 font-cinzel font-bold text-white">
                        {res.booking_reference || (res.id || res._id).substring(0, 8)}
                        <span className="block text-[10px] font-sans font-normal text-white/60">
                          {res.property_name || 'Property Unit'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-white block">
                          {res.guest_name || 'Guest User'}
                        </span>
                        <span className="text-[11px] text-white/60">
                          Suite #{res.room_number || 'TBD'} &bull; {res.room_type_name || 'Standard'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-white/80 font-mono text-[11px]">
                        <span>{res.check_in_date} &rarr; {res.check_out_date}</span>
                        <span className="block text-[10px] text-white/50 font-sans">
                          {res.number_of_nights || 1} Night(s)
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-white/80">
                        ₹{sub.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-white/70">
                        ₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-right font-editorial font-bold text-base text-white">
                        ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-cinzel font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {hasRazorpay ? 'Razorpay (Paid)' : 'Settled'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] bg-amber-50 border border-amber-300 text-amber-800 text-[10px] font-cinzel font-bold">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending Desk
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setActiveFolio(res)}
                          className="btn-luxury-secondary text-xs py-1 px-2.5 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#DFB76C]" />
                          <span>Folio</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dynamic Itemized Folio / Invoice Modal */}
      {activeFolio && (
        <FolioModal
          isOpen={!!activeFolio}
          onClose={() => setActiveFolio(null)}
          reservationId={activeFolio.id || activeFolio._id}
          onFolioUpdated={() => loadInitialData()}
        />
      )}
    </div>
  );
};

export default FinanceOverview;
