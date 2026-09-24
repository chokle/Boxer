// Monthly quota enforcement, checked at job pickup.
//
// Rules (Derek's monetization decision, 2026-09-23):
//   * free tier: FREE_MONTHLY_LIMIT analyses per calendar month (default 5)
//   * tier_1 / tier_2: higher limits (constants marked TBD in config.ts)
//   * byok=true (bring your own OpenAI key): bypasses counting entirely
//
// Quota is consumed when the job is picked up (not on success) — this
// keeps retry-spam from being free. The increment uses optimistic
// locking on the previously-read count so two workers racing on the
// same user can't both slip under the limit; on a lost race we fail
// closed (deny) with quota_race, which is safe to retry manually.
//
// Month bucket is UTC 'YYYY-MM'. Rows are created lazily with
// tier='free', byok=false; the app server updates tier/byok when the
// user subscribes or adds a key.

import { FREE_MONTHLY_LIMIT, limitForTier } from './config';
import type { DbClient } from './supabase';

export interface QuotaDecision {
  allowed: boolean;
  /** Present when denied: 'quota_exceeded' | 'quota_race'. */
  reason?: string;
  /** False for byok users — their analyses are never counted. */
  counted: boolean;
}

export function currentMonth(d = new Date()): string {
  return d.toISOString().slice(0, 7); // YYYY-MM (UTC)
}

export async function checkAndConsumeQuota(db: DbClient, userId: string): Promise<QuotaDecision> {
  const month = currentMonth();

  // Lazily create this month's ledger row; 23505 = already exists, fine.
  const { error: insErr } = await db.from('analysis_usage').insert({ user_id: userId, month });
  if (insErr && insErr.code !== '23505') {
    throw new Error(`quota ledger init failed for ${userId}/${month}: ${insErr.message}`);
  }

  const { data: row, error: selErr } = await db
    .from('analysis_usage')
    .select('count, tier, byok')
    .eq('user_id', userId)
    .eq('month', month)
    .maybeSingle();

  if (selErr || !row) {
    throw new Error(`quota lookup failed for ${userId}/${month}: ${selErr?.message ?? 'no row'}`);
  }

  const tier = row.tier as string;
  const byok = row.byok as boolean;
  const count = row.count as number;

  if (byok) {
    return { allowed: true, counted: false };
  }

  const limit = tier === 'free' ? FREE_MONTHLY_LIMIT : limitForTier(tier);
  if (count >= limit) {
    return { allowed: false, reason: 'quota_exceeded', counted: false };
  }

  // Optimistic increment: only succeeds if nobody else consumed since we read.
  const { data: updated, error: updErr } = await db
    .from('analysis_usage')
    .update({ count: count + 1 })
    .eq('user_id', userId)
    .eq('month', month)
    .eq('count', count)
    .select('count');

  if (updErr || !updated || (Array.isArray(updated) && updated.length === 0)) {
    return { allowed: false, reason: 'quota_race', counted: false };
  }
  return { allowed: true, counted: true };
}
