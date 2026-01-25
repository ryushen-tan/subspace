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

const meshesAreEqual = (a, b) => {
  if (!a || !b) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (err) {
    console.warn('Mesh comparison failed', err);
    return false;
  }
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

const extractDeltaMesh = (prev, next) => {
  if (!prev || !next) return next;
  const prevIds = new Set((prev.vertices || []).map((v) => String(v.id)));
  const nextVerts = next.vertices || [];
  const newVertices = nextVerts.filter((v) => !prevIds.has(String(v.id)));

  // If nothing new, keep next as-is
  if (!newVertices.length) return next;

  const newIdSet = new Set(newVertices.map((v) => String(v.id)));

  const pickEdges = (next.edges || []).filter((e) => newIdSet.has(String(e[0])) && newIdSet.has(String(e[1])));
  const pickFaces = (next.faces || []).filter((f) => f.some((vid) => newIdSet.has(String(vid))));

  return {
    vertices: newVertices,
    edges: pickEdges,
    faces: pickFaces,
    loops: null,
    stitch: null,
    scale_factor: next.scale_factor || 1,
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
  
  scrubToStep: (stepIndex) => {
    const state = get();
    if (stepIndex < 0 || stepIndex >= state.timelineSteps.length) return;
    
    const step = state.timelineSteps[stepIndex];
    
    // Update visibility of all objects up to this step
    const visibleObjectIds = new Set();
    for (let i = 0; i <= stepIndex; i++) {
      const s = state.timelineSteps[i];
      if (s.objectId) visibleObjectIds.add(s.objectId);
    }
    
    // Restore messages up to this point
    const messages = state.timelineSteps.slice(0, stepIndex + 1)
      .flatMap(s => s.messages || []);
    
    set({
      currentStepIndex: stepIndex,
      objects: state.objects.map(obj => ({
        ...obj,
        visible: visibleObjectIds.has(obj.id)
      })),
      messages,
      activeObjectId: step.objectId || state.activeObjectId,
      mesh: step.mesh || state.mesh,
    });
  },

  addMeshObject: (mesh, name) => {
    if (!mesh?.vertices?.length) return null;

    const state = get();
    const sig = meshSignature(mesh);
    const existing = state.objects.find((obj) => (obj.signature || meshSignature(obj.mesh)) === sig);
    if (existing) {
      set((s) => ({
        objects: s.objects, // keep all visibilities unchanged
        activeObjectId: existing.id,
        mesh: existing.mesh,
      }));
      return existing.id;
    }

    // Extract only geometry not present in ANY existing object (position-based)
    const finalMesh = extractNewGeometry(state.objects, mesh);
    if (!finalMesh) {
      // No new geometry; just keep existing visibility and focus last
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
    set((s) => {
      const objectId = `obj-${Date.now()}-${s.objects.length + 1}`;
      createdId = objectId;
      objectName = name || `Obj ${s.timelineSteps.length + 1}`;
      const color = COLORS[s.objects.length % COLORS.length];
      const newObject = { id: objectId, name: objectName, mesh: finalMesh, visible: true, signature: finalSig, color };

      return {
        // Keep all existing objects with their current visibility
        objects: [...s.objects, newObject],
        mesh: finalMesh,
        activeObjectId: objectId,
      };
    });

    if (createdId) {
      const points = finalMesh.vertices.map((v, i) => ({
        id: v.id,
        position: v.p,
        color: COLORS[i % COLORS.length],
      }));
      usePointsStore.getState().setPointsForObject(createdId, points);
      
      // Add to timeline
      const currentState = get();
      get().addTimelineStep({
        objectId: createdId,
        name: objectName,
        mesh: finalMesh,
        messages: [...currentState.messages],
        timestamp: Date.now(),
      });
    }

    return createdId;
  },

  renameObject: (objectId, name) =>
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === objectId ? { ...obj, name: name || obj.name } : obj
      ),
    })),

  updateObjectColor: (objectId, color) =>
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === objectId ? { ...obj, color } : obj
      ),
    })),

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

  toggleObjectVisibility: (objectId) =>
    set((state) => {
      const updated = state.objects.map((obj) =>
        obj.id === objectId ? { ...obj, visible: !obj.visible } : obj
      );
      const toggled = updated.find((obj) => obj.id === objectId);
      if (toggled && !toggled.visible) {
        usePointsStore.getState().clearSelectionForObject(objectId);
      }
      return { objects: updated };
    }),

  connect: async (initialPrompt = '') => {
    set({ 
      isLoading: true,
      timelineSteps: [],
      currentStepIndex: -1,
      messages: [],
      objects: [],
    });
    
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

      if (state.mesh?.vertices?.length > 0) {
        get().addMeshObject(state.mesh);
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
    } catch (e) {
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
      get().addMeshObject(mesh, file.name || 'Upload');

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
      get().addMeshObject(mesh, file.name || 'Upload');

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

  disconnect: () => {
    agentApi.close();
    set({ isConnected: false, sessionId: null });
  },
}));
