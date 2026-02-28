import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart, 
  Calendar, 
  FolderOpen, 
  Home, 
  PlusCircle, 
  Settings
} from 'lucide-react';

const NavItem = ({ to, icon, label, isActive }) => (
  <Link 
    to={to} 
    className={`flex items-center space-x-3 px-4 py-3 my-2 rounded-lg transition-all duration-200 ${
      isActive 
        ? 'bg-purple-electric text-ivory-white shadow-neo' 
        : 'text-charcoal-black hover:bg-ivory-white hover:shadow-sm'
    }`}
  >
    <div className="flex-shrink-0">
      {icon}
    </div>
    <span className="font-medium">{label}</span>
  </Link>
);

export default function Navigation() {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const navItems = [
    { path: '/', icon: <Home size={20} />, label: 'Dashboard' },
    { path: '/create', icon: <PlusCircle size={20} />, label: 'Create Post' },
    { path: '/calendar', icon: <Calendar size={20} />, label: 'Calendar' },
    { path: '/library', icon: <FolderOpen size={20} />, label: 'Library' },
    { path: '/analytics', icon: <BarChart size={20} />, label: 'Analytics' },
    { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <nav className="bg-ivory-white border-r border-neo-border h-full p-4">
      <div className="flex items-center mb-8 px-4 py-2">
        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-purple-electric text-ivory-white mr-3 shadow-neo">
          <span className="font-bold text-lg">DP</span>
        </div>
        <h1 className="text-2xl font-bold text-charcoal-black">DoctorPost</h1>
      </div>
      
      <div className="flex flex-col space-y-3">
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            to={item.path}
            icon={item.icon}
            label={item.label}
            isActive={currentPath === item.path}
          />
        ))}
      </div>
    </nav>
  );
}