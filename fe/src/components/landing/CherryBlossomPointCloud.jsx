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

  // Material
  const material = useMemo(() => {
    return createGradientDitherMaterial(2.2);
  }, []);

  // Ambient falling petals geometry with physics attributes
  const ambientGeom = useMemo(() => {
    const geo = new BufferGeometry();
    const count = 180;
    const positions = [];
    const scales = [];
    const velocities = [];
    const rotations = [];
    const rotationSpeeds = [];
    const masses = [];
    const windResponses = [];

    for (let i = 0; i < count; i++) {
      // Spread around the flower
      const angle = Math.random() * Math.PI * 2;
      const r = 12 + Math.random() * 30;
      
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      const z = (Math.random() - 0.5) * 20;
      
      positions.push(x, y, z);
      scales.push(Math.random() * 0.7 + 0.2);
      
      // Initial velocity (gentle drift)
      velocities.push((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, -Math.random() * 0.5 - 0.2);
      
      // Rotation state (Euler angles)
      rotations.push(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);
      
      // Rotation speed (tumbling)
      rotationSpeeds.push(
        (Math.random() - 0.5) * 2.0,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 2.5
      );
      
      // Physics properties
      masses.push(Math.random() * 0.5 + 0.5); // 0.5 to 1.0
      windResponses.push(Math.random() * 0.4 + 0.3); // How much wind affects this petal
    }

    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('aScale', new Float32BufferAttribute(scales, 1));
    geo.setAttribute('aVelocity', new Float32BufferAttribute(velocities, 3));
    geo.setAttribute('aRotation', new Float32BufferAttribute(rotations, 3));
    geo.setAttribute('aRotSpeed', new Float32BufferAttribute(rotationSpeeds, 3));
    geo.setAttribute('aMass', new Float32BufferAttribute(masses, 1));
    geo.setAttribute('aWindResponse', new Float32BufferAttribute(windResponses, 1));

    return geo;
  }, []);

  const ambientMaterial = useMemo(() => {
    return createPetalMaterial();
  }, []);

  // Physics refs for ambient particles
  const velocitiesRef = useRef(null);
  const rotationsRef = useRef(null);
  const rotationSpeedsRef = useRef(null);

  // Initialize physics refs
  useMemo(() => {
    velocitiesRef.current = ambientGeom.attributes.aVelocity.array.slice();
    rotationsRef.current = ambientGeom.attributes.aRotation.array.slice();
    rotationSpeedsRef.current = ambientGeom.attributes.aRotSpeed.array.slice();
  }, [ambientGeom]);

  // Animation frame with wind physics
  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.033); // Cap delta for stability

    // Wind forces (vary with time and height)
    const windBase = {
      x: Math.sin(time * 0.3) * 0.3 + Math.sin(time * 0.7) * 0.2,
      y: Math.cos(time * 0.25) * 0.2 + Math.sin(time * 0.5) * 0.15,
      z: Math.sin(time * 0.4) * 0.1
    };
    
    // More intense wind on scroll bloom
    const bloomMultiplier = 1 + scrollProgress * 3;
    const gravity = -9.8; // Gravity acceleration

    // Main group rotation
    if (groupRef.current) {
      // Gentle sway with breath-like rhythm
      const breath = Math.sin(time * 0.3) * 0.5 + 0.5;
      groupRef.current.rotation.y = time * 0.02 + scrollProgress * 1.5 + breath * 0.05;
      groupRef.current.rotation.z = Math.sin(time * 0.1) * 0.02 * (1 - scrollProgress * 0.3);
      
      // Slight tilt on scroll that recovers
      const scrollTilt = Math.sin(scrollProgress * Math.PI) * 0.15;
      groupRef.current.rotation.x = Math.sin(time * 0.05) * 0.03 + scrollTilt;
      
      // Petal cloud expansion on bloom
      const bloomScale = 1 + scrollProgress * 0.5;
      groupRef.current.scale.setScalar(bloomScale);
    }

    // Blossom specific animations with wind physics
    if (blossomRef.current) {
      const positions = blossomRef.current.geometry.attributes.position.array;
      const originals = blossomRef.current.geometry.attributes.originalPosition.array;
      const petalIds = blossomRef.current.geometry.attributes.aPetalId?.array;
      
      // Scroll-driven bloom intensity with easing
      const bloomEase = scrollProgress < 0.5 
        ? 2 * scrollProgress * scrollProgress 
        : 1 - Math.pow(-2 * scrollProgress + 2, 2) / 2;
      const dispersion = bloomEase * 25;
      const upwardBurst = bloomEase * 15;

      if (petalIds) {
        for (let i = 0; i < positions.length; i += 3) {
          const idx = i / 3;
          const ox = originals[i];
          const oy = originals[i + 1];
          const oz = originals[i + 2];
          const petalId = petalIds[idx] || 0;
          
          // Calculate distance from center for wind effect
          const distFromCenter = Math.sqrt(ox * ox + oy * oy);
          const heightFactor = (oz + 5) / 10; // Normalized height
          
          // Per-petal variation
          const petalPhase = petalId * 0.8 + idx * 0.1;
          
          // Wind turbulence varies by petal position
          const turbulence = Math.sin(time * 3 + petalPhase) * 0.03 + 
                           Math.cos(time * 5 + distFromCenter) * 0.02;
          
          // Wind force depends on height (stronger higher up)
          const windForce = heightFactor * bloomMultiplier * 0.5;
          const windX = (windBase.x + turbulence) * windForce;
          const windY = (windBase.y + turbulence * 0.5) * windForce;
          const windZ = windBase.z * windForce * 0.3;
          
          if (petalId >= 100) {
            // Center pistil - expands and drifts
            const expansion = 1 + bloomEase * 0.8;
            const driftX = Math.sin(time + petalPhase) * bloomEase * 3;
            const driftY = Math.cos(time * 0.7 + petalPhase) * bloomEase * 3;
            
            positions[i] = ox * expansion + driftX + windX * 0.5;
            positions[i + 1] = oy * expansion + driftY + windY * 0.5;
            positions[i + 2] = oz + upwardBurst * 0.3 + turbulence + windZ;
          } else if (petalId < 0) {
            // Falling petals - gravity and wind
            const fallProgress = bloomEase;
            positions[i] = ox + windX * 2 + Math.sin(time + idx) * fallProgress;
            positions[i + 1] = oy + windY * 2 + Math.cos(time * 0.8 + idx) * fallProgress;
            positions[i + 2] = oz - upwardBurst * 0.5 - fallProgress * 5 + windZ;
          } else {
            // Main petals - spiral outward with wind
            const phase = petalId * 0.5 + time * 0.2;
            
            // Spiral dispersion
            const spiralX = Math.cos(phase) * dispersion * (1 + bloomEase * 0.5);
            const spiralY = Math.sin(phase) * dispersion * (1 + bloomEase * 0.5);
            
            // Flutter effect - petals wave in wind
            const flutterAmp = (1 - bloomEase * 0.7) * 0.15;
            const flutter = Math.sin(time * 4 + phase * 2) * flutterAmp;
            const flutterZ = Math.cos(time * 3 + phase) * flutterAmp;
            
            // Combine original position with forces
            const targetX = ox + spiralX + windX + flutter * Math.cos(phase);
            const targetY = oy + spiralY + windY + flutter * Math.sin(phase);
            const targetZ = oz + flutterZ + windZ + turbulence;
            
            // Gentle ease toward target (spring physics)
            positions[i] += (targetX - positions[i]) * 0.1;
            positions[i + 1] += (targetY - positions[i + 1]) * 0.1;
            positions[i + 2] += (targetZ - positions[i + 2]) * 0.1;
          }
        }
      }

      blossomRef.current.geometry.attributes.position.needsUpdate = true;
      
      // Fade with bloom - keep some opacity for ethereal effect
      material.uniforms.uOpacity.value = Math.max(0.08, 0.95 - bloomEase * 0.85);
      material.uniforms.uTime.value = time;
    }

    // Ambient particles with full physics simulation
    if (ambientRef.current && velocitiesRef.current && rotationsRef.current) {
      const positions = ambientRef.current.geometry.attributes.position.array;
      const velocities = velocitiesRef.current;
      const rotations = rotationsRef.current;
      const rotationSpeeds = rotationSpeedsRef.current;
      const masses = ambientRef.current.geometry.attributes.aMass?.array;
      const windResponses = ambientRef.current.geometry.attributes.aWindResponse?.array;
      
      if (masses && windResponses) {
        for (let i = 0; i < positions.length; i += 3) {
          const idx = i / 3;
          const mass = masses[idx] || 1;
          const windResponse = windResponses[idx] || 0.5;
          
          // Height-based wind (stronger wind higher up, less near ground)
          const height = positions[i + 2];
          const heightFactor = Math.max(0, Math.min(1, (height + 10) / 20));
          
          // Turbulence per petal
          const turbPhase = idx * 0.5 + time * 2;
          const turbulence = {
            x: Math.sin(turbPhase) * 0.1 + Math.cos(turbPhase * 1.3) * 0.05,
            y: Math.cos(turbPhase * 0.8) * 0.08 + Math.sin(turbPhase * 1.7) * 0.04,
            z: Math.sin(turbPhase * 1.1) * 0.03
          };
          
          // Wind force on this particle
          const windForce = {
            x: (windBase.x + turbulence.x) * windResponse * heightFactor * bloomMultiplier,
            y: (windBase.y + turbulence.y) * windResponse * heightFactor * bloomMultiplier,
            z: (windBase.z + turbulence.z) * windResponse * heightFactor * 0.5
          };
          
          // Apply forces: wind + gravity + air resistance
          velocities[i] += windForce.x * dt;
          velocities[i + 1] += windForce.y * dt;
          velocities[i + 2] += (gravity * mass * 0.3 + windForce.z) * dt; // Gravity scaled by mass
          
          // Air resistance (drag) - terminal velocity
          const drag = 0.98 - (mass - 0.5) * 0.02;
          velocities[i] *= drag;
          velocities[i + 1] *= drag;
          velocities[i + 2] *= Math.min(drag + 0.01, 0.995); // Less drag on Z for falling
          
          // Tumbling rotation (petals spin as they fall)
          const rotIdx = i; // rotations are per-particle, 3 values each
          rotations[rotIdx] += rotationSpeeds[rotIdx] * dt * (1 + windResponse);
          rotations[rotIdx + 1] += rotationSpeeds[rotIdx + 1] * dt * (1 + windResponse * 0.5);
          rotations[rotIdx + 2] += rotationSpeeds[rotIdx + 2] * dt * (1 + windResponse);
          
          // Update position from velocity
          positions[i] += velocities[i] * dt;
          positions[i + 1] += velocities[i + 1] * dt;
          positions[i + 2] += velocities[i + 2] * dt;
          
          // Reset particles that fall too far (loop them)
          if (positions[i + 2] < -15) {
            // Respawn above
            const angle = Math.random() * Math.PI * 2;
            const r = 10 + Math.random() * 20;
            positions[i] = Math.cos(angle) * r;
            positions[i + 1] = Math.sin(angle) * r;
            positions[i + 2] = 8 + Math.random() * 8;
            
            // Reset velocity with slight downward drift
            velocities[i] = (Math.random() - 0.5) * 0.5;
            velocities[i + 1] = (Math.random() - 0.5) * 0.5;
            velocities[i + 2] = -Math.random() * 0.8 - 0.3;
          }
          
          // Soft boundaries (gentle push back)
          const distFromCenter = Math.sqrt(positions[i] ** 2 + positions[i + 1] ** 2);
          if (distFromCenter > 45) {
            const pushBack = 0.02;
            velocities[i] -= positions[i] * pushBack * dt;
            velocities[i + 1] -= positions[i + 1] * pushBack * dt;
          }
        }
      }
      
      ambientRef.current.geometry.attributes.position.needsUpdate = true;
      ambientMaterial.uniforms.uTime.value = time;
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
