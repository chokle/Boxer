import { getIntegrityToken } from './appIntegrity';
import { isPerformanceAnalysis } from './validateAnalysis';
import type { BoxerProfile, PerformanceAnalysis, DrillRecommendation } from '@/types';

interface AnalyzeRequest {
  title: string;
  description: string;
  match_context: string;
  opponent_style: string;
  match_description: string;
  boxer_profile: BoxerProfile;
  images?: string[];
}

export async function analyzeMatch(req: AnalyzeRequest): Promise<PerformanceAnalysis> {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const url = `https://${domain}/api/analyze`;

  const body = JSON.stringify({
      title: req.title,
      match_context: req.match_context,
      opponent_style: req.opponent_style,
      match_description: req.match_description,
      boxer_profile: {
        stance: req.boxer_profile.stance,
        experience_level: req.boxer_profile.experience_level,
        weight_class: req.boxer_profile.weight_class,
      },
      images: req.images,
    });
  const token = await getIntegrityToken(body);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 65_000);
  let res: Response;
  let json;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Play-Integrity': token },
      body,
      signal: controller.signal,
    });
    json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Analysis failed');
  } finally { clearTimeout(timeout); }

  if (!json.success) throw new Error(json.error ?? 'Analysis failed');

  const raw = json.analysis;
  if (!isPerformanceAnalysis(raw)) throw new Error('The AI returned an incomplete analysis. Please try again.');

  const drills: DrillRecommendation[] = (raw.drills ?? []).map(
    (d: Omit<DrillRecommendation, 'id' | 'completed'>, i: number) => ({
      ...d,
      id: `${Date.now()}_${i}`,
      completed: false,
    })
  );

  return { ...raw, drills };
}
