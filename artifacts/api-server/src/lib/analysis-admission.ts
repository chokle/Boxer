import type { Request, Response, NextFunction } from 'express';
import { pool } from '@workspace/db';
import { createHash } from 'node:crypto';
import { verifyIntegrityToken } from './play-integrity';

// Cheap bounded admission before calling Google or the paid model.
const buckets = new Map<string, { count: number; expires: number }>();
let active = 0;
export function analysisRateLimit(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  for (const [key, bucket] of buckets) if (bucket.expires <= now) buckets.delete(key);
  const key = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  const bucket = buckets.get(key) ?? { count: 0, expires: now + 60_000 };
  if (bucket.count >= 5 || active >= 4 || (!buckets.has(key) && buckets.size >= 4096)) {
    res.setHeader('Retry-After', '60');
    res.status(429).json({ error: 'Too many coaching requests. Please try again later.' });
    return;
  }
  bucket.count += 1;
  buckets.set(key, bucket);
  active += 1;
  let released = false;
  const release = () => { if (!released) { active -= 1; released = true; } };
  res.once('finish', release);
  res.once('close', release);
  next();
}

export async function admitAnalysis(req: Request, res: Response, next: NextFunction) {
  if (!process.env.PLAY_SIGNING_CERTIFICATE_SHA256 || process.env.BOXER_AI_ENABLED !== 'true') {
    res.status(503).json({ error: 'AI coaching is temporarily unavailable.' });
    return;
  }
  const token = req.get('X-Play-Integrity');
  const rawBody = res.locals.rawAnalysisBody;
  if (!token || typeof rawBody !== 'string') {
    res.status(401).json({ error: 'Please use the verified Google Play version of Boxer AI.' });
    return;
  }
  try {
    if (!await verifyIntegrityToken(token, rawBody)) {
      res.status(403).json({ error: 'App verification failed. Please install Boxer AI from Google Play.' });
      return;
    }
    // Database-wide limits survive restarts and coordinate all backend replicas.
    // Token digests prevent replay without storing Google tokens or user data.
    const configured = Number(process.env.BOXER_AI_DAILY_LIMIT ?? '100');
    const limit = Number.isInteger(configured) && configured > 0 && configured <= 500 ? configured : 100;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const replay = await client.query('INSERT INTO boxer_ai_used_tokens (token_hash, expires_at) VALUES ($1, NOW() + INTERVAL \'5 minutes\') ON CONFLICT DO NOTHING RETURNING token_hash', [createHash('sha256').update(token).digest('hex')]);
      if (replay.rowCount !== 1) {
        await client.query('ROLLBACK');
        res.status(409).json({ error: 'This coaching request has already been used.' });
        return;
      }
      const quota = await client.query('INSERT INTO boxer_ai_daily_budget (day, requests) VALUES (CURRENT_DATE, 1) ON CONFLICT (day) DO UPDATE SET requests = boxer_ai_daily_budget.requests + 1 WHERE boxer_ai_daily_budget.requests < $1 RETURNING requests', [limit]);
      if (quota.rowCount !== 1) {
        await client.query('ROLLBACK');
        res.status(429).json({ error: 'The daily coaching limit has been reached. Please try tomorrow.' });
        return;
      }
      await client.query('DELETE FROM boxer_ai_used_tokens WHERE expires_at < NOW()');
      await client.query("DELETE FROM boxer_ai_daily_budget WHERE day < CURRENT_DATE - 7");
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
    next();
  } catch {
    // Do not log provider token bodies or submitted photos/notes.
    req.log.warn('AI admission unavailable');
    res.status(503).json({ error: 'App verification is temporarily unavailable. Please try again later.' });
  }
}
