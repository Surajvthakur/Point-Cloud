import * as THREE from 'three';

// Shared state for model scale information
export const modelScale = {
    // Bounding box dimensions
    size: new THREE.Vector3(1, 1, 1),

    // The largest dimension (for normalization)
    maxDimension: 1,

    // Scale factor for hand positions and effect radii
    // This is calculated as maxDimension relative to a "standard" size of 1
    scaleFactor: 1,

    // Update scale based on geometry bounding box
    setFromGeometry(geometry: THREE.BufferGeometry) {
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;

        if (box) {
            box.getSize(this.size);
            this.maxDimension = Math.max(this.size.x, this.size.y, this.size.z);
            // Scale factor: how much larger is this model compared to "unit" size
            this.scaleFactor = this.maxDimension;

            console.log('Model scale set:', {
                size: this.size.toArray(),
                maxDimension: this.maxDimension,
                scaleFactor: this.scaleFactor,
            });
        }
    },
};
