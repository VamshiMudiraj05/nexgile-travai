import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  ShieldCheck,
  Calendar,
  Sparkles,
  Clock,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  Sliders,
  DollarSign,
  Ban,
  ArrowRight,
  Info,
} from 'lucide-react';
import { ratePlanService } from '../../services/ratePlanService';
import { propertyService } from '../../services/propertyService';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const RatePlanManager = () => {
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [ratePlans, setRatePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formCode, setFormCode] = useState('BAR');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMultiplier, setFormMultiplier] = useState(1.0);
  const [formFixedAdjustment, setFormFixedAdjustment] = useState(0.0);
  const [formMealPlan, setFormMealPlan] = useState('ROOM_ONLY');
  const [formCancellation, setFormCancellation] = useState('FLEXIBLE_24H');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsDefault, setFormIsDefault] = useState(false);

  // Restrictions Form
  const [formMinLOS, setFormMinLOS] = useState(1);
  const [formMaxLOS, setFormMaxLOS] = useState(30);
  const [formCTA, setFormCTA] = useState(false);
  const [formCTD, setFormCTD] = useState(false);
  const [formMinAdvance, setFormMinAdvance] = useState(0);

  // Inclusions Form
  const [inclusions, setInclusions] = useState([]);
  const [newIncName, setNewIncName] = useState('');
  const [newIncVal, setNewIncVal] = useState('');

  // Interactive Stay Restriction Tester
  const [testPlanId, setTestPlanId] = useState('');
  const [testCheckIn, setTestCheckIn] = useState('');
  const [testCheckOut, setTestCheckOut] = useState('');
  const [testBaseRate, setTestBaseRate] = useState(250.0);
  const [testResult, setTestResult] = useState(null);
  const [testingStay, setTestingStay] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const data = await propertyService.getProperties({ limit: 100 });
      const items = data.items || [];
      setProperties(items);
      if (items.length > 0) {
        setSelectedPropertyId(items[0].id || items[0]._id);
      }
    } catch (err) {
      console.error('Failed to load properties for rate plans:', err);
    }
  };

  const loadRatePlans = async () => {
    if (!selectedPropertyId) return;
    try {
      setLoading(true);
      setError('');
      const data = await ratePlanService.getRatePlans({ property_id: selectedPropertyId });
      setRatePlans(data || []);
      if (data && data.length > 0 && !testPlanId) {
        setTestPlanId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load rate plans:', err);
      setError('Failed to retrieve rate plans and stay restrictions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRatePlans();
  }, [selectedPropertyId]);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormCode('PKG_' + Math.floor(Math.random() * 900 + 100));
    setFormName('');
    setFormDescription('');
    setFormMultiplier(1.0);
    setFormFixedAdjustment(0.0);
    setFormMealPlan('ROOM_ONLY');
    setFormCancellation('FLEXIBLE_24H');
    setFormIsActive(true);
    setFormIsDefault(false);
    setFormMinLOS(1);
    setFormMaxLOS(30);
    setFormCTA(false);
    setFormCTD(false);
    setFormMinAdvance(0);
    setInclusions([]);
    setModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setFormCode(plan.code);
    setFormName(plan.name);
    setFormDescription(plan.description || '');
    setFormMultiplier(plan.rate_multiplier);
    setFormFixedAdjustment(plan.fixed_adjustment || 0.0);
    setFormMealPlan(plan.meal_plan);
    setFormCancellation(plan.cancellation_policy);
    setFormIsActive(plan.is_active);
    setFormIsDefault(plan.is_default);

    const restr = plan.restrictions || {};
    setFormMinLOS(restr.min_los || 1);
    setFormMaxLOS(restr.max_los || 30);
    setFormCTA(!!restr.closed_to_arrival);
    setFormCTD(!!restr.closed_to_departure);
    setFormMinAdvance(restr.min_advance_days || 0);

    setInclusions(plan.inclusions || []);
    setModalOpen(true);
  };

  const handleAddInclusion = () => {
    if (!newIncName.trim()) return;
    setInclusions([
      ...inclusions,
      {
        name: newIncName.trim(),
        description: 'Included package amenity',
        value: parseFloat(newIncVal) || 0.0,
      },
    ]);
    setNewIncName('');
    setNewIncVal('');
  };

  const handleRemoveInclusion = (idx) => {
    setInclusions(inclusions.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formCode.trim()) {
      setError('Please provide a rate plan code and name.');
      return;
    }

    const payload = {
      property_id: selectedPropertyId,
      code: formCode.toUpperCase().trim(),
      name: formName.trim(),
      description: formDescription.trim(),
      rate_multiplier: parseFloat(formMultiplier),
      fixed_adjustment: parseFloat(formFixedAdjustment),
      meal_plan: formMealPlan,
      cancellation_policy: formCancellation,
      is_active: formIsActive,
      is_default: formIsDefault,
      inclusions,
      restrictions: {
        min_los: parseInt(formMinLOS, 10),
        max_los: parseInt(formMaxLOS, 10),
        closed_to_arrival: formCTA,
        closed_to_departure: formCTD,
        min_advance_days: parseInt(formMinAdvance, 10),
        max_advance_days: 365,
      },
    };

    try {
      setSubmitting(true);
      setError('');
      if (editingPlan) {
        await ratePlanService.updateRatePlan(editingPlan.id, payload);
        setSuccessMsg(`Rate plan '${formName}' updated successfully.`);
      } else {
        await ratePlanService.createRatePlan(payload);
        setSuccessMsg(`Rate plan '${formName}' created successfully.`);
      }
      setModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadRatePlans();
    } catch (err) {
      console.error('Failed to save rate plan:', err);
      setError(err.response?.data?.detail || 'Failed to save rate plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete rate plan '${name}'?`)) return;
    try {
      await ratePlanService.deleteRatePlan(id);
      setSuccessMsg(`Rate plan '${name}' deleted.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      await loadRatePlans();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete rate plan');
    }
  };

  const handleTestStay = async (e) => {
    e.preventDefault();
    if (!testPlanId || !testCheckIn || !testCheckOut) {
      alert('Please select a rate plan and stay dates to test.');
      return;
    }

    try {
      setTestingStay(true);
      const res = await ratePlanService.validateStay({
        rate_plan_id: testPlanId,
        check_in_date: testCheckIn,
        check_out_date: testCheckOut,
        base_nightly_rate: parseFloat(testBaseRate),
      });
      setTestResult(res);
    } catch (err) {
      console.error('Failed to validate stay:', err);
      alert(err.response?.data?.detail || 'Stay validation check failed.');
    } finally {
      setTestingStay(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#2C315E]">
        <div>
          <span className="font-cinzel text-[10px] tracking-[0.25em] text-[#DFB76C] uppercase font-bold">
            Revenue & Yield Optimization
          </span>
          <h1 className="mt-1 font-editorial text-3xl md:text-4xl text-white tracking-tight">
            Rate Plans & Stay Restrictions
          </h1>
          <p className="mt-1 text-xs text-white/70 max-w-xl">
            Configure dynamic rate multipliers, package inclusions, and stay restrictions (MinLOS, MaxLOS, CTA, CTD).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Property Filter */}
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="bg-[#13152C] border border-[#2C315E] px-3 py-2 text-xs font-cinzel rounded-[2px] text-white focus:outline-none"
          >
            {properties.map((p) => (
              <option key={p.id || p._id} value={p.id || p._id}>
                {p.name}
              </option>
            ))}
          </select>

          <button onClick={openCreateModal} className="btn-luxury text-xs py-2 px-4 flex items-center gap-1.5 cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
            <span>New Rate Plan</span>
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
            Configured Plans
          </span>
          <p className="font-editorial text-3xl text-white mt-2">{ratePlans.length}</p>
          <span className="text-[11px] text-white/50 mt-1 block">Active yield pricing strategies</span>
        </div>

        <div className="bg-[#13152C] border border-[#2C315E] p-5 rounded-[4px] shadow-sm">
          <span className="font-cinzel text-[9px] uppercase tracking-wider text-white/60 block font-bold">
            Average Rate Yield
          </span>
          <p className="font-editorial text-3xl text-white mt-2">
            {ratePlans.length > 0
              ? (
                  (ratePlans.reduce((acc, p) => acc + p.rate_multiplier, 0) / ratePlans.length) *
                  100
                ).toFixed(0) + '%'
              : '100%'}
          </p>
          <span className="text-[11px] text-white/50 mt-1 block">Relative to base room rate</span>
        </div>

        <div className="bg-[#13152C] border border-[#2C315E] p-5 rounded-[4px] shadow-sm">
          <span className="font-cinzel text-[9px] uppercase tracking-wider text-white/60 block font-bold">
            Package Inclusions
          </span>
          <p className="font-editorial text-3xl text-[#DFB76C] mt-2">
            {ratePlans.reduce((acc, p) => acc + (p.inclusions?.length || 0), 0)}
          </p>
          <span className="text-[11px] text-white/50 mt-1 block">Active amenities bundled</span>
        </div>

        <div className="bg-[#13152C] border border-[#2C315E] p-5 rounded-[4px] shadow-sm">
          <span className="font-cinzel text-[9px] uppercase tracking-wider text-[#2D5A40] block font-bold">
            Stay Guardrails Active
          </span>
          <p className="font-editorial text-3xl text-[#2D5A40] mt-2">
            {ratePlans.filter((p) => p.restrictions?.min_los > 1 || p.restrictions?.closed_to_arrival).length}
          </p>
          <span className="text-[11px] text-white/50 mt-1 block">Plans enforcing MinLOS or CTA</span>
        </div>
      </div>

      {/* Main Grid: Rate Plans Cards & Stay Restriction Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rate Plans List (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#2C315E]">
            <h2 className="font-editorial text-xl text-white">Rate Plans for Selected Estate</h2>
            <span className="font-cinzel text-[10px] text-[#DFB76C] uppercase tracking-wider font-bold">
              {ratePlans.length} active configurations
            </span>
          </div>

          {loading ? (
            <LoadingSpinner text="Retrieving rate plans & restrictions..." />
          ) : ratePlans.length === 0 ? (
            <div className="p-12 text-center text-xs text-white/50 bg-[#13152C] border border-[#2C315E] rounded">
              No rate plans found for this property. Click "New Rate Plan" to create one.
            </div>
          ) : (
            <div className="space-y-4">
              {ratePlans.map((plan) => {
                const multiplierPct = ((plan.rate_multiplier - 1.0) * 100).toFixed(0);
                return (
                  <div
                    key={plan.id}
                    className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-5 shadow-xs hover:border-[#DFB76C] transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-cinzel text-xs font-bold text-white">{plan.name}</span>
                          <span className="px-2 py-0.5 rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] font-cinzel text-[9px] font-bold text-[#DFB76C]">
                            {plan.code}
                          </span>
                          {plan.is_default && (
                            <span className="px-2 py-0.5 rounded-[2px] bg-[#EBF7EE] text-[#2D5A40] border border-[#2D5A40]/30 font-cinzel text-[9px] font-bold">
                              PRIMARY BAR
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-[2px] bg-[#1B1E3D] text-white/70 text-[9px] font-cinzel">
                            {plan.meal_plan.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-white/70 mt-1">{plan.description}</p>
                      </div>

                      {/* Pricing Tag */}
                      <div className="text-right shrink-0">
                        <span
                          className={`font-editorial text-xl font-bold ${
                            plan.rate_multiplier < 1.0
                              ? 'text-[#2D5A40]'
                              : plan.rate_multiplier > 1.0
                              ? 'text-[#DFB76C]'
                              : 'text-white'
                          }`}
                        >
                          {multiplierPct > 0 ? `+${multiplierPct}%` : multiplierPct < 0 ? `${multiplierPct}%` : 'Base Rate'}
                        </span>
                        <span className="block text-[10px] text-white/50 font-cinzel font-bold">
                          {plan.rate_multiplier}x multiplier
                        </span>
                      </div>
                    </div>

                    {/* Restrictions & Inclusions Badges */}
                    <div className="pt-2 border-t border-[#2C315E] flex items-center justify-between gap-4 flex-wrap text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* MinLOS */}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#1B1E3D] border border-[#2C315E] text-[10px] font-cinzel font-semibold text-white/80">
                          <Clock className="w-3 h-3 text-[#DFB76C]" />
                          Min {plan.restrictions?.min_los || 1} night(s)
                        </span>

                        {/* CTA / CTD */}
                        {plan.restrictions?.closed_to_arrival && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 border border-red-200 text-[10px] font-cinzel font-bold text-red-700">
                            <Ban className="w-3 h-3" /> Closed to Arrival (CTA)
                          </span>
                        )}
                        {plan.restrictions?.closed_to_departure && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 border border-red-200 text-[10px] font-cinzel font-bold text-red-700">
                            <Ban className="w-3 h-3" /> Closed to Departure (CTD)
                          </span>
                        )}

                        {/* Inclusions count */}
                        {plan.inclusions?.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EBF7EE] border border-[#2D5A40]/30 text-[10px] font-cinzel font-bold text-[#2D5A40]">
                            <Sparkles className="w-3 h-3" />
                            {plan.inclusions.length} bundled perk(s)
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(plan)}
                          className="p-1.5 rounded text-white/60 hover:text-white hover:bg-[#1B1E3D] transition-colors cursor-pointer"
                          title="Edit Rate Plan & Restrictions"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!plan.is_default && (
                          <button
                            onClick={() => handleDelete(plan.id, plan.name)}
                            className="p-1.5 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Rate Plan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Stay Restriction & Yield Simulator */}
        <div className="space-y-4">
          <div className="bg-[#13152C] border border-[#2C315E] rounded-[4px] p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#2C315E]">
              <div className="w-8 h-8 rounded-[2px] bg-[#1B1E3D] border border-[#2C315E] text-[#DFB76C] flex items-center justify-center font-bold">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-editorial text-lg text-white">Stay Restrictions Tester</h3>
                <p className="text-[11px] text-white/50">Simulate booking engine validation & yield</p>
              </div>
            </div>

            <form onSubmit={handleTestStay} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase tracking-wider mb-1">
                  Target Rate Plan
                </label>
                <select
                  value={testPlanId}
                  onChange={(e) => setTestPlanId(e.target.value)}
                  className="w-full bg-[#1B1E3D] border border-[#2C315E] px-3 py-2 rounded focus:outline-none"
                >
                  {ratePlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase tracking-wider mb-1">
                    Check-In Date
                  </label>
                  <input
                    type="date"
                    required
                    value={testCheckIn}
                    onChange={(e) => setTestCheckIn(e.target.value)}
                    className="w-full bg-[#1B1E3D] border border-[#2C315E] px-2.5 py-1.5 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase tracking-wider mb-1">
                    Check-Out Date
                  </label>
                  <input
                    type="date"
                    required
                    value={testCheckOut}
                    onChange={(e) => setTestCheckOut(e.target.value)}
                    className="w-full bg-[#1B1E3D] border border-[#2C315E] px-2.5 py-1.5 rounded focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase tracking-wider mb-1">
                  Base Room Nightly Rate ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={testBaseRate}
                  onChange={(e) => setTestBaseRate(e.target.value)}
                  className="w-full bg-[#1B1E3D] border border-[#2C315E] px-3 py-1.5 rounded focus:outline-none font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={testingStay}
                className="w-full btn-luxury py-2 text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{testingStay ? 'Evaluating...' : 'Run Stay Restriction Audit'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Test Results Output */}
            {testResult && (
              <div
                className={`p-4 rounded-[2px] border text-xs space-y-3 ${
                  testResult.is_valid
                    ? 'bg-[#EBF7EE] border-[#2D5A40]/30 text-[#2D5A40]'
                    : 'bg-[#1B1E3D] border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-center gap-2 font-bold font-cinzel text-xs">
                  {testResult.is_valid ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#2D5A40]" />
                      <span>Stay Approved — No Restrictions Violated</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Stay Blocked by Restrictions</span>
                    </>
                  )}
                </div>

                {!testResult.is_valid && (
                  <ul className="list-disc list-inside space-y-1 text-[11px] font-sans">
                    {testResult.violations.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                )}

                {testResult.is_valid && (
                  <div className="space-y-1 pt-2 border-t border-[#2D5A40]/20 text-[11px] font-sans">
                    <div className="flex justify-between">
                      <span>Total Nights:</span>
                      <span className="font-bold">{testResult.nights} night(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Yielded Nightly Rate:</span>
                      <span className="font-bold">₹{testResult.calculated_nightly_rate?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Package Amenities Included:</span>
                      <span className="font-bold">₹{testResult.inclusions_value?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 border-t border-[#2D5A40]/20 text-xs">
                      <span>Estimated Stay Total:</span>
                      <span>₹{testResult.total_estimated_amount?.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE / EDIT RATE PLAN MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#13152C]/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#1B1E3D] border border-[#2C315E] rounded-[4px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-white my-auto">
            <div className="px-6 py-4 bg-[#13152C] border-b border-[#2C315E] flex items-center justify-between">
              <h2 className="font-editorial text-xl font-bold text-white">
                {editingPlan ? 'Edit Rate Plan & Stay Restrictions' : 'Create New Rate Plan'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-xs font-cinzel text-white/60 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase tracking-wider mb-1">
                    Rate Plan Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BAR, NON_REF, BB_PKG"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full bg-[#13152C] border border-[#2C315E] px-3 py-2 rounded font-cinzel font-bold uppercase focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase tracking-wider mb-1">
                    Plan Display Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bed & Breakfast Delight"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#13152C] border border-[#2C315E] px-3 py-2 rounded focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-cinzel font-bold text-white/70 uppercase tracking-wider mb-1">
                  Marketing Description & Terms
                </label>
                <textarea
                  rows="2"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describes inclusions, cancellation flexibility, and guest benefits."
                  className="w-full bg-[#13152C] border border-[#2C315E] px-3 py-2 rounded focus:outline-none"
                />
              </div>

              {/* Pricing Rules */}
              <div className="p-4 bg-[#13152C] border border-[#2C315E] rounded space-y-3">
                <span className="font-cinzel text-[10px] font-bold text-[#DFB76C] uppercase tracking-wider block">
                  Yield Pricing Mechanics
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-cinzel font-semibold text-white/70 mb-1">
                      Rate Multiplier
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formMultiplier}
                      onChange={(e) => setFormMultiplier(e.target.value)}
                      className="w-full bg-[#1B1E3D] border border-[#2C315E] px-2 py-1.5 rounded font-bold"
                    />
                    <span className="text-[10px] text-white/50 mt-0.5 block">1.0 = Base, 0.85 = -15%</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-cinzel font-semibold text-white/70 mb-1">
                      Meal Plan
                    </label>
                    <select
                      value={formMealPlan}
                      onChange={(e) => setFormMealPlan(e.target.value)}
                      className="w-full bg-[#1B1E3D] border border-[#2C315E] px-2 py-1.5 rounded text-xs"
                    >
                      <option value="ROOM_ONLY">Room Only</option>
                      <option value="BED_AND_BREAKFAST">Bed & Breakfast</option>
                      <option value="HALF_BOARD">Half Board</option>
                      <option value="FULL_BOARD">Full Board</option>
                      <option value="ALL_INCLUSIVE">All Inclusive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-cinzel font-semibold text-white/70 mb-1">
                      Cancellation Policy
                    </label>
                    <select
                      value={formCancellation}
                      onChange={(e) => setFormCancellation(e.target.value)}
                      className="w-full bg-[#1B1E3D] border border-[#2C315E] px-2 py-1.5 rounded text-xs"
                    >
                      <option value="FLEXIBLE_24H">Flexible 24h</option>
                      <option value="FLEXIBLE_48H">Flexible 48h</option>
                      <option value="MODERATE_7D">Moderate 7 Days</option>
                      <option value="NON_REFUNDABLE">Non-Refundable</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Stay Restrictions (MinLOS, MaxLOS, CTA, CTD) */}
              <div className="p-4 bg-[#13152C] border border-[#2C315E] rounded space-y-3">
                <span className="font-cinzel text-[10px] font-bold text-[#DFB76C] uppercase tracking-wider block">
                  Stay Restrictions & Guardrails
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-cinzel font-semibold text-white/70 mb-1">
                      Min Length of Stay (MinLOS)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formMinLOS}
                      onChange={(e) => setFormMinLOS(e.target.value)}
                      className="w-full bg-[#1B1E3D] border border-[#2C315E] px-2 py-1.5 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-cinzel font-semibold text-white/70 mb-1">
                      Max Length of Stay (MaxLOS)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formMaxLOS}
                      onChange={(e) => setFormMaxLOS(e.target.value)}
                      className="w-full bg-[#1B1E3D] border border-[#2C315E] px-2 py-1.5 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-cinzel font-semibold text-white/70 mb-1">
                      Min Advance Booking (Days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formMinAdvance}
                      onChange={(e) => setFormMinAdvance(e.target.value)}
                      className="w-full bg-[#1B1E3D] border border-[#2C315E] px-2 py-1.5 rounded"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formCTA}
                      onChange={(e) => setFormCTA(e.target.checked)}
                      className="rounded border-[#2C315E] text-[#DFB76C] focus:ring-0"
                    />
                    <span className="font-cinzel text-[10px] font-bold">Closed to Arrival (CTA)</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formCTD}
                      onChange={(e) => setFormCTD(e.target.checked)}
                      className="rounded border-[#2C315E] text-[#DFB76C] focus:ring-0"
                    />
                    <span className="font-cinzel text-[10px] font-bold">Closed to Departure (CTD)</span>
                  </label>
                </div>
              </div>

              {/* Package Inclusions */}
              <div className="p-4 bg-[#13152C] border border-[#2C315E] rounded space-y-3">
                <span className="font-cinzel text-[10px] font-bold text-[#DFB76C] uppercase tracking-wider block">
                  Bundled Package Inclusions
                </span>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Inclusion Name (e.g. Airport Limousine)"
                    value={newIncName}
                    onChange={(e) => setNewIncName(e.target.value)}
                    className="flex-1 bg-[#1B1E3D] border border-[#2C315E] px-3 py-1.5 rounded text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Value (₹)"
                    value={newIncVal}
                    onChange={(e) => setNewIncVal(e.target.value)}
                    className="w-24 bg-[#1B1E3D] border border-[#2C315E] px-3 py-1.5 rounded text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddInclusion}
                    className="btn-luxury-secondary text-xs py-1.5 px-3 cursor-pointer"
                  >
                    + Add
                  </button>
                </div>

                {inclusions.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {inclusions.map((inc, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded bg-[#1B1E3D] border border-[#2C315E] text-[11px]"
                      >
                        <span className="font-medium text-white">{inc.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#DFB76C]">₹{inc.value?.toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveInclusion(i)}
                            className="text-red-500 hover:text-red-700 cursor-pointer font-bold"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2C315E]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-luxury-secondary text-xs py-2 px-4 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-luxury text-xs py-2 px-6 cursor-pointer"
                >
                  {submitting ? 'Saving Plan...' : editingPlan ? 'Update Rate Plan' : 'Create Rate Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RatePlanManager;
