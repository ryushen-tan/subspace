import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei';
import { PointCloud } from '../components/points/PointCloud';
import { usePointsStore } from '../state/usePointsStore';
import { useAgentStore } from '../state/useAgentStore';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { ViewCube } from '../components/scene/ViewCube';

export function Scene({ isSidebarOpen }) {
  const controlsRef = useRef();
  const isDragging = usePointsStore((state) => state.isDragging);
  const clearSelection = usePointsStore((state) => state.clearSelection);
  const mesh = useAgentStore((state) => state.mesh);

  const geometry = useMemo(() => {
    if (!mesh || !mesh.faces || mesh.faces.length === 0) return null;

    const geo = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    const vertexMap = new Map();

    mesh.vertices.forEach((v, i) => {
      vertexMap.set(v.id, i);
      vertices.push(...v.p);
    });

    mesh.faces.forEach((face) => {
      if (face.length === 3) {
        indices.push(vertexMap.get(face[0]), vertexMap.get(face[1]), vertexMap.get(face[2]));
      } else if (face.length === 4) {
        // Split quad into two triangles
        const a = vertexMap.get(face[0]);
        const b = vertexMap.get(face[1]);
        const c = vertexMap.get(face[2]);
        const d = vertexMap.get(face[3]);
        indices.push(a, b, c);
        indices.push(a, c, d);
      }
    });

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [mesh]);
  
  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100vh', background: '#0a0a0a' }}
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

      {/* Mesh */}
      {geometry && (
        <mesh geometry={geometry}>
          <meshStandardMaterial color="#4f46e5" wireframe={false} transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* ViewCube */}
      <ViewCube controlsRef={controlsRef} isSidebarOpen={isSidebarOpen} />
    </Canvas>
  );
}
