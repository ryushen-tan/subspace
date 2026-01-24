/**
 * Generates a unique ID for points
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clamps a value between min and max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculates distance between two 3D points
 */
export function distance3D(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Converts Vector3 to tuple
 */
export function vector3ToTuple(vector) {
  return [vector.x, vector.y, vector.z];
}
