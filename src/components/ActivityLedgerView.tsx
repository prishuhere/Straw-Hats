import React, { useState } from 'react';
import { useGreenPulse } from '../context/GreenPulseContext';
import {
  FileText,
  Search,
  Download,
  Filter,
  Zap,
  Trash2,
  CheckCircle2,
  Calendar,
  ArrowLeft,
} from 'lucide-react';

export const ActivityLedgerView: React.FC = () => {
  const { wasteLogs, energyLogs, missions, setActiveTab } = useGreenPulse();
  const [filterType, setFilterType] = useState<'all' | 'waste' | 'energy' | 'mission'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Assemble unified chronological timeline
  const combinedTimeline = [
    ...wasteLogs.map((w) => ({
      id: w.id,
      type: 'waste' as const,
      title: w.name,
      subtitle: `${w.category} • ${w.materialType}`,
      timestamp: w.timestamp,
      metric: `-${w.avoidedCo2eKg} kg CO₂e`,
      badge: w.category,
    })),
    ...energyLogs.map((e) => ({
      id: e.id,
      type: 'energy' as const,
      title: e.appliance,
      subtitle: `${e.hoursPerDay} hrs/day • ${e.wattage}W`,
      timestamp: e.timestamp,
      metric: `${e.monthlyCost}$/mo`,
      badge: `${e.monthlyKwh} kWh`,
    })),
    ...missions
      .filter((m) => m.completed)
      .map((m) => ({
        id: m.id,
        type: 'mission' as const,
        title: m.title,
        subtitle: m.description,
        timestamp: new Date().toISOString(),
        metric: `+${m.points} XP`,
        badge: m.period,
      })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredTimeline = combinedTimeline.filter((item) => {
    const matchesFilter = filterType === 'all' || item.type === filterType;
    const matchesQuery =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  const exportJsonLedger = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(combinedTimeline, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `greenpulse-ledger-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
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
          Unified Audit Ledger
        </span>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono block">
            Immutable Audit Trail
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Activity Ledger & Event Log
          </h2>
        </div>

        <button
          onClick={exportJsonLedger}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export JSON Audit Log</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search activity records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Events ({combinedTimeline.length})
          </button>
          <button
            onClick={() => setFilterType('waste')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'waste' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Waste ({wasteLogs.length})
          </button>
          <button
            onClick={() => setFilterType('energy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'energy' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Energy ({energyLogs.length})
          </button>
          <button
            onClick={() => setFilterType('mission')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'mission' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Missions ({missions.filter((m) => m.completed).length})
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-3">
        {filteredTimeline.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No activity events matched your search query.
          </div>
        ) : (
          filteredTimeline.map((item) => (
            <div
              key={item.id}
              className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-800 flex items-center justify-center text-lg flex-shrink-0 mt-0.5 shadow-2xs">
                  {item.type === 'waste' ? '♻️' : item.type === 'energy' ? '⚡' : '🌱'}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                  <p className="text-[11px] text-slate-500">{item.subtitle}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                <strong className="text-xs font-mono font-bold text-slate-900">{item.metric}</strong>
                <span className="text-[10px] bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-bold font-mono">
                  {item.badge}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
