'use client';

import { useEffect, useRef } from 'react';
import { handState } from '../lib/handstate';
import { detectGesture } from "../lib/detectGesture";
import { gestureState } from "../lib/gestureState";

export default function HandTracker() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let hands: any;
    let camera: any;

    const loadMediaPipe = async () => {
      const { Hands } = await import('@mediapipe/hands');
      const { Camera } = await import('@mediapipe/camera_utils');

      hands = new Hands({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1, // 🔥 ONE HAND ONLY
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      hands.onResults((results) => {
        // 🔥 FULL RESET
        gestureState.right = 'NONE';
        handState.right.visible = false;

        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
          return;
        }

        // 🔥 USE FIRST HAND ONLY (IGNORE HANDEDNESS)
        const landmarks = results.multiHandLandmarks[0];
        const wrist = landmarks[0];

        const gesture = detectGesture(landmarks);
        console.log('Detected gesture:', gesture);

        // Update RIGHT hand only
        gestureState.right = gesture;
        handState.right.visible = true;

        // Update hand position
        const x = (wrist.x - 0.5) * 2;
        const y = -(wrist.y - 0.5) * 2;
        const z = -wrist.z;

        handState.right.position.set(x, y, z).multiplyScalar(1.5);
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

    loadMediaPipe();

    return () => {
      if (camera) camera.stop();
      if (hands) hands.close();
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
        width: 160,
        zIndex: 20,
        pointerEvents: 'none',
        transform: 'scaleX(-1)', // mirror for user
      }}
    />
  );
}
