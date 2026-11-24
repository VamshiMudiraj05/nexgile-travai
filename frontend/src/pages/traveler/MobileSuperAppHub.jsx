import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Shield,
  Key,
  Globe,
  Building,
  CreditCard,
  Plus,
  RefreshCw,
  QrCode,
  ArrowRight,
  Sparkles,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Copy,
  DollarSign,
  Gift,
  Languages,
  Check,
  ChevronRight,
  ExternalLink,
  Smartphone,
  X
} from 'lucide-react';
import { superappService } from '../../services/superappService';
import { paymentService } from '../../services/paymentService';
import { useAuth } from '../../hooks/useAuth';
import { WalletBalance, RazorpayMark, NexgileMark, WiseMark } from '@/components/ui/wallet-balance';

export default function MobileSuperAppHub() {
  const [activeTab, setActiveTab] = useState('wallet');

  // Wallet states
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [creditPackages, setCreditPackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState('pkg_silver');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatusMsg, setPaymentStatusMsg] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState(1500);
  const [convertPointsInput, setConvertPointsInput] = useState(5000);
  const [convertLoading, setConvertLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Memoized cards for EasyUI WalletBalance interactive pouch
  const walletAccounts = React.useMemo(() => [
    {
      id: "razorpay_credits",
      name: "Razorpay Credits",
      balance: Math.round(wallet?.cash_balance ?? 3500),
      logo: <RazorpayMark />,
      background: "#0c2340",
      amountColor: "#528FF0"
    },
    {
      id: "nexgile_reserve",
      name: "Nexgile Reserve",
      balance: Math.round((wallet?.cash_balance ?? 3500) + 10000),
      logo: <NexgileMark />,
      background: "#1c2237",
      amountColor: "#DFB76C"
    },
    {
      id: "loyalty_bank",
      name: "Loyalty Bank",
      balance: Math.round(wallet?.points_cash_value ?? 154),
      logo: <WiseMark />,
      background: "#163300",
      amountColor: "#a0d67b"
    }
  ], [wallet]);

  // Vault states
  const [vaultDocs, setVaultDocs] = useState([]);
  const [keyUnlocked, setKeyUnlocked] = useState(false);
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [newDocType, setNewDocType] = useState('PASSPORT');
  const [newDocTitle, setNewDocTitle] = useState('UK Diplomatic Passport');
  const [newDocHolder, setNewDocHolder] = useState('Eleanor Vance');
  const [newDocNumber, setNewDocNumber] = useState('GB-90218412');
  const [newDocCountry, setNewDocCountry] = useState('United Kingdom');
  const [newDocExpiry, setNewDocExpiry] = useState('2029-05-15');

  // i18n states
  const [languages, setLanguages] = useState([]);
  const [selectedLocale, setSelectedLocale] = useState('en');
  const [translationsData, setTranslationsData] = useState(null);

  // Multi-Tenancy states
  const [tenants, setTenants] = useState([]);
  const [newTenantOpen, setNewTenantOpen] = useState(false);
  const [orgName, setOrgName] = useState('Cote d\'Azur Heritage Villas');
  const [subdomain, setSubdomain] = useState('cotedazur');
  const [primaryColor, setPrimaryColor] = useState('#2563EB');
  const [secondaryColor, setSecondaryColor] = useState('#0F172A');

  useEffect(() => {
    fetchWallet();
    fetchVault();
    fetchLanguages();
    fetchTranslations('en');
    fetchTenants();
    fetchCreditPackages();
  }, []);

  const fetchCreditPackages = async () => {
    try {
      const pkgs = await paymentService.getCreditPackages();
      if (Array.isArray(pkgs) && pkgs.length > 0) {
        setCreditPackages(pkgs);
        setSelectedPackageId(pkgs[1]?.id || pkgs[0]?.id);
      }
    } catch (err) {
      console.warn('Failed to load credit packages:', err);
    }
  };

  const fetchWallet = async () => {
    setWalletLoading(true);
    try {
      const data = await superappService.getWallet();
      setWallet(data);
    } catch (err) {
      console.error('Failed to load wallet', err);
    } finally {
      setWalletLoading(false);
    }
  };

  const fetchVault = async () => {
    try {
      const data = await superappService.getVault();
      setVaultDocs(data || []);
    } catch (err) {
      console.error('Failed to load vault', err);
    }
  };

  const fetchLanguages = async () => {
    try {
      const data = await superappService.getLanguages();
      setLanguages(data || []);
    } catch (err) {
      console.error('Failed to load languages', err);
    }
  };

  const fetchTranslations = async (loc) => {
    try {
      const data = await superappService.getTranslations(loc);
      setTranslationsData(data);
    } catch (err) {
      console.error('Failed to load translations', err);
    }
  };

  const fetchTenants = async () => {
    try {
      const data = await superappService.getTenants();
      setTenants(data || []);
    } catch (err) {
      console.error('Failed to load tenants', err);
    }
  };

  const handleTopUpSubmit = async (e) => {
    e.preventDefault();
    setPaymentError(null);
    setPaymentStatusMsg(null);

    const chosenPkg = creditPackages.find((p) => p.id === selectedPackageId);
    if (!chosenPkg) {
      setPaymentError('Please select a valid credit package.');
      return;
    }

    try {
      setIsProcessingPayment(true);
      setPaymentStatusMsg('Initiating Razorpay Order...');

      // 1. Create order on backend (amount strictly verified server-side from package details)
      const orderData = await paymentService.createRazorpayOrder({
        package_id: chosenPkg.id,
      });

      // 2. Load Razorpay Checkout Script
      const scriptLoaded = await paymentService.loadRazorpayScript();

      if (scriptLoaded && window.Razorpay && orderData?.key_id && !orderData.key_id.startsWith('rzp_test_placeholder')) {
        setPaymentStatusMsg('Awaiting Razorpay Checkout completion...');
        const options = {
          key: orderData.key_id,
          amount: orderData.amount,
          currency: 'INR',
          name: 'Nexgile TravAI',
          description: chosenPkg.description,
          order_id: orderData.order_id,
          handler: async function (response) {
            try {
              setPaymentStatusMsg('Verifying payment signature with server...');
              const verifyRes = await paymentService.verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                package_id: chosenPkg.id,
              });
              setPaymentStatusMsg(`Payment verified! +${verifyRes.credits_added} credits added to your wallet.`);
              await fetchWallet();
              setTimeout(() => {
                setTopUpOpen(false);
                setPaymentStatusMsg(null);
              }, 1800);
            } catch (vErr) {
              setPaymentError('Signature verification failed. Please try again or contact support.');
            } finally {
              setIsProcessingPayment(false);
            }
          },
          prefill: {
            name: user?.name || 'Traveler',
            email: user?.email || '',
            contact: '+919876543210',
          },
          theme: { color: '#DFB76C' },
          modal: {
            ondismiss: function () {
              setPaymentError('Razorpay checkout was cancelled. No credits were added.');
              setIsProcessingPayment(false);
            },
          },
        };
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          setPaymentError(`Payment failed: ${resp.error?.description || 'Transaction declined.'}`);
          setIsProcessingPayment(false);
        });
        rzp.open();
      } else {
        // Razorpay Test Mode Simulator (active when test keys are placeholders)
        setPaymentStatusMsg('Executing Test Mode simulation & signature verification...');
        const mockPaymentId = `pay_test_${Math.random().toString(36).substring(2, 12)}`;
        const verifyRes = await paymentService.verifyRazorpayPayment({
          razorpay_order_id: orderData.order_id,
          razorpay_payment_id: mockPaymentId,
          razorpay_signature: 'rzp_test_sig_ok',
          package_id: chosenPkg.id,
        });
        setPaymentStatusMsg(`Test payment verified! +${verifyRes.credits_added} credits added to wallet.`);
        await fetchWallet();
        setTimeout(() => {
          setTopUpOpen(false);
          setPaymentStatusMsg(null);
        }, 1600);
        setIsProcessingPayment(false);
      }
    } catch (err) {
      console.error('Failed to complete Razorpay payment:', err);
      setPaymentError(err.response?.data?.detail || 'Failed to complete Razorpay checkout.');
      setIsProcessingPayment(false);
    }
  };

  const handleConvertPoints = async () => {
    setConvertLoading(true);
    try {
      const updated = await superappService.convertPoints(Number(convertPointsInput));
      setWallet(updated);
      alert(`Converted ${convertPointsInput} points to ₹{(convertPointsInput * 0.01).toFixed(2)} cash balance!`);
    } catch (err) {
      alert('Conversion error: ' + (err.response?.data?.detail || err.message));
    } finally {
      setConvertLoading(false);
    }
  };

  const handleCopyReferral = () => {
    if (wallet?.referral_code) {
      navigator.clipboard.writeText(wallet.referral_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleToggleRoomKey = () => {
    setKeyUnlocked(true);
    setTimeout(() => {
      setKeyUnlocked(false);
    }, 4000);
  };

  const handleAddVaultDocSubmit = async (e) => {
    e.preventDefault();
    try {
      await superappService.addVaultDoc({
        doc_type: newDocType,
        title: newDocTitle,
        holder_name: newDocHolder,
        document_number: newDocNumber,
        issuing_country: newDocCountry,
        expiry_date: newDocExpiry,
      });
      setAddDocOpen(false);
      fetchVault();
    } catch (err) {
      alert('Failed to add document: ' + err.message);
    }
  };

  const handleLocaleChange = (loc) => {
    setSelectedLocale(loc);
    fetchTranslations(loc);
  };

  const handleCreateTenantSubmit = async (e) => {
    e.preventDefault();
    try {
      await superappService.createTenant({
        organization_name: orgName,
        subdomain,
        primary_brand_color: primaryColor,
        secondary_brand_color: secondaryColor,
      });
      setNewTenantOpen(false);
      fetchTenants();
      alert('New isolated enterprise brand tenant successfully provisioned!');
    } catch (err) {
      alert('Tenant creation error: ' + err.message);
    }
  };

  return (
    <div className="space-y-8 pb-16 font-sans text-[#FAF6F0]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#2C315E] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-0.5 rounded-[2px] text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Phase 6 Live
            </span>
            <span className="px-3 py-0.5 rounded-[2px] text-xs font-semibold bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/30">
              Mobile Super App & Enterprise Multi-Tenancy
            </span>
          </div>
          <h1 className="font-editorial text-3xl md:text-4xl text-white tracking-tight font-bold flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-[#DFB76C]" />
            Global Travel Super App & Multi-Tenant Architecture
          </h1>
          <p className="text-white/70 text-sm mt-1 max-w-2xl">
            Integrated digital travel cash wallet, encrypted identity vault with BLE room access, 60+ language localization (i18n), and multi-tenant brand isolation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTopUpOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#DFB76C] hover:bg-[#F2D59B] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px] shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Top Up Stored Wallet
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-[#2C315E] pb-6">
        <button
          onClick={() => setActiveTab('wallet')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'wallet' ? 'bg-[#DFB76C] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px]' : 'bg-[#1B1E3D] text-white/70 hover:text-white font-cinzel text-xs tracking-wider uppercase rounded-[2px] border border-[#2C315E]'
          }`}
        >
          <Wallet className="w-4 h-4" /> Digital Cash Wallet & Rewards
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'vault' ? 'bg-[#DFB76C] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px]' : 'bg-[#1B1E3D] text-white/70 hover:text-white font-cinzel text-xs tracking-wider uppercase rounded-[2px] border border-[#2C315E]'
          }`}
        >
          <Shield className="w-4 h-4" /> Encrypted Vault & BLE Keys ({vaultDocs.length})
        </button>

        <button
          onClick={() => setActiveTab('i18n')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'i18n' ? 'bg-[#DFB76C] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px]' : 'bg-[#1B1E3D] text-white/70 hover:text-white font-cinzel text-xs tracking-wider uppercase rounded-[2px] border border-[#2C315E]'
          }`}
        >
          <Languages className="w-4 h-4 text-[#DFB76C]" /> 60+ Language Localization (i18n)
        </button>

        <button
          onClick={() => setActiveTab('tenants')}
          className={`flex items-center gap-2 px-4 py-2 rounded-[2px] text-sm font-medium transition whitespace-nowrap ${
            activeTab === 'tenants' ? 'bg-[#DFB76C] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px]' : 'bg-[#1B1E3D] text-white/70 hover:text-white font-cinzel text-xs tracking-wider uppercase rounded-[2px] border border-[#2C315E]'
          }`}
        >
          <Building className="w-4 h-4" /> Enterprise Multi-Tenancy ({tenants.length})
        </button>
      </div>

      {/* --- TAB 1: DIGITAL CASH WALLET --- */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
          {/* EasyUI Interactive Leather Pouch & Wallet Balance */}
          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-lg">
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-2 border-b lg:border-b-0 lg:border-r border-[#2C315E] pb-6 lg:pb-0 lg:pr-6">
              <span className="text-[10px] font-cinzel uppercase tracking-[0.2em] text-[#DFB76C] mb-2 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#DFB76C]" /> Motion Leather Pouch
              </span>
              <WalletBalance
                accounts={walletAccounts}
                currency="INR"
                locale="en-IN"
                totalLabel="Total Travel Liquidity"
                className="max-w-[320px]"
              />
              <p className="text-[11px] text-white/50 text-center mt-2 font-sans">
                Tap the center eye to mask or reveal balances with spring physics
              </p>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div>
                <span className="text-xs text-[#DFB76C] font-semibold uppercase tracking-wider font-cinzel">
                  Executive Traveler Portfolio
                </span>
                <h3 className="text-2xl font-editorial font-bold text-white mt-1">
                  Tactile Stored Wallet & Reserves
                </h3>
                <p className="text-xs text-white/70 mt-1 leading-relaxed font-sans">
                  Your biometric travel pouch tucks branded liquidity cards into an embossed leather pouch with organic spring physics. Use your Stored Razorpay Credits, Nexgile VIP Reserve, and Loyalty Points across all partner properties and flight charters.
                </p>
              </div>

              {/* Quick stats cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-[#1B1E3D] border border-[#DFB76C]/30 p-3.5 rounded-[3px]">
                  <span className="text-[10px] text-[#DFB76C] font-semibold uppercase tracking-wider">Razorpay Credits</span>
                  <div className="text-xl font-extrabold text-white font-mono mt-1">
                    ₹{wallet?.cash_balance ? wallet.cash_balance.toFixed(2) : '350.00'}
                  </div>
                  <span className="text-[10px] text-white/60">Live spendable</span>
                </div>

                <div className="bg-[#1B1E3D] border border-[#2C315E] p-3.5 rounded-[3px]">
                  <span className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Loyalty Points</span>
                  <div className="text-xl font-extrabold text-amber-400 font-mono mt-1">
                    {wallet?.loyalty_points ? wallet.loyalty_points.toLocaleString() : '15,400'}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    ≈ ₹{(wallet?.points_cash_value || 154).toFixed(2)}
                  </span>
                </div>

                <div className="bg-[#1B1E3D] border border-[#2C315E] p-3.5 rounded-[3px]">
                  <span className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Referral Code</span>
                  <div className="text-base font-bold text-white font-mono mt-1 flex items-center justify-between">
                    <span>{wallet?.referral_code || 'TRAV-VIP99'}</span>
                    <button
                      onClick={handleCopyReferral}
                      className="p-1 text-white/70 hover:text-white"
                      title="Copy Code"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-emerald-400">+₹{wallet?.referral_earnings || 75}.00 earned</span>
                </div>
              </div>

              {/* Primary action buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setTopUpOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#DFB76C] hover:bg-[#F2D59B] text-[#0B0C1E] font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px] shadow-sm transition"
                >
                  <Plus className="w-4 h-4" /> Top Up via Razorpay
                </button>
                <button
                  onClick={handleConvertPoints}
                  disabled={convertLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#1B1E3D] hover:bg-[#2C315E] border border-[#2C315E] text-white font-cinzel text-xs font-bold tracking-wider uppercase rounded-[2px] transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${convertLoading ? 'animate-spin' : ''}`} />
                  {convertLoading ? 'Converting...' : 'Convert 5,000 Pts → ₹50'}
                </button>
              </div>
            </div>
          </div>

          {/* Transactions Ledger */}
          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6">
            <h3 className="font-bold text-white text-base mb-4">Digital Wallet Activity Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#2C315E] text-xs text-white/70 uppercase tracking-wider">
                    <th className="py-3 px-4">Transaction ID</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C315E] font-medium">
                  {wallet?.transactions?.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-[#1B1E3D] transition">
                      <td className="py-3.5 px-4 font-mono text-xs text-[#DFB76C]">{tx.tx_id}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#1B1E3D] text-white">
                          {tx.tx_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-white text-xs">{tx.description}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        +₹{tx.amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-white/70 text-right">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: ENCRYPTED VAULT & BLE ROOM KEY --- */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          {/* Active BLE Digital Room Key Card */}
          <div className="bg-gradient-to-r from-[#13152C] via-[#1B1E3D] to-[#24284F] border border-blue-500/40 rounded-[4px] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-[4px] bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 flex-shrink-0">
                <Key className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400">
                    Live Active Key
                  </span>
                  <span className="text-xs text-white/70">NFC & Bluetooth Low Energy (BLE)</span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">The Grand Savoy - Suite 501 Digital Pass</h3>
                <p className="text-xs text-white/80 mt-0.5">
                  Hold smartphone near room door lock or front desk reader for instantaneous contactless access.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleToggleRoomKey}
                className={`flex items-center gap-2 px-6 py-3 rounded-[2px] font-bold text-sm shadow-xl transition ${
                  keyUnlocked
                    ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                }`}
              >
                {keyUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                <span>{keyUnlocked ? 'Door Unlocked (BLE Authorized)' : 'Tap to Unlock Suite 501'}</span>
              </button>
              <span className="text-[11px] text-white/70 font-mono">Token: BLE-501-A48F9B2C</span>
            </div>
          </div>

          {/* Stored Identity Documents */}
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Encrypted Travel Identity Documents</h3>
            <button
              onClick={() => setAddDocOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#13152C] hover:bg-[#1B1E3D] text-[#DFB76C] rounded-[2px] text-xs font-semibold"
            >
              <Plus className="w-4 h-4" /> Add Document to Vault
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {vaultDocs.map((doc) => (
              <div key={doc.id} className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-5 space-y-3 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold uppercase tracking-wider text-[#DFB76C]">{doc.doc_type}</span>
                    {doc.expires_soon && (
                      <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Expires &lt; 6 Mos
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-base">{doc.title}</h4>
                  <div className="text-xs text-white/70">Holder: {doc.holder_name}</div>

                  <div className="p-3 bg-[#13152C] rounded-[2px] my-3 space-y-1 font-mono text-xs">
                    <div className="text-white/70 flex justify-between">
                      <span>Doc #:</span>
                      <span className="text-white font-bold">{doc.document_number_masked}</span>
                    </div>
                    <div className="text-white/70 flex justify-between">
                      <span>Issuing:</span>
                      <span className="text-white/80">{doc.issuing_country}</span>
                    </div>
                    <div className="text-white/70 flex justify-between">
                      <span>Valid Thru:</span>
                      <span className={doc.expires_soon ? 'text-amber-400 font-bold' : 'text-white/80'}>
                        {doc.expiry_date}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#2C315E]/15 flex items-center justify-between text-xs text-white/70">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Shield className="w-3.5 h-3.5" /> AES-256 Encrypted
                  </span>
                  <span className="font-mono text-[10px]">Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: 60+ MULTILINGUAL LOCALIZATION (i18n) --- */}
      {activeTab === 'i18n' && (
        <div className="space-y-6">
          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6">
            <h3 className="font-bold text-white text-base mb-1 flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#DFB76C]" /> Global Language & Regional Formatting
            </h3>
            <p className="text-xs text-white/70 mb-6">
              Native localization across 60+ global markets with localized currency symbols, right-to-left (RTL) script rendering, and regional date representations.
            </p>

            {/* Language Selection Grid */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleLocaleChange(l.code)}
                  className={`p-3 rounded-[2px] border text-left transition flex items-center gap-3 ${
                    selectedLocale === l.code
                      ? 'bg-[#13152C] text-[#DFB76C] border-[#DFB76C] font-bold text-white shadow-sm'
                      : 'bg-[#13152C] border-[#2C315E]/15 text-white/80 hover:border-[#DFB76C]'
                  }`}
                >
                  <span className="text-2xl">{l.flag}</span>
                  <div>
                    <div className="font-bold text-xs">{l.name}</div>
                    <div className="text-[10px] text-white/70">{l.native_name}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Live Translation Preview Card */}
            {translationsData && (
              <div className="bg-[#1B1E3D] border border-[#2C315E]/15 rounded-[2px] p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#2C315E] pb-6 text-xs">
                  <span className="text-[#DFB76C] font-bold uppercase tracking-wider">
                    Active Locale: {translationsData.language_name} ({translationsData.locale})
                  </span>
                  <span className="text-white/70 font-mono">
                    Currency: {translationsData.currency_symbol} • Date: {translationsData.date_format}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-[#13152C] rounded-[2px]">
                    <span className="text-xs text-white/70 block mb-1">Welcome String</span>
                    <span className="font-semibold text-white">{translationsData.translations?.welcome}</span>
                  </div>
                  <div className="p-3 bg-[#13152C] rounded-[2px]">
                    <span className="text-xs text-white/70 block mb-1">Booking Button</span>
                    <span className="font-semibold text-white">{translationsData.translations?.book_stay}</span>
                  </div>
                  <div className="p-3 bg-[#13152C] rounded-[2px]">
                    <span className="text-xs text-white/70 block mb-1">Flights Header</span>
                    <span className="font-semibold text-white">{translationsData.translations?.flights}</span>
                  </div>
                  <div className="p-3 bg-[#13152C] rounded-[2px]">
                    <span className="text-xs text-white/70 block mb-1">Wallet Header</span>
                    <span className="font-semibold text-white">{translationsData.translations?.wallet}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 4: ENTERPRISE MULTI-TENANCY --- */}
      {activeTab === 'tenants' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 bg-blue-500/10 border border-blue-500/20 rounded-[4px]">
            <div className="flex items-center gap-3">
              <Building className="w-8 h-8 text-blue-400 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-white text-lg">Enterprise Brand Multi-Tenancy</h3>
                <p className="text-xs text-blue-300">
                  Strict collection-level database partitioning, customizable subdomains, and white-label brand palettes for global hospitality conglomerates.
                </p>
              </div>
            </div>
            <button
              onClick={() => setNewTenantOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-[2px] text-sm transition shadow-lg shadow-blue-600/30 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Provision New Brand Tenant
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tenants.map((t) => (
              <div key={t.id} className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-[2px] flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: t.primary_brand_color }}
                    >
                      {t.organization_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">{t.organization_name}</h4>
                      <p className="text-xs font-mono text-[#DFB76C]">{t.subdomain}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-[2px] text-xs font-bold bg-emerald-500/20 text-emerald-400">
                    {t.status}
                  </span>
                </div>

                <div className="bg-[#13152C] p-3.5 rounded-[2px] space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/70">Partition Identifier:</span>
                    <span className="font-mono text-white">{t.tenant_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Data Isolation:</span>
                    <span className="text-emerald-400 font-semibold">{t.data_isolation_level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Active Properties:</span>
                    <span className="text-white font-bold">{t.active_properties_count} Estates</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 text-xs text-white/70">
                  <span>Brand Theme:</span>
                  <div className="w-4 h-4 rounded-[2px] border border-white/20" style={{ backgroundColor: t.primary_brand_color }} />
                  <div className="w-4 h-4 rounded-[2px] border border-white/20" style={{ backgroundColor: t.secondary_brand_color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TOP-UP WALLET MODAL (RAZORPAY TEST GATEWAY) --- */}
      {topUpOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B0C1E]/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                if (!isProcessingPayment) {
                  setTopUpOpen(false);
                  setPaymentError(null);
                  setPaymentStatusMsg(null);
                }
              }}
              disabled={isProcessingPayment}
              className="absolute top-4 right-4 text-white/70 hover:text-white disabled:opacity-30"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-6 w-6 items-center justify-center rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] font-editorial font-bold text-xs border border-[#DFB76C]/40">
                R
              </span>
              <h3 className="text-lg font-editorial font-bold text-white">Purchase Travel Credits</h3>
            </div>
            <p className="text-xs text-white/60 mb-4 font-sans">
              Select a verified credit package to top up your universal travel balance via Razorpay Test Mode.
            </p>

            {paymentStatusMsg && (
              <div className="mb-4 rounded-[3px] border border-emerald-500/40 bg-emerald-950/40 p-3 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{paymentStatusMsg}</span>
              </div>
            )}

            {paymentError && (
              <div className="mb-4 rounded-[3px] border border-red-500/40 bg-red-950/40 p-3 text-xs text-red-300 flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{paymentError}</span>
              </div>
            )}

            <form onSubmit={handleTopUpSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/70 font-cinzel text-[10px] uppercase font-bold tracking-wider mb-2">
                  Select Credit Package (Pricing Verified on Server)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(creditPackages.length > 0 ? creditPackages : [
                    { id: 'pkg_starter', name: 'Bronze Traveler', total_credits: 500, price_inr: 500, badge: 'Entry' },
                    { id: 'pkg_silver', name: 'Silver Wanderer', total_credits: 1650, price_inr: 1500, badge: '+10% Bonus' },
                    { id: 'pkg_gold', name: 'Gold Executive', total_credits: 5750, price_inr: 5000, badge: '+15% Bonus' },
                    { id: 'pkg_platinum', name: 'Royal Sanctuary', total_credits: 12000, price_inr: 10000, badge: '+20% VIP' },
                  ]).map((pkg) => {
                    const isSelected = selectedPackageId === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => !isProcessingPayment && setSelectedPackageId(pkg.id)}
                        className={`p-3.5 rounded-[3px] border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#DFB76C] bg-[#1B1E3D] shadow-md ring-1 ring-[#DFB76C]/30'
                            : 'border-[#2C315E] bg-[#13152C] hover:border-[#DFB76C]/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <span className="font-bold text-white text-xs leading-tight">{pkg.name}</span>
                          {pkg.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-[2px] bg-[#DFB76C]/20 text-[#DFB76C] border border-[#DFB76C]/40 whitespace-nowrap">
                              {pkg.badge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline justify-between mt-auto pt-2 border-t border-[#2C315E]/60">
                          <div>
                            <span className="text-base font-extrabold text-[#DFB76C] font-mono">
                              +{pkg.total_credits.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-white/50 block">Credits</span>
                          </div>
                          <span className="text-sm font-bold text-white font-mono">
                            ₹{pkg.price_inr.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Package Summary Box */}
              {(() => {
                const pkg = (creditPackages.length > 0 ? creditPackages : [
                  { id: 'pkg_starter', name: 'Bronze Traveler', credits: 500, bonus_credits: 0, total_credits: 500, price_inr: 500 },
                  { id: 'pkg_silver', name: 'Silver Wanderer', credits: 1500, bonus_credits: 150, total_credits: 1650, price_inr: 1500 },
                  { id: 'pkg_gold', name: 'Gold Executive', credits: 5000, bonus_credits: 750, total_credits: 5750, price_inr: 5000 },
                  { id: 'pkg_platinum', name: 'Royal Sanctuary', credits: 10000, bonus_credits: 2000, total_credits: 12000, price_inr: 10000 },
                ]).find((p) => p.id === selectedPackageId);

                return (
                  <div className="rounded-[3px] bg-[#1B1E3D] border border-[#2C315E] p-3.5 space-y-2">
                    <div className="flex justify-between text-white/70">
                      <span>Base Credits:</span>
                      <span className="font-mono text-white">+{pkg?.credits?.toLocaleString() || 0}</span>
                    </div>
                    {pkg?.bonus_credits > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Free Promotional Bonus:</span>
                        <span className="font-mono font-bold">+{pkg.bonus_credits.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-white font-bold border-t border-[#2C315E] pt-2">
                      <span className="text-[#DFB76C]">Total Wallet Addition:</span>
                      <span className="font-mono text-[#DFB76C] text-sm">+{pkg?.total_credits?.toLocaleString()} Credits</span>
                    </div>
                    <div className="flex justify-between text-white/80 text-[11px] pt-1">
                      <span>Gateway Mode:</span>
                      <span className="text-amber-400 font-mono">Razorpay Test Mode (Simulated / Test Cards)</span>
                    </div>
                  </div>
                );
              })()}

              <button
                type="submit"
                disabled={isProcessingPayment}
                className="w-full py-3.5 bg-gradient-to-r from-[#DFB76C] to-[#C99E50] hover:from-[#E5C17D] hover:to-[#D4AA5E] text-[#13152C] font-cinzel text-xs tracking-wider uppercase font-extrabold rounded-[2px] transition shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isProcessingPayment
                  ? 'Processing Razorpay Order...'
                  : `PROCEED WITH RAZORPAY (₹${
                      (creditPackages.find((p) => p.id === selectedPackageId)?.price_inr || 1500).toLocaleString()
                    }) →`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD VAULT DOCUMENT MODAL --- */}
      {addDocOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B0C1E]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setAddDocOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Store Document in Vault</h3>
            <p className="text-xs text-white/70 mb-4">End-to-end encrypted identity document storage.</p>

            <form onSubmit={handleAddVaultDocSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-white/70 uppercase font-semibold mb-1">Document Type</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white"
                >
                  <option value="PASSPORT">Passport</option>
                  <option value="VISA">Travel Visa</option>
                  <option value="BOARDING_PASS">Airline Boarding Pass</option>
                  <option value="HEALTH_PASS">Health / Vaccine Pass</option>
                </select>
              </div>

              <div>
                <label className="block text-white/70 uppercase font-semibold mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white"
                />
              </div>

              <div>
                <label className="block text-white/70 uppercase font-semibold mb-1">Holder Full Name</label>
                <input
                  type="text"
                  required
                  value={newDocHolder}
                  onChange={(e) => setNewDocHolder(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white"
                />
              </div>

              <div>
                <label className="block text-white/70 uppercase font-semibold mb-1">Document Number</label>
                <input
                  type="text"
                  required
                  value={newDocNumber}
                  onChange={(e) => setNewDocNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 uppercase font-semibold mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={newDocCountry}
                    onChange={(e) => setNewDocCountry(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white"
                  />
                </div>
                <div>
                  <label className="block text-white/70 uppercase font-semibold mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={newDocExpiry}
                    onChange={(e) => setNewDocExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#13152C] hover:bg-[#1B1E3D] text-[#DFB76C] border border-[#DFB76C]/40 font-cinzel text-xs tracking-wider uppercase font-bold font-bold rounded-[2px] text-xs transition mt-2"
              >
                Encrypt & Save to Vault
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- PROVISION NEW TENANT MODAL --- */}
      {newTenantOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B0C1E]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setNewTenantOpen(false)}
              className="absolute top-4 right-4 text-white/70 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Provision Enterprise Tenant</h3>
            <p className="text-xs text-white/70 mb-4">Set up an isolated hotel brand workspace.</p>

            <form onSubmit={handleCreateTenantSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-white/70 uppercase font-semibold mb-1">Organization / Brand Name</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] text-white"
                />
              </div>

              <div>
                <label className="block text-white/70 uppercase font-semibold mb-1">Target Subdomain</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    required
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    className="flex-1 px-3 py-2 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-l-xl text-white font-mono"
                  />
                  <span className="px-3 py-2 bg-[#13152C] border-y border-r border-[#E5DDCF] rounded-r-xl text-white/70 font-mono">
                    .nexgile.com
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/70 uppercase font-semibold mb-1">Primary Color</label>
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full h-9 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] p-1 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white/70 uppercase font-semibold mb-1">Secondary Color</label>
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-full h-9 bg-[#1B1E3D] border border-[#2C315E] text-white rounded-[2px] p-1 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-[2px] text-xs transition mt-2"
              >
                Provision Isolated Tenant Environment
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
