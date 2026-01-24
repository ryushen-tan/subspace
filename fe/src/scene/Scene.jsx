import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, GizmoHelper, GizmoViewcube } from '@react-three/drei';
import { PointCloud } from '../components/points/PointCloud';
import { usePointsStore } from '../state/usePointsStore';
import { useRef, useState } from 'react';
import * as THREE from 'three';

function AnimatedGizmo({ isSidebarOpen, controlsRef }) {
  const [margin, setMargin] = useState(isSidebarOpen ? 380 : 120);

  useFrame((state, delta) => {
    const targetMargin = isSidebarOpen ? 380 : 120;
    // Smoothly interpolate margin
    const newMargin = THREE.MathUtils.lerp(margin, targetMargin, delta * 10);
    if (Math.abs(newMargin - margin) > 0.1) {
      setMargin(newMargin);
    }
  });

  return (
    <GizmoHelper
      alignment="bottom-right"
      margin={[margin, 80]}
      onUpdate={() => controlsRef.current?.update()}
    >
      <GizmoViewcube
        color="#333"
        strokeColor="#fff"
        textColor="#fff"
        hoverColor="#4a90d9"
      />
    </GizmoHelper>
  );
}

export function Scene({ isSidebarOpen }) {
  const controlsRef = useRef();
  const isDragging = usePointsStore((state) => state.isDragging);
  
  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100vh', background: '#0a0a0a' }}
    >
      <PerspectiveCamera
        makeDefault
        position={[5, 5, 5]}
        fov={50}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Grid Helper */}
      <Grid
        args={[20, 20]}
        cellColor="#6f6f6f"
        sectionColor="#9d4b4b"
        cellThickness={0.5}
        sectionThickness={1}
        fadeDistance={25}
        fadeStrength={1}
      />

      {/* Controls */}
      <OrbitControls
        makeDefault
        ref={controlsRef}
        enablePan={!isDragging}
        enableZoom={!isDragging}
        enableRotate={!isDragging}
        minDistance={2}
        maxDistance={50}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.PAN,
          RIGHT: THREE.MOUSE.ROTATE
        }}
        screenSpacePanning={true}
      />

      {/* Point Cloud */}
      <PointCloud />

      {/* ViewCube */}
      <AnimatedGizmo isSidebarOpen={isSidebarOpen} controlsRef={controlsRef} />
    </Canvas>
  );
}
