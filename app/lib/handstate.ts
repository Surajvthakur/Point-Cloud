import * as THREE from 'three';

export type HandPoint = {
  position: THREE.Vector3;
  visible: boolean;
};

export const handState = {
  left: {
    position: new THREE.Vector3(),
    visible: false,
  } as HandPoint,

  right: {
    position: new THREE.Vector3(),
    visible: false,
  } as HandPoint,
};
