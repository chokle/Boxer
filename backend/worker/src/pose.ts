// Pose estimation.
//
// Phase 2a implementation: MoveNet SinglePose Lightning via
// @tensorflow-models/pose-detection, running on the pure-JS tfjs CPU
// backend. Rationale (validated 2026-09-23):
//   * @mediapipe/tasks-vision's MPImage is canvas/WebGL-bound with a
//     private constructor — no clean raw-bytes path in headless Node.
//   * @tensorflow/tfjs-node needs a native libtensorflow build that is
//     fragile to install (failed repeatedly in this environment).
//   * Pure tfjs installs cleanly, runs anywhere, and the pose-detection
//     package abstracts the runtime — so upgrading to tfjs-node later
//     (same API, much faster inference) is a one-line change in load().
// Production note: CPU-backend inference is ~1s/frame; 16 frames ≈ 16s
// per analysis. Acceptable for 2a; switch the backend to tfjs-node for
// throughput when volume grows.

import type { DetectedPose, Keypoint } from './types';

/** COCO-17 keypoint order emitted by MoveNet. */
const COCO_NAMES = [
  'nose',
  'left_eye',
  'right_eye',
  'left_ear',
  'right_ear',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
] as const;

export interface PoseEstimator {
  load(): Promise<void>;
  /** Returns null when no person is detected (or confidence too low). */
  estimate(jpeg: Buffer): Promise<DetectedPose | null>;
  close(): Promise<void>;
}

export class MoveNetPoseEstimator implements PoseEstimator {
  private tf: any = null;
  private detector: any = null;
  private readonly minScore: number;

  constructor(minScore = 0.3) {
    this.minScore = minScore;
  }

  async load(): Promise<void> {
    // Dynamic imports keep cold-start fast and make the heavy deps
    // swappable without touching callers.
    const tf = await import('@tensorflow/tfjs');
    await import('@tensorflow/tfjs-backend-cpu');
    const poseDetection = await import('@tensorflow-models/pose-detection');

    await tf.setBackend('cpu');
    await tf.ready();

    this.detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        // NOTE: in pose-detection 2.x the tfjs runtime is the default;
        // there is no `runtime` option anymore.
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      },
    );
    this.tf = tf;
  }

  async estimate(jpegBuffer: Buffer): Promise<DetectedPose | null> {
    if (!this.detector || !this.tf) {
      throw new Error('MoveNetPoseEstimator.load() must be called first');
    }
    const jpeg = (await import('jpeg-js')).default;
    const raw = jpeg.decode(jpegBuffer, { useTArray: true, maxMemoryUsageInMB: 512 });
    const tf = this.tf;
    const img = tf.tensor3d(raw.data, [raw.height, raw.width, 4], 'int32');
    const rgb = img.slice([0, 0, 0], [raw.height, raw.width, 3]);
    try {
      const poses = await this.detector.estimatePoses(rgb);
      if (!poses || poses.length === 0) return null;
      const rawKps = poses[0].keypoints as Array<{ x: number; y: number; score?: number }>;
      const keypoints: Keypoint[] = rawKps.map((k, i) => ({
        name: COCO_NAMES[i] ?? `kp${i}`,
        x: k.x / raw.width,
        y: k.y / raw.height,
        score: typeof k.score === 'number' ? k.score : 0,
      }));
      const score = keypoints.reduce((s, k) => s + k.score, 0) / keypoints.length;
      if (score < this.minScore) return null;
      return { keypoints, score };
    } finally {
      img.dispose();
      rgb.dispose();
    }
  }

  async close(): Promise<void> {
    if (this.detector && typeof this.detector.dispose === 'function') {
      await this.detector.dispose();
    }
    this.detector = null;
    this.tf = null;
  }
}
