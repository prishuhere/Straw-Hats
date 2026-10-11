import React from 'react';
import { useGreenPulse, AppTab } from '../context/GreenPulseContext';
import { Sparkles, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

interface StepInfo {
  step: number;
  tab: AppTab;
  title: string;
  badge: string;
  description: string;
}

const DEMO_STEPS: StepInfo[] = [
  {
    step: 1,
    tab: 'dashboard',
    title: '1. Overview Dashboard',
    badge: 'Track & Understand',
    description: 'Review overall sustainability impact score, current energy usage, waste diversion rate, and next recommended action.',
  },
  {
    step: 2,
    tab: 'energy',
    title: '2. Track Energy Appliance',
    badge: 'Transparent Math',
    description: 'Calculate real-time kWh, financial cost, and grid CO₂e using regional tariffs and transparent formula breakdown.',
  },
  {
    step: 3,
    tab: 'waste',
    title: '3. Scan Waste Item',
    badge: 'AI Vision / Guidance',
    description: 'Classify material (PET, aluminum, organics) with Gemini multimodal AI, contamination warnings, and carbon avoided.',
  },
  {
    step: 4,
    tab: 'coach',
    title: '4. AI Coach & Forecaster',
    badge: 'Personalized AI',
    description: 'Receive custom recommendations grounded in your tracked energy and waste history, with 1-click what-if simulation.',
  },
  {
    step: 5,
    tab: 'missions',
    title: '5. 7-Day Streak & Letter',
    badge: 'Act & Gamify',
    description: 'Check in with daily eco-actions, earn +XP points, protect your streak, and unlock your Day 7 Appreciation Letter.',
  },
  {
    step: 6,
    tab: 'impact',
    title: '6. Long-Term Impact',
    badge: 'Measure & Improve',
    description: 'Visualize 7/30/365-day trends, energy category breakdowns, waste stream split, and tangible environmental equivalencies.',
  },
];

export const HackathonDemoBar: React.FC = () => {
  const {
    demoStep,
    setDemoStep,
    setActiveTab,
    isDemoBarOpen,
    setIsDemoBarOpen,
    resetToDemoData,
  } = useGreenPulse();

  const currentStepInfo = DEMO_STEPS.find((s) => s.step === demoStep) || DEMO_STEPS[0];

  const handleStepJump = (step: number) => {
    setDemoStep(step);
    const target = DEMO_STEPS.find((s) => s.step === step);
    if (target) {
      setActiveTab(target.tab);
    }
  };

  const handleNext = () => {
    const nextStep = demoStep >= 6 ? 1 : demoStep + 1;
    handleStepJump(nextStep);
  };

  if (!isDemoBarOpen) {
    return (
      <button
        onClick={() => setIsDemoBarOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-[#153e2b] hover:bg-[#20563b] text-white font-bold text-xs px-3.5 py-2.5 rounded-full shadow-xl flex items-center gap-2 border border-[#c8ef83]/30 transition-transform hover:scale-105"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#c8ef83]" />
        <span>Hackathon Guided Tour (Step {demoStep}/6)</span>
        <ChevronUp className="w-3.5 h-3.5 text-[#c8ef83]" />
      </button>
    );
  }

  return (
    <div className="bg-[#153e2b] text-white border-b border-[#20563b] shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Header & Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#20563b] border border-[#2f8152] px-2.5 py-1 rounded-lg text-[#c8ef83] text-xs font-bold">
              <span className="text-sm">🌿</span>
              <span>AWS + Google Hackathon Tour</span>
            </div>
            <span className="text-xs text-[#b9d7bd] hidden sm:inline font-medium">
              Track → Understand → Act → Measure → Improve
            </span>
          </div>

          {/* Stepper Buttons & Actions */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <div className="flex items-center gap-1 bg-[#0d2a1d] p-1 rounded-xl border border-[#20563b]">
              {DEMO_STEPS.map((s) => {
                const isActive = s.step === demoStep;
                const isCompleted = s.step < demoStep;
                return (
                  <button
                    key={s.step}
                    onClick={() => handleStepJump(s.step)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'bg-[#c8ef83] text-[#153e2b] shadow-sm'
                        : isCompleted
                        ? 'text-[#c8ef83] hover:bg-[#20563b]'
                        : 'text-[#9ab99e] hover:text-white hover:bg-[#20563b]'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-3 h-3 text-[#c8ef83]" />
                    ) : (
                      <span
                        className={`w-3.5 h-3.5 rounded-full text-[10px] flex items-center justify-center font-extrabold ${
                          isActive ? 'bg-[#153e2b] text-[#c8ef83]' : 'bg-[#20563b] text-[#c2ddc5]'
                        }`}
                      >
                        {s.step}
                      </span>
                    )}
                    <span className="hidden lg:inline">{s.title.split('. ')[1]}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              className="bg-[#c8ef83] hover:bg-[#bce673] text-[#153e2b] text-xs font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm transition-colors whitespace-nowrap"
            >
              <span>{demoStep === 6 ? 'Restart' : 'Next Step'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            <button
              onClick={resetToDemoData}
              title="Reset sample data"
              className="text-[#b9d7bd] hover:text-white p-1.5 rounded-lg hover:bg-[#20563b] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsDemoBarOpen(false)}
              className="text-[#b9d7bd] hover:text-white p-1.5 rounded-lg hover:bg-[#20563b] transition-colors"
              title="Collapse tour"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step Context Banner */}
        <div className="mt-2 pt-2 border-t border-[#20563b] flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#c8ef83]/20 text-[#c8ef83] font-bold px-2 py-0.5 rounded-full text-[10px] border border-[#c8ef83]/30">
              {currentStepInfo.badge}
            </span>
            <span className="text-[#e2f1e4] font-medium">
              {currentStepInfo.description}
            </span>
          </div>
          <button
            onClick={() => handleStepJump(currentStepInfo.step)}
            className="text-[#c8ef83] hover:underline font-bold text-[11px] flex items-center gap-1"
          >
            Go to {currentStepInfo.title} view &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
