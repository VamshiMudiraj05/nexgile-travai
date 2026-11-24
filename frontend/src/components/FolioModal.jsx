import React, { useState, useEffect } from 'react';
import {
  X,
  Receipt,
  CreditCard,
  PlusCircle,
  Printer,
  Download,
  Globe,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { folioService } from '../services/folioService';
import { pdfService } from '../services/pdfService';
import { LoadingSpinner } from './LoadingSpinner';

export const FolioModal = ({ isOpen, onClose, reservationId, onFolioUpdated }) => {
  const [folio, setFolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('charges'); // 'charges', 'add_charge', 'payment', 'invoice'

  // Multi-Currency State
  const [currencies, setCurrencies] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [convertedBalance, setConvertedBalance] = useState(null);
  const [converting, setConverting] = useState(false);

  // New Charge Form
  const [chargeCategory, setChargeCategory] = useState('FOOD_AND_BEVERAGE');
  const [chargeDescription, setChargeDescription] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeTaxRate, setChargeTaxRate] = useState(0.12);
  const [submittingCharge, setSubmittingCharge] = useState(false);

  // New Payment Form
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Invoice State
  const [invoice, setInvoice] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  useEffect(() => {
    if (isOpen && reservationId) {
      loadFolioData();
      loadCurrencies();
    } else {
      setFolio(null);
      setError('');
      setSuccessMsg('');
      setActiveTab('charges');
    }
  }, [isOpen, reservationId]);

  const loadFolioData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await folioService.getFolioByReservation(reservationId);
      setFolio(data);
      if (data && data.balance > 0) {
        setPaymentAmount(data.balance.toFixed(2));
      }
    } catch (err) {
      console.error('Failed to load guest folio:', err);
      setError(err.response?.data?.detail || 'Failed to retrieve guest folio details.');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrencies = async () => {
    try {
      const data = await folioService.getCurrencies();
      setCurrencies(data || []);
    } catch (err) {
      console.error('Failed to load supported currencies:', err);
    }
  };

  const handleCurrencyChange = async (e) => {
    const targetCurr = e.target.value;
    setSelectedCurrency(targetCurr);
    if (!folio) return;

    if (targetCurr === 'USD') {
      setConvertedBalance(null);
      return;
    }

    try {
      setConverting(true);
      const res = await folioService.convertCurrency(folio.balance, 'USD', targetCurr);
      setConvertedBalance(res);
    } catch (err) {
      console.error('Currency conversion error:', err);
    } finally {
      setConverting(false);
    }
  };

  const handlePostCharge = async (e) => {
    e.preventDefault();
    if (!chargeAmount || parseFloat(chargeAmount) <= 0) {
      setError('Please provide a valid positive charge amount.');
      return;
    }
    if (!chargeDescription.trim()) {
      setError('Please provide a description for this charge.');
      return;
    }

    try {
      setSubmittingCharge(true);
      setError('');
      const updated = await folioService.postCharge(folio.id, {
        category: chargeCategory,
        description: chargeDescription.trim(),
        amount: parseFloat(chargeAmount),
        tax_rate: parseFloat(chargeTaxRate),
        currency: 'USD',
      });
      setFolio(updated);
      setChargeDescription('');
      setChargeAmount('');
      setSuccessMsg('Charge successfully posted to guest folio.');
      setActiveTab('charges');
      if (onFolioUpdated) onFolioUpdated(updated);
    } catch (err) {
      console.error('Failed to post charge:', err);
      setError(err.response?.data?.detail || 'Failed to post charge to folio.');
    } finally {
      setSubmittingCharge(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      setError('Please enter a valid settlement payment amount.');
      return;
    }

    try {
      setSubmittingPayment(true);
      setError('');
      const updated = await folioService.recordPayment(folio.id, {
        payment_method: paymentMethod,
        amount: parseFloat(paymentAmount),
        currency: 'USD',
        transaction_reference: paymentRef.trim() || undefined,
      });
      setFolio(updated);
      setPaymentRef('');
      setSuccessMsg('Payment received and credited to guest folio.');
      setActiveTab('charges');
      if (onFolioUpdated) onFolioUpdated(updated);
    } catch (err) {
      console.error('Failed to record payment:', err);
      setError(err.response?.data?.detail || 'Failed to post payment.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleLoadInvoice = async () => {
    setActiveTab('invoice');
    try {
      setLoadingInvoice(true);
      const invData = await folioService.generateInvoice(folio.id);
      setInvoice(invData);
    } catch (err) {
      console.error('Failed to generate tax invoice:', err);
      setError('Failed to generate formal tax invoice.');
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    pdfService.generateHotelTaxInvoicePDF({
      invoice_number: invoice?.invoice_number || `INV-${String(reservationId).slice(-6)}`,
      booking_reference: folio?.booking_reference || `RES-${String(reservationId).slice(-6)}`,
      folio_id: folio?.id || folio?._id || `FOL-${String(reservationId).slice(-6)}`,
      guest_name: folio?.guest_name,
      property_name: folio?.property_name,
      room_number: folio?.room_number,
      total_amount: folio?.total_charges || folio?.balance || 0,
      subtotal: (folio?.total_charges || 0) * 0.88,
      tax_total: (folio?.total_charges || 0) * 0.12,
      payment_method: 'Card / Razorpay Settlement',
      items: (folio?.charges || []).map((c) => ({
        desc: c.description || c.category,
        qty: 1,
        tax: ((c.amount || 0) * 0.12).toFixed(2),
        amount: Number(c.amount || 0).toFixed(2),
      })),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#13152C]/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FAF6F0] border border-[#DFB76C]/40 rounded-[4px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-[#13152C] my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FFFFFF] border-b border-[#DFB76C]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[2px] bg-[#FAF6F0] border border-[#DFB76C]/40 flex items-center justify-center text-[#B88E43]">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="font-cinzel text-[10px] tracking-[0.2em] text-[#B88E43] uppercase font-bold">
                Guest Billing & Folio
              </span>
              <h2 className="font-editorial text-xl font-bold text-[#13152C]">
                {folio?.guest_name || 'Guest Folio Ledger'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {folio && (
              <span
                className={`px-3 py-1 text-[10px] font-cinzel font-bold uppercase rounded-[2px] border ${
                  folio.status === 'SETTLED'
                    ? 'bg-[#EBF7EE] text-[#2D5A40] border-[#2D5A40]/30'
                    : 'bg-[#FBF6ED] text-[#A0702A] border-[#DFB76C]/40'
                }`}
              >
                {folio.status === 'SETTLED' ? 'Settled & Paid' : 'Open Balance'}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-[2px] text-[#13152C]/60 hover:text-[#13152C] hover:bg-[#FAF6F0] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-[2px] flex items-center gap-2 text-xs text-red-700 font-sans">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-[2px] flex items-center gap-2 text-xs text-emerald-800 font-sans">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="p-16">
            <LoadingSpinner text="Retrieving guest folio and transactions..." />
          </div>
        ) : !folio ? (
          <div className="p-12 text-center text-xs font-sans text-[#13152C]/60">
            No folio could be located for this reservation.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Summary Cards with Multi-Currency Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#FFFFFF] border border-[#DFB76C]/25 p-4 rounded-[2px]">
                <span className="font-cinzel text-[9px] uppercase tracking-wider text-[#13152C]/60 block font-bold">
                  Room & Stay
                </span>
                <p className="font-editorial text-lg text-[#13152C] mt-1">Suite #{folio.room_number || 'TBD'}</p>
                <span className="font-sans text-[10px] text-[#13152C]/40">{folio.invoice_number}</span>
              </div>

              <div className="bg-[#FFFFFF] border border-[#DFB76C]/25 p-4 rounded-[2px]">
                <span className="font-cinzel text-[9px] uppercase tracking-wider text-[#13152C]/60 block font-bold">
                  Total Charges
                </span>
                <p className="font-editorial text-lg text-[#13152C] mt-1">
                  ₹{(folio.total_charges + folio.total_tax).toFixed(2)}
                </p>
                <span className="font-sans text-[10px] text-[#13152C]/50">Includes ₹{folio.total_tax.toFixed(2)} tax</span>
              </div>

              <div className="bg-[#FFFFFF] border border-[#DFB76C]/25 p-4 rounded-[2px]">
                <span className="font-cinzel text-[9px] uppercase tracking-wider text-[#13152C]/60 block font-bold">
                  Total Paid
                </span>
                <p className="font-editorial text-lg text-[#2D5A40] mt-1">₹{folio.total_paid.toFixed(2)}</p>
                <span className="font-sans text-[10px] text-[#2D5A40]/70">
                  {folio.payments.length} settlement transaction(s)
                </span>
              </div>

              <div className="bg-[#FFFFFF] border border-[#DFB76C]/30 p-4 rounded-[2px] bg-gradient-to-br from-[#FFFFFF] to-[#FAF6F0]">
                <div className="flex items-center justify-between">
                  <span className="font-cinzel text-[9px] uppercase tracking-wider text-[#B88E43] font-bold">
                    Balance Due
                  </span>
                  {/* Currency Switcher */}
                  <div className="flex items-center gap-1">
                    <Globe className="w-3 h-3 text-[#B88E43]" />
                    <select
                      value={selectedCurrency}
                      onChange={handleCurrencyChange}
                      className="bg-[#FAF6F0] text-[10px] font-cinzel font-bold border border-[#DFB76C]/40 rounded px-1 py-0.5 text-[#13152C] focus:outline-none"
                    >
                      <option value="INR">INR (₹)</option>
                      {currencies.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p
                  className={`font-editorial text-2xl font-bold mt-1 ${
                    folio.balance > 0 ? 'text-[#A0702A]' : 'text-[#2D5A40]'
                  }`}
                >
                  ₹{folio.balance.toFixed(2)}
                </p>

                {convertedBalance && selectedCurrency !== 'USD' && (
                  <span className="font-sans text-[10px] text-[#B88E43] font-bold block mt-0.5">
                    ≈ {convertedBalance.converted_amount.toLocaleString()} {selectedCurrency} (Rate: {convertedBalance.rate})
                  </span>
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-[#DFB76C]/20 pb-2">
              <button
                onClick={() => setActiveTab('charges')}
                className={`px-4 py-2 text-xs font-cinzel font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer ${
                  activeTab === 'charges'
                    ? 'bg-[#13152C] text-[#FAF6F0]'
                    : 'bg-[#FFFFFF] text-[#13152C]/70 hover:text-[#13152C] border border-[#DFB76C]/30'
                }`}
              >
                Line Item Ledger ({folio.charges.length + folio.payments.length})
              </button>
              <button
                onClick={() => setActiveTab('add_charge')}
                className={`px-4 py-2 text-xs font-cinzel font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'add_charge'
                    ? 'bg-[#13152C] text-[#FAF6F0]'
                    : 'bg-[#FFFFFF] text-[#13152C]/70 hover:text-[#13152C] border border-[#DFB76C]/30'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" /> Post Charge
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`px-4 py-2 text-xs font-cinzel font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'payment'
                    ? 'bg-[#13152C] text-[#FAF6F0]'
                    : 'bg-[#FFFFFF] text-[#13152C]/70 hover:text-[#13152C] border border-[#DFB76C]/30'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Settle / Payment
              </button>
              <button
                onClick={handleLoadInvoice}
                className={`px-4 py-2 text-xs font-cinzel font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'invoice'
                    ? 'bg-[#13152C] text-[#FAF6F0]'
                    : 'bg-[#FFFFFF] text-[#13152C]/70 hover:text-[#13152C] border border-[#DFB76C]/30'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Official Tax Invoice
              </button>
            </div>

            {/* TAB CONTENT 1: Line Items Ledger */}
            {activeTab === 'charges' && (
              <div className="bg-[#FFFFFF] border border-[#DFB76C]/25 rounded-[2px] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs">
                    <thead className="bg-[#FAF6F0] border-b border-[#DFB76C]/20 font-cinzel text-[10px] tracking-wider text-[#13152C]/70 uppercase">
                      <tr>
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Category</th>
                        <th className="py-2.5 px-4">Description</th>
                        <th className="py-2.5 px-4 text-right">Tax</th>
                        <th className="py-2.5 px-4 text-right">Amount</th>
                        <th className="py-2.5 px-4">Posted By / Method</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DFB76C]/10 text-xs">
                      {/* Charges */}
                      {folio.charges.map((c) => (
                        <tr key={c.id} className="hover:bg-[#FAF6F0]/40 transition-colors">
                          <td className="py-2.5 px-4 text-[#13152C]/60 whitespace-nowrap">
                            {c.date ? new Date(c.date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-cinzel text-[9px] uppercase font-bold text-[#B88E43] bg-[#FAF6F0] px-1.5 py-0.5 rounded border border-[#DFB76C]/30">
                              {c.category.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-[#13152C] font-medium">{c.description}</td>
                          <td className="py-2.5 px-4 text-right text-[#13152C]/50">₹{c.tax_amount?.toFixed(2)}</td>
                          <td className="py-2.5 px-4 text-right font-bold text-[#13152C]">₹{c.amount?.toFixed(2)}</td>
                          <td className="py-2.5 px-4 text-[#13152C]/50">{c.posted_by}</td>
                        </tr>
                      ))}

                      {/* Payments */}
                      {folio.payments.map((p) => (
                        <tr key={p.id} className="bg-[#EBF7EE]/40 hover:bg-[#EBF7EE]/70 transition-colors">
                          <td className="py-2.5 px-4 text-[#2D5A40] whitespace-nowrap">
                            {p.date ? new Date(p.date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-cinzel text-[9px] uppercase font-bold text-[#2D5A40] bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#2D5A40]/30">
                              PAYMENT ({p.payment_method})
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-[#2D5A40] font-medium">
                            Payment Settlement — Ref: {p.transaction_reference}
                          </td>
                          <td className="py-2.5 px-4 text-right text-[#2D5A40]/60">—</td>
                          <td className="py-2.5 px-4 text-right font-bold text-[#2D5A40] font-mono">
                            -₹{p.amount?.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-4 text-[#2D5A40]/70">{p.status}</td>
                        </tr>
                      ))}

                      {folio.charges.length === 0 && folio.payments.length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-8 text-center text-xs text-[#13152C]/40">
                            No charges or payments recorded on this folio.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: Post Charge */}
            {activeTab === 'add_charge' && (
              <form onSubmit={handlePostCharge} className="bg-[#FFFFFF] border border-[#DFB76C]/30 p-6 rounded-[2px] space-y-4">
                <h3 className="font-editorial text-lg text-[#13152C] border-b border-[#DFB76C]/20 pb-2">
                  Post Room or Incidental Charge
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-cinzel font-bold text-[#13152C]/70 uppercase tracking-wider mb-1">
                      Department / Category
                    </label>
                    <select
                      value={chargeCategory}
                      onChange={(e) => setChargeCategory(e.target.value)}
                      className="w-full bg-[#FAF6F0] border border-[#DFB76C]/30 px-3 py-2 text-xs rounded focus:outline-none"
                    >
                      <option value="FOOD_AND_BEVERAGE">Food & Beverage (Restaurant / Room Service)</option>
                      <option value="SPA_AND_WELLNESS">Spa & Wellness</option>
                      <option value="MINIBAR">Minibar</option>
                      <option value="LAUNDRY">Valet & Laundry</option>
                      <option value="TRANSPORTATION">Airport / Chauffeur Transfer</option>
                      <option value="LATE_CHECKOUT">Late Check-Out Surcharge</option>
                      <option value="DAMAGE_FEE">Property Damage Fee</option>
                      <option value="MISCELLANEOUS">Miscellaneous / Concierge</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-cinzel font-bold text-[#13152C]/70 uppercase tracking-wider mb-1">
                      Charge Amount ($ USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 85.00"
                      value={chargeAmount}
                      onChange={(e) => setChargeAmount(e.target.value)}
                      className="w-full bg-[#FAF6F0] border border-[#DFB76C]/30 px-3 py-2 text-xs rounded focus:outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-[#13152C]/70 uppercase tracking-wider mb-1">
                    Description & Item Details
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dinner for two at Estate Dining Room (Wine & Entrees)"
                    value={chargeDescription}
                    onChange={(e) => setChargeDescription(e.target.value)}
                    className="w-full bg-[#FAF6F0] border border-[#DFB76C]/30 px-3 py-2 text-xs rounded focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submittingCharge}
                    className="btn-luxury py-2 px-6 text-xs flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>{submittingCharge ? 'Posting Charge...' : 'Confirm & Post to Folio'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB CONTENT 3: Settle / Payment */}
            {activeTab === 'payment' && (
              <form onSubmit={handleRecordPayment} className="bg-[#FFFFFF] border border-[#DFB76C]/30 p-6 rounded-[2px] space-y-4">
                <h3 className="font-editorial text-lg text-[#13152C] border-b border-[#DFB76C]/20 pb-2">
                  Record Folio Settlement & Payment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-cinzel font-bold text-[#13152C]/70 uppercase tracking-wider mb-1">
                      Payment Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-[#FAF6F0] border border-[#DFB76C]/30 px-3 py-2 text-xs rounded focus:outline-none"
                    >
                      <option value="CARD">Credit / Debit Card (Terminal / POS)</option>
                      <option value="CASH">Cash Settlement</option>
                      <option value="RAZORPAY">Razorpay Payment Gateway</option>
                      <option value="LOYALTY_POINTS">Loyalty Points Redemption</option>
                      <option value="DIRECT_BILL">Direct Bill / Corporate Master Folio</option>
                      <option value="BANK_TRANSFER">Bank Wire Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-cinzel font-bold text-[#13152C]/70 uppercase tracking-wider mb-1">
                      Settlement Amount ($ USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 150.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full bg-[#FAF6F0] border border-[#DFB76C]/30 px-3 py-2 text-xs rounded focus:outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-[#13152C]/70 uppercase tracking-wider mb-1">
                    Terminal Authorization Code / Transaction Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AUTH-99482 or Card ending in 4242"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full bg-[#FAF6F0] border border-[#DFB76C]/30 px-3 py-2 text-xs rounded focus:outline-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="btn-luxury py-2 px-6 text-xs flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{submittingPayment ? 'Processing Settlement...' : 'Record Payment & Settle'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB CONTENT 4: Official Tax Invoice */}
            {activeTab === 'invoice' && (
              <div className="bg-[#FFFFFF] border border-[#DFB76C]/40 p-8 rounded-[2px] space-y-6 shadow-sm print:p-0 print:border-none print:shadow-none">
                {loadingInvoice ? (
                  <LoadingSpinner text="Generating tax invoice..." />
                ) : invoice ? (
                  <>
                    <div className="flex items-start justify-between border-b border-[#DFB76C]/30 pb-4">
                      <div>
                        <span className="font-cinzel text-xs tracking-[0.25em] text-[#B88E43] uppercase font-bold">
                          Official Tax Invoice
                        </span>
                        <h1 className="font-editorial text-2xl text-[#13152C] font-bold mt-1">
                          {invoice.property_name}
                        </h1>
                        <p className="font-sans text-xs text-[#13152C]/60 mt-1">{invoice.property_address}</p>
                        <p className="font-sans text-[11px] text-[#13152C]/50">Tax ID: {invoice.property_tax_id}</p>
                      </div>

                      <div className="text-right">
                        <span className="font-cinzel text-xs font-bold text-[#13152C] block">
                          {invoice.invoice_number}
                        </span>
                        <span className="font-sans text-xs text-[#13152C]/60 block mt-0.5">
                          Date: {invoice.issue_date}
                        </span>
                        <span
                          className={`inline-block mt-2 px-2.5 py-0.5 rounded text-[9px] font-cinzel font-bold border ${
                            invoice.status === 'PAID_IN_FULL'
                              ? 'bg-[#EBF7EE] text-[#2D5A40] border-[#2D5A40]/30'
                              : 'bg-[#FBF6ED] text-[#A0702A] border-[#DFB76C]/30'
                          }`}
                        >
                          {invoice.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-sans border-b border-[#DFB76C]/20 pb-4">
                      <div>
                        <span className="font-cinzel text-[9px] uppercase font-bold text-[#13152C]/50 block">Billed To:</span>
                        <p className="font-bold text-[#13152C] mt-0.5">{invoice.guest_name}</p>
                        <p className="text-[#13152C]/70">{invoice.guest_email}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-cinzel text-[9px] uppercase font-bold text-[#13152C]/50 block">Stay Details:</span>
                        <p className="text-[#13152C]">Suite #{invoice.room_number}</p>
                        <p className="text-[#13152C]/70">
                          {invoice.check_in_date} to {invoice.check_out_date}
                        </p>
                      </div>
                    </div>

                    {/* Invoice line items table */}
                    <table className="w-full text-left font-sans text-xs border-b border-[#DFB76C]/20 pb-4">
                      <thead className="border-b border-[#DFB76C]/30 font-cinzel text-[10px] uppercase text-[#13152C]/70">
                        <tr>
                          <th className="py-2">Description</th>
                          <th className="py-2 text-right">Tax</th>
                          <th className="py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DFB76C]/10">
                        {invoice.line_items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2.5">
                              <span className="font-medium text-[#13152C]">{item.description}</span>
                              <span className="block text-[10px] text-[#13152C]/50 font-cinzel">
                                {item.category.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-2.5 text-right text-[#13152C]/60">₹{item.tax_amount?.toFixed(2)}</td>
                            <td className="py-2.5 text-right font-bold text-[#13152C]">₹{item.amount?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end">
                      <div className="w-64 space-y-1.5 text-xs font-sans">
                        <div className="flex justify-between text-[#13152C]/70">
                          <span>Subtotal:</span>
                          <span>₹{invoice.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[#13152C]/70">
                          <span>Hotel & Local Tax (12%):</span>
                          <span>₹{invoice.tax_total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-[#13152C] border-t border-[#DFB76C]/20 pt-1.5 text-sm">
                          <span>Total:</span>
                          <span>₹{invoice.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-[#2D5A40] font-medium">
                          <span>Amount Paid:</span>
                          <span>-₹{invoice.amount_paid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base text-[#13152C] border-t-2 border-[#13152C] pt-2">
                          <span>Amount Due:</span>
                          <span className={invoice.amount_due > 0 ? 'text-[#A0702A]' : 'text-[#2D5A40]'}>
                            ₹{invoice.amount_due.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#DFB76C]/20 flex justify-end gap-3 print:hidden">
                      <button
                        onClick={handleDownloadPDF}
                        className="btn-luxury py-2 px-5 text-xs flex items-center gap-2 cursor-pointer shadow-sm"
                        title="Download Luxury Branded PDF Tax Invoice"
                      >
                        <Download className="w-4 h-4 text-[#DFB76C]" />
                        <span>Download Tax Invoice (PDF)</span>
                      </button>
                      <button onClick={handlePrint} className="btn-luxury-secondary py-2 px-4 text-xs flex items-center gap-2 cursor-pointer">
                        <Printer className="w-4 h-4 text-[#DFB76C]" />
                        <span>Print</span>
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
