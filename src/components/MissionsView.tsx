import React, { useState } from 'react';
import { useGreenPulse } from '../context/GreenPulseContext';
import { generateAiLetter, generateAi7DayPlan, Ai7DayPlanResult } from '../services/api';
import {
  Target,
  Award,
  Flame,
  CheckCircle2,
  Sparkles,
  Zap,
  Trash2,
  Lock,
  Mail,
  Send,
  RefreshCw,
  Plus,
  ArrowLeft,
  Check,
} from 'lucide-react';

export const MissionsView: React.FC = () => {
  const {
    missions,
    badges,
    toggleMission,
    totalXp,
    userLevel,
    levelXpProgress,
    streakDays,
    totalWasteAvoidedCo2eKg,
    triggerConfetti,
    addMissionFromCoach,
    setActiveTab,
    currentUser,
    userSettings,
  } = useGreenPulse();

  // Streak Form State
  const [userName, setUserName] = useState(userSettings.userName || (currentUser ? currentUser.name : ''));
  const [selectedAction, setSelectedAction] = useState('segregated household waste');
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [checkInMsg, setCheckInMsg] = useState('Check in daily to build your 7-day habit streak and earn Green XP.');
  
  // AI Appreciation Letter State
  const [letterUnlocked, setLetterUnlocked] = useState(streakDays >= 7);
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [aiLetterText, setAiLetterText] = useState<string | null>(null);

  // AI 7-Day Carbon Diet Plan State
  const [planGoal, setPlanGoal] = useState('Cut monthly electricity bills by 20% and zero out landfill plastics');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [aiPlan, setAiPlan] = useState<Ai7DayPlanResult | null>(null);

  const handleCheckIn = () => {
    if (checkedInToday) return;
    setCheckedInToday(true);
    setCheckInMsg(`Today's action is recorded: "${selectedAction}". Thanks for taking a thoughtful step! (+15 XP)`);
    triggerConfetti();
  };

  const handleGenerateAiLetter = async () => {
    setIsGeneratingLetter(true);
    try {
      const res = await generateAiLetter({
        userName: userName.trim() || 'Eco Champion',
        streakDays: streakDays,
        lastAction: selectedAction,
        avoidedCo2e: totalWasteAvoidedCo2eKg || 18.5,
      });
      setAiLetterText(res.letter);
      setLetterUnlocked(true);
      triggerConfetti();
    } catch {
      // Safe fallback
      setAiLetterText(`Dear ${userName},\n\nEvery thoughtful choice ripples outward. Showing up for ${streakDays} consecutive days is not merely an achievement on a screen; it is a quiet declaration that your daily rhythms matter to the living world.\n\nThank you for being part of a greener tomorrow.\n\n— EcoQuest Community`);
      setLetterUnlocked(true);
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const handleGenerateAiPlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const res = await generateAi7DayPlan({ goal: planGoal, householdSize: 3 });
      setAiPlan(res.data);
      triggerConfetti();
    } catch (e) {
      console.warn('Plan fallback', e);
    } finally {
      setIsGeneratingPlan(false);
    }
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
          Habits & Milestone Letter
        </span>
      </div>

      {/* 1. Habit Streak & AI Appreciation Letter Panel (Refined Frosted Glass) */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 space-y-8 border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider font-mono block">
              Consistency & Micro-Habits
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Action Streak & Day 7 Appreciation Letter
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed">
            Record one sustainable action every calendar day. Achieving 7 consecutive days unlocks a personalized AI Appreciation Letter celebrating your impact.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Streak Panel (7 cols) */}
          <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">🌱 Your 7-Day Action Streak</h3>
                <p className="text-xs text-slate-500">One check-in per day builds lifelong conservation habits</p>
              </div>
              <div className="text-right">
                <strong className="text-4xl font-extrabold text-amber-600 font-mono leading-none block">
                  {streakDays}
                </strong>
                <span className="text-[10px] text-slate-500 tracking-wider uppercase font-bold">
                  DAY STREAK
                </span>
              </div>
            </div>

            {/* 7-Day Circles */}
            <div className="grid grid-cols-7 gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                const isDone = day <= streakDays;
                const isLast = day === 7;
                return (
                  <div key={day} className="text-center space-y-1.5">
                    <div
                      className={`aspect-square w-full rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                        isDone
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-400'
                      }`}
                    >
                      {isDone ? '✓' : isLast ? '✉' : String(day)}
                    </div>
                    <small className={`text-[9px] block font-bold font-mono ${isLast ? 'text-amber-700' : 'text-slate-400'}`}>
                      {isLast ? 'LETTER' : `DAY ${day}`}
                    </small>
                  </div>
                );
              })}
            </div>

            {/* Check-In Form */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. Your Name"
                    className="w-full bg-[#092216] border border-[#8fe77d]/30 text-[#f4f4df] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#8fe77d]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#cde8d5] mb-1">
                    Today&apos;s Eco Action
                  </label>
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value)}
                    className="w-full bg-[#092216] border border-[#8fe77d]/30 text-[#f4f4df] rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#8fe77d]"
                  >
                    <option value="separated household waste">Separated recyclables from landfill</option>
                    <option value="avoided single-use plastics">Avoided single-use plastics & carried tumbler</option>
                    <option value="used a greener commute or walked">Took public transit, EV, or walked</option>
                    <option value="turned off idle vampire electronics">Killed idle PC & workstation vampire drain</option>
                    <option value="avoided wasting water">Took short shower & fixed faucet drip</option>
                    <option value="reused or repaired an item">Mended garment or repaired appliance</option>
                    <option value="composted food scraps">Composted kitchen organic scraps</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleCheckIn}
                disabled={checkedInToday}
                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                  checkedInToday
                    ? 'bg-[#153e28] text-[#8fe77d] border border-[#8fe77d]/30 cursor-default'
                    : 'bg-[#8fe77d] hover:bg-[#a6f097] text-[#06170f] font-extrabold shadow-md'
                }`}
              >
                {checkedInToday ? '✓ Checked in today (+15 XP recorded)' : 'Record Today\'s Action (+15 XP)'}
              </button>

              <p className="text-[11px] text-slate-500 italic leading-relaxed">
                {checkInMsg}
              </p>
            </div>
          </div>

          {/* Right Column: Eco Appreciation Letter Card (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500 font-mono">
                    Official Recognition
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {letterUnlocked ? '✦ Letter Ready' : '🔒 Day 7 Milestone'}
                  </span>
                </div>

                <h3 className="font-editorial text-xl font-bold mt-3 mb-2 text-slate-900 leading-snug">
                  {letterUnlocked
                    ? `Dear ${userName || 'Eco Champion'}, your daily choices matter.`
                    : 'Quiet stewardship, acknowledged and celebrated.'}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line mt-2 font-editorial italic">
                  {aiLetterText ||
                    `Every thoughtful choice ripples outward. Check in for 7 consecutive days or click below to generate your custom AI Appreciation Letter celebrating the conservation habits you are anchoring in your life.`}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <small className="text-[10px] text-slate-500 font-mono">
                  {letterUnlocked
                    ? `Unlocked with ${streakDays}-day streak • ${totalXp} XP`
                    : `Requires 7-day streak • ${Math.max(0, 7 - streakDays)} days remaining`}
                </small>

                <button
                  onClick={handleGenerateAiLetter}
                  disabled={isGeneratingLetter}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isGeneratingLetter ? 'Drafting Letter...' : 'Generate AI Letter ✉'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. AI 7-Day Carbon Diet & Micro-Habit Generator */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono block">
              Gemini AI Micro-Action Engine
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Personalized 7-Day Carbon Diet Plan
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Let Gemini AI synthesize a custom day-by-day sustainability sprint tailored to your household goals.
            </p>
          </div>

          <button
            onClick={handleGenerateAiPlan}
            disabled={isGeneratingPlan}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{isGeneratingPlan ? 'Synthesizing Plan...' : 'Generate 7-Day Plan'}</span>
          </button>
        </div>

        {aiPlan ? (
          <div className="space-y-4 pt-2 animate-fade-in">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <strong className="text-sm font-extrabold text-slate-900 block">{aiPlan.planTitle}</strong>
                <span className="text-slate-600">{aiPlan.expertCoachNote}</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800 font-bold">
                  {aiPlan.totalEstimatedMonthlySavings}
                </span>
                <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800 font-bold">
                  {aiPlan.totalEstimatedCo2Saved}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              {aiPlan.dailyPlan.map((d) => (
                <div
                  key={d.day}
                  className="bg-white border border-slate-200 hover:border-slate-400 p-3 rounded-xl flex flex-col justify-between text-xs space-y-2 transition-all shadow-2xs"
                >
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-extrabold text-slate-900 font-mono text-[11px]">Day {d.day}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                        +{d.xpPoints} XP
                      </span>
                    </div>
                    <strong className="text-slate-900 text-xs block mb-1">{d.title}</strong>
                    <p className="text-[11px] text-slate-500 leading-snug">{d.action}</p>
                  </div>
                  <button
                    onClick={() => {
                      addMissionFromCoach({
                        title: d.title,
                        description: d.action,
                        points: d.xpPoints,
                      });
                      triggerConfetti();
                    }}
                    className="text-[10px] bg-slate-900 text-white hover:bg-slate-800 py-1.5 rounded-lg font-bold w-full transition-colors"
                  >
                    Commit Action
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
            Click &ldquo;Generate 7-Day Plan&rdquo; above to create a focused household decarbonization curriculum.
          </div>
        )}
      </section>

      {/* 3. Daily & Weekly Missions List */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-slate-700" />
              <span>Current Missions Checklist</span>
            </h3>
            <span className="text-xs text-slate-500">
              {missions.filter((m) => m.completed).length} of {missions.length} missions completed
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 font-mono">
            <span>Level {userLevel}</span>
            <span>•</span>
            <span>{levelXpProgress.current}/100 XP</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {missions.map((m) => {
            const isDone = m.completed;
            return (
              <div
                key={m.id}
                onClick={() => toggleMission(m.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  isDone
                    ? 'bg-slate-50 border-slate-200 opacity-70'
                    : 'bg-white border-slate-200 hover:border-slate-400 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border mt-0.5 flex-shrink-0 transition-colors ${
                      isDone
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isDone && <CheckCircle2 className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {m.title}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">
                        {m.period}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{m.description}</p>
                  </div>
                </div>

                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ${
                    isDone
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  +{m.points} XP
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Badges Trophy Shelf */}
      <section className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>Earned Sustainability Badges</span>
          </h3>
          <span className="text-xs font-bold text-slate-500 font-mono">
            {badges.filter((b) => b.unlocked).length} / {badges.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-between transition-all min-h-[140px] ${
                b.unlocked
                  ? 'bg-white border-slate-200 shadow-2xs'
                  : 'bg-slate-50 border-slate-200 opacity-50'
              }`}
            >
              <span className="text-3xl mb-1">{b.icon}</span>
              <div>
                <strong className="text-xs font-bold text-slate-900 block">{b.name}</strong>
                <span className="text-[10px] text-slate-500 block mt-0.5 line-clamp-2">{b.description}</span>
              </div>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full mt-2 font-mono ${
                  b.unlocked ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {b.unlocked ? 'UNLOCKED' : b.requirement}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
