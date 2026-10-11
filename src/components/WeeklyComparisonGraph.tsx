import React, { useState } from 'react';
import { Sparkles, Calendar, TrendingDown, Info, ArrowUpRight } from 'lucide-react';
import { useGreenPulse } from '../context/GreenPulseContext';

export interface DayComparisonData {
  day: string;
  dayShort: string;
  currentKwh: number;
  pastKwh: number;
  currentCostInr: number;
  pastCostInr: number;
  waste: {
    paperKg: number;
    paperInr: number;
    plasticKg: number;
    plasticInr: number;
    metalKg: number;
    metalInr: number;
    totalKg: number;
    totalInr: number;
    co2eAvoidedKg: number;
  };
  highlightNote: string;
}

// Representative weekly data grounded in Indian household averages & kabadiwala rates
export const WEEKLY_COMPARISON_DATA: DayComparisonData[] = [
  {
    day: 'Monday',
    dayShort: 'Mon',
    currentKwh: 12.8,
    pastKwh: 15.6,
    currentCostInr: 96,
    pastCostInr: 117,
    waste: {
      paperKg: 0.8,
      paperInr: 11.2,
      plasticKg: 0.4,
      plasticInr: 8.0,
      metalKg: 0.1,
      metalInr: 3.5,
      totalKg: 1.3,
      totalInr: 22.7,
      co2eAvoidedKg: 1.9,
    },
    highlightNote: 'Cardboard package & 3 water bottles sorted for local raddi dealer.',
  },
  {
    day: 'Tuesday',
    dayShort: 'Tue',
    currentKwh: 11.4,
    pastKwh: 16.2,
    currentCostInr: 85.5,
    pastCostInr: 121.5,
    waste: {
      paperKg: 1.2,
      paperInr: 16.8, // ₹14/kg
      plasticKg: 0.6,
      plasticInr: 12.0, // ₹20/kg
      metalKg: 0.3,
      metalInr: 10.5, // ₹35/kg
      totalKg: 2.1,
      totalInr: 39.3,
      co2eAvoidedKg: 3.2,
    },
    highlightNote: 'Tuesday Special: 1 kg paper & cardboard diverted! Saved ₹16.80 cash & 33L water.',
  },
  {
    day: 'Wednesday',
    dayShort: 'Wed',
    currentKwh: 10.9,
    pastKwh: 14.8,
    currentCostInr: 81.8,
    pastCostInr: 111,
    waste: {
      paperKg: 0.5,
      paperInr: 7.0,
      plasticKg: 0.3,
      plasticInr: 6.0,
      metalKg: 0.1,
      metalInr: 3.5,
      totalKg: 0.9,
      totalInr: 16.5,
      co2eAvoidedKg: 1.4,
    },
    highlightNote: 'AC setpoint raised to 25°C, trimming 3.9 kWh off daily draw.',
  },
  {
    day: 'Thursday',
    dayShort: 'Thu',
    currentKwh: 13.1,
    pastKwh: 15.9,
    currentCostInr: 98.3,
    pastCostInr: 119.3,
    waste: {
      paperKg: 1.0,
      paperInr: 14.0,
      plasticKg: 0.5,
      plasticInr: 10.0,
      metalKg: 0.4,
      metalInr: 14.0,
      totalKg: 1.9,
      totalInr: 38.0,
      co2eAvoidedKg: 2.8,
    },
    highlightNote: 'Newspaper stack collected & bundled neatly for door-to-door scrap buyer.',
  },
  {
    day: 'Friday',
    dayShort: 'Fri',
    currentKwh: 12.2,
    pastKwh: 17.1,
    currentCostInr: 91.5,
    pastCostInr: 128.3,
    waste: {
      paperKg: 0.9,
      paperInr: 12.6,
      plasticKg: 0.7,
      plasticInr: 14.0,
      metalKg: 0.2,
      metalInr: 7.0,
      totalKg: 1.8,
      totalInr: 33.6,
      co2eAvoidedKg: 2.6,
    },
    highlightNote: 'Cold wash laundry cycle used. Avoided 2.1 kWh water heating energy.',
  },
  {
    day: 'Saturday',
    dayShort: 'Sat',
    currentKwh: 14.5,
    pastKwh: 19.4,
    currentCostInr: 108.8,
    pastCostInr: 145.5,
    waste: {
      paperKg: 1.8,
      paperInr: 25.2,
      plasticKg: 0.9,
      plasticInr: 18.0,
      metalKg: 0.6,
      metalInr: 21.0,
      totalKg: 3.3,
      totalInr: 64.2,
      co2eAvoidedKg: 4.8,
    },
    highlightNote: 'Weekend declutter: 1.8 kg cardboard packaging turned in for recycling!',
  },
  {
    day: 'Sunday',
    dayShort: 'Sun',
    currentKwh: 13.6,
    pastKwh: 18.2,
    currentCostInr: 102,
    pastCostInr: 136.5,
    waste: {
      paperKg: 1.4,
      paperInr: 19.6,
      plasticKg: 0.6,
      plasticInr: 12.0,
      metalKg: 0.2,
      metalInr: 7.0,
      totalKg: 2.2,
      totalInr: 38.6,
      co2eAvoidedKg: 3.3,
    },
    highlightNote: 'Unplugged all entertainment chargers before bed. Zero vampire draw.',
  },
];

interface WeeklyComparisonGraphProps {
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export const WeeklyComparisonGraph: React.FC<WeeklyComparisonGraphProps> = ({
  title = 'Past Week vs Current Week Carbon & Waste Telemetry',
  subtitle = 'Hover over any day (e.g. Tuesday) to see exact daily energy shift and waste classification (Paper, Plastic, Metal)',
  compact = false,
}) => {
  const { userSettings } = useGreenPulse();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(1); // Default highlight Tuesday for instant clarity!
  const [metricView, setMetricView] = useState<'energy' | 'waste'>('energy');

  // Aggregated weekly totals
  const totalCurrentKwh = WEEKLY_COMPARISON_DATA.reduce((acc, d) => acc + d.currentKwh, 0);
  const totalPastKwh = WEEKLY_COMPARISON_DATA.reduce((acc, d) => acc + d.pastKwh, 0);
  const totalKwhSaved = totalPastKwh - totalCurrentKwh;
  const totalMoneySavedInr = totalKwhSaved * userSettings.tariffRate;

  const totalPaperKg = WEEKLY_COMPARISON_DATA.reduce((acc, d) => acc + d.waste.paperKg, 0);
  const totalPlasticKg = WEEKLY_COMPARISON_DATA.reduce((acc, d) => acc + d.waste.plasticKg, 0);
  const totalMetalKg = WEEKLY_COMPARISON_DATA.reduce((acc, d) => acc + d.waste.metalKg, 0);
  const totalWasteInr = WEEKLY_COMPARISON_DATA.reduce((acc, d) => acc + d.waste.totalInr, 0);

  const activeDay = hoveredIndex !== null ? WEEKLY_COMPARISON_DATA[hoveredIndex] : WEEKLY_COMPARISON_DATA[1];

  // Maximum value for scaling the SVG chart bars
  const maxKwh = Math.max(...WEEKLY_COMPARISON_DATA.map((d) => Math.max(d.currentKwh, d.pastKwh)));
  const maxWasteKg = Math.max(...WEEKLY_COMPARISON_DATA.map((d) => d.waste.totalKg));

  return (
    <div className="bg-[#071c12] border border-[#8fe77d]/30 rounded-3xl p-5 sm:p-6 text-[#f4f4df] space-y-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Background soft glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#8fe77d]/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Header Bar with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#8fe77d]/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#8fe77d]">
            <Sparkles className="w-4 h-4 text-[#8fe77d]" />
            <span>RESPONSIVE HOVER TELEMETRY</span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-[#f4f4df] mt-1 flex items-center gap-2">
            <span>{title}</span>
          </h3>
          <p className="text-xs text-[#a4b9a8] mt-0.5 max-w-2xl">{subtitle}</p>
        </div>

        {/* Metric View Switcher */}
        <div className="flex items-center gap-1.5 bg-[#04160e] p-1.5 rounded-2xl border border-[#8fe77d]/25 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setMetricView('energy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              metricView === 'energy'
                ? 'bg-[#8fe77d] text-[#04160e] shadow-md'
                : 'text-[#a4b9a8] hover:text-[#f4f4df]'
            }`}
          >
            ⚡ Energy (kWh & ₹)
          </button>
          <button
            type="button"
            onClick={() => setMetricView('waste')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              metricView === 'waste'
                ? 'bg-[#8fe77d] text-[#04160e] shadow-md'
                : 'text-[#a4b9a8] hover:text-[#f4f4df]'
            }`}
          >
            ♻️ Waste (Paper/Plastic/Metal)
          </button>
        </div>
      </div>

      {/* 2. Interactive Chart Container with Mouse Hover Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Chart Column (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 bg-[#04160e]/80 border border-[#8fe77d]/20 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between text-xs text-[#a4b9a8] mb-3">
            <span className="flex items-center gap-2 font-mono">
              <span className="w-3 h-3 rounded-sm bg-[#8fe77d] inline-block" />
              <strong className="text-[#f4f4df]">Current Week</strong>
              <span className="w-3 h-3 rounded-sm bg-[#3a5847] inline-block ml-3" />
              <span>Past Week</span>
            </span>
            <span className="text-[11px] text-[#f4cc69] font-medium bg-[#102b1d] px-2.5 py-0.5 rounded-full border border-[#8fe77d]/20">
              💡 Hover on any day column
            </span>
          </div>

          {/* SVG / Bar Columns Graph */}
          <div className="pt-4 pb-2">
            <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-56 sm:h-64 px-1">
              {WEEKLY_COMPARISON_DATA.map((item, idx) => {
                const isHovered = hoveredIndex === idx;

                const primaryCurrentVal = metricView === 'energy' ? item.currentKwh : item.waste.totalKg;
                const primaryPastVal = metricView === 'energy' ? item.pastKwh : (item.waste.totalKg * 0.7); // comparison baseline
                const maxVal = metricView === 'energy' ? maxKwh : maxWasteKg;

                const currentHeightPct = Math.round((primaryCurrentVal / (maxVal * 1.15)) * 100);
                const pastHeightPct = Math.round((primaryPastVal / (maxVal * 1.15)) * 100);

                return (
                  <div
                    key={item.day}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    className={`flex flex-col items-center h-full justify-end cursor-pointer group transition-all rounded-xl p-1 relative ${
                      isHovered ? 'bg-[#102e1f] ring-2 ring-[#8fe77d] shadow-lg scale-105' : 'hover:bg-[#082216]'
                    }`}
                  >
                    {/* Floating Value pill on top of bar */}
                    {isHovered && (
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#8fe77d] text-[#04160e] text-[10px] font-extrabold px-1.5 py-0.5 rounded-md shadow-md animate-fade-in pointer-events-none z-20">
                        {metricView === 'energy' ? `${item.currentKwh} kWh` : `${item.waste.totalKg} kg`}
                      </div>
                    )}

                    {/* Dual Bars: Past Week (left) vs Current Week (right) */}
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-44">
                      {/* Past Week Bar */}
                      <div
                        style={{ height: `${pastHeightPct}%` }}
                        className={`w-3 sm:w-4 rounded-t-md transition-all duration-300 ${
                          isHovered ? 'bg-[#527763]' : 'bg-[#294234]'
                        }`}
                        title={`Past Week: ${primaryPastVal.toFixed(1)}`}
                      />

                      {/* Current Week Bar (Glowing Green) */}
                      <div
                        style={{ height: `${currentHeightPct}%` }}
                        className={`w-3.5 sm:w-5 rounded-t-md transition-all duration-300 relative ${
                          isHovered
                            ? 'bg-[#8fe77d] shadow-[0_0_12px_rgba(143,231,125,0.8)]'
                            : 'bg-[#6ec961] opacity-90'
                        }`}
                        title={`Current Week: ${primaryCurrentVal.toFixed(1)}`}
                      >
                        {/* Internal gradient line */}
                        <div className="w-full h-1 bg-white/40 rounded-t-md" />
                      </div>
                    </div>

                    {/* Day label */}
                    <div className="mt-2 text-center">
                      <span
                        className={`text-[11px] sm:text-xs font-bold block transition-colors ${
                          isHovered ? 'text-[#8fe77d] underline underline-offset-4' : 'text-[#a4b9a8]'
                        }`}
                      >
                        {item.dayShort}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Footer Summary */}
          <div className="mt-3 pt-3 border-t border-[#8fe77d]/15 flex flex-wrap items-center justify-between gap-2 text-xs text-[#a4b9a8]">
            <span className="flex items-center gap-1.5 text-[#8fe77d] font-bold">
              <TrendingDown className="w-4 h-4" />
              <span>Reduced electricity consumption by {totalKwhSaved.toFixed(1)} kWh this week</span>
            </span>
            <span className="font-mono text-[#f4cc69] font-bold">
              Saved ~{userSettings.currency}{totalMoneySavedInr.toFixed(0)} INR in energy costs
            </span>
          </div>
        </div>

        {/* Active Day Hover Inspector Tooltip Card (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-[#0a271a] border-2 border-[#8fe77d]/40 rounded-2xl p-5 space-y-4 shadow-xl animate-fade-in relative">
          <div className="flex items-center justify-between border-b border-[#8fe77d]/20 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8fe77d] font-extrabold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>INSPECTOR · HOVERED DAY</span>
              </span>
              <h4 className="text-xl font-extrabold text-[#f4f4df] m-0">
                {activeDay.day}
              </h4>
            </div>
            <span className="text-xs bg-[#8fe77d]/20 text-[#8fe77d] font-bold px-2.5 py-1 rounded-full border border-[#8fe77d]/40 font-mono">
              Day {(hoveredIndex ?? 1) + 1} of 7
            </span>
          </div>

          {/* Energy Comparison for Hovered Day */}
          <div className="bg-[#05170f] p-3 rounded-xl border border-[#8fe77d]/20 space-y-2">
            <span className="text-[11px] font-bold text-[#8fe77d] uppercase tracking-wide block font-mono">
              ⚡ Daily Electricity Comparison:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#102b1d] p-2 rounded-lg">
                <span className="text-[#a4b9a8] block text-[10px]">Current Week</span>
                <strong className="text-sm font-extrabold text-[#8fe77d] font-mono">
                  {activeDay.currentKwh} kWh
                </strong>
                <span className="block text-[10px] text-[#f4f4df]/80 font-mono mt-0.5">
                  ₹{activeDay.currentCostInr} INR
                </span>
              </div>
              <div className="bg-[#102b1d] p-2 rounded-lg">
                <span className="text-[#a4b9a8] block text-[10px]">Past Week</span>
                <strong className="text-sm font-bold text-[#a4b9a8] font-mono">
                  {activeDay.pastKwh} kWh
                </strong>
                <span className="block text-[10px] text-[#a4b9a8] font-mono mt-0.5">
                  ₹{activeDay.pastCostInr} INR
                </span>
              </div>
            </div>
            <div className="text-[11px] text-[#78d468] font-semibold pt-1 flex items-center justify-between">
              <span>Net Day Improvement:</span>
              <span className="font-mono font-bold">
                -{(activeDay.pastKwh - activeDay.currentKwh).toFixed(1)} kWh (Saved ₹{(activeDay.pastCostInr - activeDay.currentCostInr).toFixed(1)})
              </span>
            </div>
          </div>

          {/* Waste Classification Breakdown (Paper, Plastic, Metal) */}
          <div className="bg-[#05170f] p-3 rounded-xl border border-[#8fe77d]/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#f4cc69] uppercase tracking-wide font-mono flex items-center gap-1">
                <span>♻️ Waste Classification ({activeDay.day}):</span>
              </span>
              <span className="text-[10px] text-[#8fe77d] font-mono font-bold">
                {activeDay.waste.totalKg} kg total
              </span>
            </div>

            {/* Classification List: Paper, Plastic, Metal */}
            <div className="space-y-1.5 text-xs">
              {/* Paper & Cardboard */}
              <div className="flex items-center justify-between bg-[#0b2418] p-2 rounded-lg border border-[#8fe77d]/15">
                <span className="flex items-center gap-1.5 text-[#f4f4df]">
                  <span>📄</span>
                  <span>Paper & Cardboard</span>
                </span>
                <div className="text-right font-mono">
                  <strong className="text-[#8fe77d]">{activeDay.waste.paperKg} kg</strong>
                  <span className="text-[10px] text-[#f4cc69] block">
                    (₹{activeDay.waste.paperInr.toFixed(1)} raddi value)
                  </span>
                </div>
              </div>

              {/* Plastic */}
              <div className="flex items-center justify-between bg-[#0b2418] p-2 rounded-lg border border-[#8fe77d]/15">
                <span className="flex items-center gap-1.5 text-[#f4f4df]">
                  <span>🧴</span>
                  <span>Plastic Bottles & Packaging</span>
                </span>
                <div className="text-right font-mono">
                  <strong className="text-[#8fe77d]">{activeDay.waste.plasticKg} kg</strong>
                  <span className="text-[10px] text-[#f4cc69] block">
                    (₹{activeDay.waste.plasticInr.toFixed(1)} scrap value)
                  </span>
                </div>
              </div>

              {/* Metal */}
              <div className="flex items-center justify-between bg-[#0b2418] p-2 rounded-lg border border-[#8fe77d]/15">
                <span className="flex items-center gap-1.5 text-[#f4f4df]">
                  <span>🥫</span>
                  <span>Metal & Beverage Cans</span>
                </span>
                <div className="text-right font-mono">
                  <strong className="text-[#8fe77d]">{activeDay.waste.metalKg} kg</strong>
                  <span className="text-[10px] text-[#f4cc69] block">
                    (₹{activeDay.waste.metalInr.toFixed(1)} scrap value)
                  </span>
                </div>
              </div>
            </div>

            {/* Environmental Savings Summary */}
            <div className="bg-[#102b1d] p-2 rounded-lg border border-[#8fe77d]/20 text-[11px] text-[#b8cabb] space-y-1">
              <div className="flex justify-between font-bold text-[#8fe77d]">
                <span>Total Scrap Value Earned:</span>
                <span className="font-mono">₹{activeDay.waste.totalInr.toFixed(1)} INR</span>
              </div>
              <div className="flex justify-between">
                <span>Avoided Carbon Emissions:</span>
                <span className="font-mono text-[#f4f4df]">{activeDay.waste.co2eAvoidedKg} kg CO₂e</span>
              </div>
            </div>
          </div>

          {/* Daily Highlight Note */}
          <p className="text-[11px] text-[#a4b9a8] italic bg-[#05170f]/50 p-2.5 rounded-xl border border-[#8fe77d]/10 m-0">
            &ldquo;{activeDay.highlightNote}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
};
