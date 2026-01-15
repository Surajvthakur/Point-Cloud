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

  // Store original positions as an attribute
  const originalPositions = useMemo(() => {
    const pos = geometry.attributes.position.array as Float32Array;
    return new Float32Array(pos);
  }, [geometry]);

  // Create ShaderMaterial
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uHandPosition: { value: new THREE.Vector3() },
        uPinchStrength: { value: 0 },
        uFistStrength: { value: 0 },
        uOpenStrength: { value: 0 },
        uEntropy: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        uniform vec3 uHandPosition;
        uniform float uPinchStrength;
        uniform float uFistStrength;
        uniform float uOpenStrength;
        uniform float uEntropy;

        attribute vec3 aOriginalPosition;
        varying vec3 vColor;

        void main() {
          vColor = color;
          vec3 pos = aOriginalPosition;
          float dist = distance(pos, uHandPosition);
          
          // PINCH effect
          float pinchRadius = 1.5;
          if (dist > 0.0 && dist < pinchRadius) {
            float strength = (pinchRadius - dist) * 2.0 * uPinchStrength;
            vec3 dir = normalize(pos - uHandPosition);
            pos -= dir * strength;
          }

          // FIST effect
          float fistRadius = 1.2;
          if (dist < fistRadius) {
            float strength = 0.5 * uFistStrength;
            pos = mix(pos, uHandPosition, strength);
          }

          // OPEN effect
          float openRadius = 0.6;
          if (dist > 0.0 && dist < openRadius) {
            float strength = (openRadius - dist) * 0.6 * uOpenStrength;
            vec3 dir = normalize(pos - uHandPosition);
            pos += dir * strength;
          }

          // Entropy noise
          float noise = uEntropy * 3.0;
          pos.x += sin(uTime + aOriginalPosition.x * 10.0) * noise;
          pos.y += cos(uTime + aOriginalPosition.y * 10.0) * noise;
          pos.z += sin(uTime + aOriginalPosition.z * 10.0) * noise;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = 6.0 * (1.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          if (length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
          gl_FragColor = vec4(vColor, 1.0);
        }
      `,
      vertexColors: true,
      transparent: true,
    });
  }, [geometry]);

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
    const material = pointsRef.current.material as THREE.ShaderMaterial;
    const hand = handState.right;
    const gesture = gestureState.right;

    // Update Uniforms
    material.uniforms.uTime.value = clock.elapsedTime;

    // Smoothly lerp hand position to avoid jitter
    if (hand.visible) {
      material.uniforms.uHandPosition.value.lerp(hand.position, 0.2);
    }

    // Target strengths
    const targetPinch = (hand.visible && gesture === 'PINCH') ? 1.0 : 0.0;
    const targetFist = (hand.visible && gesture === 'FIST') ? 1.0 : 0.0;
    const targetOpen = (hand.visible && gesture === 'OPEN') ? 1.0 : 0.0;
    const targetEntropy = (hand.visible && gesture === 'OPEN') ? 0.3 : 0.0;

    // Organic lerping for smooth transitions
    const lerpSpeed = 0.1;
    material.uniforms.uPinchStrength.value += (targetPinch - material.uniforms.uPinchStrength.value) * lerpSpeed;
    material.uniforms.uFistStrength.value += (targetFist - material.uniforms.uFistStrength.value) * lerpSpeed;
    material.uniforms.uOpenStrength.value += (targetOpen - material.uniforms.uOpenStrength.value) * lerpSpeed;
    material.uniforms.uEntropy.value += (targetEntropy - material.uniforms.uEntropy.value) * lerpSpeed;
  });

  // Attach original positions as an attribute once
  useMemo(() => {
    geometry.setAttribute('aOriginalPosition', new THREE.BufferAttribute(originalPositions, 3));
  }, [geometry, originalPositions]);

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={shaderMaterial}
    />
  );
}
