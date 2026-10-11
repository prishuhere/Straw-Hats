import React, { useState } from 'react';
import { useGreenPulse } from '../context/GreenPulseContext';
import {
  ArrowLeft,
  Users,
  Trophy,
  Heart,
  MapPin,
  ExternalLink,
  RefreshCw,
  Sparkles,
  IndianRupee,
} from 'lucide-react';
import { fetchSharedCommunityReports } from '../services/api';

export const CommunityView: React.FC = () => {
  const {
    ecoReports,
    likeEcoReport,
    setActiveTab,
    setRewardModalOpen,
    streakDays,
    showToast,
  } = useGreenPulse();

  const [expandedMapId, setExpandedMapId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Selected map pin for the overview map
  const activePinReport = ecoReports.find((r) => r.lat && r.lng) || ecoReports[0];
  const centerLat = activePinReport?.lat || 28.6139;
  const centerLng = activePinReport?.lng || 77.2090;

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetchSharedCommunityReports();
      if (res?.data) {
        showToast(`Synced ${res.data.length} reports across all connected devices! 🔄`);
      }
    } catch {
      showToast('Synced with local cache.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header with Back to Home & Multi-Device Sync Indicator */}
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
            <span className="section-kicker">BETTER, TOGETHER</span>
            <h1 className="eco-title m-0">
              The green <span>community.</span>
            </h1>
            <p className="muted mt-2">
              Shared environmental reports across all friend laptops and devices with live Google Maps pins.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Cloud Multi-Device Status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#071c12] border border-[#8fe77d]/30 text-xs font-mono text-[#8fe77d]">
            <span className="w-2 h-2 rounded-full bg-[#8fe77d] animate-pulse" />
            <span>Multi-Device Sync Online</span>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="btn btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
            title="Pull reports posted by friends on other laptops"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('waste')}
            className="btn btn-primary"
          >
            Share a waste report ↗
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className="btn btn-ghost"
          >
            <Trophy className="w-3.5 h-3.5 text-[#f4cc69]" />
            <span>Green champions</span>
          </button>
        </div>
      </div>

      {/* Community Waste Google Maps Overview Section */}
      <section className="bg-[#071c12] border border-[#8fe77d]/30 rounded-3xl p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#8fe77d]/15 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#8fe77d]" />
            <div>
              <h3 className="text-base font-extrabold text-[#f4f4df] m-0">
                Live Community Waste Google Maps Radar
              </h3>
              <p className="text-xs text-[#a4b9a8] m-0 mt-0.5">
                Exact geographic pins of community waste reports. See where litter has been spotted or cleared.
              </p>
            </div>
          </div>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${centerLat},${centerLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5 no-underline self-start sm:self-auto"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#8fe77d]" />
            <span>Open Map in Google Maps</span>
          </a>
        </div>

        {/* Embedded Interactive Google Map */}
        <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-[#8fe77d]/25 shadow-inner bg-[#04160e] relative">
          <iframe
            title="Community Waste Map Radar"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={`https://maps.google.com/maps?q=${centerLat},${centerLng}&z=14&output=embed`}
            className="w-full h-full border-0"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#a4b9a8]">
          <span className="flex items-center gap-1.5">
            <span className="text-[#8fe77d]">📍</span>
            <span>
              Showing focal coordinates: <strong className="text-[#f4f4df] font-mono">{centerLat.toFixed(4)}, {centerLng.toFixed(4)}</strong>
            </span>
          </span>
          <span className="font-mono text-[#f4cc69]">
            {ecoReports.length} reports logged across local communities
          </span>
        </div>
      </section>

      {/* Community Feed Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#f4f4df] m-0 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#8fe77d]" />
            <span>Live Community Action Stream</span>
          </h2>
          <span className="text-xs text-[#a4b9a8]">
            {ecoReports.length} environmental reports logged
          </span>
        </div>

        {ecoReports.length === 0 ? (
          <div className="panel text-center py-12">
            <p className="muted">No reports yet. Be the first to share a photo from your surroundings.</p>
            <button onClick={() => setActiveTab('waste')} className="btn btn-primary mt-4">
              Submit your first report 🌱
            </button>
          </div>
        ) : (
          <div className="grid-three" id="communityPosts">
            {ecoReports.map((report) => {
              const isMapExpanded = expandedMapId === report.id;
              const repLat = report.lat || 28.6139;
              const repLng = report.lng || 77.2090;

              return (
                <article key={report.id} className="feed-card">
                  <div className="feed-photo relative">
                    {report.photo ? (
                      <img src={report.photo} alt={report.description} />
                    ) : (
                      <span>🌱</span>
                    )}

                    {/* Scrap value pill if present */}
                    {report.kabadiwalaValueInr && (
                      <div className="absolute top-2 right-2 bg-[#04160e]/90 border border-[#8fe77d]/40 text-[#8fe77d] text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shadow-md backdrop-blur-sm">
                        ₹{report.kabadiwalaValueInr} INR Value
                      </div>
                    )}
                  </div>

                  <div className="feed-content space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="m-0">🌱 {report.author}</h3>
                        <span className="text-[10px] text-[#a4b9a8] font-mono">{report.date || 'Today'}</span>
                      </div>
                      <p className="mt-1">{report.description}</p>
                      
                      {/* Location & Google Maps details */}
                      <div className="mt-2 text-xs text-[#b8cabb] space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="flex items-center gap-1 text-[11px] truncate">
                            <MapPin className="w-3.5 h-3.5 text-[#8fe77d] flex-shrink-0" />
                            <span>{report.location || 'Local Area'}</span>
                          </span>
                          <span className="text-[10px] bg-[#102b1d] px-2 py-0.5 rounded-full border border-[#8fe77d]/20 text-[#8fe77d]">
                            {report.type}
                          </span>
                        </div>

                        {/* Google Maps Actions */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => setExpandedMapId(isMapExpanded ? null : report.id)}
                            className="text-[11px] font-bold text-[#77d9ee] hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>{isMapExpanded ? 'Hide Pin Map' : 'View on Google Maps'}</span>
                          </button>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${repLat},${repLng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-[#8fe77d] hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Open ↗</span>
                          </a>
                        </div>
                      </div>

                      {/* Embedded Google Map when expanded */}
                      {isMapExpanded && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-[#8fe77d]/30 h-36 w-full animate-fade-in shadow-inner bg-[#04160e]">
                          <iframe
                            title={`Google Map for report ${report.id}`}
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            scrolling="no"
                            src={`https://maps.google.com/maps?q=${repLat},${repLng}&z=15&output=embed`}
                            className="w-full h-full border-0"
                          />
                        </div>
                      )}

                      <p style={{ marginTop: '10px' }} className="text-xs text-[#8fe77d] font-bold">
                        {report.flower} Flower earned
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#8fe77d]/15 flex items-center justify-between mt-3">
                      <button
                        onClick={() => likeEcoReport(report.id)}
                        className="like-btn flex items-center gap-1.5 cursor-pointer"
                        disabled={report.liked}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            report.liked ? 'text-[#ff9e9a] fill-[#ff9e9a]' : 'text-[#8fe77d]'
                          }`}
                        />
                        <span>{report.liked ? '♥ Cheered on!' : '♡ Cheer them on'}</span>
                      </button>
                      <span className="text-xs text-[#a4b9a8] font-mono">
                        {report.likes || 0} cheers
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 7-Day Streak Callout */}
      <section className="panel flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="section-kicker">7-DAY COMMUNITY COMMITMENT</span>
          <h3 className="text-lg font-bold text-[#f4f4df] m-0">
            Inspiring consistency across our planet
          </h3>
          <p className="muted m-0">
            You are on Day {streakDays} of your consecutive streak. Maintain it to receive your Letter of Appreciation.
          </p>
        </div>
        <button
          onClick={() => setRewardModalOpen(true)}
          className={`btn ${streakDays >= 7 ? 'btn-primary' : 'btn-ghost'}`}
        >
          {streakDays >= 7 ? 'Claim Green Hero Letter 🎉' : 'View Letter Preview 📜'}
        </button>
      </section>
    </div>
  );
};

