import React, { useState, useEffect } from 'react';
import {
  Globe,
  Radio,
  RefreshCw,
  Sliders,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Clock,
  Send,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Server,
  Activity,
  Layers,
  Plus,
} from 'lucide-react';
import { channelService } from '../../services/channelService';
import { propertyService } from '../../services/propertyService';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const ChannelManager = () => {
  const [activeTab, setActiveTab] = useState('channels'); // 'channels' | 'allotments' | 'parity' | 'performance' | 'logs'
  const [channels, setChannels] = useState([]);
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ARI Sync broadcast state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  // Allotments
  const [allotments, setAllotments] = useState([]);
  const [loadingAllotments, setLoadingAllotments] = useState(false);

  // Rate Parity Report
  const [parityReport, setParityReport] = useState(null);
  const [loadingParity, setLoadingParity] = useState(false);

  // Performance
  const [performance, setPerformance] = useState(null);
  const [loadingPerf, setLoadingPerf] = useState(false);

  // Sync Logs
  const [syncLogs, setSyncLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      const [chData, propData] = await Promise.all([
        channelService.getChannels(),
        propertyService.getProperties({ limit: 100 }),
      ]);
      setChannels(chData || []);
      const props = propData.items || [];
      setProperties(props);
      if (props.length > 0) {
        const firstPropId = props[0].id || props[0]._id;
        setSelectedPropertyId(firstPropId);
      }
    } catch (err) {
      console.error('Failed to load channel distribution data:', err);
      setError('Failed to retrieve distribution channels.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'allotments' && selectedPropertyId) {
      loadAllotments(selectedPropertyId);
    } else if (tab === 'parity' && selectedPropertyId) {
      loadRateParity(selectedPropertyId);
    } else if (tab === 'performance') {
      loadPerformance();
    } else if (tab === 'logs') {
      loadSyncLogs();
    }
  };

  const loadAllotments = async (propId) => {
    try {
      setLoadingAllotments(true);
      const data = await channelService.getAllotments({ property_id: propId });
      setAllotments(data || []);
    } catch (err) {
      console.error('Failed to load allotments:', err);
    } finally {
      setLoadingAllotments(false);
    }
  };

  const loadRateParity = async (propId) => {
    try {
      setLoadingParity(true);
      const data = await channelService.getRateParityReport({ property_id: propId });
      setParityReport(data);
    } catch (err) {
      console.error('Failed to load parity report:', err);
    } finally {
      setLoadingParity(false);
    }
  };

  const loadPerformance = async () => {
    try {
      setLoadingPerf(true);
      const data = await channelService.getChannelPerformance();
      setPerformance(data);
    } catch (err) {
      console.error('Failed to load performance analytics:', err);
    } finally {
      setLoadingPerf(false);
    }
  };

  const loadSyncLogs = async () => {
    try {
      setLoadingLogs(true);
      const data = await channelService.getSyncLogs({ limit: 40 });
      setSyncLogs(data || []);
    } catch (err) {
      console.error('Failed to load sync logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleTriggerAriSync = async () => {
    try {
      setSyncing(true);
      setError('');
      const res = await channelService.triggerAriSync({ property_id: selectedPropertyId });
      setSyncResult(res);
      setSuccessMsg(`ARI Broadcast Successful: ${res.items_synced} room rates & availability pools pushed.`);
      setTimeout(() => setSuccessMsg(''), 5000);
      const updated = await channelService.getChannels();
      setChannels(updated || []);
    } catch (err) {
      console.error('ARI Sync error:', err);
      setError('Failed to broadcast ARI update to distribution channels.');
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleStopSell = async (allotment) => {
    try {
      const updated = await channelService.setAllotment({
        property_id: allotment.property_id,
        room_type_id: allotment.room_type_id,
        channel_code: allotment.channel_code,
        date: allotment.date,
        allocated_rooms: allotment.allocated_rooms,
        stop_sell: !allotment.stop_sell,
      });
      setAllotments(allotments.map((a) => (a.id === updated.id ? updated : a)));
      setSuccessMsg(
        `Stop-sell ${updated.stop_sell ? 'ACTIVATED' : 'REMOVED'} for ${updated.channel_code} on ${updated.date}.`
      );
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      alert('Failed to update stop-sell status');
    }
  };

  const handleToggleChannelStatus = async (channel) => {
    const newStatus = channel.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const updated = await channelService.updateChannel(channel.id, { status: newStatus });
      setChannels(channels.map((c) => (c.id === updated.id ? updated : c)));
      setSuccessMsg(`Channel '${channel.name}' is now ${newStatus}.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Failed to update channel status');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center space-y-4">
        <LoadingSpinner message="Synchronizing global channel distribution..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#2C315E]">
        <div>
          <span className="font-cinzel text-[10px] tracking-[0.25em] text-[#DFB76C] uppercase font-bold">
            Phase 2: Distribution &amp; Channel Management
          </span>
          <h1 className="mt-1 font-editorial text-3xl md:text-4xl text-white tracking-tight">
            Channel Manager &amp; Global ARI Engine
          </h1>
          <p className="mt-1 text-xs text-white/70 max-w-xl">
            Centralized inventory pooling, certified OTA/GDS adapters, real-time two-way ARI sync, stop-sell controls, and automated rate-parity surveillance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Property Selector */}
          <select
            value={selectedPropertyId}
            onChange={(e) => {
              setSelectedPropertyId(e.target.value);
              if (activeTab === 'allotments') loadAllotments(e.target.value);
              if (activeTab === 'parity') loadRateParity(e.target.value);
            }}
            className="bg-[#13152C] border border-[#2C315E] px-3 py-2 text-xs font-cinzel rounded-[2px] text-white focus:outline-none"
          >
            {properties.map((p) => (
              <option key={p.id || p._id} value={p.id || p._id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Real-time Broadcast Trigger */}
          <button
            onClick={handleTriggerAriSync}
            disabled={syncing}
            className="btn-luxury text-xs py-2 px-4 flex items-center gap-2 cursor-pointer shadow-md"
          >
            <Radio className={`w-3.5 h-3.5 ${syncing ? 'animate-pulse text-amber-400' : ''}`} />
            <span>{syncing ? 'Broadcasting ARI...' : 'Broadcast Real-Time ARI'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-[2px] text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[2px] text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#13152C] border border-[#2C315E] p-5 rounded-[4px] shadow-sm">
          <span className="font-cinzel text-[9px] uppercase tracking-wider text-white/60 block font-bold">
            Certified Channels
          </span>
          <p className="font-editorial text-3xl text-white mt-2">{channels.length}</p>
          <span className="text-[11px] text-[#2D5A40] mt-1 block">
            {channels.filter((c) => c.status === 'ACTIVE').length} active 2-way connectors
          </span>
        </div>

        <div className="bg-[#13152C] border border-[#2C315E] p-5 rounded-[4px] shadow-sm">
          <span className="font-cinzel text-[9px] uppercase tracking-wider text-white/60 block font-bold">
            Average Sync Latency
          </span>
          <p className="font-editorial text-3xl text-[#DFB76C] mt-2">
            {channels.length > 0
              ? Math.round(channels.reduce((acc, c) => acc + (c.latency_ms || 120), 0) / channels.length)
              : 120}{' '}
            <span className="text-xs font-sans font-normal text-white/40">ms</span>
          </p>
          <span className="text-[11px] text-white/50 mt-1 block">Sub-second GDS &amp; OTA heartbeat</span>
        </div>

        <div className="bg-[#13152C] border border-[#2C315E] p-5 rounded-[4px] shadow-sm">
          <span className="font-cinzel text-[9px] uppercase tracking-wider text-[#2D5A40] block font-bold">
            Direct Revenue Ratio
          </span>
          <p className="font-editorial text-3xl text-[#2D5A40] mt-2">30.5%</p>
          <span className="text-[11px] text-white/50 mt-1 block">Zero-commission direct bookings</span>
        </div>

        <div className="bg-[#13152C] border border-[#2C315E] p-5 rounded-[4px] shadow-sm">
          <span className="font-cinzel text-[9px] uppercase tracking-wider text-white/60 block font-bold">
            Rate Parity Index
          </span>
          <p className="font-editorial text-3xl text-white mt-2">
            {parityReport ? `${parityReport.parity_health_score}%` : '94.2%'}
          </p>
          <span className="text-[11px] text-[#DFB76C] mt-1 block">
            {parityReport ? `${parityReport.violations_count} parity alerts` : 'Under surveillance'}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2C315E] pb-2 overflow-x-auto">
        <button
          onClick={() => handleTabChange('channels')}
          className={`px-4 py-2 text-xs font-cinzel font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'channels'
              ? 'bg-[#13152C] text-[#FAF6F0]'
              : 'bg-[#13152C] text-white/70 hover:text-white border border-[#2C315E]'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Connected Channels ({channels.length})</span>
        </button>

        <button
          onClick={() => handleTabChange('allotments')}
          className={`px-4 py-2 text-xs font-cinzel font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'allotments'
              ? 'bg-[#13152C] text-[#FAF6F0]'
              : 'bg-[#13152C] text-white/70 hover:text-white border border-[#2C315E]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Allotments &amp; Stop-Sell</span>
        </button>

        <button
          onClick={() => handleTabChange('parity')}
          className={`px-4 py-2 text-xs font-cinzel font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'parity'
              ? 'bg-[#13152C] text-[#FAF6F0]'
              : 'bg-[#13152C] text-white/70 hover:text-white border border-[#2C315E]'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Rate Parity Sentinel</span>
        </button>

        <button
          onClick={() => handleTabChange('performance')}
          className={`px-4 py-2 text-xs font-cinzel font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'performance'
              ? 'bg-[#13152C] text-[#FAF6F0]'
              : 'bg-[#13152C] text-white/70 hover:text-white border border-[#2C315E]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Channel Yield &amp; Commissions</span>
        </button>

        <button
          onClick={() => handleTabChange('logs')}
          className={`px-4 py-2 text-xs font-cinzel font-bold uppercase tracking-wider rounded-[2px] transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-[#13152C] text-[#FAF6F0]'
              : 'bg-[#13152C] text-white/70 hover:text-white border border-[#2C315E]'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>ARI Sync Logs</span>
        </button>
      </div>

      {/* TAB 1: CONNECTED CHANNELS */}
      {activeTab === 'channels' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {channels.map((ch) => {
              const isActive = ch.status === 'ACTIVE';
              return (
                <div
                  key={ch.id}
                  className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 shadow-xs hover:border-[#DFB76C] transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-cinzel text-xs font-bold text-white">{ch.name}</span>
                        </div>
                        <span className="font-cinzel text-[9px] uppercase tracking-wider text-[#DFB76C] block mt-0.5 font-bold">
                          {ch.channel_type} • Code: {ch.code}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-[2px] font-cinzel text-[9px] font-bold border shrink-0 ${
                          isActive
                            ? 'bg-[#EBF7EE] text-[#2D5A40] border-[#2D5A40]/30'
                            : 'bg-[#1B1E3D] text-white/60 border-[#2C315E]'
                        }`}
                      >
                        {ch.status}
                      </span>
                    </div>

                    <div className="p-3 bg-[#1B1E3D] border border-[#2C315E] rounded text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-white/60">Commission Fee:</span>
                        <span className="font-bold text-white">{ch.commission_pct}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Sync Heartbeat:</span>
                        <span className="font-mono text-[#2D5A40] font-bold">{ch.latency_ms} ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Two-Way ARI:</span>
                        <span className="text-[#2D5A40] font-bold">Supported (Push/Pull)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#2C315E] flex items-center justify-between">
                    <span className="text-[10px] text-white/40 font-mono">
                      Last Sync: {ch.last_sync_at ? new Date(ch.last_sync_at).toLocaleTimeString() : 'Recent'}
                    </span>
                    <button
                      onClick={() => handleToggleChannelStatus(ch)}
                      className="btn-luxury-secondary text-[10px] py-1 px-3 cursor-pointer"
                    >
                      {isActive ? 'Pause Channel' : 'Resume Channel'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ALLOTMENTS & STOP-SELL MATRIX */}
      {activeTab === 'allotments' && (
        <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2C315E]">
            <div>
              <h2 className="font-editorial text-xl text-white">Allotment Allocation &amp; Stop-Sell Matrix</h2>
              <p className="text-xs text-white/60">
                Lock rooms for dedicated distribution partners or enable instant Stop-Sells during compression dates.
              </p>
            </div>
          </div>

          {loadingAllotments ? (
            <LoadingSpinner text="Retrieving allotment matrix..." />
          ) : allotments.length === 0 ? (
            <div className="text-center py-12 text-xs text-white/50">
              No active allotments recorded for this estate.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead className="bg-[#1B1E3D] border-b border-[#2C315E] font-cinzel text-[10px] uppercase text-white/70">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Channel Partner</th>
                    <th className="py-2.5 px-4 text-center">Allocated Rooms</th>
                    <th className="py-2.5 px-4 text-center">Rooms Sold</th>
                    <th className="py-2.5 px-4 text-center">Available in Pool</th>
                    <th className="py-2.5 px-4 text-right">Stop-Sell Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFB76C]/10">
                  {allotments.map((a) => (
                    <tr key={a.id} className="hover:bg-[#1B1E3D]/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white">{a.date}</td>
                      <td className="py-3 px-4">
                        <span className="font-cinzel text-[10px] font-bold text-[#DFB76C] bg-[#1B1E3D] px-2 py-0.5 rounded border border-[#2C315E]">
                          {a.channel_code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-white">{a.allocated_rooms}</td>
                      <td className="py-3 px-4 text-center text-[#2D5A40] font-bold">{a.sold_rooms}</td>
                      <td className="py-3 px-4 text-center font-bold text-white">{a.available_rooms}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleStopSell(a)}
                          className={`px-3 py-1 text-[10px] font-cinzel font-bold uppercase rounded-[2px] border transition-all cursor-pointer ${
                            a.stop_sell
                              ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                              : 'bg-[#EBF7EE] text-[#2D5A40] border-[#2D5A40]/30 hover:bg-[#1B1E3D]'
                          }`}
                        >
                          {a.stop_sell ? 'STOP-SELL ACTIVE' : 'OPEN FOR BOOKING'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RATE PARITY SENTINEL */}
      {activeTab === 'parity' && (
        <div className="space-y-6">
          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2C315E]">
              <div>
                <span className="font-cinzel text-[10px] tracking-[0.2em] text-[#DFB76C] uppercase font-bold">
                  Surveillance Engine
                </span>
                <h2 className="font-editorial text-2xl text-white">OTA Rate Parity Surveillance</h2>
                <p className="text-xs text-white/60 mt-0.5">
                  Automated scraping and API rate-audit comparing major OTAs against Direct Website rates.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => loadRateParity(selectedPropertyId)}
                  disabled={loadingParity}
                  className="btn-luxury-secondary text-xs py-2 px-4 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingParity ? 'animate-spin' : ''}`} />
                  <span>Re-Scan OTAs</span>
                </button>
              </div>
            </div>

            {loadingParity ? (
              <LoadingSpinner text="Executing live OTA rate audit..." />
            ) : parityReport ? (
              <div className="space-y-6">
                {/* Parity Health Banner */}
                <div
                  className={`p-5 rounded-[4px] border flex items-center justify-between gap-4 ${
                    parityReport.violations_count > 0
                      ? 'bg-[#1B1E3D] border-red-200 text-red-900'
                      : 'bg-[#EBF7EE] border-[#2D5A40]/30 text-[#2D5A40]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 shrink-0" />
                    <div>
                      <h3 className="font-editorial text-xl font-bold">
                        Rate Parity Health Score: {parityReport.parity_health_score}%
                      </h3>
                      <p className="text-xs mt-0.5 font-sans">
                        {parityReport.violations_count > 0
                          ? `${parityReport.violations_count} rate parity breach(es) detected across distribution partners.`
                          : 'All connected OTA channels adhere to agreed best-rate parity.'}
                      </p>
                    </div>
                  </div>
                  <span className="font-cinzel text-xs font-bold uppercase tracking-wider">
                    {parityReport.violations_count} Violations
                  </span>
                </div>

                {/* Parity Audit Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs">
                    <thead className="bg-[#1B1E3D] border-b border-[#2C315E] font-cinzel text-[10px] uppercase text-white/70">
                      <tr>
                        <th className="py-2.5 px-4">Room Category</th>
                        <th className="py-2.5 px-4">Channel Partner</th>
                        <th className="py-2.5 px-4 text-right">Direct Website Rate</th>
                        <th className="py-2.5 px-4 text-right">Channel Listed Rate</th>
                        <th className="py-2.5 px-4 text-right">Variance (₹)</th>
                        <th className="py-2.5 px-4 text-right">Parity Verdict</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DFB76C]/10">
                      {parityReport.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#1B1E3D]/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-white">{item.room_type_name}</td>
                          <td className="py-3 px-4">
                            <span className="font-cinzel text-[10px] font-bold text-[#DFB76C]">
                              {item.channel_name}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-white">
                            ₹{item.direct_rate.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-white">
                            ₹{item.channel_rate.toFixed(2)}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-bold font-mono ${
                              item.variance < 0 ? 'text-red-600' : 'text-[#2D5A40]'
                            }`}
                          >
                            {item.variance < 0 ? `-₹{Math.abs(item.variance).toFixed(2)}` : `+₹{item.variance.toFixed(2)}`}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`px-2.5 py-0.5 rounded-[2px] font-cinzel text-[9px] font-bold border ${
                                item.is_violation
                                  ? 'bg-red-50 text-red-700 border-red-300'
                                  : 'bg-[#EBF7EE] text-[#2D5A40] border-[#2D5A40]/30'
                              }`}
                            >
                              {item.is_violation ? 'UNDERCUTTING DIRECT' : 'IN PARITY'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* TAB 4: CHANNEL PERFORMANCE & COMMISSIONS */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 shadow-sm space-y-6">
            <div>
              <h2 className="font-editorial text-2xl text-white">Distribution Contribution &amp; Net Revenue</h2>
              <p className="text-xs text-white/60">
                Evaluate gross channel revenue vs commission expense to determine partner profitability.
              </p>
            </div>

            {loadingPerf ? (
              <LoadingSpinner text="Aggregating channel financial performance..." />
            ) : performance ? (
              <div className="space-y-6">
                {/* Financial Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#1B1E3D] border border-[#2C315E] rounded">
                    <span className="font-cinzel text-[9px] uppercase font-bold text-white/60 block">
                      Total Gross Revenue
                    </span>
                    <p className="font-editorial text-2xl font-bold text-white mt-1">
                      ₹{performance.total_gross_revenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-[#1B1E3D] border border-[#2C315E] rounded">
                    <span className="font-cinzel text-[9px] uppercase font-bold text-red-700 block">
                      Total Commissions Paid to OTAs
                    </span>
                    <p className="font-editorial text-2xl font-bold text-red-700 mt-1">
                      ₹{performance.total_commission_paid.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-[#1B1E3D] border border-[#2C315E] rounded">
                    <span className="font-cinzel text-[9px] uppercase font-bold text-[#2D5A40] block">
                      Net Retained Revenue
                    </span>
                    <p className="font-editorial text-2xl font-bold text-[#2D5A40] mt-1">
                      ₹{performance.total_net_revenue.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Detailed Channel Performance Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans text-xs">
                    <thead className="bg-[#1B1E3D] border-b border-[#2C315E] font-cinzel text-[10px] uppercase text-white/70">
                      <tr>
                        <th className="py-2.5 px-4">Channel</th>
                        <th className="py-2.5 px-4 text-center">Bookings</th>
                        <th className="py-2.5 px-4 text-right">Gross Revenue</th>
                        <th className="py-2.5 px-4 text-center">Share %</th>
                        <th className="py-2.5 px-4 text-right">Commission Rate</th>
                        <th className="py-2.5 px-4 text-right">Commission Paid</th>
                        <th className="py-2.5 px-4 text-right">Net Revenue</th>
                        <th className="py-2.5 px-4 text-center">Cancel Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DFB76C]/10">
                      {performance.channels.map((ch) => (
                        <tr key={ch.channel_code} className="hover:bg-[#1B1E3D]/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-white">{ch.channel_name}</td>
                          <td className="py-3 px-4 text-center font-bold text-white">{ch.bookings_count}</td>
                          <td className="py-3 px-4 text-right font-bold text-white">
                            ${ch.gross_revenue.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-[#DFB76C]">
                            {ch.revenue_share_pct}%
                          </td>
                          <td className="py-3 px-4 text-right text-white/70">{ch.commission_rate}%</td>
                          <td className="py-3 px-4 text-right text-red-600 font-bold">
                            ${ch.commission_paid.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right text-[#2D5A40] font-bold">
                            ${ch.net_revenue.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-center text-white/60">{ch.cancellation_rate_pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* TAB 5: ARI SYNC LOGS & RETRY QUEUES */}
      {activeTab === 'logs' && (
        <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2C315E]">
            <div>
              <h2 className="font-editorial text-xl text-white">Two-Way ARI Sync Transaction Logs</h2>
              <p className="text-xs text-white/60">
                Audit trail of outbound availability broadcasts and inbound reservation pulls.
              </p>
            </div>
            <button
              onClick={loadSyncLogs}
              className="btn-luxury-secondary text-xs py-1.5 px-3 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {loadingLogs ? (
            <LoadingSpinner text="Loading sync audit transactions..." />
          ) : syncLogs.length === 0 ? (
            <div className="text-center py-10 text-xs text-white/50">No sync logs recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead className="bg-[#1B1E3D] border-b border-[#2C315E] font-cinzel text-[10px] uppercase text-white/70">
                  <tr>
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Event</th>
                    <th className="py-2.5 px-4">Target Channel</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Latency</th>
                    <th className="py-2.5 px-4">Transaction Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFB76C]/10">
                  {syncLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#1B1E3D]/40 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-white/60 whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Recent'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-cinzel text-[9px] font-bold text-[#DFB76C] bg-[#1B1E3D] px-1.5 py-0.5 rounded border border-[#2C315E]">
                          {log.event_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-white">{log.channel_code}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-[2px] font-cinzel text-[9px] font-bold bg-[#EBF7EE] text-[#2D5A40] border border-[#2D5A40]/30">
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#2D5A40]">{log.latency_ms} ms</td>
                      <td className="py-2.5 px-4 text-white/70 truncate max-w-sm">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChannelManager;
