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
    { name: '₹500 Hotel Stay Voucher', points: 500, desc: 'Discount voucher applied automatically toward your next hotel booking.' },
    { name: 'Complimentary Room Upgrade', points: 1000, desc: 'Upgrade to a higher room category at check-in (subject to availability).' },
    { name: 'Breakfast for Two', points: 400, desc: 'Free daily breakfast for two guests each morning during your stay.' },
    { name: 'Late Check-out (4:00 PM)', points: 300, desc: 'Keep your room until 4:00 PM on departure day.' },
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
    <div className="space-y-8 pb-12 text-[#FAF6F0]">
      {/* Editorial Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#2C315E] pb-6 md:flex-row md:items-end">
        <div>
          <span className="font-cinzel text-[10px] tracking-[0.25em] text-[#DFB76C] uppercase font-semibold">
            REWARDS PROGRAM
          </span>
          <h1 className="mt-1 font-editorial text-3xl md:text-4xl text-white tracking-tight font-bold">
            Loyalty Rewards & Status
          </h1>
          <p className="mt-1 font-sans text-xs md:text-sm text-white/70 max-w-2xl">
            Earn points on every stay and redeem them for free room upgrades, dining, and stay vouchers.
          </p>
        </div>
      </div>

      {redeemSuccess && (
        <div className="flex items-center gap-3 rounded-[2px] border border-emerald-500/40 bg-emerald-950/40 p-4 font-sans text-xs font-semibold text-emerald-300">
          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
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
              <span className="block font-cinzel text-[10px] tracking-[0.2em] uppercase text-white/60">
                Available Points
              </span>
              <p className="mt-1 font-editorial text-5xl md:text-6xl font-bold text-[#FAF6F0] tracking-tight">
                {points.toLocaleString()} <span className="font-sans text-sm font-normal text-[#DFB76C]">PTS</span>
              </p>
            </div>

            <p className="font-sans text-xs text-white/70">
              Total Points Earned:{' '}
              <strong className="text-[#DFB76C] font-semibold">{lifetime.toLocaleString()} Points</strong>
            </p>
          </div>

          {/* Next Tier Progress Box */}
          {account?.next_tier ? (
            <div className="rounded-[2px] bg-[#13152C]/90 p-6 border border-[#DFB76C]/30 w-full md:w-88 shadow-inner">
              <div className="flex justify-between font-cinzel text-[11px] tracking-wider text-[#FAF6F0]">
                <span>NEXT TIER: {account.next_tier}</span>
                <span className="text-[#DFB76C] font-mono font-bold">{account.points_to_next_tier} pts to unlock</span>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-[2px] bg-[#0D0E20]">
                <div
                  className="h-full bg-gradient-to-r from-[#B88E43] to-[#DFB76C] transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <p className="mt-3 font-sans text-[11px] text-white/60">
                Spend ₹{(account.points_to_next_tier * 10).toLocaleString()} more to reach {account.next_tier} tier.
              </p>
            </div>
          ) : (
            <div className="rounded-[2px] bg-[#13152C]/90 p-6 border border-[#DFB76C]/40 w-full md:w-88">
              <p className="font-cinzel text-xs font-bold tracking-widest text-[#DFB76C] flex items-center gap-2 uppercase">
                <Sparkles size={16} /> Top Tier Reached
              </p>
              <p className="mt-2 font-sans text-xs text-white/70 leading-relaxed">
                You enjoy our highest Platinum benefits: priority upgrades, late check-out, and 24/7 concierge service.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Available Rewards Catalog */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 border-b border-[#2C315E] pb-3">
          <Gift size={18} className="text-[#DFB76C]" />
          <h2 className="font-cinzel text-sm tracking-wider uppercase text-white font-bold">
            Rewards You Can Redeem
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {rewards.map((reward, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between rounded-[4px] border border-[#2C315E] bg-[#13152C] p-6 shadow-sm transition-all hover:border-[#DFB76C]/60 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-[2px] bg-[#1B1E3D] text-[#DFB76C] border border-[#2C315E]">
                    <Gift size={16} />
                  </div>
                  <span className="font-mono text-xs font-bold text-[#DFB76C] bg-[#1B1E3D] border border-[#2C315E] px-2.5 py-1 rounded-[2px]">
                    {reward.points} Pts
                  </span>
                </div>
                <h3 className="mt-4 font-editorial text-lg font-bold text-white leading-snug">
                  {reward.name}
                </h3>
                <p className="mt-1.5 font-sans text-xs text-white/70 leading-relaxed">
                  {reward.desc}
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedReward(reward);
                  setRedeemModalOpen(true);
                }}
                disabled={points < reward.points}
                className="mt-6 w-full rounded-[2px] bg-[#1B1E3D] py-2.5 font-cinzel text-[11px] tracking-wider uppercase text-[#DFB76C] hover:bg-[#DFB76C] hover:text-[#13152C] border border-[#DFB76C]/30 disabled:opacity-40 disabled:hover:bg-[#1B1E3D] disabled:hover:text-[#DFB76C] font-semibold cursor-pointer transition-all"
              >
                {points >= reward.points ? 'Redeem Privilege →' : 'Insufficient Points'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Points History Table */}
      <div className="rounded-[4px] border border-[#2C315E] bg-[#13152C] p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#2C315E] pb-4">
          <History size={16} className="text-[#DFB76C]" />
          <h2 className="font-cinzel text-xs tracking-wider uppercase text-white font-bold">
            Audit Ledger & Recent Activity
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="border-b border-[#2C315E] bg-[#1B1E3D] text-[#DFB76C] font-cinzel text-[10px] tracking-widest uppercase font-semibold">
                <th className="py-3 px-4">Activity Description</th>
                <th className="py-3 px-4">Folio Reference</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Points Movement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2C315E] text-white/90">
              {transactions && transactions.length > 0 ? (
                transactions.map((tx) => {
                  const isEarned = tx.points > 0;
                  return (
                    <tr key={tx.id} className="hover:bg-[#1B1E3D]/50 transition-colors">
                      <td className="py-3.5 px-4 font-medium flex items-center gap-2 text-white">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isEarned ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        />
                        {tx.description}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#DFB76C]">{tx.reference || '—'}</td>
                      <td className="py-3.5 px-4 text-white/60">{tx.created_at?.split('T')[0]}</td>
                      <td
                        className={`py-3.5 px-4 text-right font-mono font-bold ${
                          isEarned ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isEarned ? `+${tx.points}` : tx.points}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="py-8 text-center font-sans text-xs text-white/50">
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
          <div className="space-y-5 text-white">
            <p className="font-sans text-xs text-white/80 leading-relaxed">
              Confirm your request to deduct <strong className="text-[#DFB76C]">{selectedReward.points} points</strong> in exchange for{' '}
              <strong className="text-white">"{selectedReward.name}"</strong>?
            </p>

            <div className="rounded-[2px] bg-[#1B1E3D] p-4 font-sans text-xs space-y-2 border border-[#2C315E]">
              <div className="flex justify-between">
                <span className="text-white/70">Available Balance:</span>
                <span className="font-bold text-white">{points} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Privilege Surcharge:</span>
                <span className="font-bold text-rose-400">-{selectedReward.points} pts</span>
              </div>
              <div className="flex justify-between border-t border-[#2C315E] pt-2">
                <span className="text-white/70">Post-Redemption Balance:</span>
                <span className="font-bold text-emerald-400">{points - selectedReward.points} pts</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2C315E]">
              <button
                type="button"
                onClick={() => setRedeemModalOpen(false)}
                className="rounded-[2px] border border-[#2C315E] bg-[#13152C] px-4 py-2 font-cinzel text-xs tracking-wider uppercase text-white/80 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRedeem(selectedReward)}
                disabled={redeemLoading}
                className="rounded-[2px] bg-[#DFB76C] hover:bg-[#F2D59B] text-[#13152C] px-5 py-2 font-cinzel text-xs tracking-wider uppercase font-bold disabled:opacity-50 cursor-pointer transition-all"
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
