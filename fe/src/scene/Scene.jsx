import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei';
import { PointCloud } from '../components/points/PointCloud';
import { usePointsStore } from '../state/usePointsStore';
import { useAgentStore } from '../state/useAgentStore';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { ViewCube } from '../components/scene/ViewCube';
import { buildMeshGeometry, buildEdgesGeometry } from '../utils/meshUtils';
import WorkspaceBottomBar from '../components/WorkspaceBottomBar';

function MeshSurface({ mesh, pointOverrides }) {
  const geometry = useMemo(() => buildMeshGeometry(mesh, pointOverrides), [mesh, pointOverrides]);
  if (!geometry) return null;
  return (
    <mesh geometry={geometry}>
      <meshPhongMaterial color="#4f46e5" side={THREE.DoubleSide} transparent opacity={0.8} flatShading />
    </mesh>
  );
}

function MeshEdges({ mesh, pointOverrides }) {
  const geometry = useMemo(() => buildEdgesGeometry(mesh, pointOverrides), [mesh, pointOverrides]);
  if (!geometry) return null;
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#111827" />
    </lineSegments>
  );
}

export function Scene({ isSidebarOpen }) {
  const controlsRef = useRef();
  const isDragging = usePointsStore((state) => state.isDragging);
  const clearSelection = usePointsStore((state) => state.clearSelection);
  const points = usePointsStore((state) => state.points);
  const objects = useAgentStore((state) => state.objects);
  
  const pointOverrides = useMemo(() => {
    const map = new Map();
    points.forEach(p => map.set(p.id, p.position));
    return map;
  }, [points]);
  
  return (
    <div className="absolute top-0 left-64 right-0 bottom-0">
      <Canvas
        shadows
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', background: '#0a0a0a' }}
        onPointerMissed={(e) => {
          // Clear selection when clicking on empty space (not on a point)
          if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
            clearSelection();
          }
        }}
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

      {/* Mesh Surface & Edges */}
      {objects.map((obj) => (
        <group key={obj.id} visible={obj.visible}>
          <MeshSurface mesh={obj.mesh} pointOverrides={pointOverrides} />
          <MeshEdges mesh={obj.mesh} pointOverrides={pointOverrides} />
        </group>
      ))}

      {/* ViewCube */}
      <ViewCube controlsRef={controlsRef} isSidebarOpen={isSidebarOpen} />
    </Canvas>
    <WorkspaceBottomBar />
    </div>
  );
}
