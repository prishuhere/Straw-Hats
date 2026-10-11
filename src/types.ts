export type WasteCategory =
  | 'Recycle'
  | 'Compost'
  | 'Landfill'
  | 'Hazardous / E-Waste'
  | 'Special Drop-off'
  | 'Reusable';

export interface WasteItemLog {
  id: string;
  name: string;
  category: WasteCategory;
  materialType: string;
  confidence: number;
  confirmedByUser?: boolean;
  handlingSteps: string[];
  contaminationAlerts: string[];
  reuseIdeas: string[];
  estimatedWeightKg: number;
  avoidedCo2eKg: number;
  diversionEligible: boolean;
  funEcoFact: string;
  timestamp: string;
  imageUrl?: string;
}

export interface EnergyLog {
  id: string;
  appliance: string;
  category: 'HVAC' | 'Kitchen' | 'Computing' | 'Transport' | 'Laundry' | 'Entertainment' | 'Lighting' | 'Other';
  wattage: number;
  hoursPerDay: number;
  daysPerWeek: number;
  monthlyKwh: number;
  monthlyCost: number;
  monthlyCo2eKg: number;
  ecoTip: string;
  timestamp: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: 'energy' | 'waste' | 'habit' | 'special';
  period: 'daily' | 'weekly';
  points: number;
  difficulty: 'Easy' | 'Medium' | 'Challenging';
  completed: boolean;
  completedAt?: string;
  progressCurrent?: number;
  progressTarget?: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  requirement: string;
}

export interface UserSettings {
  userName: string;
  tariffRate: number; // in $/kWh, default 0.16
  currency: string; // '$', '€', '£', '₹'
  regionName: string;
  gridCarbonFactor: number; // in kg CO2e/kWh, default 0.385 (US average)
}

export interface UserAccount {
  id: string; // unique login ID
  name: string; // display name
  password: string; // login password
  streakDays: number;
  totalXp: number;
  ecoPoints: number;
  sustainabilityScore: number;
  wasteLogs?: WasteItemLog[];
  energyLogs?: EnergyLog[];
  missions?: Mission[];
  createdAt: string;
}

export interface DetailedCarbonInput {
  // 1. Commute & Transport
  commuteMode: 'car_petrol' | 'car_diesel' | 'car_hybrid' | 'car_ev' | 'two_wheeler' | 'public_transit' | 'bicycle_walk';
  dailyCommuteKm: number;
  commuteDaysPerWeek: number;
  carpoolPassengers: number;
  fuelEfficiencyKmL: number;
  weeklyPublicTransitKm: number;
  weekendDrivingKm: number;
  shortFlightsPerYear: number;
  longFlightsPerYear: number;
  ecoDrivingHabits: boolean;

  // 2. Home Energy & Heating
  homeType: 'apartment' | 'detached_house' | 'semi_detached' | 'townhouse';
  homeSizeSqFt: number;
  householdMembers: number;
  monthlyElectricityKwh: number;
  renewableElectricityPercent: number;
  acHeatingHoursDaily: number;
  acThermostatSetpointC: number;
  primaryHeatingSource: 'heat_pump' | 'natural_gas' | 'electric_baseboard' | 'heating_oil' | 'district_steam';
  waterHeaterType: 'electric_resistance' | 'heat_pump' | 'natural_gas' | 'solar';
  cookingGasCylindersPerYear: number;
  rooftopSolarInstalled: boolean;
  solarKwCapacity: number;
  insulationQuality: 'poor_drafty' | 'average' | 'well_insulated' | 'passivhaus';
  ledLightingPercent: number;
  vampirePowerManagement: 'unplug_smart_strips' | 'moderate' | 'always_standby';

  // 3. Diet, Food & Agriculture
  dietType: 'heavy_meat' | 'average_omnivore' | 'flexitarian' | 'pescatarian' | 'vegetarian' | 'vegan';
  redMeatServingsPerWeek: number;
  dairyServingsDaily: number;
  foodWastePercent: number;
  locallyGrownPercent: number;
  organicProducePercent: number;
  bottledWaterPurchasesPerWeek: number;
  processedFoodPercent: number;
  coffeeTeaCupsDaily: number;

  // 4. Goods, Purchases & Waste
  onlineDeliveriesPerWeek: number;
  clothingPurchasesPerMonth: number;
  secondHandPurchasePercent: number;
  electronicsReplacedYears: number;
  compostsOrganicWaste: boolean;
  compostMethod: 'home_bin' | 'municipal_curbside' | 'none';
  recyclingDiligencePercent: number;
  singleUsePlasticAvoidance: 'rarely' | 'sometimes' | 'mostly' | 'strictly';
  paperlessBilling: boolean;
  hazardousEwasteDropoff: 'always_certified' | 'sometimes' | 'landfill_trash';
  repairBeforeReplace: boolean;
}

export interface DetailedCarbonBreakdown {
  transportAnnualTonnes: number;
  homeEnergyAnnualTonnes: number;
  dietAnnualTonnes: number;
  consumptionAnnualTonnes: number;
  totalAnnualTonnes: number;
  monthlyKgCo2: number;
  comparisonWithAverage: {
    worldAvgTonnes: number; // ~4.8T
    targetParisTonnes: number; // ~2.0T
    regionalAvgTonnes: number; // ~14.2T US or ~1.9T India
    pctDifference: number; // e.g. -24%
  };
  keyActionPointers: {
    title: string;
    annualReductionKg: number;
    financialAnnualSavings: string;
    difficulty: 'Easy' | 'Moderate' | 'High';
  }[];
}

export interface CoachChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
  suggestedAction?: {
    type: 'mission' | 'energy' | 'waste';
    title: string;
    description: string;
    points?: number;
  };
}
