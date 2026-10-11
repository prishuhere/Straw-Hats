import React from 'react';
import { GreenPulseProvider, useGreenPulse } from './context/GreenPulseContext';
import { Navbar } from './components/Navbar';
import { HomeOverviewView } from './components/HomeOverviewView';
import { ComprehensiveCalculatorView } from './components/ComprehensiveCalculatorView';
import { WasteScannerView } from './components/WasteScannerView';
import { CommunityView } from './components/CommunityView';
import { LeaderboardView } from './components/LeaderboardView';
import { EnergyTrackerView } from './components/EnergyTrackerView';
import { AICoachView } from './components/AICoachView';
import { MyImpactView } from './components/MyImpactView';
import { MissionsView } from './components/MissionsView';
import { ActivityLedgerView } from './components/ActivityLedgerView';
import { KiroTechPortalView } from './components/KiroTechPortalView';
import { AuthModal } from './components/AuthModal';
import { LuffyStrawHatIcon } from './components/LuffyStrawHatIcon';

const AppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    rewardModalOpen,
    setRewardModalOpen,
    claimReward,
    toastMessage,
    streakDays,
    userSettings,
  } = useGreenPulse();

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-[#8fe77d] selection:text-[#06170f]">
      {/* Topbar Header */}
      <Navbar />

      {/* Main Container - Each feature opens as its own dedicated standalone webpage */}
      <main className="ecoquest-main flex-1">
        {activeTab === 'dashboard' && <HomeOverviewView />}
        {activeTab === 'calculator' && <ComprehensiveCalculatorView />}
        {activeTab === 'waste' && <WasteScannerView />}
        {activeTab === 'community' && <CommunityView />}
        {activeTab === 'leaderboard' && <LeaderboardView />}
        {activeTab === 'energy' && <EnergyTrackerView />}
        {activeTab === 'coach' && <AICoachView />}
        {activeTab === 'impact' && <MyImpactView />}
        {activeTab === 'missions' && <MissionsView />}
        {activeTab === 'ledger' && <ActivityLedgerView />}
        {activeTab === 'kiro' && <KiroTechPortalView />}
      </main>

      {/* EcoQuest Footer with Straw Hats Attribution */}
      <footer className="ecoquest-footer">
        <button
          onClick={() => {
            setActiveTab('dashboard');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="footer-brand bg-transparent border-0 cursor-pointer p-0"
        >
          🌎 EcoQuest
        </button>
        <span>Small actions. Greener tomorrows.</span>
        <span className="flex items-center gap-1.5">
          <span>Made by <b>Straw Hats</b></span>
          <LuffyStrawHatIcon size={20} />
        </span>
      </footer>

      {/* Toast Notification */}
      <div
        className={`toast ${toastMessage ? 'show' : ''}`}
        id="toast"
        role="status"
        aria-live="polite"
      >
        {toastMessage}
      </div>

      {/* Letter of Appreciation Certificate Modal (Day 7 Streak) */}
      {rewardModalOpen && (
        <div
          className="modal"
          id="rewardModal"
          onClick={() => setRewardModalOpen(false)}
        >
          <section
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              id="closeModal"
              onClick={() => setRewardModalOpen(false)}
              aria-label="Close Modal"
            >
              ×
            </button>
            <div className="modal-icon">🌎 🎉 🌸</div>
            <h2>You&apos;re a Green Hero!</h2>
            <p>
              Congratulations on completing {Math.max(7, streakDays)} consecutive days of action for a cleaner planet.
            </p>
            <div className="certificate">
              <div>🌿 🌸 🌿</div>
              <h3>Letter of Appreciation</h3>
              <p>
                This recognises {userSettings.userName || 'Eco Champion'}&apos;s outstanding commitment to a greener tomorrow through verified waste reduction and energy stewardship.
              </p>
              <b>Presented by Straw Hats · EcoQuest</b>
            </div>
            <button
              className="btn btn-primary"
              id="claimReward"
              onClick={claimReward}
            >
              Celebrate & continue 🌱
            </button>
          </section>
        </div>
      )}

      {/* ID & Password Authentication Modal */}
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <GreenPulseProvider>
      <AppContent />
    </GreenPulseProvider>
  );
}
