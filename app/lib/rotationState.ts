import * as THREE from 'three';

export const rotationState = {
  target: new THREE.Vector2(0, 0), // desired rotation
  current: new THREE.Vector2(0, 0), // smoothed rotation
};
