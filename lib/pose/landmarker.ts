import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

// Pinned to the installed @mediapipe/tasks-vision version. Bump alongside the
// package. The CDN serves the WASM bundle that pairs with the JS API.
const WASM_BASE =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';

// Lite model is ~5 MB and runs comfortably on phones during playback.
// Heavier variants exist but aren't worth the extra download for a
// visualisation-only feature.
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

let landmarkerPromise: Promise<PoseLandmarker> | null = null;

export function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });
    })().catch((err) => {
      // Reset so a later retry can re-attempt download.
      landmarkerPromise = null;
      throw err;
    });
  }
  return landmarkerPromise;
}
