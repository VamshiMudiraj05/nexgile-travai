import React, { useState, useEffect } from 'react';
import {
  Crown,
  Award,
  Sparkles,
  Gift,
  ArrowUpRight,
  TrendingUp,
  History,
  CheckCircle,
  Clock,
  Zap,
} from 'lucide-react';
import { loyaltyService } from '../../services/loyaltyService';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

const TIER_COLORS = {
  STANDARD: 'bg-[#13152C] border-[#2C315E] text-[#FAF6F0]',
  SILVER: 'bg-[#1B1E3D] border-[#ECE5DA]/40 text-[#FAF6F0]',
  GOLD: 'bg-[#0D0E20] border-[#DFB76C] text-[#DFB76C]',
  PLATINUM: 'bg-[#0D0E20] border-[#F2D59B] text-[#FFFFFF]',
};

export default function Loyalty() {
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(null);

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      const [accRes, txRes] = await Promise.all([
        loyaltyService.getMyLoyalty(),
        loyaltyService.getTransactions(50),
      ]);
      setAccount(accRes);
      setTransactions(txRes || []);
    } catch (err) {
      console.error('Failed to load loyalty data:', err);
    } finally {
      setLoading(false);
    }
  };

  const rewards = [
    { name: '₹500 Hotel Stay Voucher', points: 500, desc: 'Discount voucher applied against any future verified reservation.' },
    { name: 'Complimentary Suite Upgrade', points: 1000, desc: 'Automatic elevation to the next premium suite tier upon check-in.' },
    { name: 'Artisan Breakfast for Two', points: 400, desc: 'Daily gourmet table d’hôte morning banquet during your residency.' },
    { name: 'Guaranteed Late Departure (4:00 PM)', points: 300, desc: 'Extended sanctuary privilege for relaxed departure pacing.' },
  ];

  const handleRedeem = async (reward) => {
    try {
      setRedeemLoading(true);
      const res = await loyaltyService.redeemPoints({
        points: reward.points,
        reward_name: reward.name,
        description: reward.desc,
      });

      setRedeemSuccess(`Successfully redeemed ${reward.points} points for "${reward.name}"!`);
      setTimeout(() => setRedeemSuccess(null), 5000);
      setRedeemModalOpen(false);
      await fetchLoyaltyData();
    } catch (err) {
      console.error('Redeem failed:', err);
      alert(err.response?.data?.detail || 'Failed to redeem reward.');
    } finally {
      setRedeemLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving membership loyalty status..." />;
  }

  const tier = account?.tier || 'STANDARD';
  const tierClass = TIER_COLORS[tier] || TIER_COLORS.STANDARD;

  // Calculate tier progress percentage
  const points = account?.points || 0;
  const lifetime = account?.lifetime_points || 0;
  let progressPct = 100;
  if (account?.next_tier) {
    const nextRemaining = account.points_to_next_tier || 1000;
    const tierGoal = lifetime + nextRemaining;
    progressPct = Math.min(Math.round((lifetime / tierGoal) * 100), 100);
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#DFB76C]/20 pb-6 md:flex-row md:items-end">
        <div>
          <span className="font-cinzel text-[10px] tracking-[0.25em] text-[#B88E43] uppercase">
            05 / Membership Privileges
          </span>
          <h1 className="mt-1 font-editorial text-3xl md:text-4xl text-[#13152C] tracking-tight">
            Loyalty & Resident Tier
          </h1>
          <p className="mt-1 font-sans text-xs md:text-sm text-[#13152C]/70 max-w-2xl">
            Accumulate recognition points on every completed stay and access bespoke concierge privileges.
          </p>
        </div>
      </div>

      {redeemSuccess && (
        <div className="flex items-center gap-3 rounded-[2px] border border-emerald-300 bg-emerald-50 p-4 font-sans text-xs font-semibold text-emerald-800">
          <CheckCircle size={18} className="text-emerald-700 shrink-0" />
          <span>{redeemSuccess}</span>
        </div>
      )}

      {/* Hero Membership Card (Deep Navy + Antique Gold) */}
      <div className={`relative overflow-hidden rounded-[4px] border p-8 md:p-10 shadow-lg ${tierClass}`}>
        {/* Subtle decorative background watermark */}
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-5 pointer-events-none flex items-center justify-end pr-6">
          <Crown size={280} />
        </div>

        <div className="relative z-10 flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-[2px] bg-[#DFB76C]/15 border border-[#DFB76C]/40 px-3 py-1 font-cinzel text-[10px] font-bold uppercase tracking-widest text-[#DFB76C]">
              <Crown size={14} />
              <span>{tier} MEMBER</span>
            </div>

            <div>
              <span className="block font-cinzel text-[10px] tracking-[0.2em] uppercase text-[#ECE5DA]/60">
                Available Honor Points
              </span>
              <p className="mt-1 font-editorial text-5xl md:text-6xl font-bold text-[#FAF6F0] tracking-tight">
                {points.toLocaleString()} <span className="font-sans text-sm font-normal text-[#DFB76C]">PTS</span>
              </p>
            </div>

            <p className="font-sans text-xs text-[#ECE5DA]/70">
              Lifetime Recognition Accrued:{' '}
              <strong className="text-[#DFB76C] font-semibold">{lifetime.toLocaleString()} Points</strong>
            </p>
          </div>

          {/* Next Tier Progress Box */}
          {account?.next_tier ? (
            <div className="rounded-[2px] bg-[#13152C]/90 p-6 border border-[#DFB76C]/30 w-full md:w-88 shadow-inner">
              <div className="flex justify-between font-cinzel text-[11px] tracking-wider text-[#FAF6F0]">
                <span>ELEVATION: {account.next_tier}</span>
                <span className="text-[#DFB76C] font-mono font-bold">{account.points_to_next_tier} pts to unlock</span>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-[2px] bg-[#0D0E20]">
                <div
                  className="h-full bg-gradient-to-r from-[#B88E43] to-[#DFB76C] transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <p className="mt-3 font-sans text-[11px] text-[#ECE5DA]/60">
                A total residency expenditure of ₹{(account.points_to_next_tier * 10).toLocaleString()} will secure {account.next_tier} elite honors.
              </p>
            </div>
          ) : (
            <div className="rounded-[2px] bg-[#13152C]/90 p-6 border border-[#DFB76C]/40 w-full md:w-88">
              <p className="font-cinzel text-xs font-bold tracking-widest text-[#DFB76C] flex items-center gap-2 uppercase">
                <Sparkles size={16} /> Zenith Tier Achieved
              </p>
              <p className="mt-2 font-sans text-xs text-[#ECE5DA]/70 leading-relaxed">
                You are accorded our highest Platinum sanctuary privileges, private transfers, and dedicated concierge assistance.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Available Rewards Catalog */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 border-b border-[#2C315E]/10 pb-3">
          <Gift size={18} className="text-[#B88E43]" />
          <h2 className="font-cinzel text-sm tracking-wider uppercase text-[#13152C] font-bold">
            Curated Member Privileges & Perks
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {rewards.map((reward, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-[4px] border border-[#2C315E]/15 bg-[#FFFFFF] p-6 shadow-sm transition-all hover:border-[#DFB76C]/60 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-[2px] bg-[#FAF6F0] text-[#B88E43] border border-[#DFB76C]/30">
                    <Gift size={16} />
                  </div>
                  <span className="font-mono text-xs font-bold text-[#13152C] bg-[#FAF6F0] border border-[#2C315E]/10 px-2.5 py-1 rounded-[2px]">
                    {reward.points} Pts
                  </span>
                </div>
                <h3 className="mt-4 font-editorial text-lg font-bold text-[#13152C] leading-snug">
                  {reward.name}
                </h3>
                <p className="mt-1.5 font-sans text-xs text-[#13152C]/70 leading-relaxed">
                  {reward.desc}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedReward(reward);
                  setRedeemModalOpen(true);
                }}
                disabled={points < reward.points}
                className="mt-6 w-full rounded-[2px] bg-[#13152C] py-2.5 font-cinzel text-[11px] tracking-wider uppercase text-[#DFB76C] hover:bg-[#1B1E3D] hover:border-[#DFB76C] border border-[#DFB76C]/30 disabled:opacity-40 disabled:hover:bg-[#13152C] cursor-pointer transition-all"
              >
                {points >= reward.points ? 'Redeem Privilege →' : 'Insufficient Points'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Points History Table */}
      <div className="rounded-[4px] border border-[#2C315E]/15 bg-[#FFFFFF] p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#2C315E]/10 pb-4">
          <History size={16} className="text-[#B88E43]" />
          <h2 className="font-cinzel text-xs tracking-wider uppercase text-[#13152C] font-bold">
            Audit Ledger & Recent Activity
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="border-b border-[#2C315E]/10 bg-[#FAF6F0] text-[#13152C]/70 font-cinzel text-[10px] tracking-widest uppercase">
                <th className="py-3 px-4">Activity Description</th>
                <th className="py-3 px-4">Folio Reference</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Points Movement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C315E]/10 text-[#13152C]">
              {transactions && transactions.length > 0 ? (
                transactions.map((tx) => {
                  const isEarned = tx.points > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-[#FAF6F0]/60 transition-colors">
                      <td className="py-3.5 px-4 font-medium flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isEarned ? 'bg-emerald-600' : 'bg-rose-600'
                          }`}
                        />
                        {tx.description}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#13152C]/70">{tx.reference || '—'}</td>
                      <td className="py-3.5 px-4 text-[#13152C]/60">{tx.created_at?.split('T')[0]}</td>
                      <td
                        className={`py-3.5 px-4 text-right font-mono font-bold ${
                          isEarned ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isEarned ? `+${tx.points}` : tx.points}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="py-8 text-center font-sans text-xs text-[#13152C]/50">
                    No points movements registered. Completed residencies automatically credit your account.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Redeem Modal */}
      {selectedReward && (
        <Modal
          isOpen={redeemModalOpen}
          onClose={() => setRedeemModalOpen(false)}
          title={`Redeem ${selectedReward.name}`}
        >
          <div className="space-y-5">
            <p className="font-sans text-xs text-[#13152C]/80 leading-relaxed">
              Confirm your request to deduct <strong>{selectedReward.points} points</strong> in exchange for{' '}
              <strong>"{selectedReward.name}"</strong>?
            </p>

            <div className="rounded-[2px] bg-[#FAF6F0] p-4 font-sans text-xs space-y-2 border border-[#2C315E]/10">
              <div className="flex justify-between">
                <span className="text-[#13152C]/70">Available Balance:</span>
                <span className="font-bold text-[#13152C]">{points} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#13152C]/70">Privilege Surcharge:</span>
                <span className="font-bold text-rose-700">-{selectedReward.points} pts</span>
              </div>
              <div className="flex justify-between border-t border-[#2C315E]/15 pt-2">
                <span className="text-[#13152C]/70">Post-Redemption Balance:</span>
                <span className="font-bold text-emerald-700">{points - selectedReward.points} pts</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2C315E]/10">
              <button
                type="button"
                onClick={() => setRedeemModalOpen(false)}
                className="rounded-[2px] border border-[#2C315E]/20 bg-[#FFFFFF] px-4 py-2 font-cinzel text-xs tracking-wider uppercase text-[#13152C] hover:bg-[#FAF6F0] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRedeem(selectedReward)}
                disabled={redeemLoading}
                className="rounded-[2px] bg-[#13152C] border border-[#DFB76C]/40 px-5 py-2 font-cinzel text-xs tracking-wider uppercase text-[#DFB76C] hover:bg-[#1B1E3D] hover:border-[#DFB76C] disabled:opacity-50 cursor-pointer transition-all"
              >
                {redeemLoading ? 'Processing...' : 'Confirm Redemption →'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
