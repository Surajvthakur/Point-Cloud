'use client';

import { useLoader } from '@react-three/fiber';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import * as THREE from 'three';
import { useMemo, useRef } from 'react';
import { handState } from '@/app/lib/handstate';
import { useFrame } from '@react-three/fiber';
import { gestureState } from '../lib/gestureState';

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
    const right = handState.right;

    // Right-hand entropy
    if (right.visible) {
      return 0.3;
    }

    return 0;
  }
  function noHandsVisible() {
    return !handState.right.visible;
  }


  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const posAttr = geometry.attributes.position;
    const pos = posAttr.array as Float32Array;

    // 🟢 REST MODE — FULL STABILIZATION
    if (noHandsVisible()) {
      for (let i = 0; i < pos.length; i += 3) {
        pos[i] += (originalPositions[i] - pos[i]) * 0.2;
        pos[i + 1] += (originalPositions[i + 1] - pos[i + 1]) * 0.2;
        pos[i + 2] += (originalPositions[i + 2] - pos[i + 2]) * 0.2;
      }

      posAttr.needsUpdate = true;
      return; // 🔥 STOP HERE — no noise, no force
    }

    // 🔴 ACTIVE MODE — ENTROPY + FORCE
    const entropy = computeEntropy();

    // Check if we should reset to original first (for PINCH and FIST)
    const shouldResetFirst = gestureState.right === 'PINCH' || gestureState.right === 'FIST';

    for (let i = 0; i < pos.length; i += 3) {
      const ox = originalPositions[i];
      const oy = originalPositions[i + 1];
      const oz = originalPositions[i + 2];

      let x = pos[i];
      let y = pos[i + 1];
      let z = pos[i + 2];

      // Right hand force only
      const hand = handState.right;
      if (hand.visible) {
        // For PINCH and FIST: First rapidly return to original position
        if (shouldResetFirst) {
          // Fast lerp toward original position
          x += (ox - x) * 0.3;
          y += (oy - y) * 0.3;
          z += (oz - z) * 0.3;
        }

        // Calculate distance from hand using ORIGINAL position for PINCH/FIST
        const refX = shouldResetFirst ? ox : x;
        const refY = shouldResetFirst ? oy : y;
        const refZ = shouldResetFirst ? oz : z;
        
        const dx = refX - hand.position.x;
        const dy = refY - hand.position.y;
        const dz = refZ - hand.position.z;

        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        let radius = 0.6;

        // PINCH: attract points toward hand (from original position)
        if (gestureState.right === 'PINCH') {
          radius = 1.5;
          if (dist > 0 && dist < radius) {
            const strength = (radius - dist) * 1;
            x -= (dx / dist) * strength;
            y -= (dy / dist) * strength;
            z -= (dz / dist) * strength;
          }
        }
        // FIST: strongly pull points toward hand (from original position)
        else if (gestureState.right === 'FIST') {
          radius = 1.2;
          const strength = 0.5;
          if (dist > 0 && dist < radius) {
            x -= dx * strength;
            y -= dy * strength;
            z -= dz * strength;
          }
        }
        // OPEN: push points away + add chaos (works on current chaotic state)
        else if (gestureState.right === 'OPEN') {
          if (dist > 0 && dist < radius) {
            const strength = (radius - dist) * 0.6;
            x += (dx / dist) * strength;
            y += (dy / dist) * strength;
            z += (dz / dist) * strength;
          }
          // Only add entropy noise when OPEN
          const noise = entropy * 3;
          x += Math.sin(time + ox * 10) * noise;
          y += Math.cos(time + oy * 10) * noise;
          z += Math.sin(time + oz * 10) * noise;
        }
      }

      // Smooth return to original when no gesture effect
      if (!hand.visible || gestureState.right === 'NONE') {
        x += (ox - x) * 0.1;
        y += (oy - y) * 0.1;
        z += (oz - z) * 0.1;
      }

      // Smooth motion
      pos[i] += (x - pos[i]) * 0.15;
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
