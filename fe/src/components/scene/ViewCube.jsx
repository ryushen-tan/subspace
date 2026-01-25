import { GizmoHelper, GizmoViewcube } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useMemo } from 'react';

export function ViewCube({ controlsRef }) {
  const { size } = useThree();
  
  // Position ViewCube at bottom left
  const margin = useMemo(() => {
    const viewportHeight = size.height;
    const cubeSize = 80; // Approximate ViewCube size
    const leftPadding = 80; // Padding from left edge
    const bottomOffset = 20; // Positive value to push cube down (lower on screen)
    
    // Position at bottom left: left padding from left, positioned lower
    // Larger topMargin value moves the cube down
    const leftMargin = leftPadding;
    const topMargin = viewportHeight - cubeSize + bottomOffset;
    
    return [leftMargin, topMargin];
  }, [size.width, size.height]);

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
