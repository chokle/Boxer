// Shared types for the analysis worker.

export type AnalysisStatus = 'queued' | 'extracting' | 'analyzing' | 'done' | 'failed';

export interface AnalysisRow {
  id: string;
  user_id: string;
  media_path: string;
  media_type: 'video' | 'photo';
  analysis_type: string | null;
  keyframe_paths: string[];
  status: AnalysisStatus;
  pose_metrics: PoseMetricsJson | null;
  result: unknown | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

/** One body keypoint, coordinates normalized to 0..1 of frame size. */
export interface Keypoint {
  name: string;
  x: number;
  y: number;
  score: number;
}

export interface DetectedPose {
  keypoints: Keypoint[];
  /** Mean keypoint score. */
  score: number;
}

/**
 * Per-frame derived coaching metrics. All positions are normalized (0..1).
 *
 * guard_height_proxy: wrist height relative to guard geometry, where
 *   1.0 ≈ wrist at chin level, 0.5 ≈ wrist at chest, ≤0 ≈ hands dropped
 *   to waist or below. This is a PROXY, not centimeters — real-world
 *   scale is unknowable from a single uncalibrated camera.
 */
export interface FrameMetrics {
  guard_height_proxy: number | null;
  elbow_angle_left: number | null; // degrees at the elbow joint
  elbow_angle_right: number | null;
  stance_width_ratio: number | null; // ankle spread / shoulder width
  head_x: number | null;
  head_y: number | null;
}

export interface FrameResult {
  /** Seconds into the source video (approximate, from extraction fps). */
  t: number;
  /** Path inside the keyframes bucket, "<user_id>/<analysis_id>/frame_XXXX.jpg". */
  path: string;
  person_detected: boolean;
  pose_score: number | null;
  /** Present only when person_detected. */
  keypoints: Record<string, { x: number; y: number; score: number }> | null;
  metrics: FrameMetrics | null;
}

export interface PoseMetricsSummary {
  frames_with_person: number;
  avg_guard_height: number | null;
  min_guard_height: number | null;
  /** Frames where guard_height_proxy < GUARD_DROP_THRESHOLD. */
  guard_drop_events: number;
  avg_stance_width: number | null;
  /** Max head displacement from its first-seen position (normalized units). */
  head_displacement: number | null;
}

/** Exact shape stored in analyses.pose_metrics (jsonb). */
export interface PoseMetricsJson {
  model: string;
  frame_count: number;
  frames: FrameResult[];
  summary: PoseMetricsSummary;
}
