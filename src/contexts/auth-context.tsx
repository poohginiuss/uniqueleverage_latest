"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize state from localStorage immediately to avoid loading screen
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('auth_user');
        return storedUser ? JSON.parse(storedUser) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false); // Start as false since we have localStorage

  const checkAuth = async () => {
    try {
      // Get user email from localStorage
      const userEmail = localStorage.getItem('userEmail');
      if (!userEmail) {
        setUser(null);
        localStorage.removeItem('auth_user');
        return;
      }

      // Verify with API using authentication headers
      const response = await fetch('/api/current-user', {
        headers: {
          'x-user-email': userEmail,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('auth_user', JSON.stringify(data.user));
        } else {
          setUser(null);
          localStorage.removeItem('auth_user');
        }
      } else {
        setUser(null);
        localStorage.removeItem('auth_user');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // On network error, keep the cached user data
    }
  };

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
    setIsLoading(false);
  };

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
