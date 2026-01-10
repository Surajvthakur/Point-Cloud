'use client';

import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { handState } from '@/app/lib/handstate';
import { useRef } from 'react';

function HandSphere({ hand }: { hand: 'left' | 'right' }) {
  const mesh = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    const state = handState[hand];
    mesh.current.visible = state.visible;
    mesh.current.position.copy(state.position);
  });

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[0.06, 32, 32]} />
      <meshStandardMaterial
        emissive={hand === 'left' ? 'cyan' : 'magenta'}
        emissiveIntensity={2}
        color="black"
      />
    </mesh>
  );
}

export default function HandSpheres() {
  return (
    <>
      <HandSphere hand="right" />
      <HandSphere hand="left" />
    </>
  );
}
