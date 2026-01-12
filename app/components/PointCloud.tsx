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
  function noHandsVisible() {
    return !handState.left.visible && !handState.right.visible;
  }
  

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const posAttr = geometry.attributes.position;
    const pos = posAttr.array as Float32Array;
  
    // 🟢 REST MODE — FULL STABILIZATION
    if (noHandsVisible()) {
      for (let i = 0; i < pos.length; i += 3) {
        pos[i]     += (originalPositions[i]     - pos[i])     * 0.2;
        pos[i + 1] += (originalPositions[i + 1] - pos[i + 1]) * 0.2;
        pos[i + 2] += (originalPositions[i + 2] - pos[i + 2]) * 0.2;
      }
  
      posAttr.needsUpdate = true;
      return; // 🔥 STOP HERE — no noise, no force
    }
  
    // 🔴 ACTIVE MODE — ENTROPY + FORCE
    let entropy = 10; // 🔥 disable chaos for now
  
    for (let i = 0; i < pos.length; i += 3) {
      const ox = originalPositions[i];
      const oy = originalPositions[i + 1];
      const oz = originalPositions[i + 2];
  
      let x = ox;
      let y = oy;
      let z = oz;
  
      // Hand force
      const hand = handState.right;

if (hand.visible) {
  const dx = x - hand.position.x;
  const dy = y - hand.position.y;
  const dz = z - hand.position.z;

  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const radius = 0.6;

  if (dist > 0 && dist < radius) {
    let strength = (radius - dist) * 1.2; // TEMP BOOST


    // 🤏 PINCH → ATTRACT
    if (gestureState.right === 'PINCH') {
      strength *= -1.2;
    }

    // ✋ OPEN PALM → PUSH
    if (gestureState.right === 'OPEN') {
      strength *= 1.5;
    }

    // ✊ FIST → IMPLODE
    if (gestureState.right === 'FIST') {
      x -= dx * 0.8;
      y -= dy * 0.8;
      z -= dz * 0.8;
      
    }

    x += (dx / dist) * strength;
    y += (dy / dist) * strength;
    z += (dz / dist) * strength;
  }
}

  
      // Entropy noise
      // const noise = entropy * 5;
      // x += Math.sin(time + ox * 10) * noise;
      // y += Math.cos(time + oy * 10) * noise;
      // z += Math.sin(time + oz * 10) * noise;
  
      // Smooth motion
      pos[i]     += (x - pos[i])     * 0.15;
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
