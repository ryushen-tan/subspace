import { create } from 'zustand';

export const usePointsStore = create((set) => ({
  points: [
    { id: '1', position: [0, 0, 0], color: '#ff6b6b' },
    { id: '2', position: [1, 1, 0], color: '#4ecdc4' },
    { id: '3', position: [-1, 1, 0], color: '#45b7d1' },
    { id: '4', position: [0, 2, 1], color: '#f9ca24' },
    { id: '5', position: [1, 0, -1], color: '#6c5ce7' },
  ],
  isDragging: false,
  selectedPointIds: [],

  addPoint: (point) =>
    set((state) => ({
      points: [...state.points, point],
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

  setPoints: (points) => set({ points }),
  
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

  clearSelection: () => set({ selectedPointIds: [] }),
}));
