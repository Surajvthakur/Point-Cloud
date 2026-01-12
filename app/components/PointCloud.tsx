'use client';

import { useLoader } from '@react-three/fiber';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { handState } from '@/app/lib/handstate';
import { useFrame } from '@react-three/fiber';

export default function PointCloud({ url }: { url: string }) {
  const geometry = useLoader(PLYLoader, url);
  geometry.computeVertexNormals();
  geometry.center();

  const pointsRef = useRef<THREE.Points>(null!);

  // Store original positions ONCE
  const originalPositions = useMemo(() => {
    const pos = geometry.attributes.position.array as Float32Array;
    return new Float32Array(pos);
  }, [geometry]);


  const material = new THREE.PointsMaterial({
    size: 0.01,
    vertexColors: true,
  });

  function computeEntropy() {
    const left = handState.left;
    const right = handState.right;
  
    // Two-hand entropy
    if (left.visible && right.visible) {
      const d = left.position.distanceTo(right.position);
      return THREE.MathUtils.clamp(d / 2, 0, 1);
    }
  
    // One-hand fallback
    if (left.visible || right.visible) {
      return 0.3;
    }
  
    return 0;
  }

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const entropy = computeEntropy();
  
    const posAttr = geometry.attributes.position;
    const pos = posAttr.array as Float32Array;
  
    for (let i = 0; i < pos.length; i += 3) {
      const ox = originalPositions[i];
      const oy = originalPositions[i + 1];
      const oz = originalPositions[i + 2];
  
      let x = ox;
      let y = oy;
      let z = oz;
  
      // Apply hand force
      [handState.left, handState.right].forEach((hand) => {
        if (!hand.visible) return;
  
        const dx = x - hand.position.x;
        const dy = y - hand.position.y;
        const dz = z - hand.position.z;
  
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const radius = 0.2;
  
        if (dist < radius) {
          const strength = (radius - dist) * 0.4;
          x += (dx / dist) * strength;
          y += (dy / dist) * strength;
          z += (dz / dist) * strength;
        }
      });
  
      // Entropy noise (chaos)
      const noise = entropy * 0.2;
      x += Math.sin(time + ox * 10) * noise;
      y += Math.cos(time + oy * 10) * noise;
      z += Math.sin(time + oz * 10) * noise;
  
      // Smooth return to order
      pos[i]     += (x - pos[i]) * 0.15;
      pos[i + 1] += (y - pos[i + 1]) * 0.15;
      pos[i + 2] += (z - pos[i + 2]) * 0.15;
    }
  
    posAttr.needsUpdate = true;
  });

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
    />
  );
  ;
}
