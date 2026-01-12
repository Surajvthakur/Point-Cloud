export type Gesture =
  | 'NONE'
  | 'PINCH'
  | 'FIST'
  | 'OPEN'
  | 'SPREAD'
  | 'ORDER';

export const gestureState = {
  left: 'NONE' as Gesture,
  right: 'NONE' as Gesture,
  global: 'NONE' as Gesture,
};
