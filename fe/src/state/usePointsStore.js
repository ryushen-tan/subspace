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
  selectedPointId: null,

  addPoint: (point) =>
    set((state) => ({
      points: [...state.points, point],
    })),

  removePoint: (id) =>
    set((state) => ({
      points: state.points.filter((p) => p.id !== id),
      selectedPointId: state.selectedPointId === id ? null : state.selectedPointId,
    })),

  updatePoint: (id, position) =>
    set((state) => ({
      points: state.points.map((p) =>
        p.id === id ? { ...p, position } : p
      ),
    })),

  setPoints: (points) => set({ points }),
  
  setDragging: (isDragging) => set({ isDragging }),

  selectPoint: (id) => set({ selectedPointId: id }),
}));
