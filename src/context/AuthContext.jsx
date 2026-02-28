import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Decode token to check if it's still valid
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp > currentTime) {
          // Token is still valid
          setUser(decoded);
        } else {
          // Token expired
          localStorage.removeItem('authToken');
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      setLoading(true);
      
      // Mock login - replace with actual API call
      const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Lp-38GNY4w3ZlD0VP7Kf-Sjx1x5YyTZtbgsU8UfX1wk";
      
      localStorage.setItem('authToken', mockToken);
      const decoded = jwtDecode(mockToken);
      setUser(decoded);
      
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const loginWithGoogle = useCallback(async (credentialResponse) => {
    try {
      setLoading(true);
      
      // Decode Google credential
      const decoded = jwtDecode(credentialResponse.credential);
      
      // Store token and user info
      localStorage.setItem('authToken', credentialResponse.credential);
      setUser(decoded);
      
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      console.error('Google login failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const value = {
    user,
    loading,
    login,
    loginWithGoogle,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};