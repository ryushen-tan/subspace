import { ShaderMaterial, Color } from 'three';

// Custom shader for halftone/dither point rendering
export const DitherPointShader = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new Color(0xffffff) },
    uAccentColor: { value: new Color(0xdc2626) },
    uPointSize: { value: 2.0 },
    uOpacity: { value: 0.8 },
    uFadeEdge: { value: true },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uPointSize;
    attribute float aSize;
    attribute float aAccent;
    varying float vAccent;
    varying float vDepth;
    
    void main() {
      vAccent = aAccent;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vDepth = -mvPosition.z;
      
      // Point size based on depth (perspective)
      float size = uPointSize * aSize;
      
      // Scale by distance for perspective effect
      float perspective = 300.0 / -mvPosition.z;
      gl_PointSize = max(size * perspective, 1.0);
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform vec3 uAccentColor;
    uniform float uOpacity;
    varying float vAccent;
    varying float vDepth;
    
    void main() {
      // Circular point with soft edge
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      
      // Hard edge for halftone look
      float alpha = 1.0 - smoothstep(0.45, 0.5, dist);
      
      // Fade with depth
      float depthFade = smoothstep(100.0, 0.0, vDepth * 0.1);
      
      vec3 finalColor = mix(uColor, uAccentColor, vAccent);
      
      gl_FragColor = vec4(finalColor, uOpacity * alpha * depthFade);
    }
  `,
};

// Gradient Dither Shader - supports vertex colors
export const GradientDitherShader = {
  uniforms: {
    uTime: { value: 0 },
    uPointSize: { value: 2.0 },
    uOpacity: { value: 0.95 },
    uPinkGlow: { value: 0.3 },
  },
  vertexShader: `
    uniform float uTime;
    uniform float uPointSize;
    attribute float aSize;
    attribute vec3 aColor;
    varying vec3 vColor;
    varying float vDepth;
    varying float vSize;
    
    void main() {
      vColor = aColor;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vDepth = -mvPosition.z;
      vSize = aSize;
      
      // Point size with perspective
      float perspective = 350.0 / -mvPosition.z;
      gl_PointSize = max(uPointSize * aSize * perspective, 1.0);
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform float uOpacity;
    uniform float uPinkGlow;
    varying vec3 vColor;
    varying float vDepth;
    varying float vSize;
    
    // 8x8 Bayer matrix - more visible dither
    float dither8(vec2 pos) {
      return fract(dot(floor(pos), vec2(1.0, 7.0)) * 0.125);
    }
    
    void main() {
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      
      // Harder edge for pixelated look
      float edgeThreshold = 0.48;
      float alpha = 1.0 - step(edgeThreshold, dist);
      
      // Aggressive dithering - visible pixel pattern
      float dither = dither8(gl_FragCoord.xy);
      
      // Create dot pattern based on distance and pixel position
      float pattern = step(dither, dist < 0.3 ? 1.0 : 0.7);
      
      // Pixelated edge - dots become transparent toward edge
      float dots = step(dither + 0.2, 0.5 - dist);
      
      // Combine - either full alpha in center, dithered at edges
      float ditherAlpha = mix(dots, pattern, 0.5);
      alpha = alpha * ditherAlpha;
      
      // Depth fade with dithering
      float depthFade = smoothstep(80.0, 0.0, vDepth * 0.08);
      
      // Color with dither variation
      float colorDither = fract(dither * 1.5) * 0.15;
      vec3 ditherColor = vColor * (1.0 - colorDither);
      
      // Pixelated pink glow
      float glowDither = step(dither, 0.5) * (1.0 - dist * 2.0);
      vec3 glowColor = vec3(1.0, 0.7, 0.75) * uPinkGlow * glowDither;
      vec3 finalColor = mix(ditherColor, glowColor, glowDither * uPinkGlow * 2.0);
      
      gl_FragColor = vec4(finalColor, uOpacity * alpha * depthFade);
    }
  `,
};

// Petal/ambient particle shader with soft pink
export const PetalShader = {
  uniforms: {
    uTime: { value: 0 },
    uPink: { value: new Color(1.0, 0.85, 0.9) },
  },
  vertexShader: `
    uniform float uTime;
    attribute float aScale;
    attribute float aSpeed;
    attribute vec3 aDriftDir;
    varying float vScale;
    
    void main() {
      vScale = aScale;
      
      vec3 pos = position;
      
      // Drifting animation
      pos.y += sin(uTime * aSpeed + position.x * 0.05) * 0.3;
      pos.x += cos(uTime * aSpeed * 0.5 + position.z * 0.05) * 0.2;
      pos += aDriftDir * sin(uTime * 0.2) * 0.5;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = aScale * (180.0 / -mvPosition.z);
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uPink;
    varying float vScale;
    
    // Bayer dither
    float bayer4(vec2 pos) {
      return fract(dot(pos, vec2(0.5, 0.3)) + sin(pos.x * 0.1 + pos.y * 0.2) * 0.5);
    }
    
    void main() {
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      
      if (dist > 0.5) discard;
      
      // Dithered petal shape
      float alpha = 1.0 - smoothstep(0.25, 0.5, dist);
      
      // Apply dither
      float dither = bayer4(gl_FragCoord.xy);
      alpha = step(dither * 0.4, alpha);
      
      // Dithered pink color
      vec3 baseColor = mix(vec3(1.0, 0.9, 0.92), uPink, vScale * 0.5);
      vec3 color = baseColor * (0.95 + dither * 0.1);
      
      gl_FragColor = vec4(color, alpha * 0.5 * (0.3 + vScale * 0.7));
    }
  `,
};

// Background particle shader
export const ParticleShader = {
  uniforms: {
    uTime: { value: 0 },
    uMouse: { value: [0, 0] },
  },
  vertexShader: `
    uniform float uTime;
    attribute float aScale;
    attribute float aSpeed;
    varying float vScale;
    
    void main() {
      vScale = aScale;
      
      vec3 pos = position;
      
      // Gentle floating animation
      pos.y += sin(uTime * aSpeed + position.x * 0.1) * 0.5;
      pos.x += cos(uTime * aSpeed * 0.7 + position.z * 0.1) * 0.3;
      
      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_PointSize = aScale * (200.0 / -mvPosition.z);
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying float vScale;
    
    void main() {
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      
      if (dist > 0.5) discard;
      
      // Soft glow edge
      float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
      
      float brightness = 0.3 + vScale * 0.7;
      vec3 color = vec3(brightness);
      
      gl_FragColor = vec4(color, alpha * 0.6);
    }
  `,
};

export const createDitherMaterial = (color, accentColor, pointSize = 2.0) => {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new Color(color) },
      uAccentColor: { value: new Color(accentColor) },
      uPointSize: { value: pointSize },
      uOpacity: { value: 0.9 },
    },
    vertexShader: DitherPointShader.vertexShader,
    fragmentShader: DitherPointShader.fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: 1, // NormalBlending
  });
};

// Gradient material with vertex colors
export const createGradientDitherMaterial = (pointSize = 2.0) => {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPointSize: { value: pointSize },
      uOpacity: { value: 0.95 },
      uPinkGlow: { value: 0.25 },
    },
    vertexShader: GradientDitherShader.vertexShader,
    fragmentShader: GradientDitherShader.fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: 1,
  });
};

// Petal material for ambient particles
export const createPetalMaterial = () => {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPink: { value: new Color(1.0, 0.85, 0.9) },
    },
    vertexShader: PetalShader.vertexShader,
    fragmentShader: PetalShader.fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: 1,
  });
};

export const createParticleMaterial = () => {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: ParticleShader.vertexShader,
    fragmentShader: ParticleShader.fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: 1,
  });
};
