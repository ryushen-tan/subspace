import * as THREE from 'three';

export function buildMeshGeometry(mesh, pointOverrides = null) {
  if (!mesh?.vertices?.length) return null;

  const idToIndex = new Map();
  const positions = new Float32Array(mesh.vertices.length * 3);
  
  for (let i = 0; i < mesh.vertices.length; i++) {
    const v = mesh.vertices[i];
    idToIndex.set(v.id, i);
    const pos = pointOverrides?.get(v.id) ?? v.p;
    positions[i * 3] = pos[0];
    positions[i * 3 + 1] = pos[1];
    positions[i * 3 + 2] = pos[2] ?? 0;
  }

  let faces = mesh.faces || [];

  // If no faces but has loops, generate faces via lofting
  if (!faces.length && mesh.loops && Object.keys(mesh.loops).length >= 2) {
    faces = loftLoops(mesh.loops, mesh.stitch);
  }

  if (!faces.length) return null;

  const indices = [];
  for (const f of faces) {
    if (!Array.isArray(f) || f.length < 3) continue;

    const ids = f.map((x) => String(x));
    const resolved = ids.map((id) => idToIndex.get(id));
    if (resolved.some((idx) => idx == null)) continue;

    // Fan triangulation for any polygon (3+ vertices)
    for (let i = 1; i < resolved.length - 1; i++) {
      indices.push(resolved[0], resolved[i], resolved[i + 1]);
    }
  }

  if (!indices.length) return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export function buildEdgesGeometry(mesh, pointOverrides = null) {
  if (!mesh?.vertices?.length || !mesh.edges?.length) return null;

  const idToPos = new Map(mesh.vertices.map((v) => [v.id, pointOverrides?.get(v.id) ?? v.p]));
  const positions = [];

  for (const e of mesh.edges) {
    const a = idToPos.get(e[0]);
    const b = idToPos.get(e[1]);
    if (!a || !b) continue;
    positions.push(a[0], a[1], a[2] ?? 0, b[0], b[1], b[2] ?? 0);
  }

  if (!positions.length) return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

export function loftLoops(loops, stitch) {
  if (!loops || Object.keys(loops).length < 2) return [];

  // Sort loop names by numeric suffix if present
  const loopNames = Object.keys(loops).sort((a, b) => {
    const na = Number(a.match(/(\d+)$/)?.[1]);
    const nb = Number(b.match(/(\d+)$/)?.[1]);
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
    return a.localeCompare(b);
  });

  // Use stitch pairs if provided, otherwise stitch consecutive loops
  const stitchPairs = Array.isArray(stitch) && stitch.length
    ? stitch
    : loopNames.slice(0, -1).map((name, i) => [name, loopNames[i + 1]]);

  const faces = [];
  
  for (const [aName, bName] of stitchPairs) {
    const loopA = loops[aName];
    const loopB = loops[bName];
    if (!Array.isArray(loopA) || !Array.isArray(loopB)) continue;
    if (loopA.length !== loopB.length) continue;

    const n = loopA.length;
    for (let i = 0; i < n; i++) {
      const a0 = loopA[i];
      const a1 = loopA[(i + 1) % n];
      const b0 = loopB[i];
      const b1 = loopB[(i + 1) % n];
      faces.push([a0, b0, b1]);
      faces.push([a0, b1, a1]);
    }
  }

  return faces;
}
