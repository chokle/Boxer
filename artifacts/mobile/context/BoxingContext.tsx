import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BoxerProfile, MatchSession, AppStats, TimerSession } from '@/types';

const PROFILE_KEY = '@boxer_ai_profile';
const SESSIONS_KEY = '@boxer_ai_sessions';
const TIMER_SESSIONS_KEY = '@boxer_ai_timer_sessions';

interface BoxingContextType {
  profile: BoxerProfile | null;
  sessions: MatchSession[];
  timerSessions: TimerSession[];
  saveProfile: (p: BoxerProfile) => Promise<void>;
  addSession: (s: MatchSession) => Promise<void>;
  updateDrillCompleted: (sessionId: string, drillId: string, completed: boolean) => Promise<void>;
  addTimerSession: (s: TimerSession) => Promise<void>;
  getStats: () => AppStats;
  clearLocalData: () => Promise<void>;
  getDataGeneration: () => number;
}

const BoxingContext = createContext<BoxingContextType | null>(null);

export function BoxingProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<BoxerProfile | null>(null);
  const [sessions, setSessions] = useState<MatchSession[]>([]);
  const [timerSessions, setTimerSessions] = useState<TimerSession[]>([]);

  const dataGeneration = useRef(0);
  const sessionsRef = useRef<MatchSession[]>([]);
  const timerSessionsRef = useRef<TimerSession[]>([]);
  const storageQueue = useRef(Promise.resolve());
  const persist = useCallback((key: string, value: unknown) => {
    storageQueue.current = storageQueue.current.catch(() => undefined).then(() => AsyncStorage.setItem(key, JSON.stringify(value)));
    return storageQueue.current;
  }, []);

  useEffect(() => {
    const generation = dataGeneration.current;
    (async () => {
      const [pRaw, sRaw, tRaw] = await Promise.all([
        AsyncStorage.getItem(PROFILE_KEY),
        AsyncStorage.getItem(SESSIONS_KEY),
        AsyncStorage.getItem(TIMER_SESSIONS_KEY),
      ]);
      if (generation !== dataGeneration.current) return;
      if (pRaw) setProfile(JSON.parse(pRaw));
      if (sRaw) { sessionsRef.current = JSON.parse(sRaw); setSessions(sessionsRef.current); }
      if (tRaw) { timerSessionsRef.current = JSON.parse(tRaw); setTimerSessions(timerSessionsRef.current); }
    })().catch(() => { /* Invalid local data must not crash startup. */ });
  }, []);

  const saveProfile = useCallback(async (p: BoxerProfile) => {
    setProfile(p);
    await persist(PROFILE_KEY, p);
  }, []);

  const addSession = useCallback(async (s: MatchSession) => {
    const next = [s, ...sessionsRef.current];
    sessionsRef.current = next;
    setSessions(next);
    await persist(SESSIONS_KEY, next);
  }, []);

  const updateDrillCompleted = useCallback(
    async (sessionId: string, drillId: string, completed: boolean) => {
        const next = sessionsRef.current.map(s => {
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
        sessionsRef.current = next;
        setSessions(next);
        await persist(SESSIONS_KEY, next);
    },
    []
  );

  const addTimerSession = useCallback(async (s: TimerSession) => {
    const next = [s, ...timerSessionsRef.current];
    timerSessionsRef.current = next;
    setTimerSessions(next);
    await persist(TIMER_SESSIONS_KEY, next);
  }, []);

  const clearLocalData = useCallback(async () => {
    // Invalidate pending reads, serialize deletion behind pending writes.
    dataGeneration.current += 1;
    const operation = storageQueue.current.catch(() => undefined).then(() => AsyncStorage.multiRemove([PROFILE_KEY, SESSIONS_KEY, TIMER_SESSIONS_KEY]));
    storageQueue.current = operation;
    await operation;
    sessionsRef.current = [];
    timerSessionsRef.current = [];
    setProfile(null);
    setSessions([]);
    setTimerSessions([]);
  }, []);

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
    <BoxingContext.Provider value={{ profile, sessions, timerSessions, saveProfile, addSession, updateDrillCompleted, addTimerSession, getStats, clearLocalData, getDataGeneration: () => dataGeneration.current }}>
      {children}
    </BoxingContext.Provider>
  );
}

export function useBoxing() {
  const ctx = useContext(BoxingContext);
  if (!ctx) throw new Error('useBoxing must be used within BoxingProvider');
  return ctx;
}
