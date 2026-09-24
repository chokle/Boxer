import type { AnalysisType } from './copy';

export type AnalysisStatus = 'queued' | 'extracting' | 'analyzing' | 'done' | 'failed';

export interface Analysis {
  id: string;
  user_id: string;
  analysis_type: AnalysisType;
  media_path: string;
  keyframe_paths: string[];
  status: AnalysisStatus;
  pose_metrics: Record<string, unknown> | null;
  result: AnalysisResult | null;
  error: string | null;
  created_at: string;
}

export interface PunchEvent {
  type?: string;
  t0?: number;
  t1?: number;
  notes?: string;
  score?: number;
}

export interface Fault {
  fault?: string;
  severity?: string;
  frames?: number[];
  cue?: string;
}

export interface AnalysisResult {
  punches?: PunchEvent[];
  categories?: Record<string, number>;
  faults?: Fault[];
  drill_ids?: string[];
  tactical_summary?: string;
  strengths?: string[];
  [key: string]: unknown;
}

export interface Drill {
  id: string;
  title: string;
  category?: string;
  difficulty?: string;
  instructions: string;
  sets_reps?: string;
  coaching_points?: string[];
  for_faults?: string[];
}

export interface Club {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  website?: string | null;
  phone?: string | null;
  specialties?: string[] | null;
}

export interface Tournament {
  id: string;
  title: string;
  organizer?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  location?: string | null;
  registration_url?: string | null;
  deadline_text?: string | null;
  source_url?: string | null;
}

export interface Profile {
  name?: string;
  boxing_style?: string;
  weight_class?: string;
  experience?: string;
  photo_url?: string | null;
}

export interface Injury {
  id: string;
  body_part: string;
  description?: string;
  created_at: string;
}

export interface TrainingSession {
  id: string;
  title: string;
  context?: string;
  notes?: string;
  media_uris: string[];
  created_at: string;
}
