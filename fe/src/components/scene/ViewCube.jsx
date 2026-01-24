import { GizmoHelper, GizmoViewcube } from '@react-three/drei';
import { useMemo } from 'react';
import { useThree } from '@react-three/fiber';

export function ViewCube({ controlsRef }) {
  
  // GizmoHelper margin: [horizontal, vertical]
  // For "top-left" alignment, position at top-left corner of canvas
  // margin: [horizontal offset from left, vertical offset from top]
  const margin = useMemo(() => {
    return [80, 80]; // 60px from left, 40px from top
  }, []);

  return (
    <GizmoHelper
      alignment="top-left"
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
