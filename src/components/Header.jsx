import React from 'react';
import { Bell, Menu, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const Header = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-neo-background border-b border-neo-border p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="neo-button secondary p-2 mr-4"
            aria-label="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
          <h2 className="text-lg font-bold text-neo-foreground">
            Welcome back, {user?.name ?? 'User'}!
          </h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="neo-button secondary p-2">
            <Bell size={20} />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="bg-purple-electric p-2 rounded-neo border-neo border-neo-border">
              <User size={20} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-neo-foreground">{user?.name ?? 'Anonymous User'}</span>
              <button
                onClick={logout}
                className="text-xs text-gray-600 hover:text-purple-electric font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;