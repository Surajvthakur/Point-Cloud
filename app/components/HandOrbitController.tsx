'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { handState } from '@/app/lib/handstate';
import { gestureState } from '@/app/lib/gestureState';
import * as THREE from 'three';

export default function HandOrbitController() {
    const { camera } = useThree();
    const prevPosition = useRef(new THREE.Vector2());
    const isFirstFrame = useRef(true);

    // Orbital control state
    const spherical = useRef(new THREE.Spherical(3, Math.PI / 2, 0)); // radius, phi, theta
    const target = useRef(new THREE.Vector3(0, 0, 0)); // Look at center

    useFrame(() => {
        const left = handState.left;

        // Only control orbit when left hand is visible
        if (!left.visible) {
            isFirstFrame.current = true;
            return;
        }

        // Get current hand position in 2D screen space
        const currentX = left.position.x;
        const currentY = left.position.y;

        // First frame - just store position, don't rotate
        if (isFirstFrame.current) {
            prevPosition.current.set(currentX, currentY);
            isFirstFrame.current = false;
            return;
        }

        // Calculate movement delta
        const deltaX = currentX - prevPosition.current.x;
        const deltaY = currentY - prevPosition.current.y;

        // Rotation sensitivity
        const rotationSpeed = 2.0;

        // Update spherical coordinates based on hand movement
        // Horizontal movement -> theta (azimuthal angle)
        spherical.current.theta -= deltaX * rotationSpeed;

        // Vertical movement -> phi (polar angle)
        spherical.current.phi += deltaY * rotationSpeed;

        // Clamp phi to prevent flipping
        spherical.current.phi = THREE.MathUtils.clamp(
            spherical.current.phi,
            0.1, // Min (near top)
            Math.PI - 0.1 // Max (near bottom)
        );

        // Zoom OUT with PINCH gesture on left hand
        if (gestureState.left === 'PINCH') {
            spherical.current.radius = THREE.MathUtils.clamp(
                spherical.current.radius + 0.05,
                1.0, // Min zoom
                10.0 // Max zoom
            );
        }

        // Zoom IN with FIST gesture on left hand
        if (gestureState.left === 'FIST') {
            spherical.current.radius = THREE.MathUtils.clamp(
                spherical.current.radius - 0.05,
                1.0,
                10.0
            );
        }

        // Convert spherical to Cartesian and update camera
        const position = new THREE.Vector3().setFromSpherical(spherical.current);
        position.add(target.current);

        // Smoothly interpolate camera position
        camera.position.lerp(position, 0.1);
        camera.lookAt(target.current);

        // Store current position for next frame
        prevPosition.current.set(currentX, currentY);
    });

    return null; // This component doesn't render anything
}
