'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  location?: string;
  bio?: string;
  business_name?: string;
  business_category?: string;
  profile_image?: string;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

interface RegisterData {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  password: string;
  location?: string;
  bio?: string;
  business_name?: string;
  business_category?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        if (storedToken) {
          setToken(storedToken);
          // Set default axios header
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Verify token and get user data
          try {
            const response = await axios.get('http://localhost:8000/auth/me');
            setUser(response.data);
          } catch (error) {
            // Token is invalid, clear it
            console.log('Token verification failed, clearing auth state');
            localStorage.removeItem('auth_token');
            setToken(null);
            setUser(null);
            delete axios.defaults.headers.common['Authorization'];
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post('http://localhost:8000/auth/login', {
        email,
        password,
      });

      const { access_token } = response.data;
      
      // Store token
      localStorage.setItem('auth_token', access_token);
      setToken(access_token);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Get user data
      const userResponse = await axios.get('http://localhost:8000/auth/me');
      setUser(userResponse.data);
      
      console.log('Login successful, user set:', userResponse.data);
      
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.detail || 'Login failed';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      const response = await axios.post('http://localhost:8000/auth/register', userData);
      
      // After successful registration, automatically log the user in
      await login(userData.email, userData.password);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Registration failed';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
