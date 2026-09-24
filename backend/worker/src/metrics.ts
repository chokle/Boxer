// Deterministic coaching metrics derived from pose keypoints.
// Pure functions — no ML, no I/O — so they are unit-testable in isolation.
//
// All coordinates are normalized (0..1); y grows downward (image coords).
// Every metric returns null when the keypoints it needs are missing or
// below the confidence threshold, rather than guessing.

import type { FrameMetrics, FrameResult, Keypoint, PoseMetricsSummary } from './types';

const MIN_KP_SCORE = 0.3;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Angle in degrees at vertex b formed by a-b-c. */
function angleDeg(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }): number {
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  const dot = v1x * v2x + v1y * v2y;
  const n1 = Math.hypot(v1x, v1y);
  const n2 = Math.hypot(v2x, v2y);
  if (n1 < 1e-9 || n2 < 1e-9) return NaN;
  return (Math.acos(clamp(dot / (n1 * n2), -1, 1)) * 180) / Math.PI;
}

function confident(kps: Map<string, Keypoint>, name: string): Keypoint | null {
  const k = kps.get(name);
  return k && k.score >= MIN_KP_SCORE ? k : null;
}

/**
 * Per-frame coaching metrics from one detected pose.
 * Returns null only if the pose lacks even the core torso landmarks
 * (nose + both shoulders) — callers treat that as "metrics unavailable".
 */
export function computeFrameMetrics(keypoints: Keypoint[]): FrameMetrics | null {
  const m = new Map(keypoints.map((k) => [k.name, k]));

  const nose = confident(m, 'nose');
  const lSh = confident(m, 'left_shoulder');
  const rSh = confident(m, 'right_shoulder');
  if (!nose || !lSh || !rSh) return null;

  const shY = (lSh.y + rSh.y) / 2;

  // Guard height: wrist height relative to the chin–shoulder span.
  // 1.0 ≈ wrist at chin level, 0.5 ≈ chest, ≤0 ≈ dropped to waist/below.
  // PROXY, not centimeters — single uncalibrated camera, no depth.
  let guard: number | null = null;
  {
    const vals: number[] = [];
    for (const w of [confident(m, 'left_wrist'), confident(m, 'right_wrist')]) {
      if (!w) continue;
      const denom = shY - nose.y;
      if (Math.abs(denom) < 1e-6) continue;
      vals.push(clamp((shY - w.y) / denom, -0.5, 1.5));
    }
    if (vals.length > 0) guard = vals.reduce((s, v) => s + v, 0) / vals.length;
  }

  const elbow = (s: string, e: string, w: string): number | null => {
    const ks = confident(m, s);
    const ke = confident(m, e);
    const kw = confident(m, w);
    if (!ks || !ke || !kw) return null;
    const a = angleDeg(ks, ke, kw);
    return Number.isNaN(a) ? null : Math.round(a * 10) / 10;
  };

  let stance: number | null = null;
  {
    const lA = confident(m, 'left_ankle');
    const rA = confident(m, 'right_ankle');
    if (lA && rA) {
      const shW = dist(lSh, rSh);
      if (shW > 1e-6) stance = Math.round((dist(lA, rA) / shW) * 100) / 100;
    }
  }

  // Head center: ear midpoint when available, else nose.
  let headX: number | null = null;
  let headY: number | null = null;
  {
    const lE = confident(m, 'left_ear');
    const rE = confident(m, 'right_ear');
    if (lE && rE) {
      headX = (lE.x + rE.x) / 2;
      headY = (lE.y + rE.y) / 2;
    } else {
      headX = nose.x;
      headY = nose.y;
    }
  }

  const round2 = (v: number | null) => (v === null ? null : Math.round(v * 100) / 100);

  return {
    guard_height_proxy: round2(guard),
    elbow_angle_left: elbow('left_shoulder', 'left_elbow', 'left_wrist'),
    elbow_angle_right: elbow('right_shoulder', 'right_elbow', 'right_wrist'),
    stance_width_ratio: stance,
    head_x: round2(headX),
    head_y: round2(headY),
  };
}

/** Aggregate per-frame results into the summary block. */
export function computeSummary(frames: FrameResult[], guardDropThreshold: number): PoseMetricsSummary {
  const detected = frames.filter((f) => f.person_detected && f.metrics);
  const guards = detected
    .map((f) => f.metrics!.guard_height_proxy)
    .filter((g): g is number => g !== null);
  const stances = detected
    .map((f) => f.metrics!.stance_width_ratio)
    .filter((s): s is number => s !== null);

  const firstHead = detected.find((f) => f.metrics!.head_x !== null && f.metrics!.head_y !== null);
  let headDisp: number | null = null;
  if (firstHead) {
    const hx0 = firstHead.metrics!.head_x!;
    const hy0 = firstHead.metrics!.head_y!;
    let max = 0;
    for (const f of detected) {
      const hx = f.metrics!.head_x;
      const hy = f.metrics!.head_y;
      if (hx === null || hy === null) continue;
      max = Math.max(max, Math.hypot(hx - hx0, hy - hy0));
    }
    headDisp = Math.round(max * 1000) / 1000;
  }

  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((s, v) => s + v, 0) / xs.length) * 100) / 100 : null);

  return {
    frames_with_person: detected.length,
    avg_guard_height: avg(guards),
    min_guard_height: guards.length ? Math.round(Math.min(...guards) * 100) / 100 : null,
    guard_drop_events: guards.filter((g) => g < guardDropThreshold).length,
    avg_stance_width: avg(stances),
    head_displacement: headDisp,
  };
}
