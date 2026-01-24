import { useRef } from 'react';
import { useDrag3D } from '../../hooks/useDrag3D';
import { usePointsStore } from '../../state/usePointsStore';

export function DraggablePoint({ point }) {
  const meshRef = useRef(null);
  const updatePoint = usePointsStore((state) => state.updatePoint);

  const { startDrag, endDrag, isDragging } = useDrag3D({
    dragPlane: 'xy',
    onDrag: (position) => {
      updatePoint(point.id, position);
    },
  });

  return (
    <mesh
      ref={meshRef}
      position={point.position}
      userData={{ pointId: point.id }}
      onPointerDown={(e) => {
        e.stopPropagation();
        startDrag(e, e.object, point.position);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        endDrag();
      }}
      onPointerCancel={(e) => {
        e.stopPropagation();
        endDrag();
      }}
    >
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial
        color={point.color || '#ff6b6b'}
        emissive={point.color || '#ff6b6b'}
        emissiveIntensity={isDragging ? 0.5 : 0.2}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}
