import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { InstancedMesh, Object3D, Vector3, Color, Euler, MathUtils, Group, Shape, ExtrudeGeometry } from 'three';
import { useStore } from '../store';
import { generateTreePositions, generateNebulaPositions, generateOrnamentPositions, generateSpiralPositions } from '../utils/geometry';

// Particle Breakdown 
const COUNT_ORBS = 4000;
const COUNT_STARS = 1500;
const COUNT_GIFTS = 500;
const COUNT_CANDIES = 500;
const COUNT_RIBBON = 600; 

const PARTICLE_COUNT = COUNT_ORBS + COUNT_STARS + COUNT_GIFTS + COUNT_CANDIES;

const TREE_HEIGHT = 15;
const TREE_RADIUS = 6;
const NEBULA_RADIUS = 30; 
const ORNAMENT_COUNT = 120;

const ORNAMENT_COLORS = [
  '#C5A059', '#800020', '#778899', '#FFC0CB', '#F7E7CE', '#FF0000', '#FFFFFF' 
];

const STAR_PALETTE = [
    '#FFD700', // Gold
    '#FFD700', 
    '#FFAA00', // Amber
    '#FFF8DC', // Warm White
    '#E0E0E0', // Silver
    '#FFFFFF' 
];

// --- Sub-Component: 3D Star Shape ---
const TopStarMesh = () => {
    const shape = useMemo(() => {
        const star = new Shape();
        const outerRadius = 0.8;
        const innerRadius = 0.4;
        const points = 5;
        
        for (let i = 0; i < points * 2; i++) {
            const r = (i % 2 === 0) ? outerRadius : innerRadius;
            const a = (i / (points * 2)) * Math.PI * 2;
            const x = Math.cos(a + Math.PI / 2) * r; // Rotate to point up
            const y = Math.sin(a + Math.PI / 2) * r;
            if (i === 0) star.moveTo(x, y);
            else star.lineTo(x, y);
        }
        star.closePath();
        return star;
    }, []);

    const extrudeSettings = { depth: 0.3, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 3 };
    
    // Animate the star gently
    const meshRef = useRef<any>(null);
    useFrame(({ clock }) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = clock.getElapsedTime() * 0.5;
        }
    });

    return (
        <mesh ref={meshRef} position={[0, TREE_HEIGHT / 2 + 0.8, 0]}>
            <extrudeGeometry args={[shape, extrudeSettings]} />
            <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.8} metalness={0.8} roughness={0.2} />
        </mesh>
    );
};

// --- Main Tree Component ---
const ChristmasTree: React.FC = () => {
  // Refs for particle systems
  const orbsRef = useRef<InstancedMesh>(null);
  const starsRef = useRef<InstancedMesh>(null);
  const giftsRef = useRef<InstancedMesh>(null);
  const candiesRef = useRef<InstancedMesh>(null);
  const ornamentRef = useRef<InstancedMesh>(null);
  const ribbonRef = useRef<InstancedMesh>(null);

  const dummy = useMemo(() => new Object3D(), []);
  const { phase, setPhase, handPosition, handOpenness, handRotation, cameraActive, gesture } = useStore();
  
  // 1. Basic Tree Particles
  const treePositions = useMemo(() => generateTreePositions(PARTICLE_COUNT, TREE_RADIUS, TREE_HEIGHT), []);
  const nebulaPositions = useMemo(() => generateNebulaPositions(PARTICLE_COUNT, NEBULA_RADIUS), []);
  
  // 2. Ornament Systems
  const ornamentTreePositions = useMemo(() => generateOrnamentPositions(ORNAMENT_COUNT, TREE_RADIUS, TREE_HEIGHT), []);
  const ornamentNebulaPositions = useMemo(() => generateNebulaPositions(ORNAMENT_COUNT, NEBULA_RADIUS), []);

  // 3. Ribbon System (Spiral)
  const ribbonTreePositions = useMemo(() => generateSpiralPositions(COUNT_RIBBON, TREE_RADIUS, TREE_HEIGHT), []);
  const ribbonNebulaPositions = useMemo(() => generateNebulaPositions(COUNT_RIBBON, NEBULA_RADIUS * 0.8), []);

  // Current interpolated positions containers
  const currentPositions = useMemo(() => new Float32Array(treePositions), [treePositions]);
  const currentOrnamentPositions = useMemo(() => new Float32Array(ORNAMENT_COUNT * 3), []);
  const currentRibbonPositions = useMemo(() => new Float32Array(COUNT_RIBBON * 3), []);

  // "Cloud Center" persistence.
  const cloudCenter = useRef(new Vector3(0, 0, 0));
  const currentRotation = useRef(new Euler(0, 0, 0));
  
  // Colors & Random Attributes
  const starColors = useMemo(() => {
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    for(let i=0; i<PARTICLE_COUNT; i++) {
        const hex = STAR_PALETTE[Math.floor(Math.random() * STAR_PALETTE.length)];
        const col = new Color(hex);
        colors[i*3] = col.r;
        colors[i*3+1] = col.g;
        colors[i*3+2] = col.b;
    }
    return colors;
  }, []);

  const rotationSpeeds = useMemo(() => {
      const speeds = new Float32Array(PARTICLE_COUNT);
      for(let i=0; i<PARTICLE_COUNT; i++) speeds[i] = (Math.random() - 0.5) * 2;
      return speeds;
  }, []);

  const expansionRef = useRef(0);

  useEffect(() => {
      if (expansionRef.current < 0.1) setPhase('tree');
      else if (expansionRef.current > 0.9) setPhase('nebula');
      else if (expansionRef.current > expansionRef.current) setPhase('blooming'); 
      else setPhase('collapsing'); 
  }, [handOpenness]); 

  useFrame((state) => {
    if (!orbsRef.current || !starsRef.current || !giftsRef.current || !candiesRef.current || !ornamentRef.current || !ribbonRef.current) return;

    const time = state.clock.getElapsedTime();
    const { pointer } = state;

    // --- CONTINUOUS MORPH LOGIC ---
    let targetExpansion = 0;
    if (cameraActive) {
        targetExpansion = handOpenness;
    } else {
        if (gesture === 'Open_Palm') targetExpansion = 1;
        else targetExpansion = 0; 
    }

    expansionRef.current = MathUtils.lerp(expansionRef.current, targetExpansion, 0.05);
    const t = expansionRef.current; 

    // --- Cloud Center Logic ---
    if (t > 0.2 && cameraActive) {
        const x = (1 - handPosition.x - 0.5) * 50; 
        const y = -(handPosition.y - 0.5) * 30;   
        const z = MathUtils.lerp(-10, 15, handPosition.z);
        cloudCenter.current.lerp(new Vector3(x, y, z), 0.05);
    } else if (t < 0.1) {
        cloudCenter.current.lerp(new Vector3(0, 0, 0), 0.05);
    }

    // --- Rotation Logic ---
    const targetRotX = cameraActive ? handRotation.x : 0;
    const targetRotY = cameraActive ? handRotation.y : 0;
    const targetRotZ = cameraActive ? handRotation.z : 0;
    
    currentRotation.current.x = MathUtils.lerp(currentRotation.current.x, targetRotX, 0.1);
    currentRotation.current.y = MathUtils.lerp(currentRotation.current.y, targetRotY, 0.1);
    currentRotation.current.z = MathUtils.lerp(currentRotation.current.z, targetRotZ, 0.1);

    const mouseVec = new Vector3(pointer.x * 15, pointer.y * 15, 2);
    const rotVec = new Vector3();

    // Helper: Position Calculation for any particle set
    const calculatePosition = (
        tx: number, ty: number, tz: number, 
        nx: number, ny: number, nz: number, 
        index: number,
        currentPosArray: Float32Array,
        offset: number,
        isRibbonOrStar = false
    ) => {
        // Nebula Target with Rotation
        rotVec.set(nx, ny, nz);
        const autoRotY = time * 0.05;
        rotVec.applyEuler(new Euler(currentRotation.current.x, currentRotation.current.y + autoRotY, currentRotation.current.z));

        const nebulaTargetX = cloudCenter.current.x + rotVec.x;
        const nebulaTargetY = cloudCenter.current.y + rotVec.y; 
        const nebulaTargetZ = cloudCenter.current.z + rotVec.z;

        // Expansion Chaos
        const transitionChaos = Math.sin(t * Math.PI) * 5; 
        const ex = (Math.sin(index) - 0.5) * transitionChaos;
        const ey = (Math.cos(index) - 0.5) * transitionChaos;
        const ez = (Math.sin(index * 2) - 0.5) * transitionChaos;

        // Mix factors
        const finalTargetX = MathUtils.lerp(tx, nebulaTargetX, t) + ex;
        const finalTargetY = MathUtils.lerp(ty, nebulaTargetY, t) + ey;
        const finalTargetZ = MathUtils.lerp(tz, nebulaTargetZ, t) + ez;

        // Inertia
        const inertiaFactor = isRibbonOrStar ? 0.08 : (0.03 + (index % 50) * 0.001);
        
        // Initialize if zero (first run)
        if(currentPosArray[offset] === 0 && currentPosArray[offset+1] === 0 && currentPosArray[offset+2] === 0) {
            currentPosArray[offset] = tx;
            currentPosArray[offset+1] = ty;
            currentPosArray[offset+2] = tz;
        }

        currentPosArray[offset] = MathUtils.lerp(currentPosArray[offset], finalTargetX, inertiaFactor);
        currentPosArray[offset+1] = MathUtils.lerp(currentPosArray[offset+1], finalTargetY, inertiaFactor);
        currentPosArray[offset+2] = MathUtils.lerp(currentPosArray[offset+2], finalTargetZ, inertiaFactor);

        return new Vector3(currentPosArray[offset], currentPosArray[offset+1], currentPosArray[offset+2]);
    };

    // --- 1. MAIN PARTICLES ---
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3;
      const pos = calculatePosition(
          treePositions[ix], treePositions[ix+1], treePositions[ix+2],
          nebulaPositions[ix], nebulaPositions[ix+1], nebulaPositions[ix+2],
          i, currentPositions, ix
      );

      dummy.position.copy(pos);

      if (t < 0.2) {
         const dist = dummy.position.distanceTo(mouseVec);
         if (dist < 5) {
           const force = (5 - dist) / 5;
           const dir = dummy.position.clone().sub(mouseVec).normalize();
           dummy.position.add(dir.multiplyScalar(force * 2));
         }
      }

      const pulse = Math.sin(time * 2 + i) * 0.2 + 0.8; 
      dummy.rotation.set(time * rotationSpeeds[i], time * rotationSpeeds[i] * 0.5, 0);

      if (i < COUNT_ORBS) {
          dummy.scale.setScalar(MathUtils.lerp(0.1, 0.15, t) * pulse);
          dummy.updateMatrix();
          orbsRef.current.setMatrixAt(i, dummy.matrix);
          const baseCol = new Color().setHSL(0.3 + i * 0.0001, 0.8, 0.5); 
          const starCol = new Color(starColors[ix], starColors[ix+1], starColors[ix+2]).multiplyScalar(1.5); 
          orbsRef.current.setColorAt(i, baseCol.lerp(starCol, t));

      } else if (i < COUNT_ORBS + COUNT_STARS) {
          const idx = i - COUNT_ORBS;
          dummy.scale.setScalar(MathUtils.lerp(0.15, 0.25, t) * pulse);
          dummy.updateMatrix();
          starsRef.current.setMatrixAt(idx, dummy.matrix);
          starsRef.current.setColorAt(idx, new Color('#ffffff').multiplyScalar(3));

      } else if (i < COUNT_ORBS + COUNT_STARS + COUNT_GIFTS) {
          const idx = i - (COUNT_ORBS + COUNT_STARS);
          dummy.scale.setScalar(MathUtils.lerp(0.2, 0.4, t) * pulse);
          dummy.updateMatrix();
          giftsRef.current.setMatrixAt(idx, dummy.matrix);
          const giftCols = ['#D4AF37', '#8b0000', '#006400', '#191970']; 
          giftsRef.current.setColorAt(idx, new Color(giftCols[i % giftCols.length]));

      } else {
          const idx = i - (COUNT_ORBS + COUNT_STARS + COUNT_GIFTS);
          const scale = MathUtils.lerp(0.15, 0.35, t) * pulse;
          dummy.scale.set(scale * 0.5, scale * 3, scale * 0.5);
          dummy.updateMatrix();
          candiesRef.current.setMatrixAt(idx, dummy.matrix);
          const candyCols = ['#FF0000', '#FFFFFF', '#FF69B4'];
          candiesRef.current.setColorAt(idx, new Color(candyCols[i % candyCols.length]));
      }
    }
    
    // --- 2. ORNAMENTS ---
    for(let i=0; i<ORNAMENT_COUNT; i++) {
        const ix = i * 3;
        const pos = calculatePosition(
            ornamentTreePositions[i].x, ornamentTreePositions[i].y, ornamentTreePositions[i].z,
            ornamentNebulaPositions[ix], ornamentNebulaPositions[ix+1], ornamentNebulaPositions[ix+2],
            i + 5000, currentOrnamentPositions, ix
        );
        dummy.position.copy(pos);
        if (t < 0.2) {
             const dist = dummy.position.distanceTo(mouseVec);
             if (dist < 5) dummy.position.add(dummy.position.clone().sub(mouseVec).normalize().multiplyScalar((5 - dist)/2.5));
        }
        dummy.scale.setScalar(MathUtils.lerp(0.4, 0.6, t));
        dummy.rotation.set(time*0.5, time*0.5, 0);
        dummy.updateMatrix();
        ornamentRef.current.setMatrixAt(i, dummy.matrix);
        ornamentRef.current.setColorAt(i, new Color(ORNAMENT_COLORS[i % ORNAMENT_COLORS.length]));
    }

    // --- 3. RIBBON LIGHTS ---
    for(let i=0; i<COUNT_RIBBON; i++) {
        const ix = i * 3;
        const pos = calculatePosition(
            ribbonTreePositions[ix], ribbonTreePositions[ix+1], ribbonTreePositions[ix+2],
            ribbonNebulaPositions[ix], ribbonNebulaPositions[ix+1], ribbonNebulaPositions[ix+2],
            i + 10000, currentRibbonPositions, ix, true
        );
        dummy.position.copy(pos);
        
        // Twinkle Logic
        const twinkleSpeed = 3 + Math.random() * 2;
        const twinkle = (Math.sin(time * twinkleSpeed + i) + 1) / 2; // 0 to 1
        const color = new Color('#FFBF00').lerp(new Color('#FFD700'), Math.random());
        color.multiplyScalar(1 + twinkle * 4);

        dummy.scale.setScalar(0.1 + twinkle * 0.1); 
        dummy.rotation.set(0,0,0);
        dummy.updateMatrix();
        
        ribbonRef.current.setMatrixAt(i, dummy.matrix);
        ribbonRef.current.setColorAt(i, color);
    }

    // Commits
    orbsRef.current.instanceMatrix.needsUpdate = true;
    if (orbsRef.current.instanceColor) orbsRef.current.instanceColor.needsUpdate = true;
    starsRef.current.instanceMatrix.needsUpdate = true;
    giftsRef.current.instanceMatrix.needsUpdate = true;
    if (giftsRef.current.instanceColor) giftsRef.current.instanceColor.needsUpdate = true;
    candiesRef.current.instanceMatrix.needsUpdate = true;
    if (candiesRef.current.instanceColor) candiesRef.current.instanceColor.needsUpdate = true;
    ornamentRef.current.instanceMatrix.needsUpdate = true;
    if (ornamentRef.current.instanceColor) ornamentRef.current.instanceColor.needsUpdate = true;
    ribbonRef.current.instanceMatrix.needsUpdate = true;
    if (ribbonRef.current.instanceColor) ribbonRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      {/* 1. Base Orbs */}
      <instancedMesh ref={orbsRef} args={[undefined, undefined, COUNT_ORBS]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial toneMapped={false} emissive="#FFD700" emissiveIntensity={0.6} roughness={0.4} />
      </instancedMesh>

      {/* 2. Stars */}
      <instancedMesh ref={starsRef} args={[undefined, undefined, COUNT_STARS]}>
        <tetrahedronGeometry args={[1, 0]} />
        <meshStandardMaterial toneMapped={false} emissive="#FFFFFF" emissiveIntensity={2} roughness={0.2} />
      </instancedMesh>

      {/* 3. Gifts */}
      <instancedMesh ref={giftsRef} args={[undefined, undefined, COUNT_GIFTS]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.3} metalness={0.5} />
      </instancedMesh>

      {/* 4. Candies */}
      <instancedMesh ref={candiesRef} args={[undefined, undefined, COUNT_CANDIES]}>
        <cylinderGeometry args={[0.5, 0.5, 1, 8]} />
        <meshStandardMaterial roughness={0.2} metalness={0.1} />
      </instancedMesh>

      {/* 5. Baubles */}
      <instancedMesh ref={ornamentRef} args={[undefined, undefined, ORNAMENT_COUNT]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial roughness={0.1} metalness={0.9} envMapIntensity={3} />
      </instancedMesh>

      {/* 6. Ribbon Lights */}
      <instancedMesh ref={ribbonRef} args={[undefined, undefined, COUNT_RIBBON]}>
        <sphereGeometry args={[0.8, 8, 8]} />
        <meshStandardMaterial toneMapped={false} emissive="#FFBF00" emissiveIntensity={2} roughness={0.5} />
      </instancedMesh>

      {/* 7. Solid Top Star (Non-blinking) */}
      <group scale={1 - expansionRef.current}>
           <TopStarMesh />
      </group>
      
      {/* Central glow for Top Star */}
      <pointLight position={[0, TREE_HEIGHT/2, 0]} intensity={3 * (1 - expansionRef.current)} color="#ffd700" distance={15} decay={2} />
    </group>
  );
};

export default ChristmasTree;