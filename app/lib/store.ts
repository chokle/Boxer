import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Injury, Profile, TrainingSession } from './types';

// AsyncStorage keys reused from the original app where they existed.
const PROFILE_KEY = '@boxer_ai_profile';
const SESSIONS_KEY = '@boxer_ai_sessions';
const INTRO_KEY = 'boxer_ai_intro_done';
const COMPLETIONS_KEY = '@boxer_ai_drill_completions';

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is best-effort; the app must not crash over it.
  }
}

export const introStore = {
  isDone: () => readJson<boolean>(INTRO_KEY, false),
  markDone: () => writeJson(INTRO_KEY, true),
};

export const profileStore = {
  load: () => readJson<Profile>(PROFILE_KEY, {}),
  save: (p: Profile) => writeJson(PROFILE_KEY, p),
};

export const sessionStore = {
  load: () => readJson<TrainingSession[]>(SESSIONS_KEY, []),
  save: (s: TrainingSession[]) => writeJson(SESSIONS_KEY, s),
};

export const completionStore = {
  /** Local drill completion ids. Supabase is authoritative when signed in. */
  load: () => readJson<string[]>(COMPLETIONS_KEY, []),
  save: (ids: string[]) => writeJson(COMPLETIONS_KEY, ids),
};

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
