import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import {
  WasteItemLog,
  EnergyLog,
  Mission,
  Badge,
  UserSettings,
  WasteCategory,
  UserAccount,
} from '../types';
import {
  DEFAULT_SETTINGS,
  INITIAL_WASTE_LOGS,
  INITIAL_ENERGY_LOGS,
  INITIAL_MISSIONS,
  BADGES_LIST,
} from '../data/initialData';
import { fetchSharedCommunityReports, postSharedCommunityReport } from '../services/api';

export type AppTab =
  | 'dashboard'
  | 'calculator'
  | 'waste'
  | 'energy'
  | 'coach'
  | 'impact'
  | 'missions'
  | 'ledger'
  | 'kiro'
  | 'community'
  | 'leaderboard';

export interface EcoReport {
  id: number;
  photo: string;
  description: string;
  location: string;
  type: string;
  flower: string;
  date: string;
  author: string;
  likes?: number;
  liked?: boolean;
  lat?: number;
  lng?: number;
  kabadiwalaValueInr?: number;
}

export interface EcoBioAction {
  id: number;
  action: string;
  actionLabel: string;
  note: string;
  photo: string;
  date: string;
  points: number;
  author: string;
}

interface GreenPulseContextType {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  wasteLogs: WasteItemLog[];
  energyLogs: EnergyLog[];
  missions: Mission[];
  badges: Badge[];
  userSettings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;
  streakDays: number;
  totalXp: number;
  userLevel: number;
  levelXpProgress: { current: number; max: number };
  sustainabilityScore: number;

  // Streak & Daily Task System (2 tasks/day = +1 streak)
  dailyTasksCompleted: number;
  todayDateString: string;
  recordDailyTask: (taskName: string, xpGain?: number) => { streakIncremented: boolean; count: number };
  
  // Auth & Accounts
  currentUser: UserAccount | null;
  accounts: UserAccount[];
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  login: (id: string, pass: string) => { success: boolean; message: string };
  signup: (id: string, name: string, pass: string) => { success: boolean; message: string };
  logout: () => void;
  resetAllScores: () => void;

  // Computed summaries
  totalMonthlyKwh: number;
  totalMonthlyCost: number;
  totalMonthlyCo2eKg: number;
  totalWasteItems: number;
  divertedWasteItems: number;
  wasteDiversionRate: number;
  totalWasteAvoidedCo2eKg: number;

  // Actions
  addWasteLog: (item: Omit<WasteItemLog, 'id' | 'timestamp'>) => void;
  removeWasteLog: (id: string) => void;
  confirmWasteCategory: (id: string, category: WasteCategory) => void;
  addEnergyLog: (item: Omit<EnergyLog, 'id' | 'timestamp'>) => void;
  removeEnergyLog: (id: string) => void;
  toggleMission: (id: string) => void;
  addMissionFromCoach: (mission: { title: string; description: string; points: number }) => void;
  resetToDemoData: () => void;

  // EcoQuest state
  ecoReports: EcoReport[];
  addEcoReport: (report: Omit<EcoReport, 'id' | 'date'>) => void;
  likeEcoReport: (id: number) => void;
  ecoFlowers: string[];
  ecoPoints: number;
  bioActions: EcoBioAction[];
  addBioAction: (action: Omit<EcoBioAction, 'id' | 'date' | 'points' | 'author'>) => void;
  pendingBioReport: { id: number; description: string; type: string; location: string } | null;
  setPendingBioReport: (rep: { id: number; description: string; type: string; location: string } | null) => void;
  rewardModalOpen: boolean;
  setRewardModalOpen: (open: boolean) => void;
  rewardClaimed: boolean;
  claimReward: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  
  // Hackathon Demo Story Guided Tour
  demoStep: number;
  setDemoStep: (step: number) => void;
  isDemoBarOpen: boolean;
  setIsDemoBarOpen: (open: boolean) => void;
  triggerConfetti: () => void;
}

const GreenPulseContext = createContext<GreenPulseContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ACCOUNTS: 'ecoquest_accounts_v2',
  ACTIVE_SESSION: 'ecoquest_session_v2',
  WASTE: 'greenpulse_waste_v2',
  ENERGY: 'greenpulse_energy_v2',
  MISSIONS: 'greenpulse_missions_v2',
  BADGES: 'greenpulse_badges_v2',
  SETTINGS: 'greenpulse_settings_v2',
  STREAK: 'greenpulse_streak_v2',
  XP: 'greenpulse_xp_v2',
  POINTS: 'ecoquest_points_v2',
};

// Seed account for Priyanshu (login: priyanshu / 123)
const SEED_ACCOUNTS: UserAccount[] = [
  {
    id: 'priyanshu',
    name: 'Priyanshu',
    password: '123',
    streakDays: 5,
    totalXp: 340,
    ecoPoints: 120,
    sustainabilityScore: 78,
    createdAt: new Date().toISOString(),
  },
];

export const GreenPulseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [demoStep, setDemoStep] = useState<number>(1);
  const [isDemoBarOpen, setIsDemoBarOpen] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Accounts store
  const [accounts, setAccounts] = useState<UserAccount[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (stored) return JSON.parse(stored);
    } catch {}
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(SEED_ACCOUNTS));
    } catch {}
    return SEED_ACCOUNTS;
  });

  // Current session ID: NULL BY DEFAULT ON FRESH DEVICE
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    } catch {
      return null;
    }
  });

  // Resolve current user from session
  const currentUser = useMemo(() => {
    if (!currentSessionId) return null;
    return accounts.find((a) => a.id.toLowerCase() === currentSessionId.toLowerCase()) || null;
  }, [accounts, currentSessionId]);

  // Initial userSettings
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      userName: '',
      tariffRate: 0.16,
      currency: '$',
      regionName: 'US National Average',
      gridCarbonFactor: 0.385,
    };
  });

  // Streak: 0 for fresh guest, or loaded from user
  const [streakDays, setStreakDays] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.STREAK);
      if (stored !== null) return JSON.parse(stored);
    } catch {}
    return 0; // Fresh default is 0!
  });

  // Total XP: 0 for fresh guest, or loaded from user
  const [totalXp, setTotalXp] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.XP);
      if (stored !== null) return JSON.parse(stored);
    } catch {}
    return 0; // Fresh default is 0!
  });

  // Eco points
  const [ecoPoints, setEcoPoints] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.POINTS);
      if (stored !== null) return JSON.parse(stored);
    } catch {}
    return 0; // Fresh default is 0!
  });

  // Logs: Empty for fresh guest
  const [wasteLogs, setWasteLogs] = useState<WasteItemLog[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WASTE);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const [energyLogs, setEnergyLogs] = useState<EnergyLog[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ENERGY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const [missions, setMissions] = useState<Mission[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MISSIONS);
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_MISSIONS;
  });

  const [badges, setBadges] = useState<Badge[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.BADGES);
      if (stored) return JSON.parse(stored);
    } catch {}
    return BADGES_LIST;
  });

  // EcoQuest Community State
  const [ecoReports, setEcoReports] = useState<EcoReport[]>(() => {
    try {
      const stored = localStorage.getItem('ecoquest_reports_v2');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 1,
        photo: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
        description: 'Cleared plastic bottles and wrappers from neighborhood sidewalk.',
        location: 'Sunset Boulevard & 4th Ave',
        type: 'Plastic',
        flower: '🌸',
        date: new Date().toISOString().split('T')[0],
        author: 'GreenGuru',
        likes: 12,
      },
      {
        id: 2,
        photo: 'https://images.unsplash.com/photo-1604187351574-c75ca79f5807?auto=format&fit=crop&w=600&q=80',
        description: 'Sorted discarded cardboard boxes and flattened for community bin.',
        location: 'Westside Community Park',
        type: 'Paper',
        flower: '🌻',
        date: new Date().toISOString().split('T')[0],
        author: 'EcoQueen',
        likes: 8,
      },
    ];
  });

  const [ecoFlowers, setEcoFlowers] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('ecoquest_flowers_v2');
      if (stored) return JSON.parse(stored);
    } catch {}
    return ['🌼', '🌸'];
  });

  const [bioActions, setBioActions] = useState<EcoBioAction[]>(() => {
    try {
      const stored = localStorage.getItem('ecoquest_bioactions_v2');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const [pendingBioReport, setPendingBioReport] = useState<{ id: number; description: string; type: string; location: string } | null>(null);
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(() => {
    try {
      return localStorage.getItem('ecoquest_reward_claimed_v2') === 'true';
    } catch {
      return false;
    }
  });

  const todayDateString = new Date().toISOString().split('T')[0];

  const [dailyTasksCompleted, setDailyTasksCompleted] = useState<number>(() => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const savedDate = localStorage.getItem('ecoquest_daily_task_date');
      if (savedDate === today) {
        return parseInt(localStorage.getItem('ecoquest_daily_tasks_count') || '0', 10);
      }
    } catch {}
    return 0;
  });

  const [lastStreakDate, setLastStreakDate] = useState<string>(() => {
    try {
      return localStorage.getItem('ecoquest_last_streak_date') || '';
    } catch {}
    return '';
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  // Poll shared community reports from the server so friend's posts sync across devices!
  useEffect(() => {
    let isMounted = true;
    const syncReports = async () => {
      try {
        const res = await fetchSharedCommunityReports();
        if (isMounted && res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setEcoReports(res.data);
          try {
            localStorage.setItem('ecoquest_reports_v2', JSON.stringify(res.data));
          } catch {}
        }
      } catch {}
    };

    syncReports();
    const interval = setInterval(syncReports, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const recordDailyTask = (taskName: string, xpGain: number = 25) => {
    const today = new Date().toISOString().split('T')[0];
    let currentCount = dailyTasksCompleted;
    const savedDate = localStorage.getItem('ecoquest_daily_task_date');
    if (savedDate !== today) {
      currentCount = 0;
    }
    const nextCount = currentCount + 1;
    setDailyTasksCompleted(nextCount);
    setTotalXp((prev) => prev + xpGain);
    setEcoPoints((prev) => prev + Math.round(xpGain / 2));
    try {
      localStorage.setItem('ecoquest_daily_task_date', today);
      localStorage.setItem('ecoquest_daily_tasks_count', nextCount.toString());
    } catch {}

    let streakIncremented = false;
    // Increase streak ONLY when 2 tasks completed in a day!
    // If 4 tasks on same day, don't count it as 2 streak, it stays as 1 increment for the day!
    if (nextCount === 2 && lastStreakDate !== today) {
      setStreakDays((prev) => prev + 1);
      setLastStreakDate(today);
      streakIncremented = true;
      try {
        localStorage.setItem('ecoquest_last_streak_date', today);
        localStorage.setItem(STORAGE_KEYS.STREAK, (streakDays + 1).toString());
      } catch {}
      triggerConfetti();
      showToast(`🎉 2 tasks completed today! +1 Day Streak earned (${streakDays + 1} Days Active) 🔥`);
    } else if (nextCount === 1) {
      showToast(`Task "${taskName}" done (+${xpGain} XP)! Complete 1 more task today to advance streak! (1/2 done) 🌿`);
    } else {
      showToast(`Task "${taskName}" done (+${xpGain} XP)! Daily streak already secured for today. Log in tomorrow for your next streak! ✨`);
    }

    return { streakIncremented, count: nextCount };
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WASTE, JSON.stringify(wasteLogs));
    } catch {}
  }, [wasteLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ENERGY, JSON.stringify(energyLogs));
    } catch {}
  }, [energyLogs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MISSIONS, JSON.stringify(missions));
    } catch {}
  }, [missions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BADGES, JSON.stringify(badges));
    } catch {}
  }, [badges]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(userSettings));
    } catch {}
  }, [userSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(streakDays));
    } catch {}
  }, [streakDays]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.XP, JSON.stringify(totalXp));
    } catch {}
  }, [totalXp]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.POINTS, JSON.stringify(ecoPoints));
    } catch {}
  }, [ecoPoints]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch {}
  }, [accounts]);

  // Auth Functions: Login, Signup, Logout, Reset
  const login = (id: string, pass: string): { success: boolean; message: string } => {
    const acc = accounts.find((a) => a.id.toLowerCase() === id.toLowerCase());
    if (!acc) {
      return { success: false, message: `Account ID "${id}" not found. Sign up below to create a new profile!` };
    }
    if (acc.password !== pass) {
      return { success: false, message: 'Incorrect password. Please try again.' };
    }

    // Set active session
    setCurrentSessionId(acc.id);
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, acc.id);
    } catch {}

    // Load account stats
    setStreakDays(acc.streakDays || 0);
    setTotalXp(acc.totalXp || 0);
    setEcoPoints(acc.ecoPoints || 0);
    setUserSettings((prev) => ({ ...prev, userName: acc.name }));

    // If Priyanshu's demo account has demo logs, load them
    if (acc.id.toLowerCase() === 'priyanshu' && wasteLogs.length === 0) {
      setWasteLogs(INITIAL_WASTE_LOGS);
      setEnergyLogs(INITIAL_ENERGY_LOGS);
    }

    return {
      success: true,
      message: `Welcome back, ${acc.name}! Streak: ${acc.streakDays}d (${acc.totalXp} XP)`,
    };
  };

  const signup = (id: string, name: string, pass: string): { success: boolean; message: string } => {
    const cleanId = id.toLowerCase().trim();
    if (accounts.some((a) => a.id.toLowerCase() === cleanId)) {
      return { success: false, message: `ID "${cleanId}" is already taken. Please choose another ID.` };
    }

    const newAcc: UserAccount = {
      id: cleanId,
      name: name.trim(),
      password: pass,
      streakDays: 0,
      totalXp: 0,
      ecoPoints: 0,
      sustainabilityScore: 0,
      createdAt: new Date().toISOString(),
    };

    const updated = [...accounts, newAcc];
    setAccounts(updated);
    setCurrentSessionId(newAcc.id);
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(updated));
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, newAcc.id);
    } catch {}

    // Clean slate for new user
    setStreakDays(0);
    setTotalXp(0);
    setEcoPoints(0);
    setWasteLogs([]);
    setEnergyLogs([]);
    setUserSettings((prev) => ({ ...prev, userName: newAcc.name }));

    return {
      success: true,
      message: `Welcome, ${newAcc.name}! Your account is ready with a fresh 0-streak clean slate.`,
    };
  };

  const logout = () => {
    setCurrentSessionId(null);
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    } catch {}
    // Reset to clean guest state
    setStreakDays(0);
    setTotalXp(0);
    setEcoPoints(0);
    setWasteLogs([]);
    setEnergyLogs([]);
    setUserSettings((prev) => ({ ...prev, userName: '' }));
    showToast('Switched to Guest mode (0 streak, 0 score).');
  };

  const resetAllScores = () => {
    setStreakDays(0);
    setTotalXp(0);
    setEcoPoints(0);
    setWasteLogs([]);
    setEnergyLogs([]);
    setEcoFlowers([]);
    setBioActions([]);

    if (currentUser) {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id.toLowerCase() === currentUser.id.toLowerCase()
            ? { ...a, streakDays: 0, totalXp: 0, ecoPoints: 0, sustainabilityScore: 0 }
            : a
        )
      );
    }

    try {
      localStorage.setItem(STORAGE_KEYS.STREAK, '0');
      localStorage.setItem(STORAGE_KEYS.XP, '0');
      localStorage.setItem(STORAGE_KEYS.POINTS, '0');
      localStorage.setItem(STORAGE_KEYS.WASTE, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.ENERGY, JSON.stringify([]));
      localStorage.setItem('ecoquest_flowers_v2', JSON.stringify([]));
      localStorage.setItem('ecoquest_bioactions_v2', JSON.stringify([]));
    } catch {}

    showToast('✨ All streaks, scores, and logs have been reset to 0!');
  };

  // Sync back to account when user earns XP/streak
  useEffect(() => {
    if (!currentUser) return;
    setAccounts((prev) =>
      prev.map((a) =>
        a.id.toLowerCase() === currentUser.id.toLowerCase()
          ? {
              ...a,
              streakDays,
              totalXp,
              ecoPoints,
            }
          : a
      )
    );
  }, [streakDays, totalXp, ecoPoints, currentUser]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#8fe77d', '#d9f69b', '#f4cc69'],
      });
    } catch {}
  };

  const addEcoReport = async (report: Omit<EcoReport, 'id' | 'date'>) => {
    const newRep: EcoReport = {
      ...report,
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      likes: 0,
    };
    setEcoReports((prev) => [newRep, ...prev]);
    setEcoFlowers((prev) => [...prev, report.flower]);
    try {
      localStorage.setItem('ecoquest_flowers_v2', JSON.stringify([...ecoFlowers, report.flower]));
      localStorage.setItem('ecoquest_reports_v2', JSON.stringify([newRep, ...ecoReports]));
    } catch {}

    // Multi-device server sync so friend sees post!
    try {
      await postSharedCommunityReport({
        photo: report.photo,
        description: report.description,
        location: report.location,
        type: report.type,
        flower: report.flower,
        author: report.author,
        lat: report.lat,
        lng: report.lng,
        kabadiwalaValueInr: report.kabadiwalaValueInr,
      });
      const res = await fetchSharedCommunityReports();
      if (res?.data && Array.isArray(res.data)) {
        setEcoReports(res.data);
      }
    } catch (err) {
      console.warn('Could not post to server community endpoint:', err);
    }

    recordDailyTask('Eco Waste Report', 25);
  };

  const likeEcoReport = async (id: number) => {
    setEcoReports((prev) =>
      prev.map((r) => {
        if (r.id === id && !r.liked) {
          return { ...r, likes: (r.likes || 0) + 1, liked: true };
        }
        return r;
      })
    );
    try {
      await fetch(`/api/community/reports/${id}/like`, { method: 'POST' });
    } catch {}
    showToast('A little encouragement goes a long way! ♥');
  };

  const addBioAction = (action: Omit<EcoBioAction, 'id' | 'date' | 'points' | 'author'>) => {
    const newAct: EcoBioAction = {
      ...action,
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      points: 25,
      author: userSettings.userName || (currentUser ? currentUser.name : 'Eco Explorer'),
    };
    setBioActions((prev) => [newAct, ...prev]);
    setPendingBioReport(null);
    triggerConfetti();
    try {
      localStorage.setItem('ecoquest_bioactions_v2', JSON.stringify([newAct, ...bioActions]));
    } catch {}
    recordDailyTask(`2nd Life: ${action.actionLabel}`, 25);
  };

  const claimReward = () => {
    setRewardClaimed(true);
    setRewardModalOpen(false);
    setTotalXp((prev) => prev + 100);
    setEcoPoints((prev) => prev + 50);
    triggerConfetti();
    try {
      localStorage.setItem('ecoquest_reward_claimed_v2', 'true');
    } catch {}
    showToast('🎉 Champion letter unlocked! +100 XP added.');
  };

  // User Level & XP Progress
  const userLevel = useMemo(() => {
    return Math.floor(totalXp / 150) + 1;
  }, [totalXp]);

  const levelXpProgress = useMemo(() => {
    const current = totalXp % 150;
    return { current, max: 150 };
  }, [totalXp]);

  // Energy aggregates
  const totalMonthlyKwh = useMemo(() => {
    return Number(energyLogs.reduce((acc, curr) => acc + curr.monthlyKwh, 0).toFixed(1));
  }, [energyLogs]);

  const totalMonthlyCost = useMemo(() => {
    return Number(energyLogs.reduce((acc, curr) => acc + curr.monthlyCost, 0).toFixed(2));
  }, [energyLogs]);

  const totalMonthlyCo2eKg = useMemo(() => {
    return Number(energyLogs.reduce((acc, curr) => acc + curr.monthlyCo2eKg, 0).toFixed(1));
  }, [energyLogs]);

  // Waste aggregates
  const totalWasteItems = wasteLogs.length;
  const divertedWasteItems = useMemo(() => {
    return wasteLogs.filter((w) => w.diversionEligible || w.category !== 'Landfill').length;
  }, [wasteLogs]);

  const wasteDiversionRate = useMemo(() => {
    if (totalWasteItems === 0) return 0;
    return Math.round((divertedWasteItems / totalWasteItems) * 100);
  }, [divertedWasteItems, totalWasteItems]);

  const totalWasteAvoidedCo2eKg = useMemo(() => {
    return Number(
      wasteLogs
        .filter((w) => w.diversionEligible || w.category !== 'Landfill')
        .reduce((acc, curr) => acc + (curr.avoidedCo2eKg || 0), 0)
        .toFixed(2)
    );
  }, [wasteLogs]);

  // Overall GreenPulse Sustainability Impact Score (0 - 100)
  const sustainabilityScore = useMemo(() => {
    const completedMissionsCount = missions.filter((m) => m.completed).length;
    // For a brand-new user with 0 logs and 0 streak, show 0!
    if (totalWasteItems === 0 && energyLogs.length === 0 && completedMissionsCount === 0 && streakDays === 0) {
      return 0;
    }

    const wasteScore = Math.min(35, (wasteDiversionRate / 100) * 35);
    let energyScore = 35;
    if (totalMonthlyKwh > 300) {
      energyScore = Math.max(10, 35 - ((totalMonthlyKwh - 300) / 400) * 20);
    }
    const missionScore = Math.min(30, completedMissionsCount * 4 + Math.min(10, streakDays * 2));
    const total = Math.round(wasteScore + energyScore + missionScore);
    return Math.min(99, Math.max(15, total));
  }, [wasteDiversionRate, totalMonthlyKwh, missions, streakDays, totalWasteItems, energyLogs.length]);

  // Actions
  const addWasteLog = (item: Omit<WasteItemLog, 'id' | 'timestamp'>) => {
    const newLog: WasteItemLog = {
      ...item,
      id: 'w-' + Date.now(),
      timestamp: new Date().toISOString(),
    };
    setWasteLogs((prev) => [newLog, ...prev]);
    triggerConfetti();
    checkAndUnlockBadges('waste', wasteLogs.length + 1);
    recordDailyTask(`Waste Diverted: ${item.name}`, 25);
  };

  const removeWasteLog = (id: string) => {
    setWasteLogs((prev) => prev.filter((item) => item.id !== id));
  };

  const confirmWasteCategory = (id: string, category: WasteCategory) => {
    setWasteLogs((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const isDiverted = category !== 'Landfill';
          return {
            ...item,
            category,
            confirmedByUser: true,
            diversionEligible: isDiverted,
          };
        }
        return item;
      })
    );
  };

  const addEnergyLog = (item: Omit<EnergyLog, 'id' | 'timestamp'>) => {
    const newLog: EnergyLog = {
      ...item,
      id: 'e-' + Date.now(),
      timestamp: new Date().toISOString(),
    };
    setEnergyLogs((prev) => [newLog, ...prev]);
    triggerConfetti();
    checkAndUnlockBadges('energy', energyLogs.length + 1);
    recordDailyTask(`Energy Audit: ${item.appliance}`, 20);
  };

  const removeEnergyLog = (id: string) => {
    setEnergyLogs((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleMission = (id: string) => {
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextCompleted = !m.completed;
          if (nextCompleted) {
            triggerConfetti();
            recordDailyTask(`Mission Completed: ${m.title}`, m.points);
          }
          return {
            ...m,
            completed: nextCompleted,
            completedAt: nextCompleted ? new Date().toISOString() : undefined,
          };
        }
        return m;
      })
    );
  };

  const addMissionFromCoach = (missionData: { title: string; description: string; points: number }) => {
    const newMission: Mission = {
      id: 'm-' + Date.now(),
      title: missionData.title,
      description: missionData.description,
      category: 'habit',
      period: 'daily',
      points: missionData.points || 30,
      difficulty: 'Easy',
      completed: false,
    };
    setMissions((prev) => [newMission, ...prev]);
    setActiveTab('missions');
    triggerConfetti();
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setUserSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const checkAndUnlockBadges = (type: 'waste' | 'energy', count: number) => {
    setBadges((prev) =>
      prev.map((b) => {
        if (b.id === 'b-2' && type === 'energy' && count >= 3 && !b.unlocked) {
          return { ...b, unlocked: true, unlockedAt: new Date().toISOString() };
        }
        if (b.id === 'b-3' && type === 'waste' && count >= 5 && !b.unlocked) {
          return { ...b, unlocked: true, unlockedAt: new Date().toISOString() };
        }
        return b;
      })
    );
  };

  const resetToDemoData = () => {
    setWasteLogs(INITIAL_WASTE_LOGS);
    setEnergyLogs(INITIAL_ENERGY_LOGS);
    setMissions(INITIAL_MISSIONS);
    setBadges(BADGES_LIST);
    setUserSettings(DEFAULT_SETTINGS);
    setStreakDays(5);
    setTotalXp(340);
    setDemoStep(1);
    setActiveTab('dashboard');
  };

  return (
    <GreenPulseContext.Provider
      value={{
        activeTab,
        setActiveTab,
        wasteLogs,
        energyLogs,
        missions,
        badges,
        userSettings,
        updateSettings,
        streakDays,
        totalXp,
        userLevel,
        levelXpProgress,
        sustainabilityScore,
        dailyTasksCompleted,
        todayDateString,
        recordDailyTask,
        currentUser,
        accounts,
        isAuthModalOpen,
        setIsAuthModalOpen,
        login,
        signup,
        logout,
        resetAllScores,
        totalMonthlyKwh,
        totalMonthlyCost,
        totalMonthlyCo2eKg,
        totalWasteItems,
        divertedWasteItems,
        wasteDiversionRate,
        totalWasteAvoidedCo2eKg,
        addWasteLog,
        removeWasteLog,
        confirmWasteCategory,
        addEnergyLog,
        removeEnergyLog,
        toggleMission,
        addMissionFromCoach,
        resetToDemoData,
        demoStep,
        setDemoStep,
        isDemoBarOpen,
        setIsDemoBarOpen,
        triggerConfetti,
        ecoReports,
        addEcoReport,
        likeEcoReport,
        ecoFlowers,
        ecoPoints,
        bioActions,
        addBioAction,
        pendingBioReport,
        setPendingBioReport,
        rewardModalOpen,
        setRewardModalOpen,
        rewardClaimed,
        claimReward,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </GreenPulseContext.Provider>
  );
};

export const useGreenPulse = () => {
  const context = useContext(GreenPulseContext);
  if (!context) {
    throw new Error('useGreenPulse must be used within a GreenPulseProvider');
  }
  return context;
};
