import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, useGLTF } from '@react-three/drei';
import { useRef, useLayoutEffect, useState, Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { buildMeshGeometry, buildEdgesGeometry } from '../utils/meshUtils';
import { useAgentStore } from '../state/useAgentStore';

function MeshSurface({ mesh, position, scale }) {
  if (!mesh?.vertices?.length) return null;
  
  const geo = buildMeshGeometry(mesh);
  if (!geo) return null;

  return (
    <mesh geometry={geo} position={position} scale={scale}>
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

function MeshEdges({ mesh, position, scale }) {
  if (!mesh?.vertices?.length) return null;
  
  const geometry = buildEdgesGeometry(mesh);
  if (!geometry) return null;

  return (
    <lineSegments geometry={geometry} position={position} scale={scale}>
      <lineBasicMaterial color="#111827" />
    </lineSegments>
  );
}

function BackgroundPlane({ backgroundUrl }) {
  const [texture, setTexture] = useState(null);
  
  useLayoutEffect(() => {
    if (backgroundUrl && !backgroundUrl.startsWith('glb:')) {
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

// Room component that computes bounding box and recenters
function GLBRoom({ glbPath, onRoomReady }) {
  const { scene } = useGLTF(glbPath);
  const groupRef = useRef();
  
  useLayoutEffect(() => {
    if (!scene || !groupRef.current) return;

    // Clone the scene to avoid mutating the original
    const clonedScene = scene.clone();
    
    // Compute bounding box of the room
    const box = new THREE.Box3();
    box.setFromObject(clonedScene);
    
    if (!box.isEmpty()) {
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      
      // Detect unit scale (if room is very small, likely cm/mm)
      // Typical room dimensions: 3-10 meters
      const maxDimension = Math.max(size.x, size.y, size.z);
      let unitScale = 1;
      
      if (maxDimension < 0.1) {
        // Likely millimeters, convert to meters
        unitScale = 0.001;
      } else if (maxDimension < 1) {
        // Likely centimeters, convert to meters
        unitScale = 0.01;
      } else if (maxDimension > 100) {
        // Likely decimeters or unusual scale, normalize
        unitScale = 1 / maxDimension * 5; // Normalize to ~5m room
      }
      
      // Apply unit scale first
      clonedScene.scale.multiplyScalar(unitScale);
      
      // Recompute bounding box after scaling
      box.setFromObject(clonedScene);
      const scaledSize = box.getSize(new THREE.Vector3());
      const scaledCenter = box.getCenter(new THREE.Vector3());
      
      // Recenter: move so center is at origin
      const centerOffset = scaledCenter.clone().negate();
      clonedScene.position.copy(centerOffset);
      
      // Floor alignment: move so bottom sits on y = 0
      const bottomY = box.min.y;
      clonedScene.position.y -= bottomY;
      
      // Update the group
      groupRef.current.clear();
      groupRef.current.add(clonedScene);
      
      // Update materials
      clonedScene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = true;
          if (child.material) {
            child.material = child.material.clone();
            child.material.transparent = true;
            child.material.opacity = 0.9;
          }
        }
      });
      
      // Recompute final bounding box for camera positioning
      box.setFromObject(clonedScene);
      const finalSize = box.getSize(new THREE.Vector3());
      const finalCenter = box.getCenter(new THREE.Vector3());
      
      // Notify parent of room dimensions
      if (onRoomReady) {
        onRoomReady({
          box,
          size: finalSize,
          center: finalCenter,
          floorY: box.min.y,
        });
      }
    }
  }, [scene, glbPath, onRoomReady]);

  if (!scene) return null;

  return <group ref={groupRef} />;
}

// Camera controller that positions camera to view entire room
function CameraController({ roomBox, roomSize }) {
  const { camera } = useThree();
  
  useLayoutEffect(() => {
    if (!roomBox || roomBox.isEmpty() || !camera) return;
    
    if (camera instanceof THREE.PerspectiveCamera) {
      const size = roomSize || roomBox.getSize(new THREE.Vector3());
      const center = roomBox.getCenter(new THREE.Vector3());
      
      // Calculate distance needed to fit room in view
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      const distance = maxDim / (2 * Math.tan(fov / 2));
      
      // Add some padding
      const padding = 1.5;
      const finalDistance = distance * padding;
      
      // Position camera at an angle to view the room
      const angle = Math.PI / 4; // 45 degrees
      camera.position.set(
        center.x + finalDistance * Math.cos(angle),
        center.y + finalDistance * 0.6,
        center.z + finalDistance * Math.sin(angle)
      );
      
      camera.lookAt(center);
      camera.updateProjectionMatrix();
    }
  }, [camera, roomBox, roomSize]);

  return null;
}

// Debug helpers
function DebugHelpers({ roomBox, showHelpers = false }) {
  if (!showHelpers || !roomBox || roomBox.isEmpty()) return null;
  
  // Create a box geometry to visualize the bounding box
  const size = roomBox.getSize(new THREE.Vector3());
  const center = roomBox.getCenter(new THREE.Vector3());
  
  return (
    <>
      <axesHelper args={[2]} />
      <mesh position={center}>
        <boxGeometry args={[size.x, size.y, size.z]} />
        <meshBasicMaterial 
          color="yellow" 
          wireframe 
          transparent 
          opacity={0.3}
        />
      </mesh>
    </>
  );
}

function CaptureHelper({ onCapture, shouldCapture }) {
  const { gl } = useThree();
  const captured = useRef(false);

  useLayoutEffect(() => {
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
  const [roomData, setRoomData] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  
  const isGLB = backgroundUrl?.startsWith('glb:');
  const glbPath = isGLB ? `/${backgroundUrl.replace('glb:', '')}` : null;

  // Calculate model alignment to fit inside room
  const modelAlignment = useMemo(() => {
    if (!mesh?.vertices?.length || !isGLB || !roomData) {
      return { position: [0, 0, 0], scale: 1 };
    }

    // Calculate bounding box of user's mesh model
    const vertices = mesh.vertices;
    const box = new THREE.Box3();
    
    vertices.forEach((v) => {
      const [x, y, z] = v.p;
      box.expandByPoint(new THREE.Vector3(x, y, z));
    });

    if (box.isEmpty()) {
      return { position: [0, 0, 0], scale: 1 };
    }

    const modelSize = box.getSize(new THREE.Vector3());
    const modelCenter = box.getCenter(new THREE.Vector3());
    const maxModelDim = Math.max(modelSize.x, modelSize.y, modelSize.z);
    
    // Get room dimensions
    const roomSize = roomData.size;
    const roomMaxDim = Math.max(roomSize.x, roomSize.y, roomSize.z);
    
    // Scale model to fit nicely in room (target ~30% of room size)
    const targetSize = roomMaxDim * 0.3;
    const modelScale = maxModelDim > 0 ? targetSize / maxModelDim : 1;
    
    // Center model horizontally, place on floor
    const modelPosition = [
      -modelCenter.x * modelScale,
      roomData.floorY + (modelSize.y * modelScale) / 2, // Place on floor
      -modelCenter.z * modelScale,
    ];

    return {
      position: modelPosition,
      scale: modelScale,
    };
  }, [mesh, isGLB, roomData]);

  const handleRoomReady = (data) => {
    setRoomData(data);
  };

  return (
    <div className="w-full h-full relative">
      <Canvas
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        style={{ width: '100%', height: '100%', background: '#0a0a0a' }}
      >
        <PerspectiveCamera
          makeDefault
          fov={50}
        />
        
        {/* Background - Image or 3D */}
        {isGLB && glbPath && (
          <Suspense fallback={null}>
            <GLBRoom 
              glbPath={glbPath} 
              onRoomReady={handleRoomReady}
            />
            {roomData && (
              <>
                <CameraController roomBox={roomData.box} roomSize={roomData.size} />
                <DebugHelpers roomBox={roomData.box} showHelpers={showDebug} />
              </>
            )}
          </Suspense>
        )}
        {!isGLB && backgroundUrl && <BackgroundPlane backgroundUrl={backgroundUrl} />}
        
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
          minDistance={1}
          maxDistance={100}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />

        {/* Mesh Surface & Edges - Positioned and scaled to fit in room */}
        {modelAlignment && (
          <>
            <MeshSurface 
              mesh={mesh} 
              position={modelAlignment.position}
              scale={modelAlignment.scale}
            />
            <MeshEdges 
              mesh={mesh} 
              position={modelAlignment.position}
              scale={modelAlignment.scale}
            />
          </>
        )}
      </Canvas>
      
      {/* Debug toggle button */}
      {isGLB && (
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="absolute top-4 right-4 px-3 py-1 bg-neutral-800/80 text-white text-xs rounded hover:bg-neutral-700/80 z-10 cursor-pointer"
        >
          {showDebug ? 'Hide' : 'Show'} Debug
        </button>
      )}
    </div>
  );
}
