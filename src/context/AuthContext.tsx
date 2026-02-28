import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode, JwtPayload } from 'jwt-decode'; // Import JwtPayload
import { getCurrentUser } from '../lib/api';
import { User } from '../lib/types';

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  loadingAuth: boolean;
}

// Define AuthContext here
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const navigate = useNavigate();

  const handleLogout = useCallback(() => {
    localStorage.removeItem('app_token');
    setIsLoggedIn(false);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('app_token');
      if (token) {
        try {
          const decodedToken: JwtPayload = jwtDecode(token); // Type as JwtPayload
          // Check if token is expired
          if ((decodedToken.exp ?? 0) * 1000 < Date.now()) { // Use nullish coalescing
            console.log('Token expired, logging out.');
            handleLogout();
            return;
          }

          // Fetch full user profile
          const currentUser = await getCurrentUser();
          setUser(currentUser);
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Failed to decode or verify token, or fetch user:', error);
          handleLogout();
        }
      }
      setLoadingAuth(false);
    };

    void checkAuth(); // Use void to explicitly ignore the promise
  }, [handleLogout]); // Added handleLogout to deps

  const handleLogin = useCallback((token: string) => {
    localStorage.setItem('app_token', token);
    setIsLoggedIn(true);
    // Fetch user details immediately after login
    void getCurrentUser().then(currentUser => { // Use void
      setUser(currentUser);
      navigate('/dashboard');
    }).catch(error => {
      console.error('Failed to fetch user after login:', error);
      handleLogout(); // Logout if user data can't be fetched
    });
  }, [navigate, handleLogout]);

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login: handleLogin, logout: handleLogout, loadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth hook is now defined here, as it needs access to AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};