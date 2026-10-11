import React, { useState } from 'react';
import { useGreenPulse } from '../context/GreenPulseContext';
import { APPLIANCE_PRESETS, REGIONAL_TARIFFS } from '../data/initialData';
import { EnergyLog } from '../types';
import {
  Zap,
  Plus,
  Trash2,
  DollarSign,
  CloudRain,
  Info,
  Clock,
  Sliders,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingDown,
  ArrowLeft,
} from 'lucide-react';

export const EnergyTrackerView: React.FC = () => {
  const { energyLogs, addEnergyLog, removeEnergyLog, userSettings, totalMonthlyKwh, totalMonthlyCost, triggerConfetti, setActiveTab } =
    useGreenPulse();

  const [applianceName, setApplianceName] = useState('Central Inverter AC (1.5 Ton)');
  const [category, setCategory] = useState<EnergyLog['category']>('HVAC');
  const [wattage, setWattage] = useState(1400);
  const [hoursPerDay, setHoursPerDay] = useState(6);
  const [daysPerWeek, setDaysPerWeek] = useState(7);
  const [justAdded, setJustAdded] = useState(false);

  // Real-time calculation logic
  const monthlyHours = (hoursPerDay * daysPerWeek * 52) / 12;
  const calculatedMonthlyKwh = Number(((wattage * monthlyHours) / 1000).toFixed(1));
  const calculatedMonthlyCost = Number((calculatedMonthlyKwh * userSettings.tariffRate).toFixed(2));
  const calculatedMonthlyCo2e = Number((calculatedMonthlyKwh * userSettings.gridCarbonFactor).toFixed(1));

  const handlePresetSelect = (preset: (typeof APPLIANCE_PRESETS)[0]) => {
    setApplianceName(preset.name);
    setCategory(preset.category);
    setWattage(preset.watts);
    setHoursPerDay(preset.hours);
    setDaysPerWeek(preset.days);
  };

  const handleAddAppliance = () => {
    if (!applianceName.trim() || wattage <= 0) return;

    addEnergyLog({
      appliance: applianceName.trim(),
      category,
      wattage,
      hoursPerDay,
      daysPerWeek,
      monthlyKwh: calculatedMonthlyKwh,
      monthlyCost: calculatedMonthlyCost,
      monthlyCo2eKg: calculatedMonthlyCo2e,
      ecoTip: getEcoTip(applianceName, wattage),
    });

    setJustAdded(true);
    triggerConfetti();
    setTimeout(() => setJustAdded(false), 2000);
  };

  const getEcoTip = (name: string, watts: number) => {
    const lower = name.toLowerCase();
    if (lower.includes('ac') || lower.includes('air conditioner')) {
      return 'Raising cooling setpoint by just 1°C saves ~6% electricity. Clean filters every 3 weeks.';
    }
    if (lower.includes('water heater') || lower.includes('geyser')) {
      return 'Insulate your tank and drop thermostat to 120°F (49°C) to prevent standby thermal loss.';
    }
    if (lower.includes('tv') || lower.includes('console') || lower.includes('pc')) {
      return 'Entertainment gear draws 5W-25W idle phantom power. Use a smart switch to cut vampire drain.';
    }
    if (lower.includes('refrigerator')) {
      return 'Keep condenser coils dust-free and maintain 37°F (3°C) fresh food / 0°F (-18°C) freezer.';
    }
    return `Operating this ${watts}W device for 1 fewer hour per day saves ~${((watts * 30.5) / 1000).toFixed(1)} kWh monthly!`;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header with Back Navigation */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Homepage</span>
        </button>
        <span className="text-slate-300">/</span>
        <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 font-mono">
          Appliance Power & Tariffs
        </span>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono block">
            Grid Tariffs & Power Baseline
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Appliance Energy & Vampire Auditor
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md">
          Calculate appliance kilowatt-hours, monthly utility expense, and grid CO₂e emissions with fully transparent formulas and localized tariffs.
        </p>
      </div>

      {/* Main Grid: Calculator & Formula Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form & Presets (7 cols) */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-700" />
            <span>Appliance Specification</span>
          </h3>

          {/* Presets Carousel */}
          <div>
            <span className="text-xs text-slate-500 font-bold block mb-2 font-mono">
              Popular Household Presets:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {APPLIANCE_PRESETS.map((p) => {
                const isSelected = applianceName === p.name;
                return (
                  <button
                    key={p.name}
                    onClick={() => handlePresetSelect(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {p.name} ({p.watts}W)
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Appliance Name
              </label>
              <input
                type="text"
                value={applianceName}
                onChange={(e) => setApplianceName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-800 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EnergyLog['category'])}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-slate-800 focus:bg-white"
              >
                <option value="HVAC">HVAC & Climate</option>
                <option value="Kitchen">Kitchen & Cooking</option>
                <option value="Computing">Computing & Work</option>
                <option value="Transport">EV & Transport</option>
                <option value="Laundry">Laundry & Cleaning</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Lighting">Lighting</option>
                <option value="Other">Other / Standby</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Power Rating (Watts)
              </label>
              <input
                type="number"
                min="1"
                step="5"
                value={wattage}
                onChange={(e) => setWattage(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-800 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Daily Hours
              </label>
              <input
                type="number"
                min="0.1"
                max="24"
                step="0.5"
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-800 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Days / Week
              </label>
              <input
                type="number"
                min="1"
                max="7"
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(parseInt(e.target.value) || 7)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-800 focus:bg-white"
              />
            </div>
          </div>

          <button
            onClick={handleAddAppliance}
            className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all ${
              justAdded
                ? 'bg-slate-200 text-slate-700 border border-slate-300'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {justAdded ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Appliance Logged to Active Ledger (+20 XP)</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Log Appliance to My Active Tracker</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Mathematical Projection Card (5 cols) */}
        <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono">
              Monthly Calculation
            </span>
            <span className="bg-white border border-slate-200 text-slate-800 px-2.5 py-0.5 rounded-full text-xs font-bold">
              {category}
            </span>
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-slate-900">{applianceName}</h3>
            <span className="text-xs text-slate-500">{wattage}W operated {hoursPerDay}h/day ({daysPerWeek}d/wk)</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-2xs">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Energy</span>
              <strong className="text-base font-extrabold text-slate-900 font-mono">{calculatedMonthlyKwh}</strong>
              <span className="text-[10px] text-slate-500 block">kWh / mo</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-2xs">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Cost</span>
              <strong className="text-base font-extrabold text-slate-900 font-mono">
                {userSettings.currency}{calculatedMonthlyCost}
              </strong>
              <span className="text-[10px] text-slate-500 block">/ mo</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-2xs">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Grid CO₂e</span>
              <strong className="text-base font-extrabold text-slate-900 font-mono">{calculatedMonthlyCo2e}</strong>
              <span className="text-[10px] text-slate-500 block">kg CO₂e</span>
            </div>
          </div>

          {/* Formula explainer */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 font-mono">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>Transparent Math Formula:</span>
            </span>
            <div className="font-mono text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <p>kWh = ({wattage}W × {hoursPerDay}h × {daysPerWeek}d × 4.33w) ÷ 1000 = <strong>{calculatedMonthlyKwh} kWh</strong></p>
              <p>Cost = {calculatedMonthlyKwh} kWh × {userSettings.currency}{userSettings.tariffRate} = <strong>{userSettings.currency}{calculatedMonthlyCost}</strong></p>
              <p>CO₂e = {calculatedMonthlyKwh} kWh × {userSettings.gridCarbonFactor} kg/kWh = <strong>{calculatedMonthlyCo2e} kg CO₂e</strong></p>
            </div>
          </div>

          {/* Eco Tip */}
          <div className="bg-white border border-slate-200 p-3.5 rounded-xl text-xs text-slate-700 flex items-start gap-2.5 shadow-2xs">
            <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900 mb-0.5">Energy Reduction Advice:</strong>
              <p className="text-[11px] leading-relaxed text-slate-600">{getEcoTip(applianceName, wattage)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tracked Appliances Ledger */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-slate-700" />
            <span>Active Tracked Appliances ({energyLogs.length})</span>
          </h3>
          <span className="text-xs font-bold text-slate-500 font-mono">
            Total: {totalMonthlyKwh} kWh/mo • {userSettings.currency}{totalMonthlyCost}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 font-mono">
              <tr>
                <th className="p-3">Appliance</th>
                <th className="p-3">Category</th>
                <th className="p-3">Rating</th>
                <th className="p-3">Usage</th>
                <th className="p-3">Monthly kWh</th>
                <th className="p-3">Est. Cost</th>
                <th className="p-3">Grid CO₂e</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {energyLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{log.appliance}</td>
                  <td className="p-3">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold font-mono border border-slate-200">
                      {log.category}
                    </span>
                  </td>
                  <td className="p-3 font-mono">{log.wattage}W</td>
                  <td className="p-3 text-slate-500">
                    {log.hoursPerDay}h/day ({log.daysPerWeek}d/wk)
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-900">{log.monthlyKwh}</td>
                  <td className="p-3 font-mono font-bold text-slate-900">
                    {userSettings.currency}{log.monthlyCost}
                  </td>
                  <td className="p-3 font-mono text-slate-700 font-bold">{log.monthlyCo2eKg} kg</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => removeEnergyLog(log.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
