'use client';

import { useEffect, useRef } from 'react';
import { handState } from '../lib/handstate';
import { detectGesture } from '../lib/detectGesture';
import { gestureState } from '../lib/gestureState';
import { smoothGesture } from '@/app/lib/gestureSmoother';
import { rotationState } from '../lib/rotationState';

export default function HandTracker() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let hands: any;
    let camera: any;

    const load = async () => {
      const { Hands } = await import('@mediapipe/hands');
      const { Camera } = await import('@mediapipe/camera_utils');

      hands = new Hands({
        locateFile: (f: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      hands.onResults((results) => {
        // RESET
        handState.right.visible = false;
        handState.left.visible = false;
        gestureState.right = 'NONE';

        if (!results.multiHandLandmarks?.length) return;

        results.multiHandLandmarks.forEach((landmarks, i) => {
          const wrist = landmarks[0];
          const x = (wrist.x - 0.5) * 2;
          const y = -(wrist.y - 0.5) * 2;
          const z = -wrist.z;

          if (i === 0) {
            // LEFT HAND → ROTATION
            handState.left.visible = true;
            rotationState.target.set(
              y * Math.PI,
              x * Math.PI
            );
          }

          if (i === 1 || results.multiHandLandmarks.length === 1) {
            // RIGHT HAND → GESTURES
            handState.right.visible = true;
            handState.right.position
              .set(x, y, z)
              .multiplyScalar(1.5);

            const raw = detectGesture(landmarks);
            gestureState.right = smoothGesture(
              raw,
              performance.now()
            );
          }
        });
      });

      camera = new Camera(videoRef.current!, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current! });
        },
        width: 640,
        height: 480,
      });

      camera.start();
    };

    load();

    return () => {
      camera?.stop();
      hands?.close();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      style={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        width: 10,
        zIndex: 20,
        pointerEvents: 'none',
        transform: 'scaleX(-1)',
      }}
    />
  );
}
