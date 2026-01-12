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
  const wrist = landmarks[0];

  const pinchDist = dist(thumb, index);
  const palmOpenDist = dist(index, wrist);

  // 🤏 Pinch
  if (pinchDist < 0.04) return 'PINCH';

  // ✊ Fist (tips close to wrist)
  if (palmOpenDist < 0.18) return 'FIST';

  // ✋ Open palm
  if (palmOpenDist > 0.3) return 'OPEN';

  return 'NONE';
}
