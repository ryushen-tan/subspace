import { GizmoHelper, GizmoViewcube } from '@react-three/drei';
import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';

export function ViewCube({ controlsRef, isSidebarOpen }) {
  const { size } = useThree();
  
  // GizmoHelper margin: [horizontal, vertical]
  // For "bottom" alignment, horizontal is offset from left
  // To center: (screen width / 2) - (cube width / 2)
  const margin = useMemo(() => {
    const cubeWidth = 80; // Actual viewcube width in pixels
    const horizontalCenter = (size.width / 2) - (cubeWidth / 2);
    return [horizontalCenter, 60];
  }, [size.width]);

  return (
    <GizmoHelper
      alignment="bottom"
      margin={margin}
      onUpdate={() => controlsRef.current?.update?.()}
    >
      <GizmoViewcube
        color="#222"
        strokeColor="#fff"
        textColor="#fff"
        hoverColor="#4a90d9"
      />
    </GizmoHelper>
  );
}
