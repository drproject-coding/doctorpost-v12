import { useContext } from 'react';
import { AuthContextType } from './AuthContext'; // Assuming AuthContextType is exported from AuthContext
import React from 'react'; // Import React for createContext

// Define a type for the context value
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};