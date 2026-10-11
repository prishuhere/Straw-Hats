import React, { useState, useEffect } from 'react';
import { useGreenPulse, AppTab } from '../context/GreenPulseContext';
import { Menu, X, Settings, KeyRound, UserCheck, Clock } from 'lucide-react';
import { REGIONAL_TARIFFS } from '../data/initialData';
import { LuffyStrawHatIcon } from './LuffyStrawHatIcon';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    userSettings,
    updateSettings,
    streakDays,
    ecoPoints,
    dailyTasksCompleted,
    currentUser,
    setIsAuthModalOpen,
  } = useGreenPulse();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Live Date and Time on website (updates every second)
  const [currentDateTime, setCurrentDateTime] = useState<string>(() => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(
        new Date().toLocaleDateString('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navLinks: { id: AppTab; label: string; badge?: string }[] = [
    { id: 'dashboard', label: 'Home' },
    { id: 'calculator', label: 'Calculator' }, // 18+ sign removed!
    { id: 'waste', label: 'Report Waste' },
    { id: 'community', label: 'Community' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'energy', label: 'Energy' },
    { id: 'coach', label: 'AI Consultant', badge: 'AI' },
    { id: 'missions', label: 'Streak & Habits' },
    { id: 'kiro', label: 'Kiro Portal' },
  ];

  const handleNavClick = (tab: AppTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header className="topbar">
        {/* Brand with Luffy's Straw Hat Logo */}
        <button
          onClick={() => handleNavClick('dashboard')}
          className="brand bg-transparent border-0 text-left cursor-pointer p-0 flex items-center gap-2"
        >
          <LuffyStrawHatIcon size={32} />
          <span>
            <strong>
              Eco<span>Quest</span>
            </strong>
            <small>SMALL ACTIONS. GREENER TOMORROWS.</small>
          </span>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex">
          {navLinks.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`nav-link ${isActive ? 'active' : ''} flex items-center gap-1.5`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-[#8fe77d]/20 text-[#8fe77d] border border-[#8fe77d]/30">
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Live Date/Time & Streak Progress Widget */}
        <div className="hidden xl:flex items-center gap-2">
          {/* Live Clock */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#04160e] border border-[#8fe77d]/20 text-[11px] font-mono text-[#8fe77d] shadow-inner">
            <Clock className="w-3.5 h-3.5 text-[#8fe77d]" />
            <span>{currentDateTime}</span>
          </div>

          {/* Daily Streak Rule Progress */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0b2418] border border-[#8fe77d]/25 text-[11px] font-mono"
            title="Complete 2 tasks in a day to level up your streak! Extra tasks give points but don't duplicate streak."
          >
            <span className="text-[#f4cc69] font-bold">🔥 {streakDays}d</span>
            <span className="text-[#a4b9a8]">·</span>
            <span className={dailyTasksCompleted >= 2 ? 'text-[#8fe77d] font-bold' : 'text-[#f4cc69] font-bold'}>
              {dailyTasksCompleted >= 2 ? '✓ 2/2 Streak Secured' : `${dailyTasksCompleted}/2 Tasks`}
            </span>
          </div>
        </div>

        {/* Right Actions: Settings & Profile Pill */}
        <div className="flex items-center gap-2">
          {/* Settings Trigger */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-xl text-[#a4b9a8] hover:text-[#8fe77d] hover:bg-[#102b1d] transition-colors border border-transparent hover:border-[#8fe77d]/20 cursor-pointer"
            title="Configure Tariff & Region Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Account & ID/Pass Login Pill */}
          {currentUser ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f3422] hover:bg-[#174830] border border-[#8fe77d]/30 text-[#f4f4df] text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Manage Profile, Switch Account or Reset Score"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#8fe77d]" />
              <span className="max-w-[85px] truncate">{currentUser.name}</span>
              <span className="text-[10px] text-amber-300 font-mono font-extrabold bg-[#06170f]/50 px-1.5 py-0.5 rounded-md">
                🔥{streakDays}d
              </span>
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#8fe77d] hover:bg-[#a6f097] text-[#06170f] text-xs font-extrabold transition-all shadow-md cursor-pointer"
              title="Sign in with ID & Password to track streak & score"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Login / ID</span>
              <span className="text-[10px] bg-[#06170f]/20 px-1 py-0.2 rounded-sm font-mono font-bold">
                0d
              </span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-[#a4b9a8] hover:text-[#8fe77d] hover:bg-[#102b1d]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[73px] bg-[#071d12]/95 backdrop-blur-xl border-b border-[#8fe77d]/20 z-40 p-4 space-y-2 animate-fade-in shadow-2xl">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-[#183d28] text-[#8fe77d] border border-[#8fe77d]/40'
                      : 'text-[#a4b9a8] hover:bg-[#0e2c1e] hover:text-[#f4f4df]'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#8fe77d]/20 text-[#8fe77d]">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#8fe77d]/15 flex items-center justify-between text-xs text-[#a4b9a8]">
            <span>Active Streak: <b className="text-[#f4cc69]">{streakDays} Days</b> 🔥</span>
            <span>Green Points: <b className="text-[#8fe77d]">{ecoPoints} pts</b></span>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="modal" onClick={() => setSettingsOpen(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px', textAlign: 'left' }}
          >
            <button
              onClick={() => setSettingsOpen(false)}
              className="modal-close"
              aria-label="Close Settings"
            >
              ×
            </button>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⚙️</span>
              <div>
                <h3 className="font-extrabold text-lg text-[#f4f4df] m-0">Settings & Regional Tariffs</h3>
                <small className="text-[#a4b9a8] text-xs">Used for electric energy calculations and grid factor formulas</small>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="field-label">Your Name / Explorer Alias</label>
                <input
                  type="text"
                  value={userSettings.userName}
                  onChange={(e) => updateSettings({ userName: e.target.value })}
                  className="field"
                  placeholder="e.g. Priyanshu"
                />
              </div>

              <div>
                <label className="field-label">Electricity Region Preset</label>
                <select
                  className="field"
                  value={userSettings.regionName}
                  onChange={(e) => {
                    const found = REGIONAL_TARIFFS.find((r) => r.name === e.target.value);
                    if (found) {
                      updateSettings({
                        regionName: found.name,
                        tariffRate: found.tariff,
                        gridCarbonFactor: found.gridFactor,
                        currency: found.currency,
                      });
                    }
                  }}
                >
                  {REGIONAL_TARIFFS.map((r) => (
                    <option key={r.name} value={r.name}>
                      {r.name} — {r.currency}{r.tariff}/kWh ({r.gridFactor} kg CO₂e/kWh)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Tariff Rate ({userSettings.currency}/kWh)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={userSettings.tariffRate}
                    onChange={(e) => updateSettings({ tariffRate: parseFloat(e.target.value) || 0.16 })}
                    className="field"
                  />
                </div>
                <div>
                  <label className="field-label">Grid Factor (kg CO₂e/kWh)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={userSettings.gridCarbonFactor}
                    onChange={(e) => updateSettings({ gridCarbonFactor: parseFloat(e.target.value) || 0.385 })}
                    className="field"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setSettingsOpen(false)}
              className="btn btn-primary form-submit mt-6"
            >
              Save Settings ↗
            </button>
          </div>
        </div>
      )}
    </>
  );
};
