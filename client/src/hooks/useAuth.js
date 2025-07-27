import { useEffect, useState } from 'react';
import { authService } from '../lib/authService';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser, selectIsAuthenticated } from '../store/authSlice';

export function useAuth() {
  const [loading, setLoading] = useState(true);
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  // Debug authentication state
  useEffect(() => {
    console.log('Auth state changed:', { isAuthenticated, user });
  }, [isAuthenticated, user]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for token in Redux store
        const token = authService.getToken();
        console.log('Token in Redux store:', !!token);
        
        // Try to get current user if we have a token
        if (token) {
          console.log('Fetching current user...');
          await authService.getCurrentUser();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    // Navigate to login page after logout
    window.location.href = '/';
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    isDoctor: user?.role === 'doctor',
  };
}
