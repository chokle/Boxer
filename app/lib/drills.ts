import { trySupabase } from './supabase';
import { completionStore } from './store';
import type { Drill } from './types';

let cache: Drill[] | null = null;

/**
 * Loads the bundled drill library from ../drills/drills.json.
 * The file may be empty or missing — never throws, returns [] instead
 * so the Drills screen can render its honest empty state.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
function loadBundled(): Drill[] {
  if (cache) return cache;
  try {
    const data = require('../drills/drills.json');
    const list = Array.isArray(data) ? data : [];
    cache = list.filter(
      (d): d is Drill => typeof d === 'object' && d !== null && typeof d.id === 'string',
    );
  } catch {
    cache = [];
  }
  return cache;
}

export function getDrills(): Drill[] {
  return loadBundled();
}

export function getDrill(id: string): Drill | undefined {
  return loadBundled().find((d) => d.id === id);
}

/** Drill completion ids. Supabase when signed in; AsyncStorage fallback. */
export async function loadCompletions(): Promise<string[]> {
  const supabase = trySupabase();
  if (supabase) {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (user) {
      const { data } = await supabase.from('drill_completions').select('drill_id').eq('user_id', user.id);
      if (data) return (data as { drill_id: string }[]).map((r) => r.drill_id);
    }
  }
  return completionStore.load();
}

export async function setDrillCompleted(drillId: string, completed: boolean): Promise<string[]> {
  const supabase = trySupabase();
  if (supabase) {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (user) {
      if (completed) {
        await supabase.from('drill_completions').upsert(
          { user_id: user.id, drill_id: drillId },
          { onConflict: 'user_id,drill_id' },
        );
      } else {
        await supabase.from('drill_completions').delete().eq('user_id', user.id).eq('drill_id', drillId);
      }
      return loadCompletions();
    }
  }
  const current = await completionStore.load();
  const next = completed
    ? Array.from(new Set([...current, drillId]))
    : current.filter((id) => id !== drillId);
  await completionStore.save(next);
  return next;
}
