import * as THREE from 'three';

// Generate random points inside a cone volume for the Tree
export const generateTreePositions = (count: number, radius: number, height: number) => {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Random height
    const y = Math.random() * height;
    // Radius at this height (linear interpolation)
    const r = (radius * (height - y)) / height;
    
    // Random angle
    const theta = Math.random() * Math.PI * 2;
    // Random distance from center (using sqrt for uniform distribution)
    const dist = Math.sqrt(Math.random()) * r;

    positions[i * 3] = Math.cos(theta) * dist;
    positions[i * 3 + 1] = y - height / 2; // Center vertically
    positions[i * 3 + 2] = Math.sin(theta) * dist;
  }
  return positions;
};

// Generate points for the Nebula (Gaussian Sphere)
export const generateNebulaPositions = (count: number, radius: number) => {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    
    // Gaussian distribution
    const u1 = Math.random();
    const u2 = Math.random();
    
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
    const u3 = Math.random();
    const z2 = Math.sqrt(-2.0 * Math.log(u3)) * Math.cos(2.0 * Math.PI * u3);

    const scale = radius * 0.5;

    positions[i3]     = z0 * scale;
    positions[i3 + 1] = z1 * scale;
    positions[i3 + 2] = z2 * scale;
  }
  return positions;
};

// Generate spiral positions for ornaments (Scatterable objects)
export const generateOrnamentPositions = (count: number, radius: number, height: number) => {
  const positions = [];
  const turns = 6; 
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const angle = t * Math.PI * 2 * turns;
    const y = height * (t - 0.5); 
    
    const r = radius * (1 - t); 

    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    
    positions.push(new THREE.Vector3(x, y, z));
  }
  return positions;
};

// Generate specific Spiral Ribbon positions (Ordered tightly for a line look)
export const generateSpiralPositions = (count: number, radius: number, height: number) => {
  const positions = new Float32Array(count * 3);
  const turns = 8; // More turns for the ribbon
  for (let i = 0; i < count; i++) {
    const t = i / count; // 0 to 1
    const angle = t * Math.PI * 2 * turns;
    
    // Height goes from bottom to top
    const y = (t - 0.5) * height; 
    
    // Radius shrinks as we go up
    // Add a small offset (1.1) to make it float slightly outside the tree branches
    const r = (radius * (1 - t)) + 0.2; 

    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  return positions;
};