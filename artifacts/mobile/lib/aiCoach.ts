import type { BoxerProfile, PerformanceAnalysis, DrillRecommendation } from '@/types';

interface AnalyzeRequest {
  title: string;
  description: string;
  match_context: string;
  opponent_style: string;
  match_description: string;
  boxer_profile: BoxerProfile;
}

export async function analyzeMatch(req: AnalyzeRequest): Promise<PerformanceAnalysis> {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const url = `https://${domain}/api/analyze`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error ?? 'Analysis failed');
  }

  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Analysis failed');

  const raw = json.analysis;

  const drills: DrillRecommendation[] = (raw.drills ?? []).map(
    (d: Omit<DrillRecommendation, 'id' | 'completed'>, i: number) => ({
      ...d,
      id: `${Date.now()}_${i}`,
      completed: false,
    })
  );

  return { ...raw, drills };
}
