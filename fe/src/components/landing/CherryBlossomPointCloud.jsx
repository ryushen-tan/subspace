import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { BufferGeometry, Float32BufferAttribute } from 'three';
import { createGradientDitherMaterial, createPetalMaterial } from './DitherShader';

// Cherry Blossom (Sakura) Generator
const generateCherryBlossomPoints = (config = {}) => {
  const { 
    petalCount = 5,
    pointsPerPetal = 150,
    baseWidth = 3.2,
    length = 5.5,
    notchDepth = 0.4, // How deep the petal notch is
    curve = 0.6,       // Cup shape curve
    accentRatio = 0.06,
  } = config;

  const positions = [];
  const sizes = [];
  const colors = [];
  const originalPositions = [];
  const petalIds = [];

  const colorBase = [1, 0.95, 0.95]; // Soft white
  const colorCenter = [1, 0.65, 0.75]; // Cherry pink
  const colorEdge = [1, 0.9, 0.92]; // Light pink
  const colorStamen = [1, 0.85, 0.1]; // Gold

  // Helper to mix colors
  const mixColor = (t, c1, c2) => [
    c1[0] + (c2[0] - c1[0]) * t,
    c1[1] + (c2[1] - c1[1]) * t,
    c1[2] + (c2[2] - c1[2]) * t,
  ];

  // Generate 5 petals
  for (let p = 0; p < petalCount; p++) {
    const petalAngle = (p / petalCount) * Math.PI * 2;
    const nextPetalAngle = ((p + 1) / petalCount) * Math.PI * 2;
    
    for (let i = 0; i < pointsPerPetal; i++) {
      // Parametric petal shape
      const t = i / pointsPerPetal;
      
      // Distance from center (0 to 1)
      const r = t * length;
      
      // Width varies by distance: wider in middle, narrow at base and tip
      // With notch at tip
      let width = baseWidth * Math.sin(Math.PI * (1 - t * 0.8));
      
      // Add notch at tip
      if (t > 0.85) {
        const notchFactor = (t - 0.85) / 0.15; // 0 to 1 at extreme tip
        width *= 1 - notchFactor * notchDepth;
      }
      
      // Spread across petal width
      const spread = (i % 5) / 4 - 0.5; // Random-ish spread
      const spreadDistance = spread * width;
      
      // Height (cup shape) - petals curve upward
      const height = Math.pow(t, 0.6) * curve + Math.abs(spread) * 0.3;
      
      // Calculate position with slight jitter for organic look
      const jitter = 0.15;
      const angle = petalAngle + (nextPetalAngle - petalAngle) * spread * 0.3;
      
      const x = Math.cos(petalAngle) * r + (Math.random() - 0.5) * jitter + Math.cos(angle + Math.PI/2) * spreadDistance;
      const y = Math.sin(petalAngle) * r + (Math.random() - 0.5) * jitter + Math.sin(angle + Math.PI/2) * spreadDistance;
      const z = height + (Math.random() - 0.5) * jitter * 0.5;
      
      positions.push(x, y, z);
      originalPositions.push(x, y, z);
      petalIds.push(p);
      
      // Size: larger in center of petal, smaller at edges
      const size = 0.9 + (1 - Math.abs(spread)) * 0.8 - t * 0.3;
      sizes.push(Math.max(0.4, size));
      
      // Color gradient: pink at base, white at tips
      const distFromCenter = Math.sqrt(x * x + y * y);
      const maxDist = length * 0.7;
      const colorT = Math.min(distFromCenter / maxDist, 1);
      
      if (colorT < 0.4) {
        // Near center - more pink
        const pinkMix = colorT / 0.4;
        const c = mixColor(pinkMix, colorCenter, colorBase);
        colors.push(...c);
      } else {
        // Edges - white with hint of pink
        const c = mixColor((colorT - 0.4) / 0.6, colorBase, colorEdge);
        colors.push(...c);
      }
    }
  }

  // Generate stamens (many thin filaments in center)
  const stamenCount = 50;
  for (let s = 0; s < stamenCount; s++) {
    const angle = (s / stamenCount) * Math.PI * 2 + Math.random() * 0.3;
    const lengthStamen = 1.5 + Math.random() * 1.5;
    const pointsPerStamen = 20;
    
    for (let i = 0; i < pointsPerStamen; i++) {
      const t = i / pointsPerStamen;
      const r = t * lengthStamen;
      
      // Thin stamen with slight curve
      const curveOffset = Math.sin(t * Math.PI) * 0.2;
      
      const x = Math.cos(angle) * r + (Math.random() - 0.5) * 0.05;
      const y = Math.sin(angle) * r + (Math.random() - 0.5) * 0.05;
      const z = r * 1.2 + curveOffset;
      
      positions.push(x, y, z);
      originalPositions.push(x, y, z);
      petalIds.push(10 + s); // Different petal ID for stamens
      
      // Stamen tip is thicker (gold anther)
      const isTip = t > 0.8;
      const size = isTip ? 0.8 : 0.25;
      sizes.push(size);
      
      // Color: stamen filaments are darker, tips are gold
      if (isTip) {
        colors.push(...colorStamen);
      } else {
        colors.push(0.7, 0.5, 0.5); // Dark pink filament
      }
    }
  }

  // Center cluster (pistil area)
  const centerCount = 100;
  for (let i = 0; i < centerCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.8;
    
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    const z = (Math.random() - 0.5) * 0.3;
    
    positions.push(x, y, z);
    originalPositions.push(x, y, z);
    petalIds.push(100); // Center group
    
    sizes.push(0.6 + Math.random() * 0.4);
    colors.push(...colorCenter);
  }

  // Falling petals (ambient particles)
  const fallingCount = 30;
  for (let i = 0; i < fallingCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 8 + Math.random() * 12;
    
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    const z = -3 - Math.random() * 5; // Below the flower
    
    positions.push(x, y, z);
    originalPositions.push(x, y, z);
    petalIds.push(-1); // Falling petal
    
    sizes.push(0.5 + Math.random() * 0.5);
    colors.push(...colorEdge);
  }

  return {
    positions: new Float32BufferAttribute(positions, 3),
    sizes: new Float32BufferAttribute(sizes, 1),
    colors: new Float32BufferAttribute(colors, 3),
    originalPositions: new Float32BufferAttribute(originalPositions, 3),
    petalIds: new Float32BufferAttribute(petalIds, 1),
    count: positions.length / 3,
  };
};

// Cherry Blossom Component
const CherryBlossomPointCloud = ({ scrollProgress = 0 }) => {
  const groupRef = useRef();
  const blossomRef = useRef();
  const ambientRef = useRef();

  // Generate flower geometry
  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    const data = generateCherryBlossomPoints({
      petalCount: 5,
      pointsPerPetal: 200,
      baseWidth: 3.5,
      length: 6,
      notchDepth: 0.35,
      curve: 0.8,
      accentRatio: 0.05,
    });

    geo.setAttribute('position', data.positions);
    geo.setAttribute('aSize', data.sizes);
    geo.setAttribute('aColor', data.colors);
    geo.setAttribute('originalPosition', data.originalPositions);
    geo.setAttribute('aPetalId', data.petalIds);

    return geo;
  }, []);

  // Material with gradients
  const material = useMemo(() => {
    return createGradientDitherMaterial(2.2);
  }, []);

  // Ambient falling petals geometry
  const ambientGeom = useMemo(() => {
    const geo = new BufferGeometry();
    const count = 150;
    const positions = [];
    const scales = [];
    const speeds = [];
    const driftDirs = [];

    for (let i = 0; i < count; i++) {
      // Spread around the flower
      const angle = Math.random() * Math.PI * 2;
      const r = 15 + Math.random() * 25;
      
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      const z = (Math.random() - 0.5) * 15;
      
      positions.push(x, y, z);
      scales.push(Math.random() * 0.6 + 0.3);
      speeds.push(Math.random() * 0.8 + 0.3);
      driftDirs.push((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.2);
    }

    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('aScale', new Float32BufferAttribute(scales, 1));
    geo.setAttribute('aSpeed', new Float32BufferAttribute(speeds, 1));
    geo.setAttribute('aDriftDir', new Float32BufferAttribute(driftDirs, 3));

    return geo;
  }, []);

  const ambientMaterial = useMemo(() => {
    return createPetalMaterial();
  }, []);

  // Animation frame
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Main group rotation
    if (groupRef.current) {
      // Gentle sway
      groupRef.current.rotation.y = time * 0.02 + scrollProgress * 1.5;
      groupRef.current.rotation.z = Math.sin(time * 0.1) * 0.02;
      
      // Slight tilt on scroll
      groupRef.current.rotation.x = Math.sin(time * 0.05) * 0.03 + scrollProgress * 0.1;
    }

    // Blossom specific animations
    if (blossomRef.current) {
      const positions = blossomRef.current.geometry.attributes.position.array;
      const originals = blossomRef.current.geometry.attributes.originalPosition.array;
      const petalIds = blossomRef.current.geometry.attributes.aPetalId.array;
      
      // Scroll-driven dispersion
      const dispersion = scrollProgress * 20;

      for (let i = 0; i < positions.length; i += 3) {
        const ox = originals[i];
        const oy = originals[i + 1];
        const oz = originals[i + 2];
        const petalId = petalIds[i / 3];
        
        // Different animation for center vs petals
        if (petalId >= 100) {
          // Center - expand outward
          positions[i] = ox * (1 + scrollProgress * 0.5);
          positions[i + 1] = oy * (1 + scrollProgress * 0.5);
          positions[i + 2] = oz + scrollProgress * 5;
        } else if (petalId < 0) {
          // Falling petals - fall faster on scroll
          positions[i] = ox;
          positions[i + 1] = oy;
          positions[i + 2] = oz - scrollProgress * 8;
        } else {
          // Petals - spiral outward
          const phase = petalId * 0.5 + time * 0.3;
          const wave = Math.sin(time * 2 + phase) * 0.05; // Flutter
          
          const dx = Math.cos(phase) * dispersion;
          const dy = Math.sin(phase) * dispersion;
          const dz = wave * (1 - scrollProgress);
          
          positions[i] = ox + dx;
          positions[i + 1] = oy + dy;
          positions[i + 2] = oz + dz;
        }
      }

      blossomRef.current.geometry.attributes.position.needsUpdate = true;
      
      // Fade
      material.uniforms.uOpacity.value = Math.max(0.15, 0.95 - scrollProgress * 0.8);
      material.uniforms.uTime.value = time;
    }

    // Ambient particles drift
    if (ambientRef.current) {
      ambientMaterial.uniforms.uTime.value = time;
      ambientRef.current.rotation.y = -time * 0.01;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main cherry blossom */}
      <points
        ref={blossomRef}
        geometry={geometry}
        material={material}
        position={[6, 0, 0]}
      />
      
      {/* Ambient falling petals */}
      <points
        ref={ambientRef}
        geometry={ambientGeom}
        material={ambientMaterial}
      />
      
      {/* Soft lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[8, 5, 10]} intensity={0.9} color={0xffffff} />
      <pointLight position={[0, -5, 5]} intensity={0.4} color={0xffb6c1} /> {/* Pink glow */}
    </group>
  );
};

export default CherryBlossomPointCloud;
