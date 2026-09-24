import { getSupabase, trySupabase } from './supabase';
import { sessionStore, newId } from './store';
import type { Analysis, AnalysisStatus, TrainingSession } from './types';
import type { AnalysisType } from './copy';

export const ANALYSIS_BUCKET = 'raw-media';

export const STATUS_LABELS: Record<AnalysisStatus, string> = {
  queued: 'Queued — waiting for an analysis worker',
  extracting: 'Extracting frames',
  analyzing: 'Analyzing technique',
  done: 'Analysis Complete',
  failed: 'Analysis failed',
};

function guessExtension(uri: string): string {
  const clean = uri.split('?')[0].toLowerCase();
  const match = clean.match(/\.([a-z0-9]+)$/);
  return match ? match[1] : 'mp4';
}

function guessMimeType(uri: string, fallback: string): string {
  const ext = guessExtension(uri);
  const map: Record<string, string> = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    m4v: 'video/x-m4v',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    heic: 'image/heic',
    webp: 'image/webp',
  };
  return map[ext] ?? fallback;
}

function xhrPut(url: string, blob: Blob, contentType: string, onProgress: (frac: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onProgress(Math.min(1, e.loaded / e.total));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (HTTP ${xhr.status})`));
    xhr.onerror = () => reject(new Error('Upload failed: network error'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));
    xhr.send(blob);
  });
}

export interface StartAnalysisArgs {
  mediaUri: string;
  mimeType?: string;
  analysisType: AnalysisType;
  onProgress?: (frac: number) => void;
}

/**
 * Uploads media to Supabase Storage with REAL upload progress, then queues
 * an analysis row. Throws with a plain message when the backend isn't
 * configured — callers must surface that instead of faking progress.
 */
export async function startAnalysis(args: StartAnalysisArgs): Promise<string> {
  const supabase = getSupabase(); // throws when not configured
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) throw new Error('You need to sign in first.');

  const { mediaUri, analysisType, onProgress } = args;
  const mimeType = args.mimeType ?? guessMimeType(mediaUri, 'video/mp4');
  const ext = guessExtension(mediaUri);
  const path = `${user.id}/${Date.now()}.${ext}`;

  // Read the file into a Blob (works for file:// URIs in React Native).
  const fileRes = await fetch(mediaUri);
  if (!fileRes.ok) throw new Error('Could not read the selected media.');
  const blob = await fileRes.blob();

  // Signed single-use upload URL; PUT the raw bytes with real progress.
  const { data: signed, error: signError } = await supabase.storage
    .from(ANALYSIS_BUCKET)
    .createSignedUploadUrl(path);
  if (signError || !signed?.signedUrl) {
    throw new Error(signError?.message ?? 'Could not start the upload.');
  }
  await xhrPut(signed.signedUrl, blob, mimeType, onProgress ?? (() => {}));

  const { data, error } = await supabase
    .from('analyses')
    .insert({
      user_id: user.id,
      analysis_type: analysisType,
      media_path: signed.path || path,
      status: 'queued',
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Could not queue the analysis.');
  return data.id as string;
}

export async function fetchAnalysis(id: string): Promise<Analysis | null> {
  const supabase = trySupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from('analyses').select('*').eq('id', id).single();
  if (error) return null;
  return data as Analysis;
}

export async function listAnalyses(limit = 10): Promise<Analysis[]> {
  const supabase = trySupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as Analysis[];
}

/** Polls an analysis row until it reaches a terminal state. Never invents states. */
export function pollAnalysis(
  id: string,
  onUpdate: (a: Analysis | null) => void,
  intervalMs = 3000,
): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setInterval> | null = null;

  const tick = async () => {
    if (stopped) return;
    const a = await fetchAnalysis(id);
    onUpdate(a);
    if (a && (a.status === 'done' || a.status === 'failed')) {
      if (timer) clearInterval(timer);
    }
  };

  tick();
  timer = setInterval(tick, intervalMs);
  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
  };
}

// ── Training journal (Supabase when available, AsyncStorage fallback) ──

export async function listSessions(): Promise<TrainingSession[]> {
  const supabase = trySupabase();
  if (supabase) {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) {
      return (data as any[]).map((r) => ({
        id: r.id,
        title: r.title ?? 'Untitled session',
        context: r.context ?? undefined,
        notes: r.notes ?? undefined,
        media_uris: r.media_urls ?? [],
        created_at: r.created_at,
      }));
    }
  }
  return sessionStore.load();
}

export async function getSession(id: string): Promise<TrainingSession | null> {
  const all = await listSessions();
  return all.find((s) => s.id === id) ?? null;
}

export async function saveSession(s: Omit<TrainingSession, 'id' | 'created_at'>): Promise<TrainingSession> {
  const supabase = trySupabase();
  if (supabase) {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (user) {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          title: s.title,
          context: s.context ?? null,
          notes: s.notes ?? null,
          media_urls: s.media_uris,
        })
        .select('*')
        .single();
      if (!error && data) {
        return {
          id: data.id,
          title: data.title,
          context: data.context ?? undefined,
          notes: data.notes ?? undefined,
          media_uris: data.media_urls ?? [],
          created_at: data.created_at,
        };
      }
    }
  }
  const created: TrainingSession = { ...s, id: newId(), created_at: new Date().toISOString() };
  const all = await sessionStore.load();
  await sessionStore.save([created, ...all]);
  return created;
}
