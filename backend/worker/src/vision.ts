// Phase 2b seam: OpenAI vision analysis.
//
// Phase 2a stops at pose metrics (result stays null). This module is the
// single place where the vision LLM plugs in. When VISION_ENABLED=true,
// pipeline.ts calls runVisionAnalysis() after pose metrics are saved.
//
// ---- 2b integration notes (for whoever implements this) ------------------
// Model: OpenAI vision-capable model (Derek's decision 2026-09-23; exact
//   model id chosen at 2b time — the API below is model-agnostic).
// Input: the keyframe JPEGs (downscaled, ≤16) + the PoseMetricsJson.
// Prompt: the coaching rubric — punch identification, stance, guard,
//   footwork, head movement, combination fluidity, defensive reads —
//   with the pose metrics injected as grounded measurements so the
//   model critiques against data, not vibes.
// Output contract (validated server-side before saving):
//   {
//     "punches":   [{ "type": "jab| cross|hook|uppercut|…", "t0": 1.2, "t1": 1.6,
//                     "notes": "…", "score": 7 }],
//     "categories": { "stance": 6, "guard": 5, "footwork": 7,
//                     "head_movement": 4, "combinations": 6 },
//     "faults":    [{ "fault": "drops right hand on cross", "severity": "high",
//                     "frames": [3, 7], "cue": "…" }],
//     "drill_ids": ["guard-retention-2", "slip-rope-1"]   // must exist in drills
//   }
// Cost control: frame count is already capped at MAX_KEYFRAMES; keep
//   frames at ≤720p and the prompt tight. byok users' keys are used here.
// ---------------------------------------------------------------------------

import type { PoseMetricsJson } from './types';

export interface VisionResult {
  punches: Array<{ type: string; t0: number; t1: number; notes: string; score: number }>;
  categories: Record<string, number>;
  faults: Array<{ fault: string; severity: string; frames: number[]; cue: string }>;
  drill_ids: string[];
}

/**
 * Runs the OpenAI vision analysis over the keyframes + pose metrics.
 * @throws always in Phase 2a — the OpenAI step lands in 2b.
 */
export async function runVisionAnalysis(
  _keyframes: Buffer[],
  _poseMetrics: PoseMetricsJson,
  _opts: { apiKey: string; userId: string },
): Promise<VisionResult> {
  throw new Error('runVisionAnalysis: not implemented in Phase 2a — OpenAI vision step lands in Phase 2b');
}
