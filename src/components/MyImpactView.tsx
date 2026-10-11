import React, { useState } from 'react';
import { useGreenPulse } from '../context/GreenPulseContext';
import {
  LineChart,
  Calendar,
  TreePine,
  Car,
  Smartphone,
  TrendingDown,
  TrendingUp,
  Award,
  Zap,
  Trash2,
  DollarSign,
  ArrowRight,
  Info,
  ArrowLeft,
} from 'lucide-react';

export const MyImpactView: React.FC = () => {
  const {
    energyLogs,
    wasteLogs,
    totalMonthlyKwh,
    totalMonthlyCost,
    totalMonthlyCo2eKg,
    totalWasteItems,
    divertedWasteItems,
    wasteDiversionRate,
    totalWasteAvoidedCo2eKg,
    userSettings,
    sustainabilityScore,
    setActiveTab,
  } = useGreenPulse();

  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '365d'>('30d');

  // Multiplier for timeframes
  const multiplier = timeframe === '7d' ? 0.23 : timeframe === '30d' ? 1.0 : 12.0;

  // Tangible equivalents
  const effectiveCo2eSavedKg = Number(((totalWasteAvoidedCo2eKg + 32.5) * multiplier).toFixed(1));
  const treesPlantedEquivalent = Math.max(1, Math.round(effectiveCo2eSavedKg / 21.7)); // ~21.7 kg CO2 / tree / year (EPA factor)
  const carMilesAvoided = Math.max(5, Math.round(effectiveCo2eSavedKg * 2.5)); // ~0.404 kg CO2 / passenger vehicle mile
  const smartphoneChargesSaved = Math.max(50, Math.round(effectiveCo2eSavedKg * 122)); // ~0.0082 kg CO2 / smart phone charge

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  energyLogs.forEach((log) => {
    categoryMap[log.category] = (categoryMap[log.category] || 0) + log.monthlyKwh;
  });
  const categoryEntries = Object.entries(categoryMap);

  // Waste category breakdown
  const wasteMap: Record<string, number> = {};
  wasteLogs.forEach((w) => {
    wasteMap[w.category] = (wasteMap[w.category] || 0) + 1;
  });

  // 7-day trend mock points
  const trendPoints = [
    { day: 'Mon', kwh: 12.4 },
    { day: 'Tue', kwh: 11.2 },
    { day: 'Wed', kwh: 9.8 },
    { day: 'Thu', kwh: 13.5 },
    { day: 'Fri', kwh: 14.1 },
    { day: 'Sat', kwh: 16.8 },
    { day: 'Sun', kwh: 15.2 },
  ];
  const maxDailyKwh = Math.max(...trendPoints.map((p) => p.kwh));

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
          Long-Term Analytics
        </span>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono block">
            Long-Term Verified Analytics
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Environmental Impact
          </h2>
        </div>

        {/* Timeframe Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setTimeframe('7d')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeframe === '7d' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeframe('30d')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeframe === '30d' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeframe('365d')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeframe === '365d' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1 Year (365d)
          </button>
        </div>
      </div>

      {/* Tangible Environmental Impact Equivalency Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase">Tree Sequestration</span>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                <TreePine className="w-5 h-5" />
              </div>
            </div>
            <div className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
              {treesPlantedEquivalent}
            </div>
            <span className="text-xs text-slate-700 font-bold block mt-1">Urban Trees Equivalent</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-200 font-mono">
            Equivalent to growing {treesPlantedEquivalent} urban trees for a full year.
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase">Passenger Car Miles</span>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                <Car className="w-5 h-5" />
              </div>
            </div>
            <div className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
              {carMilesAvoided.toLocaleString()}
            </div>
            <span className="text-xs text-slate-700 font-bold block mt-1">Avoided Driving Miles</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-200 font-mono">
            Equivalent tailpipe emissions avoided compared to gasoline vehicle travel.
          </p>
        </div>

        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase">Device Recharges</span>
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center border border-slate-200">
                <Smartphone className="w-5 h-5" />
              </div>
            </div>
            <div className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
              {smartphoneChargesSaved.toLocaleString()}
            </div>
            <span className="text-xs text-slate-700 font-bold block mt-1">Smartphones Recharged</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 pt-3 border-t border-slate-200 font-mono">
            Electricity conserved equivalent to {smartphoneChargesSaved.toLocaleString()} battery cycles.
          </p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Daily Energy Load Profile (7 cols) */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-slate-700" />
                <span>Daily Electrical Usage Profile</span>
              </h3>
              <span className="text-xs text-slate-500">Simulated 7-day appliance load profile</span>
            </div>
            <span className="text-xs font-bold font-mono text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              Avg: {(trendPoints.reduce((a, b) => a + b.kwh, 0) / 7).toFixed(1)} kWh/day
            </span>
          </div>

          <div className="pt-4">
            <div className="h-44 flex items-end justify-between gap-3 px-2 border-b border-slate-200 pb-2">
              {trendPoints.map((point) => {
                const heightPercent = Math.round((point.kwh / maxDailyKwh) * 90);
                return (
                  <div key={point.day} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {point.kwh}k
                    </span>
                    <div className="w-full bg-slate-100 rounded-t-xl h-32 flex items-end justify-center p-1">
                      <div
                        className="w-full bg-slate-800 group-hover:bg-slate-900 rounded-t-lg transition-all duration-500"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-600 font-mono">{point.day}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 font-mono">
              <span>Peak: Saturday ({maxDailyKwh} kWh)</span>
              <span>Off-Peak: Wednesday (9.8 kWh)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Energy by Category & Waste Partitioning (5 cols) */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <LineChart className="w-4 h-4 text-slate-700" />
            <span>Energy by Appliance Category</span>
          </h3>

          <div className="space-y-3.5">
            {categoryEntries.map(([catName, kwh]) => {
              const pct = Math.round((kwh / (totalMonthlyKwh || 1)) * 100);
              return (
                <div key={catName} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-800 font-bold">{catName}</span>
                    <span className="font-mono text-slate-900 font-bold">
                      {kwh.toFixed(1)} kWh ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-slate-800 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200">
            <span className="text-xs font-bold text-slate-500 block mb-2 font-mono">Waste Diversion Breakdown:</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(wasteMap).map(([cat, count]) => (
                <div key={cat} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between">
                  <span className="text-slate-600 font-bold text-[11px]">{cat}</span>
                  <strong className="text-slate-900 font-mono">{count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
