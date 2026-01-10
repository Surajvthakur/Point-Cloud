'use client';

import { useLoader } from '@react-three/fiber';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import * as THREE from 'three';

export default function PointCloud({ url }: { url: string }) {
  const geometry = useLoader(PLYLoader, url);
  geometry.computeVertexNormals();
  geometry.center();


  const material = new THREE.PointsMaterial({
    size: 0.01,
  });

  return (
    <points
      geometry={geometry}
      material={material}
    />
  );
  ;
}
