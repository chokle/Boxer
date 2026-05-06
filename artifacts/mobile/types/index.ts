export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Pro';
export type Stance = 'Orthodox' | 'Southpaw' | 'Switch';
export type DrillDifficulty = 'Easy' | 'Medium' | 'Hard';
export type DrillCategory = 'footwork' | 'offense' | 'defense' | 'stamina' | 'combination' | 'general';

export type InjuryArea =
  | 'Head' | 'Neck' | 'Shoulder' | 'Elbow' | 'Hand/Wrist'
  | 'Ribs' | 'Back' | 'Hip' | 'Knee' | 'Ankle/Foot' | 'Other';
export type InjurySeverity = 'Mild' | 'Moderate' | 'Severe';

export interface Injury {
  id: string;
  area: InjuryArea;
  severity: InjurySeverity;
  notes: string;
  date: string;
  active: boolean;
}

export interface BoxerProfile {
  name: string;
  weight_class: string;
  experience_level: ExperienceLevel;
  stance: Stance;
  age: number | null;
  reach_inches: number | null;
  weight_kg: number | null;
  height_cm: number | null;
  injuries: Injury[];
}

export interface DrillRecommendation {
  id: string;
  category: DrillCategory;
  name: string;
  description: string;
  duration: string;
  difficulty: DrillDifficulty;
  focus_area: string;
  reps: string;
  completed: boolean;
}

export interface PerformanceAnalysis {
  overall_score: number;
  stance_score: number;
  offense_score: number;
  defense_score: number;
  footwork_score: number;
  combination_score: number;
  stance_feedback: string;
  offense_feedback: string;
  defense_feedback: string;
  footwork_feedback: string;
  combination_feedback: string;
  tactical_summary: string;
  key_strengths: string[];
  improvement_areas: string[];
  shot_accuracy: number;
  punches_thrown: number;
  punches_landed: number;
  drills: DrillRecommendation[];
}

export interface MatchSession {
  id: string;
  title: string;
  description: string;
  match_context: string;
  opponent_style: string;
  analysis: PerformanceAnalysis;
  date: string;
}

export interface AppStats {
  totalSessions: number;
  avgScore: number;
  avgStance: number;
  avgOffense: number;
  avgDefense: number;
  avgFootwork: number;
  avgCombination: number;
  bestScore: number;
  streak: number;
}
