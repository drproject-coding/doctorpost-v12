import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx'; // Import useAuth from AuthContext
import { Loader } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loadingAuth } = useAuth();

  if (loadingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-neo-background">
        <Loader size={48} className="animate-spin text-purple-electric" />
        <p className="ml-4 text-lg font-bold text-neo-foreground">Loading session...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;