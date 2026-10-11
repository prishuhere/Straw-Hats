import React from 'react';
import { useGreenPulse } from '../context/GreenPulseContext';
import { ArrowLeft, Trophy, Users, Award, Sparkles } from 'lucide-react';

export const LeaderboardView: React.FC = () => {
  const {
    userSettings,
    ecoReports,
    ecoFlowers,
    ecoPoints,
    setActiveTab,
    currentUser,
  } = useGreenPulse();

  const myDisplayName = currentUser ? currentUser.name : (userSettings.userName || 'You (Explorer)');
  const myReportsCount = ecoReports.filter((r) => r.author === myDisplayName).length + 3;
  const myTotalPoints = ecoPoints;

  const competitors = [
    { name: 'GreenGuru', emoji: '🌳', points: 320, reports: 32, flowers: 32, isUser: false },
    { name: 'CleanCrusader', emoji: '🧤', points: 280, reports: 28, flowers: 28, isUser: false },
    { name: 'EcoQueen', emoji: '🌸', points: 250, reports: 25, flowers: 25, isUser: false },
    {
      name: myDisplayName,
      emoji: '🌱',
      points: myTotalPoints,
      reports: myReportsCount,
      flowers: ecoFlowers.length,
      isUser: true,
    },
    { name: 'NatureNerd', emoji: '🌿', points: 210, reports: 21, flowers: 21, isUser: false },
    { name: 'PlanetPal', emoji: '🌎', points: 180, reports: 18, flowers: 18, isUser: false },
    { name: 'SolarSam', emoji: '☀️', points: 155, reports: 15, flowers: 15, isUser: false },
  ].sort((a, b) => b.points - a.points);

  const rankBadges = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣'];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-xs font-bold text-[#8fe77d] hover:text-[#d9f69b] flex items-center gap-1.5 transition-colors mb-2 bg-transparent border-0 cursor-pointer p-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home Overview</span>
          </button>
          <div className="page-heading pt-0 pb-0">
            <span className="section-kicker">FRIENDLY COMPETITION</span>
            <h1 className="eco-title m-0">
              Green <span>champions.</span>
            </h1>
            <p className="muted mt-2">
              Every report earns points. Every action moves us toward a cleaner world.
            </p>
          </div>
        </div>

        <div className="actions">
          <button
            onClick={() => setActiveTab('waste')}
            className="btn btn-primary"
          >
            Earn green points ↗
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className="btn btn-ghost"
          >
            <Users className="w-3.5 h-3.5 text-[#77d9ee]" />
            <span>Visit community</span>
          </button>
        </div>
      </div>

      {/* Leaderboard Rankings Panel */}
      <section className="panel" style={{ maxWidth: '820px', margin: 'auto' }}>
        <div className="flex items-center justify-between border-b border-[#8fe77d]/15 pb-4 mb-4">
          <div>
            <span className="section-kicker">COMMUNITY RANKINGS</span>
            <h2 className="m-0">
              Who&apos;s making a <span>difference?</span>
            </h2>
          </div>
          <span className="text-xs text-[#a4b9a8] font-mono">
            Updated live · Verified actions
          </span>
        </div>

        <div id="leaderRows" className="space-y-1">
          {competitors.map((item, index) => {
            const rankEmoji = rankBadges[index] || `${index + 1}`;
            return (
              <div
                key={item.name}
                className={`leader-row ${item.isUser ? 'you-row' : ''}`}
              >
                <span className="rank font-bold text-xl">{rankEmoji}</span>
                <span className="leader-avatar">{item.emoji}</span>
                <div className="leader-person">
                  <b>
                    {item.name} {item.isUser && <span className="text-[#8fe77d]">(you)</span>}
                  </b>
                  <small>
                    {item.reports} reports · {item.flowers} flowers bloomed
                  </small>
                </div>
                <strong className="points text-base">{item.points} pts</strong>
              </div>
            );
          })}
        </div>

        <div className="pt-4 mt-4 border-t border-[#8fe77d]/15 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#a4b9a8] gap-2">
          <span>
            💡 Waste reports earn <b className="text-[#8fe77d]">+10 pts</b> & flower · Biodegradable action proofs earn <b className="text-[#f4cc69]">+25 pts</b>.
          </span>
          <button
            onClick={() => setActiveTab('calculator')}
            className="text-[#8fe77d] hover:underline font-bold self-start sm:self-auto bg-transparent border-0 cursor-pointer p-0"
          >
            Take Carbon Audit ↗
          </button>
        </div>
      </section>
    </div>
  );
};
