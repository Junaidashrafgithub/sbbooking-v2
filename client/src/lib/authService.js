import { store } from '../store';
import { setCredentials, logout as logoutAction } from '../store/authSlice';

const API_BASE = '/api';

export const authService = {
  async login(email, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    
    // Dispatch to Redux store only
    store.dispatch(setCredentials({
      user: data.user,
      token: data.token
    }));
    
    return data;
  },

  async register(userData) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    const data = await response.json();
    
    // Dispatch to Redux store
    store.dispatch(setCredentials({
      user: data.user,
      token: data.token
    }));
    
    return data;
  },

  async getCurrentUser() {
    // Get token from Redux store
    const token = store.getState().auth.token;
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        this.logout();
        return null;
      }

      const data = await response.json();
      
      // Update Redux store with fresh user data
      store.dispatch(setCredentials({
        user: data.user,
        token: token
      }));
      
      return data.user;
    } catch (error) {
      this.logout();
      return null;
    }
  },

  logout() {
    // Dispatch to Redux store only
    store.dispatch(logoutAction());
  },

  getToken() {
    // Get token from Redux store
    return store.getState().auth.token;
  }
};
