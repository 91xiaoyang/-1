import React, { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, Stars, Sparkles, Cloud } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import ChristmasTree from './ChristmasTree';
import { useStore } from '../store';
import gsap from 'gsap';

const CameraController = () => {
    const { camera } = useThree();
    const { phase } = useStore();
    
    useEffect(() => {
        if (phase === 'nebula') {
            // Zoom OUT for a wide galaxy view
            gsap.to(camera.position, {
                x: 0, y: 0, z: 50, 
                duration: 4,
                ease: "power2.inOut"
            });
        } else if (phase === 'tree') {
             gsap.to(camera.position, {
                x: 0, y: 5, z: 25,
                duration: 3,
                ease: "power2.inOut"
            });
        }
    }, [phase, camera]);
    
    return null; 
}

const Scene: React.FC = () => {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 5, 25], fov: 50 }}
      gl={{ antialias: false, alpha: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}
    >
      <color attach="background" args={['#050200']} />
      <fog attach="fog" args={['#050200', 10, 80]} />
      
      <Suspense fallback={null}>
        {/* Environment & Lighting */}
        <Environment preset="night" blur={0.6} />
        
        {/* Cinematic Lighting Setup - WARM GOLD THEME */}
        <ambientLight intensity={0.2} />
        {/* Main Warm Light */}
        <pointLight position={[10, 10, 10]} color="#ffaa00" intensity={3} distance={50} decay={2} />
        {/* Fill Light (Purple/Pink instead of Blue for warmer contrast) */}
        <pointLight position={[-10, 5, -10]} color="#d62d20" intensity={1.5} distance={50} decay={2} />
        <spotLight position={[0, 30, 0]} angle={0.3} penumbra={1} intensity={5} color="#fff8e7" castShadow />

        {/* Atmosphere */}
        <Stars radius={100} depth={50} count={7000} factor={4} saturation={1} fade speed={0.5} />
        <Sparkles count={300} scale={40} size={6} speed={0.2} opacity={0.5} color="#ffd700" />
        <Sparkles count={300} scale={30} size={3} speed={0.5} opacity={0.3} color="#fff" />
        
        {/* Optional Clouds for depth */}
        <Cloud opacity={0.1} speed={0.1} width={20} depth={5} segments={10} position={[0, 10, -20]} color="#221100" />

        {/* Content */}
        <ChristmasTree />
        <CameraController />
        
        <OrbitControls 
          enablePan={false} 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 1.8}
          minDistance={1}
          maxDistance={80}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />

        {/* Post Processing */}
        <EffectComposer disableNormalPass>
          <Bloom 
             luminanceThreshold={0.2} 
             mipmapBlur 
             intensity={1.5} 
             radius={0.5} 
             levels={9}
          />
          <ChromaticAberration 
             offset={new THREE.Vector2(0.002, 0.002)} 
             radialModulation={true} 
             modulationOffset={0.5}
          />
          <Vignette eskil={false} offset={0.2} darkness={0.7} />
          <Noise opacity={0.02} blendFunction={BlendFunction.OVERLAY} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
};

export default Scene;