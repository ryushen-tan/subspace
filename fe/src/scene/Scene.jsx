import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, TransformControls } from '@react-three/drei';
import { PointCloud } from '../components/points/PointCloud';
import { usePointsStore } from '../state/usePointsStore';
import { useAgentStore } from '../state/useAgentStore';
import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { ViewCube } from '../components/scene/ViewCube';
import { buildMeshGeometry, buildEdgesGeometry } from '../utils/meshUtils';
import WorkspaceBottomBar from '../components/WorkspaceBottomBar';

function MeshSurface({ mesh, pointOverrides, color, isActive, onSelect }) {
  const geometry = useMemo(() => buildMeshGeometry(mesh, pointOverrides), [mesh, pointOverrides]);
  if (!geometry) return null;
  return (
    <mesh geometry={geometry} onPointerDown={onSelect}>
      <meshPhongMaterial
        color={color || '#4f46e5'}
        side={THREE.DoubleSide}
        transparent
        opacity={isActive ? 0.95 : 0.8}
        emissive={isActive ? '#60a5fa' : '#0f172a'}
        emissiveIntensity={isActive ? 0.35 : 0.1}
        flatShading
      />
    </mesh>
  );
}

function MeshEdges({ mesh, pointOverrides, isActive }) {
  const geometry = useMemo(() => buildEdgesGeometry(mesh, pointOverrides), [mesh, pointOverrides]);
  if (!geometry) return null;
  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color={isActive ? '#a5b4fc' : '#111827'} />
    </lineSegments>
  );
}

function IdleCamera({ controlsRef, isIdle }) {
  const startAngleRef = useRef(0);
  const idleTimeRef = useRef(0);
  const radiusRef = useRef(0);
  const initializedRef = useRef(false);

  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    if (isIdle) {
      if (!initializedRef.current) {
        // Store initial orbit position
        const controls = controlsRef.current;
        const camera = state.camera;
        const target = controls.target;
        
        // Calculate current angle and radius
        const dx = camera.position.x - target.x;
        const dz = camera.position.z - target.z;
        startAngleRef.current = Math.atan2(dz, dx);
        radiusRef.current = Math.sqrt(dx * dx + dz * dz);
        idleTimeRef.current = 0;
        initializedRef.current = true;
      }

      // Smoothly rotate camera around the target
      idleTimeRef.current += delta;
      const angle = startAngleRef.current + idleTimeRef.current * 0.3; // 0.3 radians per second
      const radius = radiusRef.current;
      
      const controls = controlsRef.current;
      const target = controls.target;
      
      state.camera.position.x = target.x + Math.cos(angle) * radius;
      state.camera.position.z = target.z + Math.sin(angle) * radius;
      state.camera.lookAt(target);
      controls.update();
    } else {
      initializedRef.current = false;
    }
  });

  return null;
}

export function Scene({ isSidebarOpen, onPreviewClick }) {
  const controlsRef = useRef();
  const isDragging = usePointsStore((state) => state.isDragging);
  const clearSelection = usePointsStore((state) => state.clearSelection);
  const points = usePointsStore((state) => state.points);
  const setDragging = usePointsStore((state) => state.setDragging);
  const objects = useAgentStore((state) => state.objects);
  const activeObjectId = useAgentStore((state) => state.activeObjectId);
  const setActiveObject = useAgentStore((state) => state.setActiveObject);
  const translateObject = useAgentStore((state) => state.translateObject);
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef(null);
  const activeHandleRef = useRef(new THREE.Object3D());
  const lastHandlePosRef = useRef(new THREE.Vector3());
  
  const pointOverrides = useMemo(() => {
    const map = new Map();
    points.forEach(p => map.set(p.id, p.position));
    return map;
  }, [points]);

  const activeObject = useMemo(
    () => objects.find((o) => o.id === activeObjectId),
    [objects, activeObjectId]
  );

  const startManualIdle = () => {
    // Manually start auto-rotate and stop the idle timer
    setIsIdle(true);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  // Idle detection - 1 minute (60000ms)
  const resetIdleTimer = () => {
    setIsIdle(false);
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 60000); // 1 minute
  };

  useEffect(() => {
    // Track user interactions; ignore the manual hotkey so it can trigger auto-rotate
    const events = ['mousedown', 'mousemove', 'keydown', 'wheel', 'touchstart'];
    const activityHandler = (event) => {
      if (event.type === 'keydown' && event.key?.toLowerCase() === 'r') return;
      resetIdleTimer();
    };
    events.forEach(event => {
      window.addEventListener(event, activityHandler);
    });

    // Start initial timer
    resetIdleTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, activityHandler);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Keyboard shortcut: press "R" to start auto-rotate
    const handler = (event) => {
      if (event.key?.toLowerCase() !== 'r') return;
      // Avoid triggering while typing in inputs/textareas/contenteditable
      const target = event.target;
      const tag = target?.tagName;
      const isTextInput = tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable;
      if (isTextInput) return;
      event.preventDefault();
      startManualIdle();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!activeObject) return;
    const center = new THREE.Vector3();
    const verts = activeObject.mesh?.vertices || [];
    if (verts.length === 0) return;

    verts.forEach((v) => {
      const pos = pointOverrides.get(v.id) || v.p || [0, 0, 0];
      center.x += pos[0];
      center.y += pos[1];
      center.z += pos[2];
    });
    center.multiplyScalar(1 / verts.length);

    if (activeHandleRef.current) {
      activeHandleRef.current.position.copy(center);
      lastHandlePosRef.current.copy(center);
    }
  }, [activeObject, pointOverrides]);
  
  return (
    <div className="absolute top-0 left-0 right-0 bottom-0">
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
        args={[50, 50]}
        cellColor="#ffffff"
        sectionColor="#ffffff"
        cellThickness={0.5}
        sectionThickness={1}
        fadeDistance={60}
        fadeStrength={1}
      />

      {/* Controls */}
      <OrbitControls
        makeDefault
        ref={controlsRef}
        enablePan={!isDragging}
        enableZoom={!isDragging}
        enableRotate={!isDragging && !isIdle}
        minDistance={2}
        maxDistance={50}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.PAN,
          RIGHT: THREE.MOUSE.ROTATE
        }}
        screenSpacePanning={true}
      />

      {/* Idle Camera Animation */}
      <IdleCamera controlsRef={controlsRef} isIdle={isIdle} />

      {/* Point Cloud */}
      <PointCloud />

      {/* Anchor for object gizmo */}
      <primitive object={activeHandleRef.current} />

      {/* Mesh Surface & Edges */}
      {objects.map((obj) => {
        const isActive = obj.id === activeObjectId;
        return (
          <group
            key={obj.id}
            visible={obj.visible}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.stopPropagation();
              setActiveObject(obj.id);
            }}
          >
            <MeshSurface
              mesh={obj.mesh}
              pointOverrides={pointOverrides}
              color={obj.color}
              isActive={isActive}
              onSelect={(e) => {
                if (e.button !== 0) return;
                e.stopPropagation();
                setActiveObject(obj.id);
              }}
            />
            <MeshEdges mesh={obj.mesh} pointOverrides={pointOverrides} isActive={isActive} />
          </group>
        );
      })}

      {/* Object Transform Controls */}
      {activeObject && (
        <TransformControls
          object={activeHandleRef.current}
          mode="translate"
          showX
          showY
          showZ
          translationSnap={0.1}
          onMouseDown={() => setDragging(true)}
          onMouseUp={() => setDragging(false)}
          onObjectChange={() => {
            if (!activeObject || !activeHandleRef.current) return;
            const current = activeHandleRef.current.position;
            const last = lastHandlePosRef.current;
            const dx = current.x - last.x;
            const dy = current.y - last.y;
            const dz = current.z - last.z;
            if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6 && Math.abs(dz) < 1e-6) return;
            translateObject(activeObject.id, [dx, dy, dz]);
            lastHandlePosRef.current.copy(current);
          }}
        />
      )}

      {/* ViewCube */}
      <ViewCube controlsRef={controlsRef} isSidebarOpen={isSidebarOpen} />
    </Canvas>
    <WorkspaceBottomBar onPreviewClick={onPreviewClick} />
    </div>
  );
}
