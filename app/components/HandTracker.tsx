'use client';
import { useEffect, useRef } from 'react';
import { Hands } from '@mediapipe/hands'; // Keep Hands if it works; dynamic if not
import { handState } from '../lib/handstate';
// Remove: import { Camera } from '@mediapipe/camera_utils';

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
        if (!results.multiHandLandmarks || !results.multiHandedness) {
          handState.left.visible = false;
          handState.right.visible = false;
          return;
        }
      
        results.multiHandLandmarks.forEach((landmarks, i) => {
          const handedness = results.multiHandedness[i].label; // "Left" | "Right"
          const wrist = landmarks[0];
      
          // Convert from [0,1] → centered space
          const x = (wrist.x - 0.5) * 2;
          const y = -(wrist.y - 0.5) * 2;
          const z = -wrist.z;
      
          const target =
            handedness === 'Left'
              ? handState.left
              : handState.right;
            const WORLD_SCALE = 1.5;
            target.position.multiplyScalar(WORLD_SCALE);
              
          target.position.set(x, y, z);
          target.visible = true;
        });
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
    width: 120,
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
    