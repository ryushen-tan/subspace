import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { buildMeshGeometry, buildEdgesGeometry } from '../utils/meshUtils';
import { useAgentStore } from '../state/useAgentStore';

function MeshSurface({ mesh }) {
  if (!mesh?.vertices?.length) return null;
  
  const geo = buildMeshGeometry(mesh);
  if (!geo) return null;

  return (
    <mesh geometry={geo}>
      <meshPhongMaterial 
        color="#4f46e5" 
        side={THREE.DoubleSide} 
        transparent 
        opacity={0.9} 
        flatShading 
      />
    </mesh>
  );
}

function MeshEdges({ mesh }) {
  if (!mesh?.vertices?.length) return null;
  
  const geometry = buildEdgesGeometry(mesh);
  if (!geometry) return null;

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#111827" />
    </lineSegments>
  );
}

function BackgroundPlane({ backgroundUrl }) {
  const [texture, setTexture] = useState(null);
  
  useEffect(() => {
    if (backgroundUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(backgroundUrl, (tex) => {
        setTexture(tex);
      });
    }
  }, [backgroundUrl]);

  if (!texture) return null;

  return (
    <mesh position={[0, 0, -15]} scale={[30, 30, 1]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );
}

function CaptureHelper({ onCapture, shouldCapture }) {
  const { gl } = useThree();
  const captured = useRef(false);

  useEffect(() => {
    if (shouldCapture && !captured.current) {
      captured.current = true;
      setTimeout(() => {
        const dataURL = gl.domElement.toDataURL('image/png');
        onCapture(dataURL);
        captured.current = false;
      }, 100);
    }
  }, [shouldCapture, gl, onCapture]);

  return null;
}

export default function PreviewScene({ backgroundUrl, onCapture, shouldCapture }) {
  const controlsRef = useRef();
  const mesh = useAgentStore((state) => state.mesh);

  return (
    <div className="w-full h-full relative">
      <Canvas
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        style={{ width: '100%', height: '100%', background: '#0a0a0a' }}
      >
        <PerspectiveCamera
          makeDefault
          position={[5, 5, 5]}
          fov={50}
        />
        
        {/* Background Image */}
        {backgroundUrl && <BackgroundPlane backgroundUrl={backgroundUrl} />}
        
        {/* Capture Helper */}
        {onCapture && <CaptureHelper onCapture={onCapture} shouldCapture={shouldCapture} />}
        
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1.2}
          castShadow
        />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        {/* Controls */}
        <OrbitControls
          ref={controlsRef}
          makeDefault
          minDistance={2}
          maxDistance={50}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />

        {/* Mesh Surface & Edges */}
        <MeshSurface mesh={mesh} />
        <MeshEdges mesh={mesh} />
      </Canvas>
    </div>
  );
}
