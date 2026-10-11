import React, { useState } from 'react';
import { useGreenPulse } from '../context/GreenPulseContext';
import {
  Zap,
  Trash2,
  TrendingDown,
  Target,
  ArrowRight,
  Flame,
  Award,
  Sparkles,
  CheckCircle2,
  Scan,
  Compass,
  DollarSign,
  CloudSun,
  ShieldCheck,
  Bot,
  Car,
  Home,
  RefreshCw,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    sustainabilityScore,
    streakDays,
    userLevel,
    levelXpProgress,
    totalMonthlyKwh,
    totalMonthlyCost,
    totalMonthlyCo2eKg,
    totalWasteItems,
    divertedWasteItems,
    wasteDiversionRate,
    totalWasteAvoidedCo2eKg,
    missions,
    wasteLogs,
    energyLogs,
    setActiveTab,
    userSettings,
    toggleMission,
    setDemoStep,
    totalXp,
  } = useGreenPulse();

  // Quick Footprint interactive state
  const [distanceKm, setDistanceKm] = useState(120);
  const [vehicleMileage, setVehicleMileage] = useState(15);
  const [fuelType, setFuelType] = useState<'petrol' | 'diesel'>('petrol');
  const [electricityKwh, setElectricityKwh] = useState(totalMonthlyKwh > 0 ? Math.round(totalMonthlyKwh / 4.33) : 25);
  const [lpgKg, setLpgKg] = useState(1.2);
  const [foodWasteKg, setFoodWasteKg] = useState(2.0);
  const [dryWasteKg, setDryWasteKg] = useState(3.0);
  const [recycledKg, setRecycledKg] = useState(1.0);
  const [compostKg, setCompostKg] = useState(0.8);
  const [householdPeople, setHouseholdPeople] = useState(4);
  const [calcCalculated, setCalcCalculated] = useState(true);

  // Math calculation
  const fuelFactor = fuelType === 'petrol' ? 2.31 : 2.68;
  const fuelLiters = Number((distanceKm / Math.max(1, vehicleMileage)).toFixed(2));
  const vehicleCo2Weekly = Number((fuelLiters * fuelFactor).toFixed(2));
  const electricityCo2Weekly = Number((electricityKwh * userSettings.gridCarbonFactor).toFixed(2));
  const lpgCo2Weekly = Number((lpgKg * 2.98).toFixed(2));
  const totalWeeklyCo2 = Number((vehicleCo2Weekly + electricityCo2Weekly + lpgCo2Weekly).toFixed(2));
  const perPersonCo2 = Number((totalWeeklyCo2 / Math.max(1, householdPeople)).toFixed(2));
  const maxBar = Math.max(vehicleCo2Weekly, electricityCo2Weekly, lpgCo2Weekly, 0.1);

  const completedMissionsCount = missions.filter((m) => m.completed).length;

  return (
    <div className="space-y-12">
      {/* 1. EcoTrack Hero Section */}
      <section className="relative overflow-hidden -mx-4 sm:-mx-6 -mt-6 sm:-mt-8 px-4 sm:px-6 py-12 sm:py-16 eco-hero-bg">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Content (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 bg-white border border-[#d7e9d2] text-[#20563b] rounded-full px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wider shadow-2xs">
              <span>🍃</span>
              <span>Your Everyday AI Sustainability Companion</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold text-[#153e2b] tracking-[-2.2px] leading-[1.04]">
              Small actions.<br />
              <span className="text-[#2f8152]">A greener tomorrow.</span>
            </h1>

            <p className="text-[#5f7365] text-base sm:text-lg max-w-xl leading-relaxed">
              Understand the footprint of your household energy and solid waste, classify items with multimodal AI vision, and build an unbroken streak of sustainable habits—one day at a time.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  const el = document.getElementById('quick-calculator');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-[#153e2b] hover:bg-[#20563b] text-white font-bold text-sm px-5 py-3 rounded-xl shadow-md transition-all hover:-translate-y-0.5 flex items-center gap-2"
              >
                <span>Calculate my footprint</span>
                <span>&rarr;</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('waste');
                  setDemoStep(3);
                }}
                className="bg-white hover:bg-[#f3faf0] text-[#153e2b] border border-[#d8e5d6] font-bold text-sm px-5 py-3 rounded-xl shadow-2xs transition-all hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Scan className="w-4 h-4 text-[#2f8152]" />
                <span>Explore AI Waste Guide</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('coach');
                  setDemoStep(4);
                }}
                className="bg-[#c8ef83] hover:bg-[#bce673] text-[#153e2b] font-extrabold text-sm px-4 py-3 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-[#153e2b]" />
                <span>Ask AI Coach</span>
              </button>
            </div>

            <div className="flex items-center gap-3 pt-4 text-xs text-[#607567] font-medium">
              <div className="flex -space-x-1.5">
                <span className="w-7 h-7 rounded-full bg-[#d6eacb] border-2 border-[#f5faef] flex items-center justify-center text-xs">🌱</span>
                <span className="w-7 h-7 rounded-full bg-[#d6eacb] border-2 border-[#f5faef] flex items-center justify-center text-xs">♻️</span>
                <span className="w-7 h-7 rounded-full bg-[#d6eacb] border-2 border-[#f5faef] flex items-center justify-center text-xs">⚡</span>
              </div>
              <span>Track · Understand · Act · Measure · Improve</span>
            </div>
          </div>

          {/* Right Hero Card: Impact Dashboard Preview (5 cols) */}
          <div className="lg:col-span-5">
            <aside className="eco-card-gradient text-white rounded-[26px] p-6 sm:p-7 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <small className="text-[#b9d7bd] font-bold uppercase tracking-wider text-[10px] block">
                    Your Impact Dashboard
                  </small>
                  <strong className="text-lg font-extrabold text-white block mt-0.5">
                    EcoQuest Score: {sustainabilityScore} / 100
                  </strong>
                </div>
                <div className="w-11 h-11 rounded-[14px] bg-[#c8ef83] text-[#153e2b] flex items-center justify-center text-xl font-extrabold">
                  ✦
                </div>
              </div>

              <div className="my-6">
                <div className="text-5xl font-extrabold tracking-[-2px] text-white">
                  {streakDays} <small className="text-base text-[#c2ddc5] font-semibold tracking-normal">day streak</small>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-[#c8ef83] rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, (streakDays / 7) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-[#bdd5c0] mt-2 font-medium">
                  <span>Day 7 unlocks your AI appreciation letter</span>
                  <span className="font-bold text-[#c8ef83]">{Math.min(7, streakDays)} / 7</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-white/10 border border-white/10 rounded-2xl p-3.5">
                  <span className="text-xs text-[#bcd4bf] block">Weekly CO₂e Footprint</span>
                  <strong className="text-xl font-bold text-white block mt-0.5">{totalWeeklyCo2} kg</strong>
                </div>
                <div className="bg-white/10 border border-white/10 rounded-2xl p-3.5">
                  <span className="text-xs text-[#bcd4bf] block">Eco Rewards</span>
                  <strong className="text-xl font-bold text-[#c8ef83] block mt-0.5">{totalXp} XP</strong>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#c2ddc5]">
                <span>Waste Diversion: <strong className="text-white">{wasteDiversionRate}%</strong></span>
                <button
                  onClick={() => setActiveTab('missions')}
                  className="text-[#c8ef83] hover:underline font-bold"
                >
                  View streak missions &rarr;
                </button>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* 2. Core Feature Cards (Features section matching EcoTrack) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-[11px] font-extrabold text-[#2f8152] uppercase tracking-[1.6px] block">
              Your Sustainability Toolkit
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#153e2b] tracking-[-1px]">
              Better habits, made practical.
            </h2>
          </div>
          <p className="text-sm text-[#697c70] max-w-md">
            Start with three simple pillars: understand your weekly footprint, sort waste correctly with AI, and stay motivated with your personal streak.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {/* Card 1 */}
          <article className="bg-white p-6 rounded-[22px] border border-[#dfe9df] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-[15px] bg-[#e9f5e9] text-[#153e2b] flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                🌍
              </div>
              <h3 className="text-lg font-extrabold text-[#153e2b] mb-1.5">
                Carbon Footprint
              </h3>
              <p className="text-xs text-[#697c70] leading-relaxed mb-4">
                Estimate direct emissions from vehicle fuel, household electricity, and LPG, while tracking waste diversion alongside.
              </p>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById('quick-calculator');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-[#2f8152] hover:text-[#153e2b] font-extrabold text-xs flex items-center gap-1 self-start"
            >
              Open calculator ↗
            </button>
          </article>

          {/* Card 2 */}
          <article className="bg-white p-6 rounded-[22px] border border-[#dfe9df] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-[15px] bg-[#e9f5e9] text-[#153e2b] flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                ♻️
              </div>
              <h3 className="text-lg font-extrabold text-[#153e2b] mb-1.5">
                AI Waste Guide & Vision
              </h3>
              <p className="text-xs text-[#697c70] leading-relaxed mb-4">
                Upload or snap packaging photos. Gemini 3.8 Flash multimodal vision categorizes materials and stops stream contamination.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveTab('waste');
                setDemoStep(3);
              }}
              className="text-[#2f8152] hover:text-[#153e2b] font-extrabold text-xs flex items-center gap-1 self-start"
            >
              Classify an item ↗
            </button>
          </article>

          {/* Card 3 */}
          <article className="bg-white p-6 rounded-[22px] border border-[#dfe9df] shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-[15px] bg-[#e9f5e9] text-[#153e2b] flex items-center justify-center text-2xl mb-4 group-hover:scale-105 transition-transform">
                🏅
              </div>
              <h3 className="text-lg font-extrabold text-[#153e2b] mb-1.5">
                7-Day Eco Streak & Letter
              </h3>
              <p className="text-xs text-[#697c70] leading-relaxed mb-4">
                Check in daily for real sustainability actions. Day 7 unlocks a personalized, heartfelt appreciation letter crafted by AI.
              </p>
            </div>
            <button
              onClick={() => {
                setActiveTab('missions');
                setDemoStep(5);
              }}
              className="text-[#2f8152] hover:text-[#153e2b] font-extrabold text-xs flex items-center gap-1 self-start"
            >
              Build my streak ↗
            </button>
          </article>
        </div>
      </section>

      {/* 3. Footprint Calculator Panel (Feature 01 · Measure from EcoTrack) */}
      <section id="quick-calculator" className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <span className="text-[11px] font-extrabold text-[#2f8152] uppercase tracking-[1.6px] block">
              Feature 01 · Measure
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#153e2b] tracking-[-1px]">
              Your weekly household footprint.
            </h2>
          </div>
          <p className="text-sm text-[#697c70] max-w-md">
            Input approximate weekly usage for your home. Compare vehicle fuel, electricity kWh, and kitchen waste diversion in one unified view.
          </p>
        </div>

        <div className="bg-white border border-[#dfe9df] rounded-[26px] p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Fields (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Transport */}
              <div>
                <div className="flex items-center gap-2.5 text-sm font-extrabold text-[#153e2b] mb-3">
                  <span className="w-7 h-7 rounded-lg bg-[#e9f5e9] flex items-center justify-center text-base">🚗</span>
                  <span>Transport</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-[#314b39] mb-1">
                      Vehicle distance per week (km)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={distanceKm}
                      onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#fcfdfb] border border-[#d9e5d9] rounded-xl px-3 py-2 text-xs text-[#20352a] font-medium focus:outline-none focus:border-[#2f8152]"
                    />
                    <span className="text-[10px] text-[#839187] block mt-0.5">Weekly vehicle commuting distance</span>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#314b39] mb-1">
                      Vehicle mileage (km / litre)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={vehicleMileage}
                      onChange={(e) => setVehicleMileage(parseFloat(e.target.value) || 15)}
                      className="w-full bg-[#fcfdfb] border border-[#d9e5d9] rounded-xl px-3 py-2 text-xs text-[#20352a] font-medium focus:outline-none focus:border-[#2f8152]"
                    />
                    <span className="text-[10px] text-[#839187] block mt-0.5">Real-world fuel economy</span>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#314b39] mb-1">
                      Fuel type
                    </label>
                    <select
                      value={fuelType}
                      onChange={(e) => setFuelType(e.target.value as any)}
                      className="w-full bg-[#fcfdfb] border border-[#d9e5d9] rounded-xl px-3 py-2 text-xs text-[#20352a] font-medium focus:outline-none focus:border-[#2f8152]"
                    >
                      <option value="petrol">Petrol (2.31 kg CO₂/L)</option>
                      <option value="diesel">Diesel (2.68 kg CO₂/L)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#314b39] mb-1">
                      People in household
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={householdPeople}
                      onChange={(e) => setHouseholdPeople(parseInt(e.target.value) || 1)}
                      className="w-full bg-[#fcfdfb] border border-[#d9e5d9] rounded-xl px-3 py-2 text-xs text-[#20352a] font-medium focus:outline-none focus:border-[#2f8152]"
                    />
                    <span className="text-[10px] text-[#839187] block mt-0.5">Divides emissions per person</span>
                  </div>
                </div>
              </div>

              {/* Home Energy */}
              <div className="pt-2">
                <div className="flex items-center gap-2.5 text-sm font-extrabold text-[#153e2b] mb-3">
                  <span className="w-7 h-7 rounded-lg bg-[#e9f5e9] flex items-center justify-center text-base">🏠</span>
                  <span>Home Energy</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-[#314b39] mb-1">
                      Electricity used per week (kWh)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={electricityKwh}
                      onChange={(e) => setElectricityKwh(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#fcfdfb] border border-[#d9e5d9] rounded-xl px-3 py-2 text-xs text-[#20352a] font-medium focus:outline-none focus:border-[#2f8152]"
                    />
                    <span className="text-[10px] text-[#839187] block mt-0.5">Weekly units (Monthly bill ÷ 4.33)</span>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-[#314b39] mb-1">
                      LPG / Cooking gas per week (kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={lpgKg}
                      onChange={(e) => setLpgKg(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#fcfdfb] border border-[#d9e5d9] rounded-xl px-3 py-2 text-xs text-[#20352a] font-medium focus:outline-none focus:border-[#2f8152]"
                    />
                    <span className="text-[10px] text-[#839187] block mt-0.5">Domestic cylinder is ~14.2 kg</span>
                  </div>
                </div>
              </div>

              {/* Waste Habits */}
              <div className="pt-2">
                <div className="flex items-center gap-2.5 text-sm font-extrabold text-[#153e2b] mb-3">
                  <span className="w-7 h-7 rounded-lg bg-[#e9f5e9] flex items-center justify-center text-base">♻️</span>
                  <span>Waste Habits (Tracked Separately)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-[#314b39] mb-1">
                      Food waste (kg/wk)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={foodWasteKg}
                      onChange={(e) => setFoodWasteKg(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#fcfdfb] border border-[#d9e5d9] rounded-xl px-2.5 py-1.5 text-xs text-[#20352a]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-[#314b39] mb-1">
                      Dry waste (kg/wk)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={dryWasteKg}
                      onChange={(e) => setDryWasteKg(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#fcfdfb] border border-[#d9e5d9] rounded-xl px-2.5 py-1.5 text-xs text-[#20352a]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-[#314b39] mb-1">
                      Recycled (kg/wk)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={recycledKg}
                      onChange={(e) => setRecycledKg(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#fcfdfb] border border-[#d9e5d9] rounded-xl px-2.5 py-1.5 text-xs text-[#20352a]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-[#314b39] mb-1">
                      Composted (kg/wk)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={compostKg}
                      onChange={(e) => setCompostKg(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#fcfdfb] border border-[#d9e5d9] rounded-xl px-2.5 py-1.5 text-xs text-[#20352a]"
                    />
                  </div>
                </div>
              </div>

              {/* Sample loader */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setDistanceKm(120);
                    setVehicleMileage(15);
                    setElectricityKwh(25);
                    setLpgKg(1.2);
                    setFoodWasteKg(2);
                    setDryWasteKg(3);
                    setRecycledKg(1);
                    setCompostKg(0.8);
                  }}
                  className="bg-[#f3faf0] hover:bg-[#e4f3df] text-[#20563b] border border-[#d2e7d2] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  Load sample values
                </button>
                <span className="text-xs text-[#697c70]">
                  Calculates direct fuel CO₂, electricity emissions, and LPG combustion.
                </span>
              </div>
            </div>

            {/* Sticky Educational Side Panel (4 cols) */}
            <div className="lg:col-span-4 bg-[#f3faf0] border border-[#dfeedd] rounded-[22px] p-6 space-y-4">
              <div className="w-11 h-11 rounded-[14px] bg-white text-[#2f8152] flex items-center justify-center text-xl shadow-2xs">
                🌿
              </div>
              <h3 className="font-extrabold text-base text-[#153e2b]">
                Measure to improve
              </h3>
              <p className="text-xs text-[#697c70] leading-relaxed">
                The number is a starting point, not a moral score. Focus on one practical change you can sustain this week.
              </p>

              <div className="space-y-1.5 pt-2">
                <span className="inline-block bg-white text-[#526c58] text-[10px] font-extrabold px-2.5 py-1 rounded-md border border-[#dfe9df]">
                  Fuel used × emission factor
                </span>
                <span className="inline-block bg-white text-[#526c58] text-[10px] font-extrabold px-2.5 py-1 rounded-md border border-[#dfe9df]">
                  Electricity × grid factor ({userSettings.gridCarbonFactor} kg/kWh)
                </span>
              </div>

              <div className="bg-[#fff8e9] border border-[#f0e3c4] rounded-xl p-3 text-[11px] text-[#775519] leading-relaxed">
                For higher accuracy, use your actual utility bill readings and localized regional emission factors configured in settings.
              </div>
            </div>
          </div>

          {/* Results Summary & Breakdown */}
          <div className="mt-8 pt-8 border-t border-[#dfe9df] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-extrabold text-[#2f8152] uppercase tracking-[1.4px]">
                  Your Results
                </span>
                <h3 className="text-xl font-extrabold text-[#153e2b]">
                  Weekly energy-related emissions
                </h3>
              </div>
              <div className="text-right">
                <span className="text-4xl font-extrabold text-[#2f8152] tracking-[-1.5px] font-mono">
                  {totalWeeklyCo2}
                </span>
                <small className="text-xs text-[#697c70] block font-sans">kg CO₂ / week</small>
              </div>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#f7faf5] border border-[#e6eee3] rounded-[16px] p-3.5">
                <span className="text-[10px] text-[#697c70] font-bold block uppercase tracking-wider">Per Person</span>
                <strong className="text-lg font-extrabold text-[#153e2b] block mt-0.5">{perPersonCo2} kg</strong>
              </div>
              <div className="bg-[#f7faf5] border border-[#e6eee3] rounded-[16px] p-3.5">
                <span className="text-[10px] text-[#697c70] font-bold block uppercase tracking-wider">Fuel Burned</span>
                <strong className="text-lg font-extrabold text-[#153e2b] block mt-0.5">{fuelLiters} L</strong>
              </div>
              <div className="bg-[#f7faf5] border border-[#e6eee3] rounded-[16px] p-3.5">
                <span className="text-[10px] text-[#697c70] font-bold block uppercase tracking-wider">Waste Logged</span>
                <strong className="text-lg font-extrabold text-[#153e2b] block mt-0.5">{(foodWasteKg + dryWasteKg).toFixed(1)} kg</strong>
              </div>
              <div className="bg-[#f7faf5] border border-[#e6eee3] rounded-[16px] p-3.5">
                <span className="text-[10px] text-[#697c70] font-bold block uppercase tracking-wider">Diverted / Recycled</span>
                <strong className="text-lg font-extrabold text-[#2f8152] block mt-0.5">{(recycledKg + compostKg).toFixed(1)} kg</strong>
              </div>
            </div>

            {/* Horizontal Stack Breakdown Bars */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-12 gap-2 text-xs items-center">
                <span className="col-span-3 sm:col-span-2 text-[#506458] font-bold">Vehicle fuel</span>
                <div className="col-span-7 sm:col-span-8 bg-[#eaf0e7] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2f8152] rounded-full transition-all duration-500"
                    style={{ width: `${(vehicleCo2Weekly / maxBar) * 100}%` }}
                  />
                </div>
                <strong className="col-span-2 text-right text-[#153e2b] font-mono">{vehicleCo2Weekly} kg</strong>
              </div>

              <div className="grid grid-cols-12 gap-2 text-xs items-center">
                <span className="col-span-3 sm:col-span-2 text-[#506458] font-bold">Electricity</span>
                <div className="col-span-7 sm:col-span-8 bg-[#eaf0e7] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2f8152] rounded-full transition-all duration-500"
                    style={{ width: `${(electricityCo2Weekly / maxBar) * 100}%` }}
                  />
                </div>
                <strong className="col-span-2 text-right text-[#153e2b] font-mono">{electricityCo2Weekly} kg</strong>
              </div>

              <div className="grid grid-cols-12 gap-2 text-xs items-center">
                <span className="col-span-3 sm:col-span-2 text-[#506458] font-bold">LPG Cooking</span>
                <div className="col-span-7 sm:col-span-8 bg-[#eaf0e7] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2f8152] rounded-full transition-all duration-500"
                    style={{ width: `${(lpgCo2Weekly / maxBar) * 100}%` }}
                  />
                </div>
                <strong className="col-span-2 text-right text-[#153e2b] font-mono">{lpgCo2Weekly} kg</strong>
              </div>
            </div>

            {/* Recommendations Box */}
            <div className="bg-[#f3faf0] border border-[#dfeedd] rounded-[20px] p-5 space-y-2">
              <h4 className="font-extrabold text-sm text-[#153e2b] flex items-center gap-1.5">
                <span>🌱</span>
                <span>Small practical changes to consider this week:</span>
              </h4>
              <ul className="text-xs text-[#486450] space-y-1.5 list-disc pl-5">
                <li>Combine errands or replace one short solo drive per week with walking or transit to cut ~{((vehicleCo2Weekly * 0.15)).toFixed(1)} kg CO₂.</li>
                <li>Ensure refrigerator temperature is set to 37°F and air-dry dishes to save ~{((electricityCo2Weekly * 0.1)).toFixed(1)} kg CO₂.</li>
                <li>Continue composting food scraps ({compostKg} kg logged) to prevent anaerobic landfill methane release.</li>
              </ul>
              <p className="text-[11px] text-[#697c70] pt-1">
                Illustrative scenario: cutting vehicle distance and electricity usage by 10% reduces your emissions by roughly{' '}
                <strong className="text-[#153e2b] font-bold">{((vehicleCo2Weekly + electricityCo2Weekly) * 0.1).toFixed(2)} kg CO₂e / week</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Next Sustainability Action Banner */}
      <section className="bg-gradient-to-r from-[#153e2b] via-[#20563b] to-[#2c6944] text-white rounded-[26px] p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="bg-[#c8ef83] text-[#153e2b] px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
              AI Action Recommendation
            </span>
            <span className="text-xs text-[#c2ddc5]">• +35 Green XP</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Perform a 10-Minute Standby Phantom Power Audit
          </h3>
          <p className="text-xs sm:text-sm text-[#d8e9da] leading-relaxed">
            Standby appliances draw 15–30W 24 hours a day. Unplugging idle game consoles and entertainment chargers before sleep cuts ~₹240 INR and 7.7 kg CO₂e every month.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => {
              setActiveTab('coach');
              setDemoStep(4);
            }}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
          >
            Ask AI Coach
          </button>
          <button
            onClick={() => {
              setActiveTab('missions');
              setDemoStep(5);
            }}
            className="bg-[#c8ef83] hover:bg-[#bce673] text-[#153e2b] px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow"
          >
            Accept Mission &rarr;
          </button>
        </div>
      </section>
    </div>
  );
};
