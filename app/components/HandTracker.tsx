'use client';
import { useEffect, useRef } from 'react';
import { Hands } from '@mediapipe/hands'; // Keep Hands if it works; dynamic if not
import { handState } from '../lib/handstate';
import { detectGesture } from '../lib/detectGesture';
import { gestureState } from '../lib/gestureState';

export default function HandTracker() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // Add for drawing if needed

  useEffect(() => {
    let hands: any, camera: any;

    const loadMediaPipe = async () => {
      const { Hands } = await import('@mediapipe/hands');
      const { Camera } = await import('@mediapipe/camera_utils');
      const { drawConnectors, drawLandmarks } = await import('@mediapipe/drawing_utils'); // If using

      hands = new Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results) => {
        // reset
        gestureState.left = 'NONE';
        gestureState.right = 'NONE';
        gestureState.global = 'NONE';

        handState.left.visible = false;
        handState.right.visible = false;

        if (!results.multiHandLandmarks) return;

        results.multiHandLandmarks.forEach((landmarks, i) => {
          // MediaPipe labels are mirrored - your right hand shows as "Left"
          const rawHandedness = results.multiHandedness[i].label;
          const handedness = rawHandedness === 'Left' ? 'Right' : 'Left';
          const gesture = detectGesture(landmarks);

          // Get palm center (wrist landmark 0) and convert to 3D space
          const wrist = landmarks[0];
          const x = -(wrist.x - 0.5) * 4;  // Increased sensitivity (was 2)
          const y = -(wrist.y - 0.5) * 4;  // Increased sensitivity (was 2)
          const z = -wrist.z * 4;          // Increased sensitivity (was 2)

          if (handedness === 'Left') {
            gestureState.left = gesture;
            handState.left.visible = true;
            handState.left.position.set(x, y, z);
          } else {
            gestureState.right = gesture;
            handState.right.visible = true;
            handState.right.position.set(x, y, z);
          }
        });

        // 🖐 Right-hand only global gestures
        if (gestureState.right === 'OPEN') {
          gestureState.global = 'SPREAD';
        }

        if (gestureState.right === 'FIST') {
          gestureState.global = 'ORDER';
        }
      });


      camera = new Camera(videoRef.current!, {
        onFrame: async () => {
          await hands.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    };

    if (typeof window !== 'undefined') {
      loadMediaPipe();
    }

    return () => {
      if (camera) camera.stop();
      if (hands) hands.close();
    };
  }, []);

  return (
    <>
      return (
      <video
        ref={videoRef}
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          width: 20,
          zIndex: 20,
          pointerEvents: 'none',
          transform: 'scaleX(-1)'
        }}
        autoPlay
        playsInline
      />

      );
      <canvas ref={canvasRef} />
    </>
  );
}
