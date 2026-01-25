import { create } from 'zustand';
import { pb } from '../lib/pocketbase';

export const useAuthStore = create((set, get) => ({
  user: pb.authStore.model,
  token: pb.authStore.token,
  isAuthenticated: pb.authStore.isValid,

  // Initialize: sync with PocketBase auth store
  init: () => {
    // Listen to auth store changes
    pb.authStore.onChange((token, model) => {
      set({
        user: model,
        token: token,
        isAuthenticated: pb.authStore.isValid,
      });
    });

    // Set initial state
    set({
      user: pb.authStore.model,
      token: pb.authStore.token,
      isAuthenticated: pb.authStore.isValid,
    });
  },

  // Login with email/password
  login: async (email, password) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      return { success: true, user: authData.record };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Signup with email/password
  signup: async (email, password, passwordConfirm, name = '') => {
    try {
      // Create user
      const userData = {
        email,
        password,
        passwordConfirm,
        name: name || email.split('@')[0],
      };
      await pb.collection('users').create(userData);
      
      // Auto-login after signup
      const authData = await pb.collection('users').authWithPassword(email, password);
      return { success: true, user: authData.record };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Logout
  logout: () => {
    pb.authStore.clear();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  // Get current token (for API calls)
  getToken: () => {
    return pb.authStore.token;
  },
}));
