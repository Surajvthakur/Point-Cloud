import { Gesture } from './gestureState';

let lastGesture: Gesture = 'NONE';
let lastTime = 0;

export function smoothGesture(
  next: Gesture,
  now: number,
  delay = 120
): Gesture {
  if (next !== lastGesture) {
    lastGesture = next;
    lastTime = now;
    return 'NONE';
  }

  if (now - lastTime > delay) {
    return next;
  }

  return 'NONE';
}
