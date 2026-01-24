import { useEffect, useRef } from 'react';
import { TransformControls } from '@react-three/drei';
import { usePointsStore } from '../../state/usePointsStore';

export function DraggablePoint({ point }) {
  const meshRef = useRef(null);
  const updatePoint = usePointsStore((state) => state.updatePoint);
  const selectPoint = usePointsStore((state) => state.selectPoint);
  const selectedPointIds = usePointsStore((state) => state.selectedPointIds);
  const setDragging = usePointsStore((state) => state.setDragging);
  const isSelected = selectedPointIds.includes(point.id);
  const isSingleSelected = selectedPointIds.length === 1 && isSelected;

  useEffect(() => {
    if (!meshRef.current) return;
    const [x, y, z] = point.position;
    meshRef.current.position.set(x, y, z);
  }, [point.position]);

  return (
    <>
      <mesh
        ref={meshRef}
        position={point.position}
        userData={{ pointId: point.id }}
        onPointerDown={(e) => {
          e.stopPropagation();
          // Check for multi-select modifier keys (Ctrl, Cmd, or Shift)
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
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color={point.color || '#ff6b6b'}
          emissive={isSelected ? '#4a90d9' : (point.color || '#ff6b6b')}
          emissiveIntensity={isSelected ? 0.6 : 0.2}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {isSingleSelected && meshRef.current && (
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
          }}
          onMouseUp={() => {
            setDragging(false);
            document.body.style.cursor = 'grab';
          }}
          onObjectChange={() => {
            if (!meshRef.current) return;
            const { x, y, z } = meshRef.current.position;
            updatePoint(point.id, [x, y, z]);
          }}
        />
      )}
    </>
  );
}
