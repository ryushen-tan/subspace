import { create } from 'zustand';
import { agentApi } from '../services/agentApi';
import { usePointsStore } from './usePointsStore';

const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894'];

const DEFAULT_CUBE_MESH = {
  vertices: [
    { id: '1', p: [-0.5, -0.5, -0.5] },
    { id: '2', p: [0.5, -0.5, -0.5] },
    { id: '3', p: [0.5, 0.5, -0.5] },
    { id: '4', p: [-0.5, 0.5, -0.5] },
    { id: '5', p: [-0.5, -0.5, 0.5] },
    { id: '6', p: [0.5, -0.5, 0.5] },
    { id: '7', p: [0.5, 0.5, 0.5] },
    { id: '8', p: [-0.5, 0.5, 0.5] },
  ],
  faces: [
    ['1', '2', '3', '4'], // back
    ['5', '8', '7', '6'], // front
    ['1', '5', '6', '2'], // bottom
    ['4', '3', '7', '8'], // top
    ['1', '4', '8', '5'], // left
    ['2', '6', '7', '3'], // right
  ],
  edges: [],
  loops: null,
  stitch: null,
  scale_factor: 1,
};

const meshSignature = (mesh) => {
  if (!mesh) return '';
  try {
    const verts = (mesh.vertices || []).map((v) => `${v.id}:${v.p.join(',')}`).sort();
    const edges = (mesh.edges || []).map((e) => e.join('-')).sort();
    const faces = (mesh.faces || []).map((f) => f.join(',')).sort();
    const loopNames = mesh.loops ? Object.keys(mesh.loops).sort() : [];
    const loops = loopNames.map((k) => `${k}:${(mesh.loops[k] || []).join(',')}`);
    const stitch = (mesh.stitch || []).map((s) => s.join('-')).sort();
    return [verts.join('|'), edges.join('|'), faces.join('|'), loops.join('|'), stitch.join('|')].join('::');
  } catch (err) {
    console.warn('Mesh signature failed', err);
    return '';
  }
};

const computeCenter = (verts = []) => {
  if (!verts.length) return [0, 0, 0];
  const cx = verts.reduce((s, v) => s + (v.p?.[0] ?? 0), 0) / verts.length;
  const cy = verts.reduce((s, v) => s + (v.p?.[1] ?? 0), 0) / verts.length;
  const cz = verts.reduce((s, v) => s + (v.p?.[2] ?? 0), 0) / verts.length;
  return [cx, cy, cz];
};

const buildTransformedMesh = (originalMesh, transform) => {
  if (!originalMesh?.vertices?.length) return originalMesh;
  const { translation = [0, 0, 0], rotation = [0, 0, 0], scale = 100 } = transform || {};

  const center = originalMesh.originalCenter || computeCenter(originalMesh.vertices);
  const [tx, ty, tz] = translation;
  const [rx, ry, rz] = rotation.map((r) => (r * Math.PI) / 180);
  const s = scale / 100;

  const rotatePoint = ([x, y, z]) => {
    // rotation around X
    let y1 = y * Math.cos(rx) - z * Math.sin(rx);
    let z1 = y * Math.sin(rx) + z * Math.cos(rx);
    y = y1; z = z1;
    // rotation around Y
    let x1 = x * Math.cos(ry) + z * Math.sin(ry);
    z1 = -x * Math.sin(ry) + z * Math.cos(ry);
    x = x1; z = z1;
    // rotation around Z
    x1 = x * Math.cos(rz) - y * Math.sin(rz);
    y1 = x * Math.sin(rz) + y * Math.cos(rz);
    return [x1, y1, z];
  };

  const nextVerts = originalMesh.vertices.map((v) => {
    const rel = [
      (v.p?.[0] ?? 0) - center[0],
      (v.p?.[1] ?? 0) - center[1],
      (v.p?.[2] ?? 0) - center[2],
    ];
    const scaled = rel.map((c) => c * s);
    const rotated = rotatePoint(scaled);
    const world = [
      rotated[0] + center[0] + tx,
      rotated[1] + center[1] + ty,
      rotated[2] + center[2] + tz,
    ];
    return { ...v, p: world };
  });

  return {
    ...originalMesh,
    vertices: nextVerts,
    originalCenter: originalMesh.originalCenter || center,
  };
};

const extractNewGeometry = (allObjects, incomingMesh) => {
  if (!incomingMesh?.vertices?.length) return null;

  // Build position set from ALL existing objects
  const existingPositions = new Set();
  allObjects.forEach((obj) => {
    (obj.mesh?.vertices || []).forEach((v) => {
      const key = `${v.p[0].toFixed(6)},${v.p[1].toFixed(6)},${v.p[2].toFixed(6)}`;
      existingPositions.add(key);
    });
  });

  // Keep only vertices with positions not yet seen
  const newVerts = (incomingMesh.vertices || []).filter((v) => {
    const key = `${v.p[0].toFixed(6)},${v.p[1].toFixed(6)},${v.p[2].toFixed(6)}`;
    return !existingPositions.has(key);
  });

  if (newVerts.length === 0) return null;

  const newIds = new Set(newVerts.map((v) => String(v.id)));
  const newEdges = (incomingMesh.edges || []).filter(
    (e) => newIds.has(String(e[0])) && newIds.has(String(e[1]))
  );
  const newFaces = (incomingMesh.faces || []).filter((f) =>
    f.every((vid) => newIds.has(String(vid)))
  );

  return {
    vertices: newVerts,
    edges: newEdges,
    faces: newFaces,
    loops: null,
    stitch: null,
    scale_factor: incomingMesh.scale_factor || 1,
  };
};

export const useAgentStore = create((set, get) => ({
  sessionId: null,
  isConnected: false,
  isLoading: false,
  todo: [],
  messages: [],
  toolCalls: [],
  mesh: null,
  objects: [],
  activeObjectId: null,
  finalized: false,
  lastProcessedMeshSignature: null,
  
  // Project info (in-memory + optional PocketBase project id)
  currentProjectId: null,
  projectName: 'Untitled Project',
  projectDescription: '',
  projectCreatedAt: Date.now(),

  setCurrentProjectId: (id) => set({ currentProjectId: id }),
  setProjectName: (name) => set({ projectName: name || 'Untitled Project' }),
  setProjectDescription: (description) => set({ projectDescription: description || '' }),

  getSnapshotForSave: () => {
    const s = get();
    return {
      version: 1,
      projectName: s.projectName,
      projectDescription: s.projectDescription,
      objects: s.objects,
      timelineSteps: s.timelineSteps,
      currentStepIndex: s.currentStepIndex,
      messages: s.messages,
      todo: s.todo,
      activeObjectId: s.activeObjectId,
    };
  },

  hydrateFromSnapshot: (snapshot) => {
    if (!snapshot || typeof snapshot !== 'object') return;
    const s = snapshot;
    set({
      projectName: s.projectName ?? 'Untitled Project',
      projectDescription: s.projectDescription ?? '',
      objects: s.objects ?? [],
      timelineSteps: s.timelineSteps ?? [],
      currentStepIndex: s.currentStepIndex ?? -1,
      messages: s.messages ?? [],
      todo: s.todo ?? [],
      activeObjectId: s.activeObjectId ?? null,
      mesh: null,
      lastProcessedMeshSignature: null,
    });
    const state = get();
    const activeObj = state.objects.find((o) => o.id === state.activeObjectId);
    if (activeObj?.mesh) set({ mesh: activeObj.mesh });
    usePointsStore.getState().clearAll();
    (state.objects || []).forEach((obj) => {
      const verts = obj.mesh?.vertices || [];
      const points = verts.map((v, i) => ({
        id: v.id,
        position: v.p,
        color: COLORS[i % COLORS.length],
      }));
      usePointsStore.getState().setPointsForObject(obj.id, points);
    });
  },

  /** Clear project state and points. Use disconnect: false when entering "new project" so we don't close the socket. */
  resetProject: (opts = {}) => {
    const { disconnect = false } = typeof opts === 'boolean' ? { disconnect: opts } : opts;
    if (disconnect) get().disconnect();
    usePointsStore.getState().clearAll();
    set({
      ...(disconnect && {
        sessionId: null,
        isConnected: false,
        isLoading: false,
      }),
      todo: [],
      messages: [],
      toolCalls: [],
      mesh: null,
      objects: [],
      activeObjectId: null,
      finalized: false,
      lastProcessedMeshSignature: null,
      currentProjectId: null,
      projectName: 'Untitled Project',
      projectDescription: '',
      projectCreatedAt: Date.now(),
      timelineSteps: [],
      currentStepIndex: -1,
    });
  },

  // Timeline state
  timelineSteps: [],
  currentStepIndex: -1,

  addTimelineStep: (stepData) => {
    set((s) => {
      // If we're not at the end, truncate future steps
      const steps = s.currentStepIndex === s.timelineSteps.length - 1 
        ? s.timelineSteps 
        : s.timelineSteps.slice(0, s.currentStepIndex + 1);
      
      return {
        timelineSteps: [...steps, stepData],
        currentStepIndex: steps.length,
      };
    });
  },
  
  // Undo/Redo helpers
  undo: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      get().scrubToStep(currentStepIndex - 1);
    }
  },
  redo: () => {
    const { currentStepIndex, timelineSteps } = get();
    if (currentStepIndex < timelineSteps.length - 1) {
      get().scrubToStep(currentStepIndex + 1);
    }
  },
  
  scrubToStep: (stepIndex) => {
    const state = get();
    if (stepIndex < 0 || stepIndex >= state.timelineSteps.length) return;
    
    const step = state.timelineSteps[stepIndex];
    
    // Compute latest mesh snapshot per object up to this step
    const latestMeshByObject = new Map();
    const visibleObjectIds = new Set();
    for (let i = 0; i <= stepIndex; i++) {
      const s = state.timelineSteps[i];
      if (s.objectId) {
        visibleObjectIds.add(s.objectId);
        if (s.mesh) latestMeshByObject.set(s.objectId, s.mesh);
      }
    }

    // Restore messages up to this point
    const messages = state.timelineSteps.slice(0, stepIndex + 1)
      .flatMap(s => s.messages || []);

    // Build restored objects with mesh and visibility
    const restoredObjects = state.objects.map((obj) => {
      const restoredMesh = latestMeshByObject.get(obj.id) || obj.mesh;
      return {
        ...obj,
        mesh: restoredMesh,
        visible: visibleObjectIds.has(obj.id),
      };
    });

    // Sync points for each object to reflect restored meshes
    restoredObjects.forEach((obj) => {
      const verts = obj.mesh?.vertices || [];
      const points = verts.map((v, i) => ({
        id: v.id,
        position: v.p,
        color: COLORS[i % COLORS.length],
      }));
      usePointsStore.getState().setPointsForObject(obj.id, points);
      if (!obj.visible) {
        usePointsStore.getState().clearSelectionForObject(obj.id);
      }
    });

    set({
      currentStepIndex: stepIndex,
      objects: restoredObjects,
      messages,
      activeObjectId: step.objectId || state.activeObjectId,
      mesh: step.mesh || state.mesh,
    });
  },

  addMeshObject: (mesh, name, placeOnGround = false) => {
    if (!mesh?.vertices?.length) return null;

    const state = get();
    const sig = meshSignature(mesh);
    
    // Skip if we just processed this exact mesh (prevents duplicates from rapid state updates)
    if (sig === state.lastProcessedMeshSignature) {
      return state.objects[state.objects.length - 1]?.id || null;
    }
    
    const existing = state.objects.find((obj) => (obj.signature || meshSignature(obj.mesh)) === sig);
    if (existing) {
      set((s) => ({
        objects: s.objects,
        activeObjectId: existing.id,
        mesh: existing.mesh,
      }));
      return existing.id;
    }

    let finalMesh = extractNewGeometry(state.objects, mesh);

    if (placeOnGround && finalMesh?.vertices?.length) {
      const minY = Math.min(...finalMesh.vertices.map((v) => v.p[1]));
      finalMesh = {
        ...finalMesh,
        vertices: finalMesh.vertices.map((v) => ({ ...v, p: [v.p[0], v.p[1] - minY, v.p[2]] })),
      };
    }
    if (!finalMesh) {
      const last = state.objects[state.objects.length - 1];
      if (last) {
        set({
          activeObjectId: last.id,
          mesh: last.mesh,
        });
        return last.id;
      }
      return null;
    }

    const finalSig = meshSignature(finalMesh);

    let createdId = null;
    let objectName = null;
    let createdMesh = finalMesh;
    set((s) => {
      const objectId = `obj-${Date.now()}-${s.objects.length + 1}`;
      createdId = objectId;
      objectName = name || `Obj ${s.timelineSteps.length + 1}`;
      const color = COLORS[s.objects.length % COLORS.length];
      const originalCenter = computeCenter(finalMesh.vertices);
      const originalMesh = { ...finalMesh, originalCenter };
      const identityTransform = { translation: [0, 0, 0], rotation: [0, 0, 0], scale: 100 };
      const meshWithTransform = buildTransformedMesh(originalMesh, identityTransform);
      createdMesh = meshWithTransform;
      const newObject = {
        id: objectId,
        name: objectName,
        mesh: meshWithTransform,
        visible: true,
        signature: finalSig,
        color,
        originalMesh,
        scalePercentage: 100,
        transform: identityTransform,
      };

      return {
        objects: [...s.objects, newObject],
        mesh: meshWithTransform,
        activeObjectId: objectId,
        lastProcessedMeshSignature: sig,
      };
    });

    if (createdId) {
      const points = createdMesh.vertices.map((v, i) => ({
        id: v.id,
        position: v.p,
        color: COLORS[i % COLORS.length],
      }));
      usePointsStore.getState().setPointsForObject(createdId, points);

      const currentState = get();
      get().addTimelineStep({
        objectId: createdId,
        name: objectName,
        mesh: createdMesh,
        messages: [...currentState.messages],
        timestamp: Date.now(),
      });
    }

    return createdId;
  },

  renameObject: (objectId, name) => {
    const prev = get().objects.find((o) => o.id === objectId);
    const oldName = prev?.name;
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === objectId ? { ...obj, name: name || obj.name } : obj
      ),
    }));
    const updated = get().objects.find((o) => o.id === objectId);
    if (updated) {
      get().addTimelineStep({
        objectId,
        name: `Renamed ${oldName || updated.name} → ${name || updated.name}`,
        mesh: updated.mesh,
        timestamp: Date.now(),
      });
    }
  },

  updateObjectColor: (objectId, color) => {
    const before = get().objects.find((o) => o.id === objectId);
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === objectId ? { ...obj, color } : obj
      ),
    }));
    const after = get().objects.find((o) => o.id === objectId);
    if (after) {
      get().addTimelineStep({
        objectId,
        name: `Changed color of ${after.name || 'object'} to ${color}`,
        mesh: after.mesh,
        timestamp: Date.now(),
      });
    }
  },

  translateObject: (objectId, delta) =>
    set((state) => {
      if (!delta || delta.length !== 3) return state;
      const [dx, dy, dz] = delta;
      if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6 && Math.abs(dz) < 1e-6) return state;

      const updatedObjects = state.objects.map((obj) => {
        if (obj.id !== objectId) return obj;
        const baseTransform = obj.transform || { translation: [0, 0, 0], rotation: [0, 0, 0], scale: 100 };
        const nextTranslation = [
          (baseTransform.translation?.[0] || 0) + dx,
          (baseTransform.translation?.[1] || 0) + dy,
          (baseTransform.translation?.[2] || 0) + dz,
        ];
        const nextTransform = { ...baseTransform, translation: nextTranslation };
        const nextMesh = buildTransformedMesh(obj.originalMesh || obj.mesh, nextTransform);
        const points = (nextMesh.vertices || []).map((v, i) => ({
          id: v.id,
          position: v.p,
          color: COLORS[i % COLORS.length],
        }));
        usePointsStore.getState().setPointsForObject(objectId, points);
        return { ...obj, mesh: nextMesh, transform: nextTransform };
      });

      const activeUpdated = updatedObjects.find((o) => o.id === state.activeObjectId);
      return {
        objects: updatedObjects,
        mesh: activeUpdated?.mesh || state.mesh,
      };
    }),

  rotateObject: (objectId, rotation) =>
    set((state) => {
      if (!rotation || rotation.length !== 3) return state;
      const rotationDegArray = rotation;
      const obj = state.objects.find((o) => o.id === objectId);
      if (!obj?.mesh?.vertices?.length) return state;

      const updatedObjects = state.objects.map((o) => {
        if (o.id !== objectId) return o;

        // Apply rotation on top of existing translation/scale
        const baseTransform = o.transform || { translation: [0, 0, 0], rotation: [0, 0, 0], scale: 100 };
        const nextTransform = { ...baseTransform, rotation: rotationDegArray };
        const nextMesh = buildTransformedMesh(o.originalMesh || o.mesh, nextTransform);

        const points = (nextMesh.vertices || []).map((v, i) => ({
          id: v.id,
          position: v.p,
          color: COLORS[i % COLORS.length],
        }));
        usePointsStore.getState().setPointsForObject(objectId, points);

        return { ...o, mesh: nextMesh, transform: nextTransform, scalePercentage: baseTransform.scale };
      });

      const activeUpdated = updatedObjects.find((o) => o.id === state.activeObjectId);
      return {
        objects: updatedObjects,
        mesh: activeUpdated?.mesh || state.mesh,
      };
    }),

  scaleObject: (objectId, percentage) =>
    set((state) => {
      if (!percentage || percentage <= 0) return state;

      const obj = state.objects.find((o) => o.id === objectId);
      if (!obj) return state;

      const baseTransform = obj.transform || { translation: [0, 0, 0], rotation: [0, 0, 0], scale: 100 };
      const nextTransform = { ...baseTransform, scale: percentage };
      const nextMesh = buildTransformedMesh(obj.originalMesh || obj.mesh, nextTransform);
      const points = (nextMesh.vertices || []).map((v, i) => ({
        id: v.id,
        position: v.p,
        color: COLORS[i % COLORS.length],
      }));
      usePointsStore.getState().setPointsForObject(objectId, points);

      const updatedObjects = state.objects.map((o) =>
        o.id === objectId ? { ...o, mesh: nextMesh, scalePercentage: Math.round(percentage), transform: nextTransform } : o
      );

      const activeUpdated = updatedObjects.find((o) => o.id === state.activeObjectId);
      return {
        objects: updatedObjects,
        mesh: activeUpdated?.mesh || state.mesh,
      };
    }),

  setObjectPosition: (objectId, position) => {
    if (!position || position.length !== 3) return;
    const state = get();
    const obj = state.objects.find((o) => o.id === objectId);
    if (!obj) return;

    const original = obj.originalMesh || obj.mesh;
    const originalCenter = original.originalCenter || computeCenter(original.vertices);
    const [newX, newY, newZ] = position;
    const nextTranslation = [newX - originalCenter[0], newY - originalCenter[1], newZ - originalCenter[2]];

    const baseTransform = obj.transform || { translation: [0, 0, 0], rotation: [0, 0, 0], scale: 100 };
    const nextTransform = { ...baseTransform, translation: nextTranslation };
    const nextMesh = buildTransformedMesh(original, nextTransform);
    const points = (nextMesh.vertices || []).map((v, i) => ({
      id: v.id,
      position: v.p,
      color: COLORS[i % COLORS.length],
    }));
    usePointsStore.getState().setPointsForObject(objectId, points);

    const updatedObjects = state.objects.map((o) =>
      o.id === objectId ? { ...o, mesh: nextMesh, transform: nextTransform } : o
    );

    const activeUpdated = updatedObjects.find((o) => o.id === state.activeObjectId);
    set({ objects: updatedObjects, mesh: activeUpdated?.mesh || state.mesh });
  },

  setActiveObject: (objectId) => {
    const target = get().objects.find((obj) => obj.id === objectId);
    if (!target) return;

    set((state) => {
      if (state.activeObjectId !== objectId) {
        usePointsStore.getState().clearSelection();
      }

      return {
        activeObjectId: objectId,
        mesh: target.mesh || state.mesh,
      };
    });
  },

  clearActiveObject: () =>
    set({
      activeObjectId: null,
    }),

  deleteObject: (objectId) =>
    set((state) => {
      const remaining = state.objects.filter((obj) => obj.id !== objectId);
      usePointsStore.getState().clearPointsForObject(objectId);
      usePointsStore.getState().clearSelectionForObject(objectId);

      const fallback = remaining[remaining.length - 1];
      return {
        objects: remaining,
        activeObjectId: fallback?.id || null,
        mesh: fallback?.mesh || null,
      };
    }),

  updateVertexPosition: (objectId, vertexId, position) =>
    set((state) => {
      let nextObjects = state.objects;

      nextObjects = state.objects.map((obj) => {
        if (obj.id !== objectId) return obj;
        const updatedVerts = (obj.mesh?.vertices || []).map((v) =>
          String(v.id) === String(vertexId) ? { ...v, p: position } : v
        );
        const updatedMesh = { ...obj.mesh, vertices: updatedVerts };
        return { ...obj, mesh: updatedMesh };
      });

      const active = nextObjects.find((o) => o.id === state.activeObjectId) || nextObjects[nextObjects.length - 1] || null;

      // Keep points in sync for this object
      const targetObj = nextObjects.find((o) => o.id === objectId);
      if (targetObj?.mesh?.vertices?.length) {
        const points = targetObj.mesh.vertices.map((v, i) => ({
          id: v.id,
          position: v.p,
          color: COLORS[i % COLORS.length],
        }));
        usePointsStore.getState().setPointsForObject(objectId, points);
      }

      return {
        objects: nextObjects,
        mesh: active?.mesh || null,
      };
    }),

  toggleObjectVisibility: (objectId) => {
    const before = get().objects.find((o) => o.id === objectId);
    const wasVisible = before?.visible;
    set((state) => {
      const updated = state.objects.map((obj) =>
        obj.id === objectId ? { ...obj, visible: !obj.visible } : obj
      );
      const toggled = updated.find((obj) => obj.id === objectId);
      if (toggled && !toggled.visible) {
        usePointsStore.getState().clearSelectionForObject(objectId);
      }
      return { objects: updated };
    });
    const after = get().objects.find((o) => o.id === objectId);
    if (after) {
      get().addTimelineStep({
        objectId,
        name: wasVisible ? `Hid ${after.name || 'object'}` : `Showed ${after.name || 'object'}`,
        mesh: after.mesh,
        timestamp: Date.now(),
      });
    }
  },

  connect: async (initialPrompt = '') => {
    set({ isLoading: true });
    
    agentApi.onConnect = (sessionId) => {
      set({ sessionId, isConnected: true, isLoading: false });
    };

    agentApi.onDisconnect = () => {
      set({ isConnected: false, sessionId: null });
    };

    agentApi.onStateUpdate = (state) => {
      const isDone = state.finalized || state.task_complete;
      set({ 
        todo: state.todo || [],
        finalized: isDone,
        isLoading: !isDone,
      });

      // Only add mesh if it's new and different from what we've processed
      if (state.mesh?.vertices?.length > 0) {
        const sig = meshSignature(state.mesh);
        if (sig !== get().lastProcessedMeshSignature) {
          get().addMeshObject(state.mesh, undefined, false);
        }
      }

    };

    agentApi.onMessage = (response) => {
      if (response?.type === 'tool_response') {
        const toolName = response.id?.replace(/^tool_/, '').replace(/_[A-Za-z0-9]+$/, '') || 'tool';
        const resultStr = JSON.stringify(response.result || response.error || {});
        set((s) => ({
          toolCalls: [...s.toolCalls, {
            name: toolName,
            result: resultStr.length > 80 ? resultStr.slice(0, 80) + '...' : resultStr,
            success: response.result?.success !== false && !response.error,
          }],
        }));
      }
      const msg = response?.result?.message || response?.result?.summary;
      if (msg) {
        set((s) => ({
          messages: [...s.messages, { role: 'assistant', content: msg }],
          isLoading: false,
        }));
      } else if (response?.result?.tasks) {
        set({ todo: response.result.tasks, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    };

    agentApi.onError = (error) => {
      console.error('Agent error:', error);
      set((s) => ({
        messages: [...s.messages, { role: 'assistant', content: `Error: ${error}` }],
        isLoading: false,
      }));
    };

    try {
      await agentApi.connect(initialPrompt);
    } catch {
      set({ isLoading: false });
    }
  },

  sendMessage: (content) => {
    set((s) => ({
      messages: [...s.messages, { role: 'user', content }],
      toolCalls: [],
      isLoading: true,
      finalized: false,
    }));
    agentApi.sendMessage(content);
  },

  uploadStepFile: async (file) => {
    const { sessionId } = get();
    set({ isLoading: true });
    try {
      const mesh = await agentApi.uploadStepFile(file, sessionId);
      set({ isLoading: false });
      get().addMeshObject(mesh, file.name || 'Upload', true);

      set((s) => ({
        messages: [...s.messages, { role: 'assistant', content: `Successfully uploaded and processed ${file.name}` }],
      }));
    } catch (error) {
      console.error('Upload error:', error);
      set({ isLoading: false });
      set((s) => ({
        messages: [...s.messages, { role: 'assistant', content: `Error uploading ${file.name}: ${error.message}` }],
      }));
    }
  },

  uploadStlFile: async (file) => {
    const { sessionId } = get();
    set({ isLoading: true });
    try {
      const mesh = await agentApi.uploadStlFile(file, sessionId);
      set({ isLoading: false });
      get().addMeshObject(mesh, file.name || 'Upload', true);

      set((s) => ({
        messages: [...s.messages, { role: 'assistant', content: `Successfully uploaded and processed ${file.name}` }],
      }));
    } catch (error) {
      console.error('Upload error:', error);
      set({ isLoading: false });
      set((s) => ({
        messages: [...s.messages, { role: 'assistant', content: `Error uploading ${file.name}: ${error.message}` }],
      }));
    }
  },

  uploadPhotoFile: async (file, paperSize = 'letter') => {
    const { sessionId } = get();
    set({ isLoading: true });
    try {
      const response = await agentApi.uploadPhotoFile(file, paperSize, sessionId);
      set({ isLoading: false });
      
      if (response.success) {
        get().addMeshObject(response.mesh, response.analysis.object_name || 'Photo Model', true);
        set((s) => ({
          messages: [...s.messages, { role: 'assistant', content: `Successfully created 3D model from ${file.name}: ${response.analysis.object_name}` }],
        }));
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      set({ isLoading: false });
      set((s) => ({
        messages: [...s.messages, { role: 'assistant', content: `Error processing photo ${file.name}: ${error.message}` }],
      }));
    }
  },

  disconnect: () => {
    agentApi.close();
    set({ isConnected: false, sessionId: null });
  },
  
  }));
  
