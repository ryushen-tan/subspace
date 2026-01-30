import { create } from 'zustand';

export const usePointsStore = create((set) => ({
  points: [],
  isDragging: false,
  selectedPointIds: [],

  setPointsForObject: (objectId, points) =>
    set((state) => {
      const existing = state.points.filter((p) => p.objectId === objectId);
      const normalized = points.map((p) => ({
        ...p,
        id: `${objectId}:${p.id}`,
        objectId,
      }));

      const sameLength = existing.length === normalized.length;
      const sameAll = sameLength && existing.every((p, idx) => {
        const n = normalized[idx];
        return p.id === n.id &&
          p.position[0] === n.position[0] &&
          p.position[1] === n.position[1] &&
          p.position[2] === n.position[2] &&
          p.color === n.color;
      });

      if (sameAll) return state;

      const filtered = state.points.filter((p) => p.objectId !== objectId);
      return { points: [...filtered, ...normalized] };
    }),

  addPoint: (point, objectId = 'default') =>
    set((state) => ({
      points: [...state.points, { ...point, objectId, id: `${objectId}:${point.id}` }],
    })),

  removePoint: (id) =>
    set((state) => ({
      points: state.points.filter((p) => p.id !== id),
      selectedPointIds: state.selectedPointIds.filter((selectedId) => selectedId !== id),
    })),

  updatePoint: (id, position) =>
    set((state) => ({
      points: state.points.map((p) =>
        p.id === id ? { ...p, position } : p
      ),
    })),

  updatePoints: (updates) =>
    set((state) => ({
      points: state.points.map((p) =>
        updates[p.id] ? { ...p, position: updates[p.id] } : p
      ),
    })),

  clearPointsForObject: (objectId) =>
    set((state) => ({
      points: state.points.filter((p) => p.objectId !== objectId),
      selectedPointIds: state.selectedPointIds.filter((selectedId) => !selectedId.startsWith(`${objectId}:`)),
    })),
  setPoints: (points, objectId = 'default') =>
    set(() => ({
      points: points.map((p) => ({ ...p, objectId, id: `${objectId}:${p.id}` })),
      selectedPointIds: [],
    })),
  
  setDragging: (isDragging) => set({ isDragging }),

  selectPoint: (id, multiSelect = false) =>
    set((state) => {
      if (multiSelect) {
        // Multi-select: toggle the point in selection
        const isSelected = state.selectedPointIds.includes(id);
        if (isSelected) {
          // Deselect if already selected
          return {
            selectedPointIds: state.selectedPointIds.filter((selectedId) => selectedId !== id),
          };
        } else {
          // Add to selection
          return {
            selectedPointIds: [...state.selectedPointIds, id],
          };
        }
      } else {
        // Single select: replace selection
        return {
          selectedPointIds: state.selectedPointIds.includes(id) ? [] : [id],
        };
      }
    }),

  clearAll: () => set({ points: [], selectedPointIds: [] }),

  clearSelection: () => set({ selectedPointIds: [] }),
  clearSelectionForObject: (objectId) =>
    set((state) => ({
      selectedPointIds: state.selectedPointIds.filter((selectedId) => !selectedId.startsWith(`${objectId}:`)),
    })),
}));
