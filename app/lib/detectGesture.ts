import { Gesture } from './gestureState';

function dist(a: any, b: any) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function detectGesture(landmarks: any[]): Gesture {
    const thumb = landmarks[4];
    const index = landmarks[8];
    const middle = landmarks[12];
    const ring = landmarks[16];
    const pinky = landmarks[20];
    const wrist = landmarks[0];
  
    const pinchDist = dist(thumb, index);
  
    const indexToWrist = dist(index, wrist);
    const middleToWrist = dist(middle, wrist);
    const ringToWrist = dist(ring, wrist);
    const pinkyToWrist = dist(pinky, wrist);
  
    // 🤏 PINCH (HIGHEST PRIORITY)
    if (pinchDist < 0.07) {
      return 'PINCH';
    }
  
    // ✊ FIST (ALL FINGERS CLOSE TO WRIST)
    if (
      indexToWrist < 0.25 &&
      middleToWrist < 0.25 &&
      ringToWrist < 0.25 &&
      pinkyToWrist < 0.25
    ) {
      return 'FIST';
    }
  
    // ✋ OPEN PALM
    if (
      indexToWrist > 0.35 &&
      middleToWrist > 0.35
    ) {
      return 'OPEN';
    }
  
    return 'NONE';
  }
  