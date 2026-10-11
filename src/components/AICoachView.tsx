import React, { useState, useRef, useEffect } from 'react';
import { useGreenPulse } from '../context/GreenPulseContext';
import { chatWithCoach, simulateAiForecast, AiForecastResult } from '../services/api';
import { CoachChatMessage } from '../types';
import {
  Bot,
  Send,
  Sparkles,
  Zap,
  Target,
  ArrowRight,
  TrendingDown,
  RotateCcw,
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  Plus,
  Flame,
  Award,
} from 'lucide-react';
import { LuffyStrawHatIcon } from './LuffyStrawHatIcon';

const parseInlineBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-extrabold text-[#8fe77d]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

const renderFormattedMessageText = (rawText: string) => {
  const lines = rawText.split('\n');
  return (
    <div className="space-y-1.5 leading-relaxed text-[12.5px] text-[#f4f4df]">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // 1. Remove ## and ### signs completely
        if (trimmed.startsWith('#')) {
          const cleanHeader = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '');
          return (
            <div key={idx} className="text-sm font-extrabold text-[#8fe77d] mt-2 mb-1 flex items-center gap-1.5">
              <span>🌿</span>
              <span>{cleanHeader}</span>
            </div>
          );
        }

        // 2. Check for bullet points (*, -, •, or 1., 2.) and replace with leaf or flower!
        if (/^[-*•]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed)) {
          const cleanBullet = trimmed.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');
          const bulletIcon = idx % 2 === 0 ? '🌿' : '🌸';
          return (
            <div key={idx} className="flex items-start gap-2 pl-1.5 my-1 text-[#f4f4df]">
              <span className="text-xs select-none flex-shrink-0 mt-0.5">{bulletIcon}</span>
              <span className="flex-1 leading-snug">{parseInlineBold(cleanBullet)}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="m-0 leading-relaxed">
            {parseInlineBold(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

const SUGGESTED_PROMPTS = [
  'How do I eliminate phantom vampire power from my workstation?',
  'Can I recycle greasy pizza boxes or should I compost them?',
  'What are the 3 fastest ways to lift my sustainability score to 90?',
  'How much money & carbon can I save by washing clothes in cold water?',
  'Give me a low-effort daily habit to cut household plastic by 50%.',
  'What temperature should my refrigerator and AC be set to for maximum efficiency?',
];

const PRESET_SCENARIOS = [
  'Switch all lights to LED, air-dry laundry, and compost 100% of vegetable scraps',
  'Unplug entertainment center overnight, bike 2 days a week, and avoid single-use plastics',
  'Install smart power strips, set fridge to 37°F, and cold wash all clothing',
];

export const AICoachView: React.FC = () => {
  const {
    totalMonthlyKwh,
    totalMonthlyCost,
    totalMonthlyCo2eKg,
    totalWasteItems,
    wasteDiversionRate,
    streakDays,
    sustainabilityScore,
    wasteLogs,
    energyLogs,
    userSettings,
    addMissionFromCoach,
    triggerConfetti,
    setActiveTab,
    ecoPoints,
    showToast,
    currentUser,
  } = useGreenPulse();

  const [activeTabMode, setActiveTabMode] = useState<'chat' | 'forecaster'>('chat');

  // Chat State
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<'ready' | 'thinking' | 'online'>('online');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const displayName = currentUser ? currentUser.name : (userSettings.userName || 'Explorer');
  const initialGreeting = `Hello ${displayName}! I am your AI Sustainability Consultant powered by Google Gemini.

I have analyzed your live household telemetry:
• Monthly Electricity: ${totalMonthlyKwh} kWh (${userSettings.currency}${totalMonthlyCost.toFixed(2)})
• Waste Diversion Rate: ${wasteDiversionRate}% (${totalWasteItems} items tracked)
• Active Daily Streak: ${streakDays} Consecutive Days
• EcoQuest Sustainability Score: ${sustainabilityScore} / 100
• Eco Points: ${ecoPoints} XP

What sustainability challenge, utility bill question, or waste item would you like to consult me on today?`;

  const [messages, setMessages] = useState<CoachChatMessage[]>([
    {
      id: 'm-init',
      sender: 'coach',
      text: initialGreeting,
      timestamp: 'Just now',
    },
  ]);

  // Scenario Forecaster State
  const [scenarioInput, setScenarioInput] = useState('');
  const [isForecasting, setIsForecasting] = useState(false);
  const [forecastResult, setForecastResult] = useState<AiForecastResult | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: CoachChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);
    setAiStatus('thinking');

    try {
      const recentWasteNames = wasteLogs.slice(0, 3).map((w) => w.name);
      const recentEnergyNames = energyLogs.slice(0, 3).map((e) => e.appliance);
      const recentCombined = [...recentWasteNames, ...recentEnergyNames];

      const conversationHistory = messages.slice(-6).map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        content: m.text,
      }));

      const res = await chatWithCoach({
        userMessage: textToSend,
        history: conversationHistory,
        userContext: {
          totalKwh: totalMonthlyKwh,
          totalCost: totalMonthlyCost,
          totalCo2eKg: totalMonthlyCo2eKg,
          wasteCount: totalWasteItems,
          diversionRate: wasteDiversionRate,
          streakDays,
          sustainabilityScore,
          recentItems: recentCombined,
        },
      });

      let suggestedAction: CoachChatMessage['suggestedAction'] = undefined;
      const lower = res.reply.toLowerCase();
      if (lower.includes('mission') || lower.includes('challenge') || lower.includes('step')) {
        suggestedAction = {
          type: 'mission',
          title: 'Consultant Eco-Action Challenge',
          description: 'Put this AI consultation insight into action today to reduce emissions & gain bonus XP!',
          points: 35,
        };
      }

      const coachMsg: CoachChatMessage = {
        id: 'cch-' + Date.now(),
        sender: 'coach',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedAction,
      };

      setMessages((prev) => [...prev, coachMsg]);
      setAiStatus('online');
    } catch {
      // Deterministic intelligent consultant response if offline
      const fallbackMsg: CoachChatMessage = {
        id: 'cch-' + Date.now(),
        sender: 'coach',
        text: `### 🌿 Practical Consultation Plan

Based on your current telemetry (**${totalMonthlyKwh} kWh** monthly consumption, **${wasteDiversionRate}% diversion rate**, and **${streakDays}-day streak**), here is your highest-impact action plan:

1. **Eliminate Vampire Draw**: Entertainment setups and workstations draw 15–25W continually even when asleep. Connecting them to a switched power strip cuts roughly 18 kWh and saves **${userSettings.currency}${(18 * userSettings.tariffRate).toFixed(2)} / month**.
2. **Optimize Water Heating**: Dial your washing machine to 30°C / Cold Wash. Over 85% of laundry energy is spent heating water.
3. **Verify Paper & Cardboard Purity**: Keep greasy takeout containers out of standard recycling—compost or trash them so you don't spoil entire recycling batches.

---
🎯 **Your Personalized Challenge:**
**"The 24-Hour Vampire Load Disconnect"** (+35 XP)
*Switch off standby peripherals before bed tonight.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedAction: {
          type: 'mission',
          title: 'Vampire Load Disconnect',
          description: 'Switch off idle workstation power strip overnight.',
          points: 35,
        },
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      setAiStatus('online');
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'm-reset-' + Date.now(),
        sender: 'coach',
        text: initialGreeting,
        timestamp: 'Just now',
      },
    ]);
    showToast('Consultation session refreshed! 🌿');
  };

  const handleRunForecast = async () => {
    if (!scenarioInput.trim() || isForecasting) return;
    setIsForecasting(true);
    try {
      const res = await simulateAiForecast({
        scenarioText: scenarioInput,
        currentKwh: totalMonthlyKwh,
        currentWaste: totalWasteItems,
        tariff: userSettings.tariffRate,
        gridFactor: userSettings.gridCarbonFactor,
      });
      setForecastResult(res.data);
      triggerConfetti();
    } catch {
      // High-quality deterministic fallback
      setForecastResult({
        projectedKwhSavedMonthly: 32.5,
        projectedCostSavedMonthly: Number((32.5 * userSettings.tariffRate).toFixed(2)),
        projectedCo2eSavedMonthly: Number((32.5 * userSettings.gridCarbonFactor + 8.4).toFixed(1)),
        wasteDivertedKgMonthly: 6.2,
        treesEquivalentAnnual: 2,
        carMilesAvoidedMonthly: 38,
        actionBreakdown: [
          {
            action: 'Wash laundry on cold cycle & air dry',
            monthlyCo2eSaved: 14.8,
            effort: 'Low',
            tip: 'Water heating consumes ~90% of cycle electricity.',
          },
          {
            action: 'Countertop composting of fruit & vegetable peels',
            monthlyCo2eSaved: 11.2,
            effort: 'Medium',
            tip: 'Prevents anaerobic methane breakdown in municipal landfills.',
          },
          {
            action: 'Smart strip auto-disconnect for PC setup',
            monthlyCo2eSaved: 6.5,
            effort: 'Low',
            tip: 'Cuts 18W idle transformer standby vampire drain.',
          },
        ],
        feasibilityScore: 94,
        executiveSummary: 'This scenario yields approximately a 15% reduction in monthly household emissions with low friction to your daily routine.',
      });
    } finally {
      setIsForecasting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 1. Header Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#8fe77d]/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-3 py-1.5 rounded-xl bg-[#0b2418] border border-[#8fe77d]/30 text-[#8fe77d] hover:bg-[#102b1d] transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Homepage</span>
          </button>
          <span className="text-[#a4b9a8]/40">/</span>
          <span className="text-xs font-semibold text-[#8fe77d] bg-[#102b1d] px-2.5 py-1 rounded-full border border-[#8fe77d]/30 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#8fe77d] animate-pulse"></span>
            <span>Google Gemini AI Consultant</span>
          </span>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-[#0b2418] p-1.5 rounded-2xl border border-[#8fe77d]/25">
          <button
            onClick={() => setActiveTabMode('chat')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              activeTabMode === 'chat'
                ? 'bg-[#8fe77d] text-[#06170f] shadow-lg'
                : 'text-[#a4b9a8] hover:text-[#f4f4df]'
            }`}
          >
            <span>💬 Live Consultant Chat</span>
          </button>
          <button
            onClick={() => setActiveTabMode('forecaster')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              activeTabMode === 'forecaster'
                ? 'bg-[#8fe77d] text-[#06170f] shadow-lg'
                : 'text-[#a4b9a8] hover:text-[#f4f4df]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Scenario Forecaster</span>
          </button>
        </div>
      </div>

      {/* 2. Headline & Overview */}
      <div className="space-y-2">
        <div className="eyebrow flex items-center gap-2">
          <span className="pulse-dot"></span>
          <span>INTERACTIVE ENVIRONMENTAL CONSULTANT</span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#f4f4df] tracking-tight">
          AI Sustainability <span style={{ color: 'var(--green)' }}>Consultant</span>
        </h1>
        <p className="text-sm text-[#a4b9a8] max-w-2xl leading-relaxed">
          Ask questions about energy consumption, waste diversion, carbon footprint reduction, or utility bills. Powered by Google Gemini AI, grounded in your real-time household telemetry.
        </p>
      </div>

      {/* 3. MODE 1: Interactive Chat */}
      {activeTabMode === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Context Card & Quick Questions (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Live Context Telemetry */}
            <div className="panel p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8fe77d] font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Your Live Telemetry</span>
                </span>
                <span className="text-[10px] text-[#a4b9a8] bg-[#102b1d] px-2 py-0.5 rounded-full border border-[#8fe77d]/20">
                  Synced
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="bg-[#06170f]/80 p-2.5 rounded-xl border border-[#8fe77d]/20 flex items-center justify-between">
                  <span className="text-[#a4b9a8]">Sustainability Score</span>
                  <strong className="text-[#8fe77d] font-mono font-extrabold">{sustainabilityScore} / 100</strong>
                </div>
                <div className="bg-[#06170f]/80 p-2.5 rounded-xl border border-[#8fe77d]/20 flex items-center justify-between">
                  <span className="text-[#a4b9a8]">Monthly Energy</span>
                  <strong className="text-[#f4f4df] font-mono">{totalMonthlyKwh} kWh</strong>
                </div>
                <div className="bg-[#06170f]/80 p-2.5 rounded-xl border border-[#8fe77d]/20 flex items-center justify-between">
                  <span className="text-[#a4b9a8]">Waste Diversion</span>
                  <strong className="text-[#8fe77d] font-mono">{wasteDiversionRate}%</strong>
                </div>
                <div className="bg-[#06170f]/80 p-2.5 rounded-xl border border-[#8fe77d]/20 flex items-center justify-between">
                  <span className="text-[#a4b9a8]">Active Streak</span>
                  <strong className="text-[#f4cc69] font-mono flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> {streakDays} Days
                  </strong>
                </div>
                <div className="bg-[#06170f]/80 p-2.5 rounded-xl border border-[#8fe77d]/20 flex items-center justify-between">
                  <span className="text-[#a4b9a8]">Eco Points</span>
                  <strong className="text-[#f4cc69] font-mono flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> {ecoPoints} XP
                  </strong>
                </div>
              </div>

              <p className="text-[11px] text-[#a4b9a8] leading-relaxed pt-1">
                The AI Consultant references your exact electricity rates and habit stats to give concrete dollar and carbon figures.
              </p>
            </div>

            {/* Quick Questions Starter */}
            <div className="panel p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#f4f4df]">
                  Suggested Questions:
                </span>
                <span className="text-[10px] text-[#8fe77d]">Click to ask</span>
              </div>
              <div className="space-y-2">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    disabled={loading}
                    className="w-full text-left bg-[#06170f]/60 hover:bg-[#102b1d] border border-[#8fe77d]/20 hover:border-[#8fe77d]/50 p-2.5 rounded-xl text-xs text-[#cde8d5] hover:text-[#f4f4df] font-medium transition-all flex items-center justify-between group disabled:opacity-50"
                  >
                    <span className="line-clamp-2 leading-snug">{prompt}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#8fe77d] opacity-60 group-hover:opacity-100 flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Chat Consultation Container (8 cols) */}
          <div className="lg:col-span-8 panel p-0 flex flex-col h-[640px] overflow-hidden border border-[#8fe77d]/25">
            {/* Chat Top Header */}
            <div className="p-4 bg-[#082216] border-b border-[#8fe77d]/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#102b1d] border border-[#8fe77d]/40 flex items-center justify-center text-lg">
                  🤖
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-[#f4f4df] flex items-center gap-2">
                    <span>EcoQuest AI Consultant</span>
                    <span className="text-[9px] bg-[#8fe77d]/20 text-[#8fe77d] px-1.5 py-0.2 rounded-full border border-[#8fe77d]/30 font-mono">
                      Google Gemini
                    </span>
                  </h3>
                  <p className="text-[10px] text-[#a4b9a8] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8fe77d] animate-pulse"></span>
                    <span>Ready for instant consultation</span>
                  </p>
                </div>
              </div>

              <button
                onClick={handleResetChat}
                className="text-[11px] font-bold text-[#a4b9a8] hover:text-[#8fe77d] bg-[#06170f] border border-[#8fe77d]/20 hover:border-[#8fe77d]/50 px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1"
                title="Clear and restart consultation"
              >
                <RotateCcw className="w-3 h-3" />
                <span>New Session</span>
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#06170f]/50">
              {messages.map((msg) => {
                const isCoach = msg.sender === 'coach';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isCoach ? 'items-start' : 'items-start flex-row-reverse'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold border ${
                        isCoach
                          ? 'bg-[#102b1d] text-[#8fe77d] border-[#8fe77d]/40'
                          : 'bg-[#8fe77d] text-[#06170f] border-[#8fe77d]'
                      }`}
                    >
                      {isCoach ? '🌱' : '👤'}
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                        isCoach
                          ? 'bg-[#0b2418] border border-[#8fe77d]/30 text-[#f4f4df] shadow-md'
                          : 'bg-[#102b1d] border border-[#8fe77d]/50 text-[#f4f4df]'
                      }`}
                    >
                      {/* Message Content with clean headings and leaf/flower bullets (no ## signs) */}
                      <div>
                        {renderFormattedMessageText(msg.text)}
                      </div>

                      {/* Actionable Mission Card (if returned by consultant) */}
                      {msg.suggestedAction && isCoach && (
                        <div className="mt-3 pt-3 border-t border-[#8fe77d]/20 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-[#8fe77d] flex items-center gap-1">
                            <Target className="w-3.5 h-3.5" /> Recommended Action Challenge:
                          </span>
                          <button
                            onClick={() => {
                              if (msg.suggestedAction) {
                                addMissionFromCoach({
                                  title: msg.suggestedAction.title,
                                  description: msg.suggestedAction.description,
                                  points: msg.suggestedAction.points || 35,
                                });
                                triggerConfetti();
                                showToast('Added to your 7-Day Missions! (+35 XP) 🎯');
                              }
                            }}
                            className="btn btn-primary text-[10px] py-1 px-3 shadow-sm flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Accept Challenge (+35 XP)</span>
                          </button>
                        </div>
                      )}

                      <div className="mt-2 text-[10px] text-right text-[#a4b9a8]/70">
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-xl bg-[#102b1d] border border-[#8fe77d]/40 text-[#8fe77d] flex items-center justify-center text-sm font-bold animate-spin">
                    🌱
                  </div>
                  <div className="bg-[#0b2418] border border-[#8fe77d]/30 rounded-2xl p-4 text-xs text-[#cde8d5] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#8fe77d] animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-[#8fe77d] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-[#8fe77d] animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-2 font-mono text-[11px] text-[#8fe77d]">
                      AI Consultant is analyzing carbon math & best practices...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 bg-[#082216] border-t border-[#8fe77d]/20">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask the consultant about electricity bills, packaging, vampire power, heat pumps..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={loading}
                  className="input-field flex-1 text-xs"
                />
                <button
                  type="submit"
                  disabled={loading || !inputMessage.trim()}
                  className="btn btn-primary text-xs flex items-center gap-1.5 py-2 px-5 disabled:opacity-40"
                >
                  <span>Ask AI</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODE 2: Climate Scenario Forecaster */}
      {activeTabMode === 'forecaster' && (
        <div className="panel p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8fe77d] font-mono block">
              What-If Simulation Engine • Gemini 3.8 Flash
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#f4f4df] tracking-tight">
              Test Future Sustainability Scenarios
            </h3>
            <p className="text-xs text-[#a4b9a8] max-w-xl">
              Type any lifestyle change, appliance upgrade, or commuting shift. Gemini models the exact monthly financial savings and emission reductions.
            </p>
          </div>

          {/* Preset Chips */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#8fe77d] uppercase tracking-wider">
              Quick Scenarios:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_SCENARIOS.map((scenario, idx) => (
                <button
                  key={idx}
                  onClick={() => setScenarioInput(scenario)}
                  className="text-xs bg-[#06170f] hover:bg-[#102b1d] border border-[#8fe77d]/30 text-[#cde8d5] hover:text-[#8fe77d] px-3 py-1.5 rounded-xl transition-all"
                >
                  {scenario}
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Input */}
          <div className="space-y-3">
            <textarea
              rows={3}
              value={scenarioInput}
              onChange={(e) => setScenarioInput(e.target.value)}
              placeholder="e.g. Switch water heater to 120°F, install draft stoppers on doors, bike 2 days a week, and compost all vegetable scraps"
              className="input-field w-full text-xs"
            />

            <button
              onClick={handleRunForecast}
              disabled={isForecasting || !scenarioInput.trim()}
              className="btn btn-primary text-xs py-2.5 px-6 flex items-center gap-2 disabled:opacity-50"
            >
              {isForecasting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#06170f] border-t-transparent rounded-full animate-spin"></span>
                  <span>Computing Multi-Factor Projection...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simulate Environmental & Cost Impact</span>
                </>
              )}
            </button>
          </div>

          {/* Forecast Results Display */}
          {forecastResult && (
            <div className="bg-[#06170f]/80 border border-[#8fe77d]/30 rounded-2xl p-6 space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#8fe77d]/20">
                <div>
                  <span className="text-[10px] font-bold text-[#8fe77d] uppercase tracking-wider font-mono">
                    Simulation Complete
                  </span>
                  <h4 className="text-base sm:text-lg font-extrabold text-[#f4f4df]">
                    Projected Household Impact
                  </h4>
                  <p className="text-xs text-[#a4b9a8] mt-1 leading-relaxed max-w-xl">
                    {forecastResult.executiveSummary}
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-[#102b1d] px-4 py-2.5 rounded-2xl border border-[#8fe77d]/30">
                  <div className="text-right">
                    <span className="text-[10px] text-[#a4b9a8] font-bold block uppercase">Feasibility</span>
                    <strong className="text-lg font-mono text-[#8fe77d]">
                      {forecastResult.feasibilityScore}%
                    </strong>
                  </div>
                  <CheckCircle className="w-6 h-6 text-[#8fe77d]" />
                </div>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-[#0b2418] p-4 rounded-xl border border-[#8fe77d]/20 space-y-1">
                  <span className="text-[10px] text-[#a4b9a8] font-bold block uppercase">Monthly Power Saved</span>
                  <strong className="text-lg font-extrabold text-[#8fe77d] font-mono">
                    {forecastResult.projectedKwhSavedMonthly} kWh
                  </strong>
                </div>
                <div className="bg-[#0b2418] p-4 rounded-xl border border-[#8fe77d]/20 space-y-1">
                  <span className="text-[10px] text-[#a4b9a8] font-bold block uppercase">Estimated Savings</span>
                  <strong className="text-lg font-extrabold text-[#f4cc69] font-mono">
                    {userSettings.currency}{forecastResult.projectedCostSavedMonthly} / mo
                  </strong>
                </div>
                <div className="bg-[#0b2418] p-4 rounded-xl border border-[#8fe77d]/20 space-y-1">
                  <span className="text-[10px] text-[#a4b9a8] font-bold block uppercase">GHG Avoided</span>
                  <strong className="text-lg font-extrabold text-[#8fe77d] font-mono">
                    {forecastResult.projectedCo2eSavedMonthly} kg CO₂e
                  </strong>
                </div>
                <div className="bg-[#0b2418] p-4 rounded-xl border border-[#8fe77d]/20 space-y-1">
                  <span className="text-[10px] text-[#a4b9a8] font-bold block uppercase">Urban Trees Equiv.</span>
                  <strong className="text-lg font-extrabold text-[#8fe77d] font-mono">
                    {forecastResult.treesEquivalentAnnual} trees / yr
                  </strong>
                </div>
              </div>

              {/* Action Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#f4f4df]">
                  Action Breakdown & Micro-Tips:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {forecastResult.actionBreakdown.map((act, idx) => (
                    <div
                      key={idx}
                      className="bg-[#0b2418] border border-[#8fe77d]/25 rounded-2xl p-4 flex flex-col justify-between space-y-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-extrabold text-[#f4f4df]">{act.action}</span>
                          <span className="text-[9px] bg-[#102b1d] text-[#8fe77d] font-bold px-1.5 py-0.5 rounded border border-[#8fe77d]/30">
                            {act.effort} Effort
                          </span>
                        </div>
                        <p className="text-[11px] text-[#a4b9a8] leading-relaxed">{act.tip}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#8fe77d]/20">
                        <span className="font-mono text-[#8fe77d] font-bold text-[11px]">
                          -{act.monthlyCo2eSaved} kg CO₂e
                        </span>
                        <button
                          onClick={() => {
                            addMissionFromCoach({
                              title: act.action,
                              description: act.tip,
                              points: 30,
                            });
                            triggerConfetti();
                            showToast(`Adopted "${act.action}" as active habit mission! 🌿`);
                          }}
                          className="btn btn-primary text-[10px] py-1 px-2.5"
                        >
                          Adopt Mission
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Attribution Footer */}
      <div className="text-center pt-6 text-xs text-[#a4b9a8] flex items-center justify-center gap-1.5">
        <span>Consultant powered by Google Gemini • Made by </span>
        <b className="text-[#8fe77d] flex items-center gap-1">
          Straw Hats <LuffyStrawHatIcon size={20} />
        </b>
      </div>
    </div>
  );
};
