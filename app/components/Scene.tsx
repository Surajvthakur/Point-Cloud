'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import PointCloud from './PointCloud';
import HandTracker from './HandTracker';

export default function Scene({ plyURL }: { plyURL: string }) {
  return (
    <>
      <HandTracker />
      <Canvas
        style={{ position: 'absolute', inset: 0 }}
        camera={{ position: [0, 0, 3] }}
      >
        <ambientLight intensity={0.5} />
        <PointCloud url={plyURL} />
        <OrbitControls enableRotate={false} />
      </Canvas>
    </>
  );
}
