import React, { useState } from 'react';
import { useGreenPulse } from '../context/GreenPulseContext';
import { KeyRound, User, Lock, LogIn, UserPlus, LogOut, RotateCcw, X, Check, AlertCircle, Sparkles } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    currentUser,
    login,
    signup,
    logout,
    resetAllScores,
    showToast,
  } = useGreenPulse();

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [signupId, setSignupId] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!loginId.trim() || !loginPass.trim()) {
      setErrorMsg('Please enter both User ID and Password');
      return;
    }

    const result = login(loginId.trim(), loginPass.trim());
    if (result.success) {
      showToast(result.message);
      setIsAuthModalOpen(false);
      setLoginId('');
      setLoginPass('');
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!signupId.trim() || !signupName.trim() || !signupPass.trim()) {
      setErrorMsg('Please fill in all fields (User ID, Your Name, Password)');
      return;
    }
    if (signupPass.length < 3) {
      setErrorMsg('Password should be at least 3 characters long');
      return;
    }

    const result = signup(signupId.trim(), signupName.trim(), signupPass.trim());
    if (result.success) {
      showToast(result.message);
      setIsAuthModalOpen(false);
      setSignupId('');
      setSignupName('');
      setSignupPass('');
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleQuickDemoPriyanshu = () => {
    setLoginId('priyanshu');
    setLoginPass('123');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-[#092216] border border-[#8fe77d]/30 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 text-[#f4f4df]">
        {/* Close button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#a4b9a8] hover:text-[#f4f4df] hover:bg-[#103423] transition-colors"
          aria-label="Close Auth Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#8fe77d]/20 text-[#8fe77d] border border-[#8fe77d]/30">
              <KeyRound className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-[#8fe77d] uppercase tracking-wider font-mono">
              EcoQuest ID & Pass Auth
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#f4f4df] tracking-tight">
            {currentUser ? 'Your Eco Profile & Session' : 'Sign In or Create ID'}
          </h2>
          <p className="text-xs text-[#a4b9a8] leading-relaxed">
            {currentUser
              ? 'Your streaks, scores, and habits are isolated and saved to your ID account.'
              : 'Keep your streak and scores private to your account. On any new laptop or friend\'s device, accounts start fresh with 0 streak & 0 scores until you sign in.'}
          </p>
        </div>

        {/* Logged In State Display */}
        {currentUser ? (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-[#0d2e1f] border border-[#8fe77d]/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8fe77d] font-mono">
                    Active User Session
                  </span>
                  <h3 className="text-lg font-extrabold text-[#f4f4df]">
                    {currentUser.name}
                  </h3>
                  <p className="text-xs text-[#a4b9a8] font-mono">
                    ID: @{currentUser.id}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-[#8fe77d] font-mono block">
                    {currentUser.streakDays}d
                  </span>
                  <span className="text-[10px] text-[#a4b9a8] font-semibold uppercase">
                    Streak
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#8fe77d]/15 text-xs">
                <div className="bg-[#092216] p-2.5 rounded-xl border border-[#8fe77d]/10">
                  <span className="text-[#a4b9a8] text-[10px] block">Total XP</span>
                  <span className="text-sm font-bold text-amber-300 font-mono">
                    {currentUser.totalXp} pts
                  </span>
                </div>
                <div className="bg-[#092216] p-2.5 rounded-xl border border-[#8fe77d]/10">
                  <span className="text-[#a4b9a8] text-[10px] block">Sustainability Score</span>
                  <span className="text-sm font-bold text-[#8fe77d] font-mono">
                    {currentUser.sustainabilityScore}/100
                  </span>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  logout();
                  setIsAuthModalOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-[#123825] hover:bg-[#1a4a33] text-[#f4f4df] border border-[#8fe77d]/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-[#8fe77d]" />
                <span>Log Out (Switch to Fresh 0-Score Guest)</span>
              </button>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset your streak, scores, and XP back to 0?')) {
                    resetAllScores();
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 border border-rose-500/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-rose-400" />
                <span>Reset Streak & Scores to 0</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up Forms */
          <div className="space-y-4">
            {/* Tab Switcher */}
            <div className="flex p-1 rounded-2xl bg-[#0d2e1f] border border-[#8fe77d]/20 text-xs font-bold">
              <button
                onClick={() => { setActiveTab('signin'); setErrorMsg(null); }}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-[#8fe77d] text-[#06170f] shadow-md font-extrabold'
                    : 'text-[#a4b9a8] hover:text-[#f4f4df]'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => { setActiveTab('signup'); setErrorMsg(null); }}
                className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-[#8fe77d] text-[#06170f] shadow-md font-extrabold'
                    : 'text-[#a4b9a8] hover:text-[#f4f4df]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create New ID</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {activeTab === 'signin' ? (
              /* Sign In Form */
              <form onSubmit={handleSignIn} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#cde8d5] mb-1">
                    User ID or Username
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      placeholder="e.g. priyanshu or your ID"
                      className="w-full bg-[#0d2e1f] border border-[#8fe77d]/30 text-[#f4f4df] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#8fe77d] placeholder:text-[#6a8774]"
                      autoFocus
                    />
                    <User className="w-4 h-4 absolute right-3.5 top-3 text-[#6a8774]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#cde8d5] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0d2e1f] border border-[#8fe77d]/30 text-[#f4f4df] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#8fe77d] placeholder:text-[#6a8774]"
                    />
                    <Lock className="w-4 h-4 absolute right-3.5 top-3 text-[#6a8774]" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#8fe77d] hover:bg-[#a6f097] text-[#06170f] font-extrabold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In & Load My Data</span>
                </button>

                {/* Quick demo autofill */}
                <div className="pt-2 border-t border-[#8fe77d]/15 flex items-center justify-between text-[11px] text-[#a4b9a8]">
                  <span>Priyanshu Demo Account:</span>
                  <button
                    type="button"
                    onClick={handleQuickDemoPriyanshu}
                    className="text-[#8fe77d] hover:underline font-bold flex items-center gap-1 cursor-pointer bg-transparent border-0"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Autofill priyanshu / 123</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Sign Up Form */
              <form onSubmit={handleSignUp} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#cde8d5] mb-1">
                    Choose a User ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={signupId}
                      onChange={(e) => setSignupId(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                      placeholder="e.g. rahul_eco or alex2026"
                      className="w-full bg-[#0d2e1f] border border-[#8fe77d]/30 text-[#f4f4df] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#8fe77d] placeholder:text-[#6a8774]"
                      autoFocus
                    />
                    <User className="w-4 h-4 absolute right-3.5 top-3 text-[#6a8774]" />
                  </div>
                  <span className="text-[10px] text-[#a4b9a8] mt-0.5 block">
                    Use lowercase letters, numbers, or underscores
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#cde8d5] mb-1">
                    Your Display Name
                  </label>
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-[#0d2e1f] border border-[#8fe77d]/30 text-[#f4f4df] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#8fe77d] placeholder:text-[#6a8774]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#cde8d5] mb-1">
                    Create Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={signupPass}
                      onChange={(e) => setSignupPass(e.target.value)}
                      placeholder="At least 3 characters"
                      className="w-full bg-[#0d2e1f] border border-[#8fe77d]/30 text-[#f4f4df] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#8fe77d] placeholder:text-[#6a8774]"
                    />
                    <Lock className="w-4 h-4 absolute right-3.5 top-3 text-[#6a8774]" />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#0b2418] border border-[#8fe77d]/20 text-[11px] text-[#cde8d5] flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#8fe77d] shrink-0 mt-0.5" />
                  <span>
                    New account starts clean with <strong>0 Streak</strong> and <strong>0 XP</strong>, isolating your data from other devices.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#8fe77d] hover:bg-[#a6f097] text-[#06170f] font-extrabold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account (0 Streak Start)</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Global Reset Option */}
        <div className="pt-3 border-t border-[#8fe77d]/15 flex items-center justify-between text-xs text-[#a4b9a8]">
          <span>Need to start completely over?</span>
          <button
            type="button"
            onClick={() => {
              if (confirm('This will reset your current device streak & scores back to 0. Continue?')) {
                resetAllScores();
                setIsAuthModalOpen(false);
              }
            }}
            className="text-rose-300 hover:text-rose-200 underline font-semibold cursor-pointer bg-transparent border-0"
          >
            Reset all scores to 0
          </button>
        </div>
      </div>
    </div>
  );
};
