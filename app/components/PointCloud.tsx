'use client';

import { useLoader } from '@react-three/fiber';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import * as THREE from 'three';
import { useMemo, useRef, useEffect, useState } from 'react';
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
        uVortexStrength: { value: 0 },
        uMorphStrength: { value: 0 },
        uAudioIntensity: { value: 0 },
        uTotalPoints: { value: 100000 },
        uEntropy: { value: 0 },
      },
      vertexShader: `
        uniform float uTime;
        uniform vec3 uHandPosition;
        uniform float uPinchStrength;
        uniform float uFistStrength;
        uniform float uOpenStrength;
        uniform float uVortexStrength;
        uniform float uMorphStrength;
        uniform float uAudioIntensity;
        uniform float uTotalPoints;
        uniform float uEntropy;

        attribute vec3 aOriginalPosition;
        attribute float aIndex;
        varying vec3 vColor;
        varying float vGlow;
        varying float vIntensity;

        mat3 rotationMatrix(vec3 axis, float angle) {
          axis = normalize(axis);
          float s = sin(angle);
          float c = cos(angle);
          float oc = 1.0 - c;
          return mat3(
            oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
            oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
            oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c
          );
        }

        void main() {
          vColor = color;
          vec3 pos = aOriginalPosition;
          
          // --- GEOMETRIC MORPH (Sphere) ---
          float phi = acos(clamp(1.0 - 2.0 * aIndex / uTotalPoints, -1.0, 1.0));
          float theta = 2.0 * 3.14159 * aIndex * 0.618;
          vec3 targetPos = vec3(sin(phi) * cos(theta), sin(phi) * sin(theta), cos(phi)) * 0.8;
          pos = mix(pos, targetPos, uMorphStrength);

          // --- ORGANIC IDLE FLOW ---
          float flowTime = uTime * 0.2;
          float flowScale = 0.05 + uAudioIntensity * 0.1;
          pos.x += sin(flowTime + aOriginalPosition.y * 2.0) * flowScale;
          pos.y += cos(flowTime + aOriginalPosition.z * 2.0) * flowScale;
          pos.z += sin(flowTime + aOriginalPosition.x * 2.0) * flowScale;

          float dist = distance(pos, uHandPosition);
          
          // PINCH effect (Imploding)
          float pinchRadius = 1.5;
          if (dist > 0.0 && dist < pinchRadius) {
            float strength = (pinchRadius - dist) * 2.0 * uPinchStrength;
            vec3 dir = normalize(pos - uHandPosition);
            pos -= dir * strength;
          }

          // FIST effect (Pull)
          float fistRadius = 1.2;
          if (dist < fistRadius) {
            float strength = 0.5 * uFistStrength;
            pos = mix(pos, uHandPosition, strength);
          }

          // OPEN effect (Repel)
          float openRadius = 0.6;
          if (dist > 0.0 && dist < openRadius) {
            float strength = (openRadius - dist) * 0.6 * uOpenStrength;
            vec3 dir = normalize(pos - uHandPosition);
            pos += dir * strength;
          }

          // NEBULA VORTEX (Spread)
          float vortexRadius = 2.0;
          if (dist > 0.0 && dist < vortexRadius) {
            float strength = (vortexRadius - dist) * 4.0 * uVortexStrength;
            pos = rotationMatrix(vec3(0.0, 1.0, 0.0), strength) * (pos - uHandPosition) + uHandPosition;
          }

          // Interaction Halo & Intensity
          float interactionRange = 1.5;
          vIntensity = 1.0 - smoothstep(0.0, interactionRange, dist);
          float interactionSum = uPinchStrength + uFistStrength + uOpenStrength + uVortexStrength + uMorphStrength;
          vGlow = vIntensity * interactionSum + uAudioIntensity * 0.5;

          // Entropy noise
          float noise = uEntropy * 3.0 + uAudioIntensity * 1.0;
          pos.x += sin(uTime + aOriginalPosition.x * 50.0) * noise;
          pos.y += cos(uTime + aOriginalPosition.y * 50.0) * noise;
          pos.z += sin(uTime + aOriginalPosition.z * 50.0) * noise;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = (6.0 + uAudioIntensity * 10.0) * (1.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vGlow;
        varying float vIntensity;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float alpha = smoothstep(0.5, 0.4, dist);
          
          // --- CHROMATIC SHIFT ---
          vec3 electricBlue = vec3(0.0, 0.7, 1.5);
          vec3 lime = vec3(0.5, 1.5, 0.0);
          vec3 chromatic = mix(lime, electricBlue, sin(vIntensity * 3.14) * 0.5 + 0.5);
          
          vec3 finalColor = mix(vColor, chromatic, vGlow * 0.7);
          finalColor += vec3(1.0) * vGlow * 0.4; // Core highlight

          gl_FragColor = vec4(finalColor, alpha * (0.8 + vGlow * 0.2));
        }
      `,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }, [geometry]);

  // --- AUDIO REACTIVITY SETUP ---
  const analyzerRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    let context: AudioContext;
    let source: MediaStreamAudioSourceNode;
    let analyzer: AnalyserNode;

    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        context = new (window.AudioContext || (window as any).webkitAudioContext)();
        source = context.createMediaStreamSource(stream);
        analyzer = context.createAnalyser();
        analyzer.fftSize = 256;
        source.connect(analyzer);
        analyzerRef.current = analyzer;
      } catch (err) {
        console.warn('Audio interaction failed:', err);
      }
    };

    startAudio();
    return () => { context?.close(); };
  }, []);

  useFrame(({ clock }) => {
    const material = pointsRef.current.material as THREE.ShaderMaterial;
    const hand = handState.right;
    const gesture = gestureState.right;

    // Update Uniforms
    material.uniforms.uTime.value = clock.elapsedTime;
    material.uniforms.uTotalPoints.value = geometry.attributes.position.count;

    // Smoothly lerp hand position to avoid jitter
    if (hand.visible) {
      material.uniforms.uHandPosition.value.lerp(hand.position, 0.2);
    }

    // Audio Analysis
    if (analyzerRef.current) {
      const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
      analyzerRef.current.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((acc, v) => acc + v, 0) / dataArray.length;
      material.uniforms.uAudioIntensity.value += (avg / 255 - material.uniforms.uAudioIntensity.value) * 0.2;
    }

    // Target strengths
    const targetPinch = (hand.visible && gesture === 'PINCH') ? 1.0 : 0.0;
    const targetFist = (hand.visible && gesture === 'FIST') ? 1.0 : 0.0;
    const targetOpen = (hand.visible && gesture === 'OPEN') ? 1.0 : 0.0;
    const targetVortex = (hand.visible && gesture === 'SPREAD') ? 1.0 : 0.0;
    const targetMorph = (hand.visible && gesture === 'ORDER') ? 1.0 : 0.0;
    const targetEntropy = (hand.visible && gesture === 'OPEN') ? 0.3 : 0.0;

    // Organic lerping for smooth transitions
    const lerpSpeed = 0.1;
    material.uniforms.uPinchStrength.value += (targetPinch - material.uniforms.uPinchStrength.value) * lerpSpeed;
    material.uniforms.uFistStrength.value += (targetFist - material.uniforms.uFistStrength.value) * lerpSpeed;
    material.uniforms.uOpenStrength.value += (targetOpen - material.uniforms.uOpenStrength.value) * lerpSpeed;
    material.uniforms.uVortexStrength.value += (targetVortex - material.uniforms.uVortexStrength.value) * lerpSpeed;
    material.uniforms.uMorphStrength.value += (targetMorph - material.uniforms.uMorphStrength.value) * lerpSpeed;
    material.uniforms.uEntropy.value += (targetEntropy - material.uniforms.uEntropy.value) * lerpSpeed;
  });

  // Attach original positions and vertex indices once
  useMemo(() => {
    geometry.setAttribute('aOriginalPosition', new THREE.BufferAttribute(originalPositions, 3));
    const indices = new Float32Array(originalPositions.length / 3);
    for (let i = 0; i < indices.length; i++) indices[i] = i;
    geometry.setAttribute('aIndex', new THREE.BufferAttribute(indices, 1));
  }, [geometry, originalPositions]);

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={shaderMaterial}
    />
  );
}
