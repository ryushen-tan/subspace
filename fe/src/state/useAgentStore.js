import { create } from 'zustand';
import { agentApi } from '../services/agentApi';
import { usePointsStore } from './usePointsStore';

const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894'];

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

  addMeshObject: (mesh, name) => {
    if (!mesh?.vertices?.length) return null;

    const state = get();
    const sig = meshSignature(mesh);
    const existing = state.objects.find((obj) => (obj.signature || meshSignature(obj.mesh)) === sig);
    if (existing) {
      set((s) => ({
        objects: s.objects.map((obj) => ({
          ...obj,
          visible: obj.id === existing.id,
        })),
        activeObjectId: existing.id,
        mesh: existing.mesh,
      }));
      return existing.id;
    }

    // If previous layer exists and new mesh contains prior geometry plus additions, isolate only the new geometry
    const prev = state.objects[state.objects.length - 1]?.mesh;
    const maybeDelta = extractDeltaMesh(prev, mesh);
    const finalMesh = maybeDelta || mesh;
    const finalSig = meshSignature(finalMesh);

    let createdId = null;
    set((s) => {
      const objectId = `obj-${Date.now()}-${s.objects.length + 1}`;
      createdId = objectId;
      const label = name || `Object ${s.objects.length + 1}`;
      const newObject = { id: objectId, name: label, mesh: finalMesh, visible: true, signature: finalSig };

      return {
        // Only the latest object stays visible to avoid duplicate geometry overlay; others remain but hidden
        objects: [...s.objects.map((obj) => ({ ...obj, visible: false })), newObject],
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
    }

    return createdId;
  },

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

      if (state.mesh?.vertices?.length > 0) {
        const label = state.iteration != null ? `Step ${state.iteration}` : undefined;
        get().addMeshObject(state.mesh, label);
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
