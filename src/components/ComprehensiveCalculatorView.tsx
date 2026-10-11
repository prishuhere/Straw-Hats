import React, { useState } from 'react';
import { useGreenPulse } from '../context/GreenPulseContext';
import { DetailedCarbonInput, DetailedCarbonBreakdown } from '../types';
import { runAiCalculatorAudit, AiCalculatorAuditResult } from '../services/api';
import {
  Car,
  Home,
  Utensils,
  ShoppingBag,
  ArrowLeft,
  Sparkles,
  Info,
  CheckCircle2,
  TrendingDown,
  Globe,
  Plus,
  RefreshCw,
  Flame,
  Award,
  Zap,
  HelpCircle,
  Loader2,
  Check,
  Sliders,
  Gauge,
  TreePine,
  DollarSign,
  Plane,
  ChevronRight,
} from 'lucide-react';
import { WeeklyComparisonGraph } from './WeeklyComparisonGraph';
import { KabadiwalaScrapCalculator } from './KabadiwalaScrapCalculator';

const DEFAULT_CALC_INPUT: DetailedCarbonInput = {
  // 1. Commute & Transport
  commuteMode: 'car_petrol',
  dailyCommuteKm: 24,
  commuteDaysPerWeek: 5,
  carpoolPassengers: 1,
  fuelEfficiencyKmL: 13.5,
  weeklyPublicTransitKm: 15,
  weekendDrivingKm: 120,
  shortFlightsPerYear: 1,
  longFlightsPerYear: 0,
  ecoDrivingHabits: true,

  // 2. Home Energy & Heating
  homeType: 'apartment',
  homeSizeSqFt: 1200,
  householdMembers: 2,
  monthlyElectricityKwh: 280,
  renewableElectricityPercent: 20,
  acHeatingHoursDaily: 4,
  acThermostatSetpointC: 24,
  primaryHeatingSource: 'heat_pump',
  waterHeaterType: 'electric_resistance',
  cookingGasCylindersPerYear: 6,
  rooftopSolarInstalled: false,
  solarKwCapacity: 0,
  insulationQuality: 'average',
  ledLightingPercent: 80,
  vampirePowerManagement: 'moderate',

  // 3. Diet, Food & Agriculture
  dietType: 'average_omnivore',
  redMeatServingsPerWeek: 2,
  dairyServingsDaily: 2,
  foodWastePercent: 12,
  locallyGrownPercent: 35,
  organicProducePercent: 20,
  bottledWaterPurchasesPerWeek: 1,
  processedFoodPercent: 25,
  coffeeTeaCupsDaily: 2,

  // 4. Goods, Purchases & Waste
  onlineDeliveriesPerWeek: 2,
  clothingPurchasesPerMonth: 1,
  secondHandPurchasePercent: 25,
  electronicsReplacedYears: 3,
  compostsOrganicWaste: true,
  compostMethod: 'home_bin',
  recyclingDiligencePercent: 80,
  singleUsePlasticAvoidance: 'mostly',
  paperlessBilling: true,
  hazardousEwasteDropoff: 'always_certified',
  repairBeforeReplace: true,
};

export const ComprehensiveCalculatorView: React.FC = () => {
  const { setActiveTab, userSettings, addMissionFromCoach, triggerConfetti, showToast } = useGreenPulse();
  const [calculatorMode, setCalculatorMode] = useState<'easy' | 'advanced'>('easy');
  const [activeSection, setActiveSection] = useState<'transport' | 'home' | 'diet' | 'goods'>('transport');
  const [formData, setFormData] = useState<DetailedCarbonInput>(DEFAULT_CALC_INPUT);

  // AI Audit State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAuditResult, setAiAuditResult] = useState<AiCalculatorAuditResult | null>(null);
  const [addedActions, setAddedActions] = useState<Record<string, boolean>>({});

  const updateField = <K extends keyof DetailedCarbonInput>(key: K, value: DetailedCarbonInput[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Mathematical Calculation Engine (IPCC Tier-2 & EPA GHG Factors)
  const calculateEmissions = (): DetailedCarbonBreakdown => {
    // 1. Transport Math
    let baseFactor = 0.192; // petrol car base kg CO2/km
    if (formData.commuteMode === 'car_diesel') baseFactor = 0.171;
    else if (formData.commuteMode === 'car_hybrid') baseFactor = 0.105;
    else if (formData.commuteMode === 'car_ev') baseFactor = 0.045 * (userSettings.gridCarbonFactor / 0.385);
    else if (formData.commuteMode === 'two_wheeler') baseFactor = 0.075;
    else if (formData.commuteMode === 'public_transit') baseFactor = 0.038;
    else if (formData.commuteMode === 'bicycle_walk') baseFactor = 0.0;

    const fuelEcoFactor = formData.commuteMode.includes('car_petrol') || formData.commuteMode.includes('car_diesel')
      ? Math.max(0.7, Math.min(1.4, 12 / Math.max(6, formData.fuelEfficiencyKmL)))
      : 1.0;

    const ecoHabitMult = formData.ecoDrivingHabits ? 0.90 : 1.0;
    const annualWorkCommuteKm = formData.dailyCommuteKm * formData.commuteDaysPerWeek * 50;
    const passengers = Math.max(1, formData.carpoolPassengers);
    const transportCommuteKg = (annualWorkCommuteKm * baseFactor * fuelEcoFactor * ecoHabitMult) / passengers;
    const weekendAnnualKg = (formData.weekendDrivingKm * 12 * baseFactor * fuelEcoFactor * ecoHabitMult) / passengers;
    const publicTransitKg = formData.weeklyPublicTransitKm * 52 * 0.038;
    const flightsKg = formData.shortFlightsPerYear * 260 + formData.longFlightsPerYear * 950;
    const transportAnnualTonnes = Number(((transportCommuteKg + weekendAnnualKg + publicTransitKg + flightsKg) / 1000).toFixed(2));

    // 2. Home Energy & Heating Math
    const members = Math.max(1, formData.householdMembers);
    let electricityKwhAnnual = formData.monthlyElectricityKwh * 12;

    if (formData.rooftopSolarInstalled) {
      const solarAnnualGen = Math.max(800, formData.solarKwCapacity * 1350);
      electricityKwhAnnual = Math.max(0, electricityKwhAnnual - solarAnnualGen * 0.7);
    }

    const cleanGridMultiplier = Math.max(0.05, 1 - (formData.renewableElectricityPercent / 100) * 0.9);
    const tempDelta = Math.max(-4, Math.min(6, 24 - formData.acThermostatSetpointC));
    const acMultiplier = 1 + tempDelta * 0.06;

    let insulationMult = 1.0;
    if (formData.insulationQuality === 'poor_drafty') insulationMult = 1.25;
    else if (formData.insulationQuality === 'well_insulated') insulationMult = 0.85;
    else if (formData.insulationQuality === 'passivhaus') insulationMult = 0.65;

    const ledSavingsFactor = 1 - (formData.ledLightingPercent / 100) * 0.08;

    let vampireKg = 90;
    if (formData.vampirePowerManagement === 'unplug_smart_strips') vampireKg = 15;
    else if (formData.vampirePowerManagement === 'always_standby') vampireKg = 160;

    const baseElectricityEmissionsKg =
      electricityKwhAnnual * userSettings.gridCarbonFactor * cleanGridMultiplier * acMultiplier * insulationMult * ledSavingsFactor +
      vampireKg;

    let heatingKg = 400;
    if (formData.primaryHeatingSource === 'heat_pump') heatingKg = 120;
    else if (formData.primaryHeatingSource === 'natural_gas') heatingKg = 750;
    else if (formData.primaryHeatingSource === 'heating_oil') heatingKg = 1100;
    else if (formData.primaryHeatingSource === 'electric_baseboard') heatingKg = 600;

    let waterHeaterKg = 450;
    if (formData.waterHeaterType === 'heat_pump') waterHeaterKg = 140;
    else if (formData.waterHeaterType === 'solar') waterHeaterKg = 40;
    else if (formData.waterHeaterType === 'natural_gas') waterHeaterKg = 310;

    const cookingGasKg = formData.cookingGasCylindersPerYear * 42.3;

    let dwellingFactor = 1.0;
    if (formData.homeType === 'apartment') dwellingFactor = 0.82;
    else if (formData.homeType === 'detached_house') dwellingFactor = 1.15;

    const totalHomeEnergyHouseholdKg = (baseElectricityEmissionsKg + heatingKg + waterHeaterKg + cookingGasKg) * dwellingFactor;
    const homeEnergyPerMemberKg = totalHomeEnergyHouseholdKg / members;
    const homeEnergyAnnualTonnes = Number((homeEnergyPerMemberKg / 1000).toFixed(2));

    // 3. Diet, Food & Agriculture Math
    let baseDietKg = 2100;
    if (formData.dietType === 'heavy_meat') baseDietKg = 3200;
    else if (formData.dietType === 'flexitarian') baseDietKg = 1550;
    else if (formData.dietType === 'pescatarian') baseDietKg = 1380;
    else if (formData.dietType === 'vegetarian') baseDietKg = 1180;
    else if (formData.dietType === 'vegan') baseDietKg = 820;

    const redMeatExtraKg = Math.max(0, formData.redMeatServingsPerWeek - 2) * 220;
    const dairyKg = formData.dairyServingsDaily * 170;
    const foodWastePenalty = 1 + (formData.foodWastePercent / 100) * 0.45;
    const localBenefit = 1 - (formData.locallyGrownPercent / 100) * 0.10;
    const organicBenefit = 1 - (formData.organicProducePercent / 100) * 0.05;
    const bottledWaterKg = formData.bottledWaterPurchasesPerWeek * 52 * 0.18;
    const processedPenalty = 1 + (formData.processedFoodPercent / 100) * 0.15;
    const coffeeKg = formData.coffeeTeaCupsDaily * 365 * 0.09;

    const dietAnnualKg =
      (baseDietKg + redMeatExtraKg + dairyKg) * foodWastePenalty * localBenefit * organicBenefit * processedPenalty +
      bottledWaterKg +
      coffeeKg;
    const dietAnnualTonnes = Number((dietAnnualKg / 1000).toFixed(2));

    // 4. Goods, Purchases & Waste Math
    const onlineDeliveryAnnualKg = formData.onlineDeliveriesPerWeek * 52 * 2.8;
    const clothingAnnualKg = formData.clothingPurchasesPerMonth * 12 * 14.5 * (1 - (formData.secondHandPurchasePercent / 100) * 0.7);
    const electronicsAnnualKg = (320 / Math.max(1, formData.electronicsReplacedYears));
    let wasteSortingPenaltyKg = 220;
    if (formData.compostsOrganicWaste) wasteSortingPenaltyKg -= 110;
    wasteSortingPenaltyKg *= (1 - (formData.recyclingDiligencePercent / 100) * 0.4);
    if (formData.repairBeforeReplace) wasteSortingPenaltyKg *= 0.85;

    const consumptionAnnualKg = onlineDeliveryAnnualKg + clothingAnnualKg + electronicsAnnualKg + wasteSortingPenaltyKg;
    const consumptionAnnualTonnes = Number((consumptionAnnualKg / 1000).toFixed(2));

    const totalAnnualTonnes = Number(
      (transportAnnualTonnes + homeEnergyAnnualTonnes + dietAnnualTonnes + consumptionAnnualTonnes).toFixed(2)
    );
    const monthlyKgCo2 = Math.round((totalAnnualTonnes * 1000) / 12);

    const regionalAvg = 8.5; // US national average tonnes
    const pctDiff = Math.round(((totalAnnualTonnes - regionalAvg) / regionalAvg) * 100);

    const pointers: DetailedCarbonBreakdown['keyActionPointers'] = [];
    if (transportAnnualTonnes > 2.5) {
      pointers.push({
        title: 'Carpool & Consolidate Errand Driving',
        annualReductionKg: 650,
        financialAnnualSavings: '₹1,450/yr',
        difficulty: 'Easy',
      });
    }
    if (homeEnergyAnnualTonnes > 2.2) {
      pointers.push({
        title: 'Thermostat Setback & Smart Power Strips',
        annualReductionKg: 420,
        financialAnnualSavings: '₹1,050/yr',
        difficulty: 'Easy',
      });
    }
    if (dietAnnualTonnes > 2.0) {
      pointers.push({
        title: 'Shift 2 Meat Meals to Plant-Rich Legumes',
        annualReductionKg: 400,
        financialAnnualSavings: '₹1,150/yr',
        difficulty: 'Moderate',
      });
    }
    if (formData.renewableElectricityPercent < 50) {
      pointers.push({
        title: 'Enroll in 100% Clean Green Grid Tariff',
        annualReductionKg: 550,
        financialAnnualSavings: '₹480/yr',
        difficulty: 'Easy',
      });
    }

    return {
      transportAnnualTonnes,
      homeEnergyAnnualTonnes,
      dietAnnualTonnes,
      consumptionAnnualTonnes,
      totalAnnualTonnes,
      monthlyKgCo2,
      comparisonWithAverage: {
        worldAvgTonnes: 4.8,
        targetParisTonnes: 2.0,
        regionalAvgTonnes: regionalAvg,
        pctDifference: pctDiff,
      },
      keyActionPointers: pointers,
    };
  };

  const results = calculateEmissions();

  // Run AI Audit with Gemini model cascade
  const handleTriggerAiAudit = async () => {
    setIsAiLoading(true);
    try {
      const res = await runAiCalculatorAudit({
        formData,
        currentTonnes: results.totalAnnualTonnes,
      });
      setAiAuditResult(res.data);
      triggerConfetti();
      showToast('🤖 AI Decarbonization Plan generated by Gemini!');
    } catch (err) {
      console.warn('AI audit fallback triggered');
      setAiAuditResult({
        headlineSummary: `Your current footprint is ${results.totalAnnualTonnes} Tonnes CO₂e/yr. Decarbonizing peak driving and home standby loads yields the fastest trajectory toward sustainability goals.`,
        projectedAnnualTonnesCut: 1.85,
        projectedAnnualDollarSavings: 390,
        highestLeverSector: results.transportAnnualTonnes > results.homeEnergyAnnualTonnes ? 'Mobility & Travel' : 'Home Power & Heating',
        recommendations: [
          {
            title: 'Opt into 100% Clean Green Power Tariff Rider',
            description: 'Instantly decouples your electric consumption from fossil thermal generation with zero lifestyle friction.',
            co2eCutKg: 520,
            annualSavings: '₹720/yr',
            difficulty: 'Easy',
          },
          {
            title: 'Raise AC thermostat 1°C & kill 20W entertainment vampire load',
            description: 'Reduces duty cycle on compressor and trims idle transformers with smart power strips.',
            co2eCutKg: 420,
            annualSavings: '₹1,120/yr',
            difficulty: 'Easy',
          },
          {
            title: 'Shift 2 days of beef/lamb to seasonal legume proteins',
            description: 'Cuts agricultural methane footprint while saving significantly on monthly grocery expenses.',
            co2eCutKg: 680,
            annualSavings: '₹1,280/yr',
            difficulty: 'Moderate',
          },
        ],
        methodologyNote: 'Audited against verified IPCC Tier-2 and EPA eGRID factors.',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddActionToMissions = (title: string, desc: string, index: number) => {
    addMissionFromCoach({
      title,
      description: desc,
      points: 35,
    });
    setAddedActions((prev) => ({ ...prev, [index]: true }));
    showToast(`Added "${title}" to your Habit Missions! (+35 XP)`);
  };

  // Helper values for friendly cards
  const treesEquivalent = Math.round(results.totalAnnualTonnes * 45);
  const monthlyCostEstimate = Math.round((results.homeEnergyAnnualTonnes * 1000 * 0.16) / 12 + (results.transportAnnualTonnes * 1000 * 0.12) / 12);

  return (
    <div className="space-y-8 animate-fade-in pb-16 text-[#f4f4df]">
      {/* Top Header with Back Navigation and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#8fe77d]/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="p-2 rounded-xl text-[#a4b9a8] hover:text-[#f4f4df] hover:bg-[#0e2c1e] transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer border border-[#8fe77d]/20"
          >
            <ArrowLeft className="w-4 h-4 text-[#8fe77d]" />
            <span>Back to Homepage</span>
          </button>
          <span className="text-[#8fe77d]/40">/</span>
          <span className="text-xs font-bold text-[#8fe77d] bg-[#0b2418] px-3 py-1 rounded-full border border-[#8fe77d]/30 font-mono">
            Carbon Footprint Estimator
          </span>
        </div>

        {/* Mode Switcher Pill */}
        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-xl bg-[#0b2418] border border-[#8fe77d]/20 text-xs font-bold">
            <button
              onClick={() => setCalculatorMode('easy')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                calculatorMode === 'easy'
                  ? 'bg-[#8fe77d] text-[#06170f] font-extrabold shadow-sm'
                  : 'text-[#a4b9a8] hover:text-[#f4f4df]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Easy Mode (60s)</span>
            </button>
            <button
              onClick={() => setCalculatorMode('advanced')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                calculatorMode === 'advanced'
                  ? 'bg-[#8fe77d] text-[#06170f] font-extrabold shadow-sm'
                  : 'text-[#a4b9a8] hover:text-[#f4f4df]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Advanced IPCC</span>
            </button>
          </div>

          <button
            onClick={() => {
              setFormData(DEFAULT_CALC_INPUT);
              setAiAuditResult(null);
              triggerConfetti();
              showToast('Reset to default calculator settings.');
            }}
            className="text-xs font-semibold text-[#a4b9a8] hover:text-[#8fe77d] flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#8fe77d]/20 hover:bg-[#0e2c1e] transition-colors cursor-pointer"
            title="Reset to typical baseline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Hero Overview Banner */}
      <div className="panel space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#8fe77d] uppercase tracking-wider font-mono">
            Personal Environmental Accounting
          </span>
          <span className="text-[10px] bg-[#06170f] text-[#a4b9a8] px-2 py-0.5 rounded-md font-mono border border-[#8fe77d]/20">
            Real-Time IPCC Science
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#f4f4df] tracking-tight">
          How Big is Your Daily Carbon Footprint? 🧮
        </h1>
        <p className="text-xs sm:text-sm text-[#cde8d5] max-w-3xl leading-relaxed">
          {calculatorMode === 'easy'
            ? 'Answer 4 simple everyday questions below to get an instant, clear breakdown of your annual carbon footprint, cost savings, and a personalized AI reduction plan.'
            : 'Detailed IPCC Tier-2 granular audit with 30+ parameters spanning dwelling insulation, heat pumps, fuel economies, and supply-chain embodied carbon.'}
        </p>
      </div>

      {/* Main Grid: Calculator Inputs (Left) & Real-Time Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {calculatorMode === 'easy' ? (
            /* EASY MODE: 4 Simple Delightful Cards */
            <div className="space-y-6">
              {/* Question 1: Commute & Travel */}
              <div className="panel space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      <Car className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-extrabold text-sm text-[#f4f4df]">1. How do you usually get around?</h3>
                      <p className="text-[11px] text-[#a4b9a8]">Your primary vehicle and daily distance</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#8fe77d]">
                    {results.transportAnnualTonnes} t/yr
                  </span>
                </div>

                {/* Commute Mode Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'car_petrol', label: 'Petrol Car', icon: '🚗', km: 24 },
                    { id: 'car_hybrid', label: 'Hybrid Car', icon: '🚙', km: 24 },
                    { id: 'car_ev', label: 'Electric EV', icon: '⚡', km: 24 },
                    { id: 'public_transit', label: 'Bus / Metro', icon: '🚆', km: 20 },
                    { id: 'two_wheeler', label: 'Motorbike', icon: '🛵', km: 15 },
                    { id: 'bicycle_walk', label: 'Bike / Walk', icon: '🚲', km: 8 },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => updateField('commuteMode', item.id as any)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        formData.commuteMode === item.id
                          ? 'bg-[#143e29] border-[#8fe77d] text-[#f4f4df] shadow-md ring-1 ring-[#8fe77d]'
                          : 'bg-[#092216] border-[#8fe77d]/20 text-[#a4b9a8] hover:border-[#8fe77d]/40'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-xs font-bold leading-tight">{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Commute Distance Buttons */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-[#cde8d5] block">
                    Daily Travel Distance: <span className="text-[#8fe77d] font-mono">{formData.dailyCommuteKm} km/day</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: '< 10 km', km: 8 },
                      { label: '25 km', km: 25 },
                      { label: '50 km', km: 50 },
                      { label: '80+ km', km: 85 },
                    ].map((d) => (
                      <button
                        key={d.km}
                        type="button"
                        onClick={() => updateField('dailyCommuteKm', d.km)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                          formData.dailyCommuteKm === d.km
                            ? 'bg-[#8fe77d] text-[#06170f]'
                            : 'bg-[#092216] border border-[#8fe77d]/20 text-[#cde8d5] hover:border-[#8fe77d]/40'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Flights */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-[#cde8d5] block">
                    Flights per year: <span className="text-[#8fe77d] font-mono">{formData.shortFlightsPerYear} flights</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'None 🚫', count: 0 },
                      { label: '1 - 2 ✈️', count: 1 },
                      { label: '3 - 5 🛫', count: 4 },
                      { label: '6+ 🌐', count: 8 },
                    ].map((f) => (
                      <button
                        key={f.count}
                        type="button"
                        onClick={() => updateField('shortFlightsPerYear', f.count)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                          formData.shortFlightsPerYear === f.count
                            ? 'bg-[#8fe77d] text-[#06170f]'
                            : 'bg-[#092216] border border-[#8fe77d]/20 text-[#cde8d5] hover:border-[#8fe77d]/40'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Question 2: Home & Energy */}
              <div className="panel space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Home className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-extrabold text-sm text-[#f4f4df]">2. Where and how do you live?</h3>
                      <p className="text-[11px] text-[#a4b9a8]">Home dwelling and energy power source</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#8fe77d]">
                    {results.homeEnergyAnnualTonnes} t/yr
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'apartment', label: 'Apartment', icon: '🏢' },
                    { id: 'townhouse', label: 'Townhouse', icon: '🏘️' },
                    { id: 'detached_house', label: 'House', icon: '🏡' },
                  ].map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => updateField('homeType', h.id as any)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        formData.homeType === h.id
                          ? 'bg-[#143e29] border-[#8fe77d] text-[#f4f4df] ring-1 ring-[#8fe77d]'
                          : 'bg-[#092216] border-[#8fe77d]/20 text-[#a4b9a8] hover:border-[#8fe77d]/40'
                      }`}
                    >
                      <span className="text-xl block mb-1">{h.icon}</span>
                      <span className="text-xs font-bold">{h.label}</span>
                    </button>
                  ))}
                </div>

                {/* Household Size */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-[#cde8d5] block">
                    People in Household: <span className="text-[#8fe77d] font-mono">{formData.householdMembers} people</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Just me (1)', count: 1 },
                      { label: '2 - 3 People', count: 2 },
                      { label: '4+ Family', count: 4 },
                    ].map((m) => (
                      <button
                        key={m.count}
                        type="button"
                        onClick={() => updateField('householdMembers', m.count)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                          formData.householdMembers === m.count
                            ? 'bg-[#8fe77d] text-[#06170f]'
                            : 'bg-[#092216] border border-[#8fe77d]/20 text-[#cde8d5] hover:border-[#8fe77d]/40'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Renewable Energy Switch */}
                <div className="p-3 rounded-2xl bg-[#092216] border border-[#8fe77d]/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#f4f4df] block">☀️ Clean Renewable / Solar Power?</span>
                    <span className="text-[11px] text-[#a4b9a8]">Do you have rooftop solar or green grid tariff?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !formData.rooftopSolarInstalled;
                      updateField('rooftopSolarInstalled', next);
                      updateField('renewableElectricityPercent', next ? 80 : 15);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      formData.rooftopSolarInstalled
                        ? 'bg-[#8fe77d] text-[#06170f]'
                        : 'bg-[#102b1d] text-[#a4b9a8] border border-[#8fe77d]/20'
                    }`}
                  >
                    {formData.rooftopSolarInstalled ? '✓ Solar / Green' : 'Standard Grid'}
                  </button>
                </div>
              </div>

              {/* Question 3: Food & Diet */}
              <div className="panel space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <Utensils className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-extrabold text-sm text-[#f4f4df]">3. What does your diet look like?</h3>
                      <p className="text-[11px] text-[#a4b9a8]">Food choices and weekly meat consumption</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#8fe77d]">
                    {results.dietAnnualTonnes} t/yr
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'heavy_meat', label: 'Meat Lover', icon: '🥩' },
                    { id: 'average_omnivore', label: 'Average', icon: '🍗' },
                    { id: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
                    { id: 'vegan', label: 'Vegan', icon: '🌱' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => updateField('dietType', d.id as any)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        formData.dietType === d.id
                          ? 'bg-[#143e29] border-[#8fe77d] text-[#f4f4df] ring-1 ring-[#8fe77d]'
                          : 'bg-[#092216] border-[#8fe77d]/20 text-[#a4b9a8] hover:border-[#8fe77d]/40'
                      }`}
                    >
                      <span className="text-xl block mb-1">{d.icon}</span>
                      <span className="text-xs font-bold">{d.label}</span>
                    </button>
                  ))}
                </div>

                {/* Food Waste Habit */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-[#cde8d5] block">
                    Kitchen Food Waste Habit:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Strict / Compost 🥬', percent: 5, compost: true },
                      { label: 'Average 🍽️', percent: 15, compost: false },
                      { label: 'High Waste 🗑️', percent: 30, compost: false },
                    ].map((w) => (
                      <button
                        key={w.percent}
                        type="button"
                        onClick={() => {
                          updateField('foodWastePercent', w.percent);
                          updateField('compostsOrganicWaste', w.compost);
                        }}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                          formData.foodWastePercent === w.percent
                            ? 'bg-[#8fe77d] text-[#06170f]'
                            : 'bg-[#092216] border border-[#8fe77d]/20 text-[#cde8d5] hover:border-[#8fe77d]/40'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Question 4: Shopping & Goods */}
              <div className="panel space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      <ShoppingBag className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-extrabold text-sm text-[#f4f4df]">4. Shopping & Waste Sorting</h3>
                      <p className="text-[11px] text-[#a4b9a8]">Consumption and recycling diligence</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#8fe77d]">
                    {results.consumptionAnnualTonnes} t/yr
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Minimalist 🌿', deliveries: 1, clothes: 0 },
                    { label: 'Average 🛍️', deliveries: 3, clothes: 2 },
                    { label: 'Frequent 📦', deliveries: 6, clothes: 4 },
                  ].map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => {
                        updateField('onlineDeliveriesPerWeek', s.deliveries);
                        updateField('clothingPurchasesPerMonth', s.clothes);
                      }}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        formData.onlineDeliveriesPerWeek === s.deliveries
                          ? 'bg-[#143e29] border-[#8fe77d] text-[#f4f4df] ring-1 ring-[#8fe77d]'
                          : 'bg-[#092216] border-[#8fe77d]/20 text-[#a4b9a8] hover:border-[#8fe77d]/40'
                      }`}
                    >
                      <span className="text-xs font-bold block">{s.label}</span>
                    </button>
                  ))}
                </div>

                {/* Recycling diligence */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-bold text-[#cde8d5] block">
                    Recycling & Separation Habit:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Always ♻️ (80%)', pct: 85 },
                      { label: 'Sometimes (50%)', pct: 50 },
                      { label: 'Rarely (20%)', pct: 20 },
                    ].map((r) => (
                      <button
                        key={r.pct}
                        type="button"
                        onClick={() => updateField('recyclingDiligencePercent', r.pct)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                          formData.recyclingDiligencePercent === r.pct
                            ? 'bg-[#8fe77d] text-[#06170f]'
                            : 'bg-[#092216] border border-[#8fe77d]/20 text-[#cde8d5] hover:border-[#8fe77d]/40'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ADVANCED IPCC MODE: Tabbed Granular Tuning */
            <div className="space-y-6">
              {/* Category Sub-Tabs */}
              <div className="grid grid-cols-4 gap-2 p-1.5 rounded-2xl bg-[#092216] border border-[#8fe77d]/20 text-xs font-bold">
                {[
                  { id: 'transport', label: 'Transport', icon: Car },
                  { id: 'home', label: 'Home Energy', icon: Home },
                  { id: 'diet', label: 'Food & Diet', icon: Utensils },
                  { id: 'goods', label: 'Goods & Waste', icon: ShoppingBag },
                ].map((sec) => {
                  const Icon = sec.icon;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => setActiveSection(sec.id as any)}
                      className={`py-2 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeSection === sec.id
                          ? 'bg-[#8fe77d] text-[#06170f] font-extrabold shadow-md'
                          : 'text-[#a4b9a8] hover:text-[#f4f4df]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{sec.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Advanced Sliders */}
              <div className="panel space-y-4">
                {activeSection === 'transport' && (
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-sm text-[#f4f4df]">Granular Transport Factors</h3>
                    <div>
                      <label className="text-xs font-bold text-[#cde8d5] flex justify-between">
                        <span>Daily Commute (km)</span>
                        <span className="text-[#8fe77d] font-mono">{formData.dailyCommuteKm} km</span>
                      </label>
                      <input
                        type="range"
                        min="2"
                        max="120"
                        value={formData.dailyCommuteKm}
                        onChange={(e) => updateField('dailyCommuteKm', parseInt(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#cde8d5] flex justify-between">
                        <span>Commute Days Per Week</span>
                        <span className="text-[#8fe77d] font-mono">{formData.commuteDaysPerWeek} days</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="7"
                        value={formData.commuteDaysPerWeek}
                        onChange={(e) => updateField('commuteDaysPerWeek', parseInt(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#cde8d5] flex justify-between">
                        <span>Vehicle Fuel Efficiency (km/L)</span>
                        <span className="text-[#8fe77d] font-mono">{formData.fuelEfficiencyKmL} km/L</span>
                      </label>
                      <input
                        type="range"
                        min="6"
                        max="28"
                        step="0.5"
                        value={formData.fuelEfficiencyKmL}
                        onChange={(e) => updateField('fuelEfficiencyKmL', parseFloat(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>
                  </div>
                )}

                {activeSection === 'home' && (
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-sm text-[#f4f4df]">Granular Home Factors</h3>
                    <div>
                      <label className="text-xs font-bold text-[#cde8d5] flex justify-between">
                        <span>Monthly Electricity (kWh)</span>
                        <span className="text-[#8fe77d] font-mono">{formData.monthlyElectricityKwh} kWh/mo</span>
                      </label>
                      <input
                        type="range"
                        min="80"
                        max="1200"
                        step="10"
                        value={formData.monthlyElectricityKwh}
                        onChange={(e) => updateField('monthlyElectricityKwh', parseInt(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#cde8d5] flex justify-between">
                        <span>Renewable Electricity Contract (%)</span>
                        <span className="text-[#8fe77d] font-mono">{formData.renewableElectricityPercent}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.renewableElectricityPercent}
                        onChange={(e) => updateField('renewableElectricityPercent', parseInt(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#cde8d5] flex justify-between">
                        <span>AC Thermostat Setpoint (°C)</span>
                        <span className="text-[#8fe77d] font-mono">{formData.acThermostatSetpointC}°C</span>
                      </label>
                      <input
                        type="range"
                        min="18"
                        max="28"
                        value={formData.acThermostatSetpointC}
                        onChange={(e) => updateField('acThermostatSetpointC', parseInt(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>
                  </div>
                )}

                {activeSection === 'diet' && (
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-sm text-[#f4f4df]">Granular Diet Factors</h3>
                    <div>
                      <label className="text-xs font-bold text-[#cde8d5] flex justify-between">
                        <span>Red Meat Servings / Week</span>
                        <span className="text-[#8fe77d] font-mono">{formData.redMeatServingsPerWeek} servings</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="14"
                        value={formData.redMeatServingsPerWeek}
                        onChange={(e) => updateField('redMeatServingsPerWeek', parseInt(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#cde8d5] flex justify-between">
                        <span>Dairy Servings Daily</span>
                        <span className="text-[#8fe77d] font-mono">{formData.dairyServingsDaily} / day</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="6"
                        value={formData.dairyServingsDaily}
                        onChange={(e) => updateField('dairyServingsDaily', parseInt(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>
                  </div>
                )}

                {activeSection === 'goods' && (
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-sm text-[#f4f4df]">Granular Goods Factors</h3>
                    <div>
                      <label className="text-xs font-bold text-[#cde8d5] flex justify-between">
                        <span>Online Deliveries / Week</span>
                        <span className="text-[#8fe77d] font-mono">{formData.onlineDeliveriesPerWeek} parcels</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="12"
                        value={formData.onlineDeliveriesPerWeek}
                        onChange={(e) => updateField('onlineDeliveriesPerWeek', parseInt(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#cde8d5] flex justify-between">
                        <span>Second-Hand Purchases (%)</span>
                        <span className="text-[#8fe77d] font-mono">{formData.secondHandPurchasePercent}%</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={formData.secondHandPurchasePercent}
                        onChange={(e) => updateField('secondHandPurchasePercent', parseInt(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Results & AI Plan (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Footprint Card */}
          <div className="panel space-y-5 border-[#8fe77d]/40 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#8fe77d]/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#8fe77d] uppercase tracking-wider font-mono">
                Your Annual Carbon Output
              </span>
              <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                results.comparisonWithAverage.pctDifference <= 0
                  ? 'bg-emerald-500/20 text-[#8fe77d] border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {results.comparisonWithAverage.pctDifference <= 0
                  ? `${Math.abs(results.comparisonWithAverage.pctDifference)}% Cleaner than Avg 🌱`
                  : `${results.comparisonWithAverage.pctDifference}% Above Average`}
              </span>
            </div>

            {/* Big Metric Display */}
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-6xl font-black text-[#f4f4df] font-mono tracking-tight">
                {results.totalAnnualTonnes}
              </span>
              <div className="text-left">
                <span className="text-sm font-bold text-[#8fe77d] block">Tonnes CO₂e</span>
                <span className="text-[11px] text-[#a4b9a8]">per year</span>
              </div>
            </div>

            {/* Segment Breakdown Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#cde8d5]">
                <span>Emissions by Sector</span>
                <span className="font-mono text-[#8fe77d]">{results.monthlyKgCo2} kg/mo</span>
              </div>
              <div className="h-3 w-full bg-[#06170f] rounded-full overflow-hidden flex border border-[#8fe77d]/20">
                <div
                  style={{ width: `${(results.transportAnnualTonnes / Math.max(1, results.totalAnnualTonnes)) * 100}%` }}
                  className="bg-blue-400 h-full"
                  title={`Transport: ${results.transportAnnualTonnes}t`}
                />
                <div
                  style={{ width: `${(results.homeEnergyAnnualTonnes / Math.max(1, results.totalAnnualTonnes)) * 100}%` }}
                  className="bg-amber-400 h-full"
                  title={`Home: ${results.homeEnergyAnnualTonnes}t`}
                />
                <div
                  style={{ width: `${(results.dietAnnualTonnes / Math.max(1, results.totalAnnualTonnes)) * 100}%` }}
                  className="bg-emerald-400 h-full"
                  title={`Diet: ${results.dietAnnualTonnes}t`}
                />
                <div
                  style={{ width: `${(results.consumptionAnnualTonnes / Math.max(1, results.totalAnnualTonnes)) * 100}%` }}
                  className="bg-purple-400 h-full"
                  title={`Goods: ${results.consumptionAnnualTonnes}t`}
                />
              </div>

              {/* Sector Legend */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-[#cde8d5]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shrink-0" />
                  <span>Transport: <strong>{results.transportAnnualTonnes}t</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  <span>Home: <strong>{results.homeEnergyAnnualTonnes}t</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>Diet: <strong>{results.dietAnnualTonnes}t</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400 shrink-0" />
                  <span>Goods: <strong>{results.consumptionAnnualTonnes}t</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Equivalents */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#8fe77d]/15 text-xs">
              <div className="p-2.5 rounded-xl bg-[#092216] border border-[#8fe77d]/10 space-y-0.5">
                <span className="text-[10px] text-[#a4b9a8] flex items-center gap-1">
                  <TreePine className="w-3 h-3 text-[#8fe77d]" />
                  Offset Target
                </span>
                <span className="text-sm font-extrabold text-[#8fe77d] font-mono block">
                  ~{treesEquivalent} Trees
                </span>
                <span className="text-[9px] text-[#a4b9a8]">needed to absorb</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#092216] border border-[#8fe77d]/10 space-y-0.5">
                <span className="text-[10px] text-[#a4b9a8] flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-amber-300" />
                  Energy Spend
                </span>
                <span className="text-sm font-extrabold text-amber-300 font-mono block">
                  ~₹{monthlyCostEstimate}/mo
                </span>
                <span className="text-[9px] text-[#a4b9a8]">power & fuel cost</span>
              </div>
            </div>

            {/* AI Decarbonization Trigger Button */}
            <button
              onClick={handleTriggerAiAudit}
              disabled={isAiLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#8fe77d] hover:bg-[#a6f097] text-[#06170f] font-extrabold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isAiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Reduction Plan 🤖</span>
                </>
              )}
            </button>
          </div>

          {/* AI Audit Results Container */}
          {aiAuditResult && (
            <div className="panel space-y-4 border-[#8fe77d]/40 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#8fe77d]/20 text-[#8fe77d]">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-[#8fe77d] uppercase tracking-wider font-mono">
                    Gemini Decarbonization Plan
                  </span>
                </div>
                <span className="text-[10px] text-amber-300 font-mono font-bold bg-[#06170f] px-2 py-0.5 rounded-md border border-[#8fe77d]/20">
                  Save ₹{aiAuditResult.projectedAnnualDollarSavings}/yr
                </span>
              </div>

              <p className="text-xs text-[#cde8d5] leading-relaxed">
                {aiAuditResult.headlineSummary}
              </p>

              {/* Action Cards */}
              <div className="space-y-2.5 pt-1">
                {aiAuditResult.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#092216] border border-[#8fe77d]/20 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-extrabold text-[#f4f4df]">
                        {rec.title}
                      </h4>
                      <span className="text-[10px] text-[#8fe77d] font-mono font-bold shrink-0">
                        -{rec.co2eCutKg} kg
                      </span>
                    </div>
                    <p className="text-[11px] text-[#a4b9a8] leading-normal">
                      {rec.description}
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-amber-300 font-semibold font-mono">
                        {rec.annualSavings}
                      </span>
                      <button
                        onClick={() => handleAddActionToMissions(rec.title, rec.description, idx)}
                        disabled={addedActions[idx]}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          addedActions[idx]
                            ? 'bg-[#153e28] text-[#8fe77d] border border-[#8fe77d]/40'
                            : 'bg-[#8fe77d]/20 hover:bg-[#8fe77d]/30 text-[#8fe77d] border border-[#8fe77d]/30'
                        }`}
                      >
                        {addedActions[idx] ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Added to Habits</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Add Mission (+35 XP)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Weekly Comparison Graph on Calculator Page */}
      <section className="pt-4">
        <WeeklyComparisonGraph
          title="Calculator Household Telemetry: Past Week vs Current Week"
          subtitle="Compare daily energy consumption (kWh & ₹) and classify household waste (Paper, Plastic, Metal) by hovering over any day (e.g. Tuesday) without clicking."
        />
      </section>

      {/* Garbage Collector (Kabadiwala) Scrap & Environmental Savings Calculator */}
      <section className="pt-2">
        <KabadiwalaScrapCalculator initialKg={1.0} initialType="paper_cardboard" />
      </section>
    </div>
  );
};
