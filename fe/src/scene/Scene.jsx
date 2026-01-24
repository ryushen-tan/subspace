import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, GizmoHelper, GizmoViewcube } from '@react-three/drei';
import { PointCloud } from '../components/points/PointCloud';
import { usePointsStore } from '../state/usePointsStore';
import { useRef } from 'react';

export function Scene() {
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
      />

      {/* Point Cloud */}
      <PointCloud />

      {/* ViewCube */}
      <GizmoHelper
        alignment="bottom-right"
        margin={[80, 80]}
        onUpdate={() => controlsRef.current?.update()}
      >
        <GizmoViewcube
          color="#333"
          strokeColor="#fff"
          textColor="#fff"
          hoverColor="#4a90d9"
        />
      </GizmoHelper>
    </Canvas>
  );
}
