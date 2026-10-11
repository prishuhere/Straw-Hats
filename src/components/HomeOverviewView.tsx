import React, { useState } from 'react';
import { useGreenPulse, AppTab } from '../context/GreenPulseContext';
import {
  Calculator,
  Scan,
  Zap,
  Bot,
  Target,
  LineChart,
  FileText,
  BookOpen,
  Users,
  Trophy,
  Flame,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { LuffyStrawHatIcon } from './LuffyStrawHatIcon';
import { WeeklyComparisonGraph } from './WeeklyComparisonGraph';

const QUOTES = [
  { quote: 'Small green habits grow into a big beautiful future.', author: 'Your planet, probably 🌍' },
  { quote: 'Be the reason your corner of Earth feels loved.', author: 'EcoQuest Wisdom' },
  { quote: "The Earth is not a bin. Let's keep it beautiful, together.", author: 'Straw Hats' },
  { quote: 'A cleaner planet begins with the next small thing you do.', author: 'Stewardship Principle' },
  { quote: 'Waste less today. Protect more tomorrow.', author: 'Circular Thought' },
  { quote: 'There is no Planet B, but there are millions of ways to help Planet A.', author: 'Climate Reality' },
];

const ENERGY_TIPS = [
  'Switch off lights when you leave a room, and unplug chargers when not in use.',
  'Use daylight instead of switching on lights whenever possible.',
  'Separate e-waste and take it to an authorised collection point.',
  'Reuse containers and repair items before replacing them.',
  'Walk, cycle, or use public transport for short trips when safe.',
  'Wash laundry with cold water to cut household washing energy by up to 90%.',
];

export const HomeOverviewView: React.FC = () => {
  const {
    setActiveTab,
    userSettings,
    updateSettings,
    streakDays,
    sustainabilityScore,
    totalMonthlyKwh,
    totalMonthlyCost,
    totalWasteItems,
    wasteDiversionRate,
    totalWasteAvoidedCo2eKg,
    ecoFlowers,
    ecoReports,
    ecoPoints,
    showToast,
    triggerConfetti,
    setRewardModalOpen,
    currentUser,
    setIsAuthModalOpen,
    resetAllScores,
  } = useGreenPulse();

  const [quoteIndex, setQuoteIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [visitorNameInput, setVisitorNameInput] = useState('');
  const [nameSavedSuccess, setNameSavedSuccess] = useState(false);

  const currentQuote = QUOTES[quoteIndex % QUOTES.length];
  const currentTip = ENERGY_TIPS[tipIndex % ENERGY_TIPS.length];

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % QUOTES.length);
  };

  const handleNextTip = () => {
    setTipIndex((prev) => (prev + 1) % ENERGY_TIPS.length);
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = visitorNameInput.trim();
    if (!trimmed) {
      showToast('Please enter your name first.');
      return;
    }
    updateSettings({ userName: trimmed.slice(0, 32) });
    setVisitorNameInput('');
    setNameSavedSuccess(true);
    triggerConfetti();
    showToast(`Welcome to EcoQuest, ${trimmed}! 🌱`);
  };

  const featureCards: {
    id: AppTab;
    title: string;
    subtitle: string;
    emoji: string;
    tag: string;
    icon: React.ReactNode;
    color: string;
    badge: string;
  }[] = [
    {
      id: 'calculator',
      title: 'Comprehensive Carbon Calculator',
      subtitle: 'Multi-sector household audit across mobility, home energy, diet, and goods circularity with verified IPCC factors.',
      emoji: '🧮',
      tag: 'Audit Engine',
      icon: <Calculator className="w-5 h-5 text-[#8fe77d]" />,
      color: 'bg-[#183d28] text-[#8fe77d] border-[#8fe77d]/30',
      badge: 'Smart IPCC',
    },
    {
      id: 'waste',
      title: 'Report Waste & AI Scanner',
      subtitle: 'Spot litter, upload photos, identify materials with multimodal AI, earn virtual flowers, and unlock 2nd-life bio actions.',
      emoji: '📸',
      tag: 'Multimodal AI',
      icon: <Scan className="w-5 h-5 text-[#77d9ee]" />,
      color: 'bg-[#0f2e3d] text-[#77d9ee] border-[#77d9ee]/30',
      badge: 'Photo & Flowers',
    },
    {
      id: 'community',
      title: 'The Green Community',
      subtitle: 'Discover community waste cleanups, cheer on fellow protectors, and share your verified local environmental reports.',
      emoji: '💬',
      tag: 'Community',
      icon: <Users className="w-5 h-5 text-[#d9f69b]" />,
      color: 'bg-[#1f3820] text-[#d9f69b] border-[#d9f69b]/30',
      badge: 'Shared Reports',
    },
    {
      id: 'leaderboard',
      title: 'Green Champions Leaderboard',
      subtitle: 'Friendly community rankings celebrating top contributors, flower collections, and verified carbon-reduction points.',
      emoji: '🏆',
      tag: 'Rankings',
      icon: <Trophy className="w-5 h-5 text-[#f4cc69]" />,
      color: 'bg-[#382d0e] text-[#f4cc69] border-[#f4cc69]/30',
      badge: 'Top Champions',
    },
    {
      id: 'energy',
      title: 'Appliance Energy & Vampire Auditor',
      subtitle: 'Calculate kilowatt-hours, monthly electric bills, and phantom standby drain with localized utility tariffs.',
      emoji: '⚡',
      tag: 'Power & Tariffs',
      icon: <Zap className="w-5 h-5 text-[#f8d875]" />,
      color: 'bg-[#2d2a13] text-[#f8d875] border-[#f8d875]/30',
      badge: 'Formula Math',
    },
    {
      id: 'coach',
      title: 'AI Consultant & Climate Coach',
      subtitle: 'Live interactive consultation powered by Google Gemini AI. Ask questions, audit habits, and simulate future sustainability scenarios.',
      emoji: '🤖',
      tag: 'AI Consultant',
      icon: <Bot className="w-5 h-5 text-[#8fe77d]" />,
      color: 'bg-[#0f2e1d] text-[#8fe77d] border-[#8fe77d]/40',
      badge: 'Google Gemini AI',
    },
    {
      id: 'missions',
      title: '7-Day Streak & Letter of Appreciation',
      subtitle: 'Complete daily eco-habits, maintain consecutive action days, and claim your custom AI appreciation certificate.',
      emoji: '🏅',
      tag: 'Streak Rewards',
      icon: <Target className="w-5 h-5 text-[#ff9e9a]" />,
      color: 'bg-[#3b171a] text-[#ff9e9a] border-[#ff9e9a]/30',
      badge: 'Day 7 Reward',
    },
    {
      id: 'impact',
      title: 'Long-Term Impact Analytics',
      subtitle: 'Interactive trend visualizations, sector breakdown, and tangible metrics (trees planted, car miles avoided).',
      emoji: '📊',
      tag: 'Verified Metrics',
      icon: <LineChart className="w-5 h-5 text-[#8fe77d]" />,
      color: 'bg-[#183d28] text-[#8fe77d] border-[#8fe77d]/30',
      badge: 'Analytics',
    },
    {
      id: 'ledger',
      title: 'Immutable Activity Audit Ledger',
      subtitle: 'Unified historical timeline tracking every waste report, appliance log, and completed mission with JSON export.',
      emoji: '📑',
      tag: 'Audit Trail',
      icon: <FileText className="w-5 h-5 text-[#a4b9a8]" />,
      color: 'bg-[#102b1d] text-[#a4b9a8] border-[#a4b9a8]/30',
      badge: 'Export Log',
    },
    {
      id: 'kiro',
      title: 'Kiro (AWS) Technical Documentation Portal',
      subtitle: 'Deep dual-cloud architecture specs, multi-AI pipeline (Kiro, Claude, Naina, ChatGPT, AWS), and live inspector.',
      emoji: '☁️',
      tag: 'Cloud Architecture',
      icon: <BookOpen className="w-5 h-5 text-[#9be4d8]" />,
      color: 'bg-[#102e2b] text-[#9be4d8] border-[#9be4d8]/30',
      badge: 'Hackathon Spec',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. EcoQuest Mascot Hero Section */}
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="pulse-dot"></span> YOUR PLANET. YOUR QUEST.
          </div>
          <h1 className="eco-title">
            Make your corner<br />of Earth <span>greener.</span>
          </h1>
          <p className="hero-text">
            Spot waste. Snap it. Calculate your footprint. Track energy. Every small action grows into a cleaner, brighter tomorrow.
          </p>
          <div className="actions">
            <button
              onClick={() => setActiveTab('calculator')}
              className="btn btn-primary"
            >
              Calculate Footprint 🧮
            </button>
            <button
              onClick={() => setActiveTab('coach')}
              className="btn btn-ghost"
            >
              AI Consultant 🤖
            </button>
            <button
              onClick={() => setActiveTab('waste')}
              className="btn btn-ghost"
            >
              Report Waste 📸
            </button>
          </div>
          <div className="hero-proof">
            <span>🌿 🌎 🌱</span>
            <span>
              <b className="text-[#f4f4df]">{ecoReports.length + totalWasteItems}</b> verified reports made by you
            </span>
          </div>
          <p className="muted" style={{ marginTop: '22px' }}>
            Made with purpose by <b style={{ color: 'var(--green)' }}>Straw Hats</b>
          </p>
        </div>

        {/* Mascot Artwork with Animated Straw Hat Earth */}
        <div className="hero-art">
          <div className="sun-glow"></div>
          <div className="orbit"></div>
          <div className="orbit two"></div>

          {/* Earth Mascot with Straw Hat */}
          <div className="mascot">
            <div className="hat">
              <span></span>
            </div>
            <div className="earth-face">
              <div className="land land-a"></div>
              <div className="land land-b"></div>
              <div className="eye eye-a"></div>
              <div className="eye eye-b"></div>
              <div className="cheek cheek-a"></div>
              <div className="cheek cheek-b"></div>
              <div className="smile"></div>
            </div>
          </div>

          <div className="art-tag tag-left">
            <span>♻</span>
            <div>
              <b>Waste less</b>
              <small>Love more</small>
            </div>
          </div>

          <div className="art-tag tag-right">
            <span>⚡</span>
            <div>
              <b>Clean energy</b>
              <small>Bright future</small>
            </div>
          </div>

          <div className="made-by">
            MADE BY <b>STRAW HATS</b>
          </div>
        </div>
      </section>

      {/* 2. User's Personal Green Space & ID Account Manager */}
      <section className="panel welcome-panel">
        <div className="welcome-copy">
          <span className="section-kicker">YOUR PERSONAL GREEN SPACE & ID ACCOUNT</span>
          <h2>
            Hello, {currentUser ? currentUser.name : (userSettings.userName ? userSettings.userName : 'Green Explorer')}! <span>🌱</span>
          </h2>
          <p className="muted">
            {currentUser
              ? `Logged in as @${currentUser.id} • Active streak: ${streakDays} days • ${ecoPoints} XP. Your scores are saved and isolated to your account.`
              : 'You are currently exploring in Guest Mode (Streak: 0 days). Log in with your ID & Password or create an ID so your streak and scores never leak to or from another laptop!'}
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-3">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="btn btn-primary"
            >
              {currentUser ? '👤 Manage Profile / Switch Account' : '🔑 Log In / Create ID (0-Streak Start)'}
            </button>
            <button
              onClick={() => {
                if (confirm('Reset your active streak and scores to 0 on this device?')) {
                  resetAllScores();
                }
              }}
              className="btn btn-ghost text-xs text-rose-300 hover:text-rose-200 border border-rose-500/30 hover:bg-rose-950/40"
            >
              ⚠️ Reset Streak & Scores to 0
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveName} className="name-form">
          <label className="field-label" htmlFor="visitorNameInput">
            Custom Display Name
          </label>
          <div className="name-form-row">
            <input
              id="visitorNameInput"
              type="text"
              maxLength={32}
              value={visitorNameInput}
              onChange={(e) => setVisitorNameInput(e.target.value)}
              placeholder={userSettings.userName || (currentUser ? currentUser.name : 'Enter your name')}
              className="field"
            />
            <button className="btn btn-secondary" type="submit">
              Update ↗
            </button>
          </div>
          {nameSavedSuccess && (
            <small className="text-[#8fe77d] block mt-1 font-semibold">
              ✓ Name updated! Welcome, {userSettings.userName}.
            </small>
          )}
        </form>
      </section>

      {/* 3. Inspiring Daily Quote Panel with Refresher */}
      <section className="quote-panel panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="section-kicker">✦ A LITTLE DAILY SPARK</span>
            <blockquote>“{currentQuote.quote}”</blockquote>
            <div className="quote-author">— {currentQuote.author}</div>
          </div>
          <button
            onClick={handleNextQuote}
            className="btn btn-ghost self-start sm:self-auto flex items-center gap-1.5"
            title="Read next inspiring quote"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#8fe77d]" />
            <span>Next Quote</span>
          </button>
        </div>
      </section>

      {/* 4. Live Stats & 7-Day Streak Showcase */}
      <section className="panel space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#8fe77d]/15 pb-4">
          <div>
            <span className="section-kicker">YOUR LIVE PROGRESS & STREAK</span>
            <h2 className="m-0">
              Consistency is <span>magic.</span>
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#f4cc69] bg-[#183d28] px-3 py-1 rounded-full border border-[#8fe77d]/20">
              {ecoPoints} Green Points ⭐
            </span>
          </div>
        </div>

        {/* 4 Key Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1: Sustainability Score */}
          <div className="bg-[#071d12] border border-[#8fe77d]/20 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#a4b9a8]">
              <span>Sustainability Score</span>
              <span className="text-[#8fe77d] font-bold">Top Tier</span>
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#f4f4df] font-mono">
                {sustainabilityScore}
              </span>
              <span className="text-xs text-[#a4b9a8]">/ 100</span>
            </div>
            <span className="text-[11px] text-[#8fe77d]">● High household efficiency</span>
          </div>

          {/* Stat 2: Consecutive Days Streak */}
          <div className="bg-[#071d12] border border-[#8fe77d]/20 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#a4b9a8]">
              <span>Active Action Streak</span>
              <Flame className="w-4 h-4 text-[#f4cc69] fill-[#f4cc69]" />
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#f4cc69] font-mono">
                {streakDays}
              </span>
              <span className="text-xs text-[#a4b9a8]">/ 7 Days</span>
            </div>
            <span className="text-[11px] text-[#a4b9a8]">
              {streakDays >= 7
                ? 'Letter unlocked! Claim below 🎉'
                : `${7 - streakDays} day(s) to Letter of Appreciation`}
            </span>
          </div>

          {/* Stat 3: Virtual Flowers Bloom */}
          <div className="bg-[#071d12] border border-[#8fe77d]/20 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#a4b9a8]">
              <span>Virtual Garden Flowers</span>
              <span className="text-lg">🌸</span>
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#8fe77d] font-mono">
                {ecoFlowers.length}
              </span>
              <span className="text-xs text-[#a4b9a8]">blooming</span>
            </div>
            <span className="text-[11px] text-[#a4b9a8]">
              +{totalWasteAvoidedCo2eKg} kg avoided emissions
            </span>
          </div>

          {/* Stat 4: Electricity Footprint */}
          <div className="bg-[#071d12] border border-[#8fe77d]/20 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-[#a4b9a8]">
              <span>Monthly Electricity</span>
              <span className="text-[#f8d875] font-bold">Power</span>
            </div>
            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#f4f4df] font-mono">
                {totalMonthlyKwh}
              </span>
              <span className="text-xs text-[#a4b9a8]">kWh / mo</span>
            </div>
            <span className="text-[11px] text-[#a4b9a8]">
              Est. {userSettings.currency}{totalMonthlyCost} utility cost
            </span>
          </div>
        </div>

        {/* 7-Day Streak Track Bar with Day 7 Unlock */}
        <div className="pt-2">
          <div className="streak-track">
            {['🌱', '💧', '♻️', '🌿', '🌼', '🌳', '🏆'].map((emoji, i) => {
              const isDone = i < streakDays;
              return (
                <div key={i} className={`streak-step ${isDone ? 'done' : ''}`}>
                  <span>{isDone ? '✓' : emoji}</span>
                  <small>Day {i + 1}</small>
                </div>
              );
            })}
          </div>

          <div className="reward-strip flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span>🏅</span>
              <div>
                <b>Letter of Appreciation</b>
                <small>Unlock celebration certificate after seven consecutive days of green action.</small>
              </div>
            </div>
            <button
              onClick={() => {
                if (streakDays >= 7) {
                  setRewardModalOpen(true);
                } else {
                  showToast(`${7 - streakDays} more day(s) of action needed to claim the Letter!`);
                }
              }}
              className={`btn ${streakDays >= 7 ? 'btn-primary' : 'btn-secondary'} whitespace-nowrap`}
            >
              {streakDays >= 7 ? 'View Appreciation Letter 📜' : `Unlock at 7 days (${streakDays}/7)`}
            </button>
          </div>
        </div>
      </section>

      {/* 4.5 Weekly Comparison Graph: Past Week vs Current Week Telemetry */}
      <WeeklyComparisonGraph
        title="Homepage Carbon & Waste Shift (Past Week vs Current Week)"
        subtitle="Hover your mouse over Tuesday or any day to inspect exact energy differences and waste categories (Paper, Plastic, Metal) without clicking."
      />

      {/* 5. Feature Navigation Buttons: On Clicking Any Feature, Opens Its Separate Page */}
      <section className="space-y-4 pt-2">
        <div>
          <span className="section-kicker">FEATURES & TOOLS</span>
          <h2>
            Explore our <span>dedicated capabilities.</span>
          </h2>
          <p className="muted">
            Click on any feature below to launch its full standalone webpage and tools.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featureCards.map((card) => (
            <div
              key={card.id}
              onClick={() => {
                setActiveTab(card.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="quick-link group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs ${card.color}`}>
                    {card.icon}
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#183d28] text-[#8fe77d] border border-[#8fe77d]/30 font-mono">
                    {card.badge}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xl">{card.emoji}</span>
                  <h3 className="group-hover:text-[#8fe77d] transition-colors m-0">
                    {card.title}
                  </h3>
                </div>

                <p>{card.subtitle}</p>
              </div>

              <div className="pt-3 border-t border-[#8fe77d]/15 flex items-center justify-between text-xs font-bold text-[#8fe77d] group-hover:translate-x-1 transition-all">
                <span>Launch {card.tag}</span>
                <ArrowRight className="w-4 h-4 text-[#8fe77d]" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Waste Less, Power Wisely Banner with Tip Cycler */}
      <section className="energy-banner">
        <div className="energy-orb">⚡</div>
        <div>
          <span className="section-kicker">WASTE LESS. POWER WISELY.</span>
          <h2>
            A greener planet runs on <span>better choices.</span>
          </h2>
          <p id="energyTip">{currentTip}</p>
        </div>
        <button onClick={handleNextTip} className="btn btn-ghost whitespace-nowrap" id="nextTip">
          Another tip ↻
        </button>
      </section>

      {/* 7. Signature Frosted Glass Section: Made by Straw Hats */}
      <section className="panel flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LuffyStrawHatIcon size={38} />
          <div>
            <h4 className="font-extrabold text-base text-[#f4f4df] m-0">
              EcoQuest — Small actions. Greener tomorrows.
            </h4>
            <span className="text-xs text-[#a4b9a8]">
              Built for real environmental impact with verified calculation engines & AI guidance.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-black text-sm text-[#092115] bg-gradient-to-r from-[#b2f59a] to-[#6dd878] px-4 py-2 rounded-xl shadow-md">
          <LuffyStrawHatIcon size={20} />
          <span>Made by &ldquo;Straw Hats&rdquo;</span>
        </div>
      </section>
    </div>
  );
};
