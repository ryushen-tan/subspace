import { create } from 'zustand';
import { agentApi } from '../services/agentApi';
import { usePointsStore } from './usePointsStore';

const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894'];

export const useAgentStore = create((set, get) => ({
  sessionId: null,
  isConnected: false,
  isLoading: false,
  todo: [],
  messages: [],
  toolCalls: [],
  mesh: null,
  finalized: false,

  connect: async (initialPrompt = '') => {
    set({ isLoading: true });
    
    agentApi.onConnect = (sessionId) => {
      set({ sessionId, isConnected: true, isLoading: false });
    };

    agentApi.onDisconnect = () => {
      set({ isConnected: false, sessionId: null });
    };

    agentApi.onStateUpdate = (state) => {
      set({ 
        todo: state.todo || [],
        mesh: state.mesh,
        finalized: state.finalized,
        isLoading: false,
      });

      if (state.mesh?.vertices?.length > 0) {
        const points = state.mesh.vertices.map((v, i) => ({
          id: v.id,
          position: v.p,
          color: COLORS[i % COLORS.length],
        }));
        usePointsStore.getState().setPoints(points);
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
      set({ mesh, isLoading: false });
      
      if (mesh.vertices?.length > 0) {
        const points = mesh.vertices.map((v, i) => ({
          id: v.id,
          position: v.p,
          color: COLORS[i % COLORS.length],
        }));
        usePointsStore.getState().setPoints(points);
      }
      
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
