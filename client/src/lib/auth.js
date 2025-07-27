import { store } from '../store';
import { setCredentials, logout as logoutAction } from '../store/authSlice';

const API_BASE = '/api';

export class AuthService {
  static instance;
  token = null;
  user = null;

  constructor() {
    // Get token from Redux store if available
    const state = store.getState();
    this.token = state.auth?.token || null;
    this.user = state.auth?.user || null;
  }

  static getInstance() {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

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
    this.token = data.token;
    this.user = data.user;
    localStorage.setItem('auth_token', data.token);
    return data;
  }

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
    this.token = data.token;
    this.user = data.user;
    localStorage.setItem('auth_token', data.token);
    return data;
  }

  async getCurrentUser() {
    if (!this.token) return null;

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        this.logout();
        return null;
      }

      const data = await response.json();
      this.user = data.user;
      
      // Update Redux store with fresh user data
      store.dispatch(setCredentials({
        user: data.user,
        token: this.token
      }));
      
      return data.user;
    } catch (error) {
      this.logout();
      return null;
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    
    // Update Redux store
    store.dispatch(logoutAction());
  }

  getToken() {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  isAuthenticated() {
    return !!this.token;
  }

  hasRole(role) {
    return this.user?.role === role;
  }

  isAdmin() {
    return this.hasRole('admin');
  }

  isDoctor() {
    return this.hasRole('doctor');
  }
}

export const authService = AuthService.getInstance();
