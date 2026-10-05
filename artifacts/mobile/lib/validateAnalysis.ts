import type { PerformanceAnalysis } from '@/types';

export function isPerformanceAnalysis(value: unknown): value is PerformanceAnalysis {
  if (!value || typeof value !== 'object') return false;
  const raw = value as Record<string, unknown>;
  const scores = ['overall_score','stance_score','offense_score','defense_score','footwork_score','combination_score','shot_accuracy'];
  if (scores.some(k => typeof raw[k] !== 'number' || !Number.isFinite(raw[k]) || (raw[k] as number) < 0 || (raw[k] as number) > 100)) return false;
  if (['punches_thrown','punches_landed'].some(k => !Number.isInteger(raw[k]) || (raw[k] as number) < 0 || (raw[k] as number) > 100_000)) return false;
  const text = (v: unknown) => typeof v === 'string' && v.length <= 4000;
  if (['stance_feedback','offense_feedback','defense_feedback','footwork_feedback','combination_feedback','tactical_summary'].some(k => !text(raw[k]))) return false;
  if (['key_strengths','improvement_areas'].some(k => !Array.isArray(raw[k]) || (raw[k] as unknown[]).length > 20 || !(raw[k] as unknown[]).every(text))) return false;
  return Array.isArray(raw.drills) && raw.drills.length <= 20 && raw.drills.every(d => d && typeof d === 'object' &&
    ['footwork','offense','defense','stamina','combination','general'].includes(d.category) &&
    ['Easy','Medium','Hard'].includes(d.difficulty) && ['name','description','duration','focus_area','reps'].every(k => text(d[k])));
}
