"use client";

import type { FaceLandmarker, NormalizedLandmark } from "@mediapipe/tasks-vision";

export type FaceLandmarks = NormalizedLandmark[];

let landmarkerPromise: Promise<FaceLandmarker | null> | null = null;

/**
 * Loads the on-device face landmarker (self-hosted wasm + model, no CDN).
 * The heavy MediaPipe bundle is dynamically imported only when first used,
 * so it never ships in the main bundle or runs during SSR.
 * Returns null if the device can't run it — callers must degrade gracefully.
 */
export function getFaceLandmarker(): Promise<FaceLandmarker | null> {
  if (landmarkerPromise) return landmarkerPromise;
  landmarkerPromise = (async () => {
    try {
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
      return await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: "/mediapipe/face_landmarker.task" },
        runningMode: "VIDEO",
        numFaces: 1
      });
    } catch {
      return null;
    }
  })();
  return landmarkerPromise;
}

/** Detects one face in the current video frame; returns null when none is found. */
export function detectFace(
  lm: FaceLandmarker,
  video: HTMLVideoElement,
  timestampMs: number
): FaceLandmarks | null {
  try {
    const res = lm.detectForVideo(video, timestampMs);
    return res.faceLandmarks?.[0] ?? null;
  } catch {
    return null;
  }
}
