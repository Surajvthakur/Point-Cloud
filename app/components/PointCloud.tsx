'use client';

import { useLoader, useFrame } from '@react-three/fiber';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { handState } from '../lib/handstate';
import { gestureState } from '../lib/gestureState';
import { rotationState } from '../lib/rotationState';

export default function PointCloud({ url }: { url: string }) {
  const geometry = useLoader(PLYLoader, url);
  geometry.center();

  const pointsRef = useRef<THREE.Points>(null!);

  const original = useMemo(() => {
    return new Float32Array(
      geometry.attributes.position.array as Float32Array
    );
  }, [geometry]);

  useFrame(() => {
    rotationState.current.lerp(rotationState.target, 0.1);
    pointsRef.current.rotation.x = rotationState.current.x;
    pointsRef.current.rotation.y = rotationState.current.y;

    const pos = geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < pos.length; i += 3) {
      const ox = original[i];
      const oy = original[i + 1];
      const oz = original[i + 2];

      let x = ox, y = oy, z = oz;

      if (handState.right.visible) {
        const dx = x - handState.right.position.x;
        const dy = y - handState.right.position.y;
        const dz = z - handState.right.position.z;

        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const radius = 0.6;

        if (dist > 0 && dist < radius) {
          let strength = (radius - dist) * 0.35;

          if (gestureState.right === 'PINCH') strength *= -1;
          if (gestureState.right === 'OPEN') strength *= 1.2;
          if (gestureState.right === 'FIST') {
            x -= dx * 0.25;
            y -= dy * 0.25;
            z -= dz * 0.25;
          }

          x += (dx / dist) * strength;
          y += (dy / dist) * strength;
          z += (dz / dist) * strength;
        }
      }

      pos[i] += (x - pos[i]) * 0.12;
      pos[i + 1] += (y - pos[i + 1]) * 0.12;
      pos[i + 2] += (z - pos[i + 2]) * 0.12;
    }

    geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry attach="geometry" {...geometry} />
      <pointsMaterial size={0.01} color="white" />
    </points>
  );
}
