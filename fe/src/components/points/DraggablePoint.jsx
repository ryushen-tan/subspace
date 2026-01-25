import { useEffect, useRef, useCallback } from 'react';
import { TransformControls } from '@react-three/drei';
import { usePointsStore } from '../../state/usePointsStore';

export function DraggablePoint({ point }) {
  const meshRef = useRef(null);
  const lastPositionRef = useRef(null);
  const updatePoint = usePointsStore((state) => state.updatePoint);
  const updatePoints = usePointsStore((state) => state.updatePoints);
  const selectPoint = usePointsStore((state) => state.selectPoint);
  const selectedPointIds = usePointsStore((state) => state.selectedPointIds);
  const points = usePointsStore((state) => state.points);
  const setDragging = usePointsStore((state) => state.setDragging);
  const isSelected = selectedPointIds.includes(point.id);
  const isPrimarySelected = selectedPointIds.length > 0 && selectedPointIds[0] === point.id;
  const isMultiSelected = selectedPointIds.length > 1 && isSelected;

  useEffect(() => {
    if (!meshRef.current) return;
    const [x, y, z] = point.position;
    meshRef.current.position.set(x, y, z);
  }, [point.position]);

  const getSelectedPointsPositions = useCallback(() => {
    const positions = {};
    selectedPointIds.forEach(id => {
      const p = points.find(pt => pt.id === id);
      if (p) positions[id] = [...p.position];
    });
    return positions;
  }, [selectedPointIds, points]);

  return (
    <>
      <group ref={meshRef} position={point.position} userData={{ pointId: point.id }}>
        <mesh
          onPointerDown={(e) => {
            e.stopPropagation();
            const isMultiSelect = e.ctrlKey || e.metaKey || e.shiftKey;
            selectPoint(point.id, isMultiSelect);
            document.body.style.cursor = 'grabbing';
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'grab';
          }}
          onPointerEnter={() => {
            document.body.style.cursor = 'grab';
          }}
          onPointerLeave={() => {
            document.body.style.cursor = 'default';
          }}
        >
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial
            color={point.color || '#ff6b6b'}
            emissive={isSelected ? '#4a90d9' : (point.color || '#ff6b6b')}
            emissiveIntensity={isSelected ? 0.6 : 0.2}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

      </group>

      {isSelected && meshRef.current && (
        <TransformControls
          object={meshRef.current}
          mode="translate"
          showX
          showY
          showZ
          translationSnap={0.1}
          onMouseDown={() => {
            setDragging(true);
            document.body.style.cursor = 'grabbing';
            lastPositionRef.current = { x: meshRef.current.position.x, y: meshRef.current.position.y, z: meshRef.current.position.z };
          }}
          onMouseUp={() => {
            setDragging(false);
            document.body.style.cursor = 'grab';
            lastPositionRef.current = null;
          }}
          onObjectChange={() => {
            if (!meshRef.current) return;
            const { x, y, z } = meshRef.current.position;
            
            if (isMultiSelected && lastPositionRef.current) {
              const dx = x - lastPositionRef.current.x;
              const dy = y - lastPositionRef.current.y;
              const dz = z - lastPositionRef.current.z;
              
              const updates = {};
              selectedPointIds.forEach(id => {
                const p = points.find(pt => pt.id === id);
                if (p) {
                  updates[id] = [
                    p.position[0] + dx,
                    p.position[1] + dy,
                    p.position[2] + dz,
                  ];
                }
              });
              updatePoints(updates);
              lastPositionRef.current = { x, y, z };
            } else {
              updatePoint(point.id, [x, y, z]);
            }
          }}
        />
      )}
    </>
  );
}
