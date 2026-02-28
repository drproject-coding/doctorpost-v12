import React from 'react';
import { Menu, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();

  const initials = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <header className="bg-ivory-white border-b-neo border-neo-border py-4 px-6 flex items-center justify-between">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-neo border-neo border-neo-border mr-4 hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-bold hidden md:block">Dashboard</h1>
      </div>

      <div className="flex items-center space-x-3">
        <button className="p-2 rounded-neo border-neo border-neo-border hover:bg-gray-100 relative">
          <Bell size={20} />
          <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-blazing-orange border-2 border-ivory-white"></span>
        </button>

        <div className="flex items-center space-x-2">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name ?? 'User'}
              className="w-9 h-9 rounded-neo border-neo border-neo-border object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-neo border-neo border-neo-border bg-purple-electric text-white flex items-center justify-center font-bold">
              {initials}
            </div>
          )}
          <span className="hidden md:block font-medium">{user?.name ?? 'User'}</span>
        </div>

        <button
          onClick={logout}
          className="p-2 rounded-neo border-neo border-neo-border hover:bg-gray-100"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
