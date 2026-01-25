import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

function FloatingMesh({ position, rotation, scale, speed = 1 }) {
  const meshRef = useRef();

  useFrame(() => {
    // Subtle additional rotation
    if (meshRef.current) {
        meshRef.current.rotation.x += 0.001 * speed;
        meshRef.current.rotation.y += 0.002 * speed;
    }
  });

  return (
    <Float
      speed={2 * speed} 
      rotationIntensity={0.5} 
      floatIntensity={0.5}
    >
      <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#444444"
          wireframe
          transparent
          opacity={0.3}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
    </Float>
  );
}

function SceneContent() {
    const groupRef = useRef();

    useFrame((state) => {
        if (groupRef.current) {
            // Smoothly interpolate rotation based on mouse position
            // state.pointer.x goes from -1 to 1
            const targetX = state.pointer.y * 0.2; // Tilt up/down
            const targetY = state.pointer.x * 0.2; // Pan left/right
            
            groupRef.current.rotation.x = THREE.MathUtils.lerp(
                groupRef.current.rotation.x,
                targetX,
                0.05
            );
            groupRef.current.rotation.y = THREE.MathUtils.lerp(
                groupRef.current.rotation.y,
                targetY,
                0.05
            );
        }
    });

    return (
        <group ref={groupRef} position={[2, 0, 0]}> {/* Shifted entire group to the right */}
             {/* Central cluster */}
            <FloatingMesh position={[0, 1, -5]} rotation={[0, 0, 0]} scale={1.5} speed={1.2} />
            <FloatingMesh position={[4, -1, -8]} rotation={[0.5, 0.5, 0]} scale={2} speed={0.8} />
            <FloatingMesh position={[2, 3, -10]} rotation={[0, 0, 0.5]} scale={1} speed={1.5} />
            
            {/* Background elements */}
            <FloatingMesh position={[-2, -4, -15]} rotation={[0, 0, 0]} scale={3} speed={0.5} />
            <FloatingMesh position={[10, 4, -12]} rotation={[0, 0, 0]} scale={2.5} speed={0.6} />
        </group>
    );
}

export default function BackgroundScene() {
  return (
    <div className="fixed inset-0 z-0 bg-[#050505] pointer-events-none">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} />
        <fog attach="fog" args={['#050505', 5, 25]} />
        
        {/* Minimal lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4444ff" />

        <SceneContent />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
