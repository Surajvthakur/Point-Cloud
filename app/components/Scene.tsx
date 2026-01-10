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
  camera={{ position: [0, 0, 3], fov: 60 }}
  onCreated={({ camera }) => {
    camera.lookAt(0, 0, 0);
  }}
>

        <ambientLight />
        <PointCloud url={plyURL} />
        <OrbitControls
  enablePan={true}
  enableRotate={true}
  enableZoom={true}
  panSpeed={0.8}
/>

      </Canvas>
    </>
  );
}
