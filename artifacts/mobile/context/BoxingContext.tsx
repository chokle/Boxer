import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BoxerProfile, MatchSession, AppStats } from '@/types';

const PROFILE_KEY = '@boxer_ai_profile';
const SESSIONS_KEY = '@boxer_ai_sessions';

interface BoxingContextType {
  profile: BoxerProfile | null;
  sessions: MatchSession[];
  saveProfile: (p: BoxerProfile) => Promise<void>;
  addSession: (s: MatchSession) => Promise<void>;
  updateDrillCompleted: (sessionId: string, drillId: string, completed: boolean) => Promise<void>;
  getStats: () => AppStats;
}

const BoxingContext = createContext<BoxingContextType | null>(null);

export function BoxingProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<BoxerProfile | null>(null);
  const [sessions, setSessions] = useState<MatchSession[]>([]);

  useEffect(() => {
    (async () => {
      const [pRaw, sRaw] = await Promise.all([
        AsyncStorage.getItem(PROFILE_KEY),
        AsyncStorage.getItem(SESSIONS_KEY),
      ]);
      if (pRaw) setProfile(JSON.parse(pRaw));
      if (sRaw) setSessions(JSON.parse(sRaw));
    })();
  }, []);

  const saveProfile = useCallback(async (p: BoxerProfile) => {
    setProfile(p);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  }, []);

  const addSession = useCallback(async (s: MatchSession) => {
    setSessions(prev => {
      const next = [s, ...prev];
      AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const updateDrillCompleted = useCallback(
    async (sessionId: string, drillId: string, completed: boolean) => {
      setSessions(prev => {
        const next = prev.map(s => {
          if (s.id !== sessionId) return s;
          return {
            ...s,
            analysis: {
              ...s.analysis,
              drills: s.analysis.drills.map(d =>
                d.id === drillId ? { ...d, completed } : d
              ),
            },
          };
        });
        AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const getStats = useCallback((): AppStats => {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        avgScore: 0,
        avgStance: 0,
        avgOffense: 0,
        avgDefense: 0,
        avgFootwork: 0,
        avgCombination: 0,
        bestScore: 0,
        streak: 0,
      };
    }
    const n = sessions.length;
    const avg = (key: keyof MatchSession['analysis']) =>
      Math.round(
        sessions.reduce((sum, s) => sum + (s.analysis[key] as number), 0) / n
      );
    return {
      totalSessions: n,
      avgScore: avg('overall_score'),
      avgStance: avg('stance_score'),
      avgOffense: avg('offense_score'),
      avgDefense: avg('defense_score'),
      avgFootwork: avg('footwork_score'),
      avgCombination: avg('combination_score'),
      bestScore: Math.round(Math.max(...sessions.map(s => s.analysis.overall_score))),
      streak: Math.min(n, 7),
    };
  }, [sessions]);

  return (
    <BoxingContext.Provider value={{ profile, sessions, saveProfile, addSession, updateDrillCompleted, getStats }}>
      {children}
    </BoxingContext.Provider>
  );
}

export function useBoxing() {
  const ctx = useContext(BoxingContext);
  if (!ctx) throw new Error('useBoxing must be used within BoxingProvider');
  return ctx;
}
